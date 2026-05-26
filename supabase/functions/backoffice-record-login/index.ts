import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
}

function recordLoginError(message: string, detail?: unknown) {
  console.error("backoffice-record-login:", message, detail);
}

function getBearer(req: Request): string | null {
  const auth = req.headers.get("Authorization") || "";
  if (!auth) return null;
  if (auth.toLowerCase().startsWith("bearer "))
    return auth.slice("bearer ".length);
  return auth;
}

function firstIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function getClientIp(req: Request): string | null {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("true-client-ip"),
    req.headers.get("fastly-client-ip"),
    req.headers.get("fly-client-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-forwarded-for"),
  ];

  for (const c of candidates) {
    const ip = firstIp(c);
    if (ip) return ip;
  }

  return null;
}

type BackofficeScope = "admin" | "agent";

function isBackofficeScope(value: unknown): value is BackofficeScope {
  return value === "admin" || value === "agent";
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      recordLoginError("Missing Supabase environment variables");
      return jsonResponse(
        { error: "Unable to record login" },
        500
      );
    }

    const jwt = getBearer(req);
    if (!jwt) return jsonResponse({ error: "Missing auth token" }, 401);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(jwt);
    if (authError || !authData?.user) {
      recordLoginError("Invalid auth token", authError?.message);
      return jsonResponse({ error: "Invalid auth token" }, 401);
    }

    const userId = authData.user.id;
    const now = new Date().toISOString();
    const ip = getClientIp(req);
    const body = await req.json().catch(() => ({}));
    const scope = body?.scope;

    if (!isBackofficeScope(scope)) {
      return jsonResponse({ error: "Invalid scope" }, 400);
    }

    const tableName = scope === "admin" ? "admins" : "agents";

    const { data: accountRow, error: accountError } = await supabaseAdmin
      .from(tableName)
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (accountError) {
      recordLoginError("Account lookup failed", accountError.message);
      return jsonResponse({ error: "Unable to record login" }, 400);
    }

    if (!accountRow) {
      recordLoginError("Account not found for scope", scope);
      return jsonResponse({ error: "Unable to record login" }, 404);
    }

    const { error: updateErr } = await supabaseAdmin
      .from(tableName)
      .update({
        last_login_at: now,
        last_login_ip: ip,
        updated_at: now,
      })
      .eq("id", userId);

    if (updateErr) {
      recordLoginError("Login update failed", updateErr.message);
      return jsonResponse({ error: "Unable to record login" }, 400);
    }

    return jsonResponse({ success: true }, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    recordLoginError("Unhandled error", message);
    return jsonResponse({ error: "Unable to record login" }, 500);
  }
});
