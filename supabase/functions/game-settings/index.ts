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
    const gameType = u.searchParams.get("game_type");

    let query = supabase.from("game_settings").select("*");
    if (gameType) {
      query = query.eq("game_type", gameType).limit(1);
      const { data, error } = await (query as any).maybeSingle();
      if (error) throw error;
      return json({ success: true, data });
    }

    const { data, error } = await query.order("game_type", { ascending: true });
    if (error) throw error;
    return json({ success: true, data: data || [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ success: false, error: message }, 400);
  }
});
