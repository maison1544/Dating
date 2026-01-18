import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// 유저용 Supabase 클라이언트 (기본)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "sb-user-auth-token",
  },
});

// 관리자/에이전트용 Supabase 클라이언트 (별도 세션)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: "sb-admin-auth-token",
    },
  }
);

// Helper function for realtime subscriptions
export function subscribeToChannel(channelName: string) {
  return supabase.channel(channelName);
}
