import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      "Content-Type": "application/json",
    },
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

  const url = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!url || !anonKey)
    return json({ success: false, error: "Missing env" }, 500);

  const jwt = getBearer(req);
  if (!jwt)
    return json({ success: false, error: "Missing authorization" }, 401);

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user?.id) {
    return json({ success: false, error: "Invalid token" }, 401);
  }

  const body = await req.json().catch(() => ({} as any));
  const roundId = body?.round_id ?? body?.roundId;
  const betType = body?.bet_type ?? body?.betType;
  const amount = body?.amount ?? body?.bet_amount ?? body?.betAmount;
  const odds = body?.odds ?? 1.95;

  if (!roundId || !betType || !amount) {
    return json({ success: false, error: "Missing required fields" }, 400);
  }

  const { data: betId, error: betError } = await supabase.rpc("place_bet", {
    p_user_id: userData.user.id,
    p_round_id: String(roundId),
    p_bet_type: String(betType),
    p_amount: Number(amount),
    p_odds: Number(odds),
  });

  if (betError || !betId) {
    return json(
      { success: false, error: betError?.message || "Failed to place bet" },
      400
    );
  }

  const { data: balanceRow, error: balErr } = await supabase
    .from("user_profiles")
    .select("points")
    .eq("id", userData.user.id)
    .single();

  if (balErr) {
    return json({ success: true, bet_id: betId, new_balance: null });
  }

  return json({
    success: true,
    bet_id: betId,
    new_balance: (balanceRow as any)?.points ?? 0,
  });
});
