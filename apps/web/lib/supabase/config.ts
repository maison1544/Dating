export type AppInstance = "user" | "admin" | "agent";
export type SupabaseAuthInstance = AppInstance | "backoffice";

export function resolveAppInstance(): AppInstance {
  const raw =
    typeof window !== "undefined"
      ? ((window as unknown as Record<string, unknown>).__APP_INSTANCE__ ??
        process.env.NEXT_PUBLIC_APP_INSTANCE)
      : process.env.NEXT_PUBLIC_APP_INSTANCE;

  if (raw === "admin") return "admin";
  if (raw === "agent") return "agent";
  return "user";
}

const PROJECT_NAME = "dating";

export function getSupabaseAuthCookieName(instance: SupabaseAuthInstance = resolveAppInstance()) {
  return `sb-${PROJECT_NAME}-${instance}-auth-token`;
}

export function getSupabaseAuthStorageKey(instance: SupabaseAuthInstance = resolveAppInstance()) {
  return `sb-${PROJECT_NAME}-${instance}-auth-token`;
}

export function getSupabaseCookieOptions(instance: SupabaseAuthInstance = resolveAppInstance()) {
  return {
    name: getSupabaseAuthCookieName(instance),
  };
}
