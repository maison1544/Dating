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
  const isActive = Boolean(body?.is_active);

  if (gameType !== "powerball" && gameType !== "ladder") {
    return json({ success: false, error: "Invalid game_type" }, 400);
  }

  const { data, error } = await supabase
    .from("game_settings")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("game_type", gameType)
    .select("*")
    .maybeSingle();

  if (error) return json({ success: false, error: error.message }, 400);

  return json({
    success: true,
    data,
    message: isActive ? "발매가 시작되었습니다" : "발매가 중지되었습니다",
  });
});
