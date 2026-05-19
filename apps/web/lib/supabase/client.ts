import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseCookieOptions,
  getSupabaseAuthStorageKey,
  resolveBrowserAppInstance,
  resolveBackofficeAuthInstance,
  type SupabaseAuthInstance,
} from "./config";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

const browserClients = new Map<Exclude<SupabaseAuthInstance, "backoffice">, SupabaseBrowserClient>();

function getRequiredSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required to use Supabase.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

function resolveClientInstance(instance?: SupabaseAuthInstance) {
  if (!instance) return resolveBrowserAppInstance();
  return instance === "backoffice" ? resolveBackofficeAuthInstance() : instance;
}

export function createClient(instance?: SupabaseAuthInstance) {
  const resolvedInstance = resolveClientInstance(instance);
  const { supabaseUrl, supabaseAnonKey } = getRequiredSupabaseEnv();

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      isSingleton: false,
      cookieOptions: getSupabaseCookieOptions(resolvedInstance),
      auth: {
        storageKey: getSupabaseAuthStorageKey(resolvedInstance),
      },
    },
  );
}

export function getSupabaseBrowserClient(instance?: SupabaseAuthInstance) {
  const resolvedInstance = resolveClientInstance(instance);
  const existing = browserClients.get(resolvedInstance);
  if (existing) {
    return existing;
  }
  const client = createClient(resolvedInstance);
  browserClients.set(resolvedInstance, client);
  return client;
}

function createLazyClient(instance?: SupabaseAuthInstance): SupabaseBrowserClient {
  return new Proxy({} as SupabaseBrowserClient, {
    get(_target, prop) {
      const client = getSupabaseBrowserClient(instance);
      const value = client[prop as keyof SupabaseBrowserClient];
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

const supabase = createLazyClient();
const supabaseAdmin = createLazyClient("backoffice");

export { supabase, supabaseAdmin };
