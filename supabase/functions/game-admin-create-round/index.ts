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
  const gameType = String(body?.game_type || "").toLowerCase() as GameType;

  if (gameType !== "powerball" && gameType !== "ladder") {
    return json({ success: false, error: "Invalid game_type" }, 400);
  }

  const nowIso = new Date().toISOString();

  const { data: existingBetting, error: existingErr } = await supabase
    .from("game_rounds")
    .select("id, round_number, betting_end_time")
    .eq("game_type", gameType)
    .eq("status", "betting")
    .gte("betting_end_time", nowIso)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingErr)
    return json({ success: false, error: existingErr.message }, 400);
  if (existingBetting?.id) {
    return json(
      {
        success: false,
        error: "Betting round already exists",
        data: existingBetting,
      },
      409
    );
  }

  const { data: settings, error: settingsError } = await supabase
    .from("game_settings")
    .select("is_active, betting_end_seconds, round_duration_seconds")
    .eq("game_type", gameType)
    .maybeSingle();

  if (settingsError && (settingsError as any).code !== "PGRST116") {
    return json({ success: false, error: settingsError.message }, 400);
  }

  if (settings?.is_active === false) {
    return json({ success: false, error: "Sales are inactive" }, 400);
  }

  const durationSeconds =
    (settings as any)?.betting_end_seconds ??
    (settings as any)?.round_duration_seconds ??
    300;

  const { data: lastRound, error: lastErr } = await supabase
    .from("game_rounds")
    .select("round_number")
    .eq("game_type", gameType)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) return json({ success: false, error: lastErr.message }, 400);

  const nextRoundNumber = (lastRound?.round_number || 0) + 1;
  const now = new Date();
  const bettingEndTime = new Date(
    now.getTime() + Number(durationSeconds) * 1000
  );

  const { data: newRound, error: insertErr } = await supabase
    .from("game_rounds")
    .insert({
      game_type: gameType,
      round_number: nextRoundNumber,
      status: "betting",
      start_time: now.toISOString(),
      betting_end_time: bettingEndTime.toISOString(),
      total_bet_amount: 0,
      total_win_amount: 0,
      profit: 0,
      is_settled: false,
    })
    .select("*")
    .single();

  if (insertErr) return json({ success: false, error: insertErr.message }, 400);

  return json({ success: true, data: newRound });
});
