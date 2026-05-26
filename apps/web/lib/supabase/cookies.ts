import {
  getSupabaseAuthCookieName,
  type AppInstance,
  type SupabaseAuthInstance,
} from "./config";

const LEGACY_PROJECT_COOKIE_NAMES = ["sb-diwrjedpfyndhggbgdls-auth-token"];
const CHUNK_SUFFIXES = ["", ".0", ".1", ".2", ".3", ".4"];

function expireCookie(name: string, domain?: string) {
  const parts = [
    `${name}=`,
    "path=/",
    "expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "max-age=0",
    "sameSite=lax",
  ];

  if (domain) {
    parts.push(`domain=${domain}`);
    parts.push("secure");
  }

  document.cookie = parts.join("; ");
}

function expireCookieVariants(name: string) {
  const domain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim();

  expireCookie(name);
  if (domain) {
    expireCookie(name, domain);
  }
}

function cookieChunkNames(baseName: string) {
  return CHUNK_SUFFIXES.map((suffix) => `${baseName}${suffix}`);
}

export function clearStaleSupabaseAuthCookies(instance: SupabaseAuthInstance) {
  if (typeof document === "undefined") return;

  const targetInstance: AppInstance = instance === "backoffice" ? "admin" : instance;
  const cookieNames = [
    ...cookieChunkNames(getSupabaseAuthCookieName(targetInstance)),
    ...LEGACY_PROJECT_COOKIE_NAMES.flatMap(cookieChunkNames),
  ];

  Array.from(new Set(cookieNames)).forEach(expireCookieVariants);
}
