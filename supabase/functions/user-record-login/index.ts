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
  const cf = req.headers.get("cf-connecting-ip");
  const realIp = req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  return firstIp(cf) || firstIp(realIp) || firstIp(forwardedFor) || null;
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
      return jsonResponse(
        { error: "Missing Supabase environment variables" },
        500,
      );
    }

    const jwt = getBearer(req);
    if (!jwt) return jsonResponse({ error: "Missing auth token" }, 401);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(jwt);
    if (authError || !authData?.user) {
      return jsonResponse({ error: "Invalid auth token" }, 401);
    }

    const userId = authData.user.id;
    const now = new Date().toISOString();
    const ip = getClientIp(req);

    // Check if user profile exists
    const { data: userRow, error: userError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, join_ip")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return jsonResponse({ error: userError.message }, 400);
    }

    if (!userRow) {
      return jsonResponse({ error: "User profile not found" }, 404);
    }

    // Update last_login_at and last_login_ip
    // If join_ip is null, set it too (first login after signup)
    const updateData: Record<string, unknown> = {
      last_login_at: now,
      last_login_ip: ip,
      is_online: true,
      last_activity: now,
      updated_at: now,
    };

    // Set join_ip on first login if not already set
    if (!userRow.join_ip && ip) {
      updateData.join_ip = ip;
    }

    const { error: updateErr } = await supabaseAdmin
      .from("user_profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateErr) {
      return jsonResponse({ error: updateErr.message }, 400);
    }

    return jsonResponse({ success: true, ip }, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
