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

function safeRound(row: any) {
  const status = String(row?.status || "");
  const isHidden = status === "betting" || status === "playing";
  return {
    ...row,
    result: isHidden ? null : row?.result ?? null,
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

    const { data, error } = await supabase
      .from("game_rounds")
      .select("*")
      .eq("game_type", gameType)
      .in("status", ["betting", "playing", "completed", "settled"])
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return json({ success: true, data: null, remaining_seconds: 0 });
    }

    const now = Date.now();
    const endTimeRaw = data.betting_end_time || data.end_time;
    const endTime = endTimeRaw ? new Date(endTimeRaw).getTime() : now;
    const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

    return json({
      success: true,
      data: { ...safeRound(data), remaining_seconds: remainingSeconds },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ success: false, error: message }, 400);
  }
});
