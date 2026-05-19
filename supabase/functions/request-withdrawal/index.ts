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
  extraHeaders: Record<string, string> = {},
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
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice("bearer ".length);
  }
  return auth;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (!url || !anonKey) {
    return json({ success: false, error: "Missing env" }, 500);
  }

  const jwt = getBearer(req);
  if (!jwt) {
    return json({ success: false, error: "Missing authorization" }, 401);
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData?.user?.id) {
    return json({ success: false, error: "Invalid token" }, 401);
  }

  const userId = userData.user.id;
  const body = await req.json().catch(() => ({}) as any);
  const amount = Math.floor(Number(body?.amount) || 0);
  const bank = body?.bank;
  const accountNumber = body?.account_number;
  const accountHolder = body?.account_holder;

  if (!amount || amount < 10000) {
    return json(
      { success: false, error: "최소 출금 금액은 10,000P입니다." },
      400,
    );
  }

  if (!bank || !accountNumber || !accountHolder) {
    return json({ success: false, error: "계좌 정보가 필요합니다." }, 400);
  }

  try {
    const { data: rpcResult, error: rpcError } = await userClient.rpc(
      "request_withdrawal_v2",
      {
        p_user_id: userId,
        p_amount: amount,
        p_bank: bank,
        p_account_number: accountNumber,
        p_account_holder: accountHolder,
      },
    );

    if (rpcError) {
      return json(
        {
          success: false,
          error: "출금 신청에 실패했습니다: " + rpcError.message,
        },
        400,
      );
    }

    const result = rpcResult as {
      success: boolean;
      data?: any;
      error?: string;
      message?: string;
    };

    if (!result.success) {
      return json(
        { success: false, error: result.error || "출금 신청에 실패했습니다." },
        400,
      );
    }

    return json({
      success: true,
      data: result.data,
      message: result.message || "출금 신청이 완료되었습니다.",
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "출금 신청에 실패했습니다.";
    return json({ success: false, error: errorMessage }, 500);
  }
});
