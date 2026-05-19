import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type SupabaseAuthInstance = "user" | "admin" | "agent";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PROJECT_NAME = "dating";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export function createScopedSupabaseClient(
  instance: SupabaseAuthInstance = "user",
) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: instance === "user",
      storageKey: `sb-${PROJECT_NAME}-${instance}-auth-token`,
    },
  });
}
