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

function randomSuffix(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;
  if (!/^[A-Z0-9\-]{4,32}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 3) return null;
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function makeBackofficeEmail(username: string) {
  const safe = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\.]/g, "");
  return `${safe || "user"}@backoffice.local`;
}

function makeReferralCode(username: string) {
  const maxLen = 20;
  const suffix = randomSuffix(4);
  const prefixMax = Math.max(2, maxLen - (1 + suffix.length));
  const prefix = username
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, prefixMax);
  return `${prefix || "AG"}-${suffix}`.slice(0, maxLen);
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
        500
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (!jwt) return jsonResponse({ error: "Missing auth token" }, 401);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(jwt);
    if (authError || !authData?.user) {
      return jsonResponse({ error: "Invalid auth token" }, 401);
    }

    const requesterId = authData.user.id;
    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("id", requesterId)
      .maybeSingle();

    if (adminError || !adminRow) {
      return jsonResponse({ error: "Admin privileges required" }, 403);
    }

    const body = await req.json().catch(() => null);

    const accountType = body?.accountType;
    const username = normalizeUsername(body?.username);
    const name = normalizeName(body?.name);
    const password = body?.password;

    if (accountType !== "admin" && accountType !== "agent") {
      return jsonResponse({ error: "Invalid accountType" }, 400);
    }
    if (!username) {
      return jsonResponse({ error: "Invalid username" }, 400);
    }
    if (!name) {
      return jsonResponse({ error: "Invalid name" }, 400);
    }
    if (typeof password !== "string" || password.length < 6) {
      return jsonResponse(
        { error: "Password must be at least 6 characters" },
        400
      );
    }

    const email = makeBackofficeEmail(username);

    if (accountType === "admin") {
      const role = body?.role;
      if (role !== "super_admin" && role !== "admin") {
        return jsonResponse({ error: "Invalid role" }, 400);
      }

      const { data: existing, error: existErr } = await supabaseAdmin
        .from("admins")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existErr) return jsonResponse({ error: existErr.message }, 400);
      if (existing)
        return jsonResponse({ error: "Account already exists" }, 409);

      const { data: createdAuth, error: authCreateErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
      if (authCreateErr || !createdAuth.user) {
        return jsonResponse(
          { error: authCreateErr?.message || "Failed to create auth user" },
          400
        );
      }

      const { error: insertErr } = await supabaseAdmin.from("admins").insert({
        id: createdAuth.user.id,
        username,
        name,
        role,
        is_active: true,
      });

      if (insertErr) {
        await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
        return jsonResponse({ error: insertErr.message }, 400);
      }

      return jsonResponse({ success: true, id: createdAuth.user.id, email });
    }

    const { data: existingAgent, error: existAgentErr } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existAgentErr)
      return jsonResponse({ error: existAgentErr.message }, 400);
    if (existingAgent)
      return jsonResponse({ error: "Account already exists" }, 409);

    const requestedReferralCode = normalizeReferralCode(body?.referralCode);
    if (requestedReferralCode) {
      const { data: exists } = await supabaseAdmin
        .from("agents")
        .select("id")
        .eq("referral_code", requestedReferralCode)
        .maybeSingle();
      if (exists) {
        return jsonResponse({ error: "Referral code already exists" }, 409);
      }
      if (requestedReferralCode.length > 20) {
        return jsonResponse({ error: "Referral code too long" }, 400);
      }
    }

    const { data: createdAuth, error: authCreateErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (authCreateErr || !createdAuth.user) {
      return jsonResponse(
        { error: authCreateErr?.message || "Failed to create auth user" },
        400
      );
    }

    let referralCode: string | null = requestedReferralCode;
    if (!referralCode) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = makeReferralCode(username);
        const { data: exists } = await supabaseAdmin
          .from("agents")
          .select("id")
          .eq("referral_code", candidate)
          .maybeSingle();
        if (!exists) {
          referralCode = candidate;
          break;
        }
      }
    }

    if (!referralCode) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return jsonResponse({ error: "Failed to generate referral code" }, 500);
    }

    const { error: insertErr } = await supabaseAdmin.from("agents").insert({
      id: createdAuth.user.id,
      username,
      name,
      referral_code: referralCode,
      is_active: true,
    });

    if (insertErr) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return jsonResponse({ error: insertErr.message }, 400);
    }

    return jsonResponse({
      success: true,
      id: createdAuth.user.id,
      referralCode,
      email,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
