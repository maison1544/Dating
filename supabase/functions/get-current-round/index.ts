import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeRound(row: any) {
  const status = String(row?.status || "");
  const hide = status === "betting" || status === "playing";
  return {
    ...row,
    result: hide ? null : row?.result ?? null,
    reserved_result: null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!url || !anonKey)
    return json({ success: false, error: "Missing env" }, 500);

  const supabase = createClient(url, anonKey, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") || "" },
    },
  });

  try {
    const u = new URL(req.url);
    const gameType = (
      u.searchParams.get("game_type") || "powerball"
    ).toLowerCase();
    if (gameType !== "powerball" && gameType !== "ladder") {
      return json({ success: false, error: "Invalid game type" }, 400);
    }

    const { data: currentRound, error } = await supabase
      .from("game_rounds")
      .select("*")
      .eq("game_type", gameType)
      .in("status", ["betting", "playing"])
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && (error as any).code !== "PGRST116") throw error;

    let timeRemaining = 0;
    if (currentRound?.betting_end_time) {
      const endTime = new Date(currentRound.betting_end_time).getTime();
      const now = Date.now();
      timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
    }

    const { data: history, error: historyErr } = await supabase
      .from("game_rounds")
      .select("round_number, result, end_time, status")
      .eq("game_type", gameType)
      .in("status", ["completed", "settled"])
      .order("round_number", { ascending: false })
      .limit(10);

    if (historyErr) throw historyErr;

    return json({
      success: true,
      current_round: currentRound
        ? { ...sanitizeRound(currentRound), time_remaining: timeRemaining }
        : null,
      history: (history || []).map(sanitizeRound),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ success: false, error: message }, 400);
  }
});
