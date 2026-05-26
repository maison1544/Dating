import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseCookieOptions, type AppInstance } from "./config";

export async function updateSession(
  request: NextRequest,
  appScope: AppInstance = "user",
) {
  let supabaseResponse = NextResponse.next({ request });
  const cookieOptions = getSupabaseCookieOptions(appScope);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
      cookieOptions,
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
    console.warn("Supabase middleware getUser failed", {
      hostname: request.nextUrl.hostname,
      pathname: request.nextUrl.pathname,
      appScope,
      cookieName: cookieOptions.name,
      requestCookieNames: request.cookies.getAll().map((cookie) => cookie.name),
      message: error.message,
      code: error.code,
    });
  }

  return { response: supabaseResponse, user };
}
