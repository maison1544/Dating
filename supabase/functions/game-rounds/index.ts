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
  const hideResult = status === "betting" || status === "playing";
  return {
    ...row,
    result: hideResult ? null : row?.result ?? null,
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
    const gameType = u.searchParams.get("game_type") || undefined;
    const status = u.searchParams.get("status") || undefined;
    const limit = Math.min(
      200,
      Math.max(1, parseInt(u.searchParams.get("limit") || "20", 10))
    );

    let query = supabase
      .from("game_rounds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (gameType) query = query.eq("game_type", gameType);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return json({ success: true, data: (data || []).map(sanitizeRound) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ success: false, error: message }, 400);
  }
});
