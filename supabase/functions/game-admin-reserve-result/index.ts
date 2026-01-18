import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type GameType = "powerball" | "ladder";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearer(req: Request): string | null {
  const auth = req.headers.get("Authorization") || "";
  if (!auth) return null;
  if (auth.toLowerCase().startsWith("bearer "))
    return auth.slice("bearer ".length);
  return auth;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return json({ success: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !anonKey)
    return json({ success: false, error: "Missing env" }, 500);

  const jwt = getBearer(req);
  if (!jwt)
    return json({ success: false, error: "Missing authorization" }, 401);

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user?.id)
    return json({ success: false, error: "Invalid token" }, 401);

  const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
  if (adminErr) return json({ success: false, error: adminErr.message }, 400);
  if (!isAdmin)
    return json({ success: false, error: "Admin privileges required" }, 403);

  const body = await req.json().catch(() => ({} as any));
  const action = String(body?.action || "set").toLowerCase();
  const roundId = body?.round_id ?? body?.roundId ?? null;
  const gameType = (String(
    body?.game_type || body?.gameType || ""
  ).toLowerCase() || null) as GameType | null;
  const roundNumber = body?.round_number ?? body?.roundNumber ?? null;
  const reservedResult = body?.reserved_result ?? body?.result ?? null;

  if (!roundId && (!gameType || roundNumber == null)) {
    return json(
      {
        success: false,
        error: "round_id or (game_type + round_number) required",
      },
      400
    );
  }

  const patch: Record<string, unknown> = {
    reserved_result:
      action === "remove" || action === "cancel" ? null : reservedResult,
    reserved_by:
      action === "remove" || action === "cancel" ? null : userData.user.id,
    reserved_at:
      action === "remove" || action === "cancel"
        ? null
        : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let query = supabase.from("game_rounds").update(patch).select("*");

  if (roundId) {
    query = query.eq("id", String(roundId));
  } else {
    query = query
      .eq("game_type", String(gameType))
      .eq("round_number", Number(roundNumber));
  }

  // don't allow reserving completed rounds
  query = query.not("status", "in", "(completed,settled)");

  const { data, error } = await query.maybeSingle();

  if (error) return json({ success: false, error: error.message }, 400);
  if (!data)
    return json(
      { success: false, error: "Round not found or not reservable" },
      404
    );

  return json({ success: true, data });
});
