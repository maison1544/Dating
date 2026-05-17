import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseCookieOptions,
  getSupabaseAuthStorageKey,
  type SupabaseAuthInstance,
} from "./config";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

const browserClients = new Map<SupabaseAuthInstance, SupabaseBrowserClient>();

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

export function createClient(instance: SupabaseAuthInstance = "user") {
  const { supabaseUrl, supabaseAnonKey } = getRequiredSupabaseEnv();

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      isSingleton: false,
      cookieOptions: getSupabaseCookieOptions(instance),
      auth: {
        storageKey: getSupabaseAuthStorageKey(instance),
      },
    },
  );
}

function getClient(instance: SupabaseAuthInstance) {
  const existing = browserClients.get(instance);
  if (existing) {
    return existing;
  }
  const client = createClient(instance);
  browserClients.set(instance, client);
  return client;
}

function createLazyClient(instance: SupabaseAuthInstance): SupabaseBrowserClient {
  return new Proxy({} as SupabaseBrowserClient, {
    get(_target, prop) {
      const client = getClient(instance);
      const value = client[prop as keyof SupabaseBrowserClient];
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

// Legacy named exports for compatibility with existing components
export const supabase = createLazyClient("user");
export const supabaseAdmin = createLazyClient("backoffice");
