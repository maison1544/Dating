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

async function revokeUserSessions(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const endpoint = `${supabaseUrl}/auth/v1/admin/users/${userId}/logout?scope=global`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
  });

  if (resp.ok || resp.status === 204) {
    return { success: true };
  }

  let text = "";
  try {
    text = await resp.text();
  } catch {
    text = "";
  }

  return {
    success: false,
    error: `Logout failed (status=${resp.status} ${resp.statusText}${
      text ? `, body=${text}` : ""
    })`,
  };
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

    if (!jwt) {
      return jsonResponse({ error: "Missing auth token" }, 401);
    }

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
    const userId = body?.userId;
    const newPassword = body?.newPassword;

    if (typeof userId !== "string" || userId.length < 1) {
      return jsonResponse({ error: "Invalid userId" }, 400);
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return jsonResponse(
        { error: "Password must be at least 6 characters" },
        400
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    const revocation = await revokeUserSessions(
      supabaseUrl,
      serviceRoleKey,
      userId
    );

    const topic = `private:force-logout:${userId}`;
    const payload = {
      type: "forced_logout",
      userId,
      reason: "password_changed",
      at: new Date().toISOString(),
    };

    const { error: sendErr } = await supabaseAdmin.rpc("realtime.send", {
      topic,
      event: "forced_logout",
      payload,
      private: true,
    });

    if (sendErr) {
      return jsonResponse({ error: sendErr.message }, 400);
    }

    return jsonResponse(
      { success: true, user: { id: data.user?.id }, revocation },
      200
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
