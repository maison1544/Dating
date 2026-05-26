export type AppInstance = "user" | "admin" | "agent";
export type SupabaseAuthInstance = AppInstance | "backoffice";

export function normalizeAppInstance(value: unknown): AppInstance | null {
  if (value === "admin") return "admin";
  if (value === "agent") return "agent";
  if (value === "user" || value === "app") return "user";
  return null;
}

export function resolveAppInstanceFromPathname(pathname = "/"): AppInstance {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/agent" || pathname.startsWith("/agent/")) return "agent";
  return "user";
}

export function resolveAppInstanceFromHost(hostname = ""): AppInstance | null {
  const normalized = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!normalized || normalized === "localhost" || normalized === "127.0.0.1") {
    return null;
  }

  const firstLabel = normalized.split(".")[0];
  return normalizeAppInstance(firstLabel);
}

export function resolveAppInstance(input?: {
  hostname?: string;
  pathname?: string;
}): AppInstance {
  const fromHost = resolveAppInstanceFromHost(input?.hostname ?? "");
  if (fromHost) return fromHost;

  if (input?.pathname) {
    return resolveAppInstanceFromPathname(input.pathname);
  }

  const raw =
    typeof window !== "undefined"
      ? ((window as unknown as Record<string, unknown>).__APP_INSTANCE__ ??
        process.env.NEXT_PUBLIC_APP_INSTANCE)
      : process.env.NEXT_PUBLIC_APP_INSTANCE;

  return normalizeAppInstance(raw) ?? "user";
}

export function resolveBrowserAppInstance(): AppInstance {
  if (typeof window === "undefined") {
    return resolveAppInstance();
  }

  return resolveAppInstance({
    hostname: window.location.hostname,
    pathname: window.location.pathname,
  });
}

export function resolveBackofficeAuthInstance(
  instance: AppInstance = resolveBrowserAppInstance(),
): AppInstance {
  return instance === "agent" ? "agent" : instance === "admin" ? "admin" : "user";
}

const PROJECT_NAME = "dating";

export function getSupabaseAuthCookieName(instance: SupabaseAuthInstance = resolveAppInstance()) {
  return `sb-${PROJECT_NAME}-${instance}-auth-token`;
}

export function getSupabaseAuthStorageKey(instance: SupabaseAuthInstance = resolveAppInstance()) {
  return `sb-${PROJECT_NAME}-${instance}-auth-token`;
}

export function getSupabaseCookieOptions(instance: SupabaseAuthInstance = resolveAppInstance()) {
  const domain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim();

  return {
    name: getSupabaseAuthCookieName(instance),
    path: "/",
    sameSite: "lax" as const,
    ...(domain ? { domain, secure: true } : {}),
  };
}
