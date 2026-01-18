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

type MemberHandling = "detach" | "deactivate";

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
      .select("id, role")
      .eq("id", requesterId)
      .maybeSingle();

    if (adminError || !adminRow) {
      return jsonResponse({ error: "Admin privileges required" }, 403);
    }

    const body = await req.json().catch(() => null);
    const accountType = body?.accountType;
    const userId = body?.userId;

    if (accountType !== "admin" && accountType !== "agent") {
      return jsonResponse({ error: "Invalid accountType" }, 400);
    }
    if (typeof userId !== "string" || userId.length < 1) {
      return jsonResponse({ error: "Invalid userId" }, 400);
    }

    if (accountType === "admin" && userId === requesterId) {
      return jsonResponse(
        { error: "You cannot delete your own admin account" },
        400
      );
    }

    let updatedMembers = 0;
    let unassignedProfiles = 0;

    if (accountType === "agent") {
      const memberHandling: MemberHandling =
        body?.memberHandling === "deactivate" ? "deactivate" : "detach";

      const { data: affectedMembers, error: memberSelectError } =
        await supabaseAdmin
          .from("user_profiles")
          .select("id")
          .eq("agent_id", userId);

      if (memberSelectError) {
        return jsonResponse({ error: memberSelectError.message }, 400);
      }

      const memberIds = (affectedMembers || []).map((m) => m.id);
      if (memberIds.length > 0) {
        const updates: Record<string, unknown> = { agent_id: null };
        if (memberHandling === "deactivate") {
          updates.status = "suspended";
        }

        const { error: memberUpdateError } = await supabaseAdmin
          .from("user_profiles")
          .update(updates)
          .in("id", memberIds);

        if (memberUpdateError) {
          return jsonResponse({ error: memberUpdateError.message }, 400);
        }
        updatedMembers = memberIds.length;
      }

      const { data: affectedProfiles, error: profileSelectError } =
        await supabaseAdmin
          .from("chat_profiles")
          .select("id")
          .eq("assigned_agent_id", userId);

      if (profileSelectError) {
        return jsonResponse({ error: profileSelectError.message }, 400);
      }

      const profileIds = (affectedProfiles || []).map((p) => p.id);
      if (profileIds.length > 0) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from("chat_profiles")
          .update({ assigned_agent_id: null })
          .in("id", profileIds);

        if (profileUpdateError) {
          return jsonResponse({ error: profileUpdateError.message }, 400);
        }
        unassignedProfiles = profileIds.length;
      }
    }

    const tableName = accountType === "admin" ? "admins" : "agents";

    const { error: deleteRowErr } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq("id", userId);
    if (deleteRowErr) return jsonResponse({ error: deleteRowErr.message }, 400);

    const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );
    if (deleteAuthErr) {
      return jsonResponse({ error: deleteAuthErr.message }, 400);
    }

    return jsonResponse({
      success: true,
      updatedMembers,
      unassignedProfiles,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
