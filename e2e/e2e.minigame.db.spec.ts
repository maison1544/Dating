import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryableSupabaseError(error: any) {
  const msg = String(error?.message || error || "").toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("timeout")
  );
}

async function supabaseCallWithRetries<T>(
  op: () => Promise<{ data: T; error: any }>,
  attempts = 3,
  delayMs = 250,
): Promise<{ data: T; error: any }> {
  let lastError: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await op();
      if (!res.error) return res;
      lastError = res.error;
      if (!isRetryableSupabaseError(res.error)) return res;
      await sleep(delayMs);
    } catch (err) {
      lastError = err;
      if (!isRetryableSupabaseError(err)) {
        return { data: null as unknown as T, error: err };
      }
      await sleep(delayMs);
    }
  }
  return { data: null as unknown as T, error: lastError };
}

function uniqueSuffix() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function cloneJson<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function disableBetTypeOdds(odds: any, betType: string) {
  const base = cloneJson(odds);
  const nextOdds =
    base && typeof base === "object" && !Array.isArray(base) ? base : {};

  const hasEnabled = nextOdds.enabled && typeof nextOdds.enabled === "object";
  const hasEntry = nextOdds[betType] && typeof nextOdds[betType] === "object";

  if (hasEnabled) {
    nextOdds.enabled = {
      ...(nextOdds.enabled as Record<string, boolean>),
      [betType]: false,
    };
    return nextOdds;
  }

  if (hasEntry) {
    nextOdds[betType] = {
      ...(nextOdds[betType] as Record<string, unknown>),
      enabled: false,
    };
    return nextOdds;
  }

  nextOdds.enabled = {
    ...(nextOdds.enabled as Record<string, boolean> | undefined),
    [betType]: false,
  };

  return nextOdds;
}

function resolveBetOdds(odds: any, betType: string, fallback = 1.95) {
  if (!odds || typeof odds !== "object") return fallback;

  if (
    odds.odds &&
    typeof odds.odds === "object" &&
    typeof odds.odds[betType] === "number"
  ) {
    return odds.odds[betType];
  }

  const entry = odds[betType];
  if (typeof entry === "number") return entry;
  if (entry && typeof entry === "object" && typeof entry.odds === "number") {
    return entry.odds;
  }

  return fallback;
}

function resolveBetAmount(settings: any, fallback = 1000) {
  const minBet = typeof settings?.min_bet === "number" ? settings.min_bet : 1;
  const maxBet =
    typeof settings?.max_bet === "number" ? settings.max_bet : null;

  let amount = Math.max(fallback, minBet || 1);
  if (maxBet && amount > maxBet) amount = maxBet;
  if (amount < minBet) amount = minBet;

  return Math.max(1, amount);
}

async function ensureFreshActiveUser(
  browser: import("@playwright/test").Browser,
  adminSb: ReturnType<typeof createAuthedSupabaseClient>,
  startedAtIso: string,
) {
  const suffix = uniqueSuffix();
  const email = `e2e_minigame_${suffix}@secretday.com`;
  const password = `E2eMinigame!${suffix}`;

  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();

  await userPage.goto("/signup");
  await userPage.getByPlaceholder("이름을 입력하세요").fill("테스트");
  await userPage
    .getByPlaceholder("닉네임을 입력하세요")
    .fill(`미니${suffix.slice(-3)}`);
  await userPage.getByPlaceholder("이메일을 입력하세요").fill(email);
  await userPage.getByPlaceholder("'-' 없이 입력하세요").fill("01012345678");
  await userPage.getByPlaceholder("비밀번호를 입력하세요").fill(password);
  await userPage.getByPlaceholder("비밀번호를 다시 입력하세요").fill(password);
  await userPage.getByRole("button", { name: "다음" }).click();

  await userPage.locator("select").first().selectOption("국민은행");
  await userPage.getByPlaceholder("'-' 없이 입력하세요").fill("123456789012");
  await userPage.getByPlaceholder("예금주 이름을 입력하세요").fill("테스터");

  await userPage.locator('input[type="checkbox"]').check();
  await userPage.getByRole("button", { name: "회원가입" }).click();
  await expect(userPage).toHaveURL(/\/login$/);

  const profile = await (async () => {
    for (let i = 0; i < 30; i++) {
      const { data, error } = await supabaseCallWithRetries(() =>
        adminSb
          .from("user_profiles")
          .select("id, status, created_at")
          .eq("email", email)
          .gte("created_at", startedAtIso)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
      if (!error && data?.id) return data as any;
      await sleep(1000);
    }
    throw new Error("Could not find newly created user profile");
  })();

  const { error: activateErr } = await supabaseCallWithRetries(() =>
    adminSb
      .from("user_profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", String(profile.id)),
  );
  if (activateErr) throw new Error(activateErr.message);

  await (async () => {
    for (let i = 0; i < 30; i++) {
      const { data, error } = await supabaseCallWithRetries(() =>
        adminSb
          .from("user_profiles")
          .select("id, status")
          .eq("id", String(profile.id))
          .maybeSingle(),
      );
      if (!error && data && String((data as any).status) === "active") return;
      await sleep(1000);
    }
    throw new Error("User did not become active");
  })();

  await userContext.close();

  const token = await signInWithPassword(email, password);
  return { email, password, id: String(profile.id), token };
}

test.describe("Minigame access control (non-destructive)", () => {
  test("Logged-out user cannot place a bet (bet button disabled)", async ({
    page,
  }) => {
    await page.goto("/dice-game");
    await expect(page.locator("body")).toBeVisible();

    const betBtn = page.getByRole("button", { name: "배팅하기" });
    await expect(betBtn).toBeVisible();
    await expect(betBtn).toBeDisabled();
  });
});

test.describe("Minigame betting lifecycle + DB storage (destructive)", () => {
  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin credentials",
  );

  test.skip(
    !creds.mutate,
    "Requires E2E_MUTATE=true (creates rounds, places bets, processes rounds)",
  );

  test("Powerball: disabled bet type blocks RPC (server-side validation)", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const startedAt = new Date().toISOString();

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string,
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string,
    );

    const adminSb = createAuthedSupabaseClient(adminToken);

    const { error: initTickErr } = await supabaseCallWithRetries(() =>
      adminSb.rpc("admin_game_tick", {
        p_game_type: "powerball",
      }),
    );
    if (initTickErr) throw new Error(initTickErr.message);

    const testUser = await ensureFreshActiveUser(browser, adminSb, startedAt);
    const userSb = createAuthedSupabaseClient(testUser.token);
    const userId = testUser.id;

    const { data: settingsRow, error: settingsErr } =
      await supabaseCallWithRetries(
        () =>
          adminSb
            .from("game_settings")
            .select("id, odds, min_bet, max_bet")
            .eq("game_type", "powerball")
            .maybeSingle(),
        5,
      );

    if (settingsErr) throw new Error(settingsErr.message);
    if (!(settingsRow as any)?.id) {
      throw new Error("Missing game_settings row for powerball");
    }

    const betType = "normal-odd";
    const originalOdds = (settingsRow as any).odds;
    const updatedOdds = disableBetTypeOdds(originalOdds, betType);

    try {
      const { error: updateErr } = await supabaseCallWithRetries(
        () =>
          adminSb
            .from("game_settings")
            .update({
              odds: updatedOdds,
              updated_at: new Date().toISOString(),
            })
            .eq("id", String((settingsRow as any).id))
            .select("id")
            .maybeSingle(),
        5,
      );
      if (updateErr) throw new Error(updateErr.message);

      const fetchActiveRound = async () => {
        const { data, error } = await supabaseCallWithRetries(() =>
          adminSb
            .from("game_rounds")
            .select("id, game_type, round_number, status, betting_end_time")
            .eq("game_type", "powerball")
            .eq("status", "betting")
            .gte("betting_end_time", new Date().toISOString())
            .order("round_number", { ascending: false })
            .limit(1)
            .maybeSingle(),
        );
        if (error) throw new Error(error.message);
        return data as any;
      };

      const waitForFreshRound = async (minSecondsLeft: number) => {
        for (let i = 0; i < 30; i++) {
          const { error: tickErr } = await supabaseCallWithRetries(() =>
            adminSb.rpc("admin_game_tick", {
              p_game_type: "powerball",
            }),
          );
          if (tickErr) throw new Error(tickErr.message);

          const r = await fetchActiveRound();
          if (r?.id) {
            const endMs = new Date(String(r.betting_end_time)).getTime();
            const secondsLeft = Math.floor((endMs - Date.now()) / 1000);

            if (Number.isFinite(secondsLeft) && secondsLeft >= minSecondsLeft) {
              return r;
            }

            const { error: forceErr } = await supabaseCallWithRetries(() =>
              adminSb.rpc("admin_force_process_round", {
                p_round_id: String(r.id),
                p_result: null,
              }),
            );
            if (forceErr) throw new Error(forceErr.message);
          }

          await new Promise((res) => setTimeout(res, 500));
        }

        throw new Error("Could not obtain a fresh betting round");
      };

      const { data: pointsRow, error: pointsErr } =
        await supabaseCallWithRetries(
          () =>
            userSb
              .from("user_profiles")
              .select("points")
              .eq("id", userId as string)
              .single(),
          5,
        );
      if (pointsErr) throw new Error(pointsErr.message);

      const balanceBefore = Number((pointsRow as any)?.points ?? 0);
      const betAmount = resolveBetAmount(settingsRow, 1000);

      if (balanceBefore < betAmount) {
        const { error: topupErr } = await supabaseCallWithRetries(
          () =>
            adminSb.rpc("add_points", {
              p_user_id: userId as string,
              p_amount: betAmount * 3,
              p_type: "admin_adjust",
              p_reference_id: null,
              p_description: "E2E minigame topup",
            }),
          5,
        );
        if (topupErr) throw new Error(topupErr.message);
      }

      const { data: pointsRowBeforeBet, error: pointsBeforeBetErr } =
        await supabaseCallWithRetries(
          () =>
            userSb
              .from("user_profiles")
              .select("points")
              .eq("id", userId as string)
              .single(),
          5,
        );
      if (pointsBeforeBetErr) throw new Error(pointsBeforeBetErr.message);
      const balanceBeforeBet = Number((pointsRowBeforeBet as any)?.points ?? 0);

      const odds = resolveBetOdds(updatedOdds, betType, 1.95);

      let activeRound: any = null;
      let errorMessage = "";
      for (let attempt = 0; attempt < 6; attempt++) {
        activeRound = await waitForFreshRound(60);

        const { data, error } = await supabaseCallWithRetries(
          () =>
            userSb.rpc("place_bet", {
              p_user_id: userId as string,
              p_round_id: String(activeRound.id),
              p_bet_type: betType,
              p_amount: betAmount,
              p_odds: odds,
            }),
          5,
        );

        if (!error) {
          throw new Error(
            `Expected place_bet to fail for disabled bet type, got bet id=${String(
              data,
            )}`,
          );
        }

        const msg = String((error as any)?.message || error);
        if (msg.includes("Betting is closed")) {
          await sleep(250);
          continue;
        }

        errorMessage = msg;
        break;
      }

      if (!errorMessage) {
        throw new Error("Expected place_bet to fail for disabled bet type");
      }
      expect(errorMessage.toLowerCase()).toContain("disabled");
      expect(activeRound?.id).toBeTruthy();

      const { data: betRow, error: betErr } = await supabaseCallWithRetries(
        () =>
          userSb
            .from("game_bets")
            .select("id")
            .eq("user_id", userId as string)
            .eq("round_id", String(activeRound.id))
            .eq("bet_type", betType)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        5,
      );
      if (betErr) throw new Error(betErr.message);
      expect((betRow as any)?.id).toBeFalsy();

      const { data: pointsAfterRow, error: pointsAfterErr } =
        await supabaseCallWithRetries(
          () =>
            userSb
              .from("user_profiles")
              .select("points")
              .eq("id", userId as string)
              .single(),
          5,
        );
      if (pointsAfterErr) throw new Error(pointsAfterErr.message);
      expect(Number((pointsAfterRow as any)?.points ?? 0)).toBe(
        balanceBeforeBet,
      );
    } finally {
      const { error: restoreErr } = await supabaseCallWithRetries(
        () =>
          adminSb
            .from("game_settings")
            .update({
              odds: originalOdds,
              updated_at: new Date().toISOString(),
            })
            .eq("id", String((settingsRow as any).id))
            .select("id")
            .maybeSingle(),
        5,
      );
      if (restoreErr) throw new Error(restoreErr.message);
    }
  });

  test("Powerball: admin creates round -> user places bet -> admin processes round -> DB has result + bet settled + new round created", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const startedAt = new Date().toISOString();

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string,
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string,
    );

    const adminSb = createAuthedSupabaseClient(adminToken);

    const { error: initTickErr } = await supabaseCallWithRetries(() =>
      adminSb.rpc("admin_game_tick", {
        p_game_type: "powerball",
      }),
    );
    if (initTickErr) throw new Error(initTickErr.message);

    const testUser = await ensureFreshActiveUser(browser, adminSb, startedAt);
    const userSb = createAuthedSupabaseClient(testUser.token);
    const userId = testUser.id;

    const fetchActiveRound = async () => {
      const { data, error } = await supabaseCallWithRetries(() =>
        adminSb
          .from("game_rounds")
          .select("id, game_type, round_number, status, betting_end_time")
          .eq("game_type", "powerball")
          .eq("status", "betting")
          .gte("betting_end_time", new Date().toISOString())
          .order("round_number", { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
      if (error) throw new Error(error.message);
      return data as any;
    };

    const waitForFreshRound = async (minSecondsLeft: number) => {
      for (let i = 0; i < 30; i++) {
        const { error: tickErr } = await supabaseCallWithRetries(() =>
          adminSb.rpc("admin_game_tick", {
            p_game_type: "powerball",
          }),
        );
        if (tickErr) throw new Error(tickErr.message);

        const r = await fetchActiveRound();
        if (r?.id) {
          const endMs = new Date(String(r.betting_end_time)).getTime();
          const secondsLeft = Math.floor((endMs - Date.now()) / 1000);

          if (Number.isFinite(secondsLeft) && secondsLeft >= minSecondsLeft) {
            return r;
          }

          const { error: forceErr } = await supabaseCallWithRetries(() =>
            adminSb.rpc("admin_force_process_round", {
              p_round_id: String(r.id),
              p_result: null,
            }),
          );
          if (forceErr) throw new Error(forceErr.message);
        }

        await new Promise((res) => setTimeout(res, 500));
      }

      throw new Error("Could not obtain a fresh betting round");
    };

    // Ensure user has enough points for the bet
    const { data: pointsRow, error: pointsErr } = await supabaseCallWithRetries(
      () =>
        userSb
          .from("user_profiles")
          .select("points")
          .eq("id", userId as string)
          .single(),
      5,
    );

    if (pointsErr) throw new Error(pointsErr.message);

    const balanceBefore = Number((pointsRow as any)?.points ?? 0);

    if (balanceBefore < 1500) {
      const { error: topupErr } = await supabaseCallWithRetries(
        () =>
          adminSb.rpc("add_points", {
            p_user_id: userId as string,
            p_amount: 5000,
            p_type: "admin_adjust",
            p_reference_id: null,
            p_description: "E2E minigame topup",
          }),
        5,
      );
      if (topupErr) throw new Error(topupErr.message);
    }

    const { data: pointsRowBeforeBet, error: pointsBeforeBetErr } =
      await supabaseCallWithRetries(
        () =>
          userSb
            .from("user_profiles")
            .select("points")
            .eq("id", userId as string)
            .single(),
        5,
      );

    if (pointsBeforeBetErr) throw new Error(pointsBeforeBetErr.message);

    const balanceBeforeBet = Number((pointsRowBeforeBet as any)?.points ?? 0);

    // Place bet via RPC (server-side validation) for deterministic test execution
    const betAmount = 1000;
    const betType = "normal-odd";

    const { data: settingsRow, error: settingsErr } =
      await supabaseCallWithRetries(
        () =>
          adminSb
            .from("game_settings")
            .select("odds")
            .eq("game_type", "powerball")
            .maybeSingle(),
        5,
      );

    if (settingsErr) throw new Error(settingsErr.message);
    const odds = Number(
      ((settingsRow as any)?.odds?.odds?.[betType] ?? 1.95) as any,
    );

    let activeRound: any = null;
    let betId: string | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      activeRound = await waitForFreshRound(90);

      const { data, error } = await supabaseCallWithRetries(
        () =>
          userSb.rpc("place_bet", {
            p_user_id: userId as string,
            p_round_id: String(activeRound.id),
            p_bet_type: betType,
            p_amount: betAmount,
            p_odds: odds,
          }),
        5,
      );

      if (error) {
        const msg = String(error.message || error);
        if (msg.includes("Betting is closed")) {
          await sleep(250);
          continue;
        }
        throw new Error(msg);
      }

      betId = String(data);
      break;
    }

    if (!activeRound?.id || !betId) {
      throw new Error(
        "Could not place bet after retries (betting kept closing)",
      );
    }

    const roundNumber = Number(activeRound.round_number);
    expect(roundNumber).toBeGreaterThan(0);
    void balanceBeforeBet;

    // verify DB bet row exists (poll briefly)
    let betRow: any = null;
    for (let i = 0; i < 10; i++) {
      const { data, error: betErr } = await supabaseCallWithRetries(() =>
        userSb
          .from("game_bets")
          .select("id, user_id, round_id, bet_type, bet_amount, status")
          .eq("user_id", userId as string)
          .eq("round_id", String(activeRound.id))
          .eq("bet_type", "normal-odd")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      );

      if (betErr) throw new Error(betErr.message);
      if (data?.id) {
        betRow = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(betRow?.id).toBeTruthy();
    expect(["pending", "won", "lost"]).toContain((betRow as any)?.status);

    // verify point transaction for the bet exists
    const { data: betTx, error: betTxErr } = await supabaseCallWithRetries(
      () =>
        userSb
          .from("point_transactions")
          .select(
            "id, amount, balance_before, balance_after, related_id, related_type",
          )
          .eq("user_id", userId as string)
          .eq("type", "bet")
          .eq("related_id", (betRow as any).id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      5,
    );

    if (betTxErr) throw new Error(betTxErr.message);
    expect((betTx as any)?.amount).toBe(-1000);
    expect((betTx as any)?.related_type).toBe("game_bets");
    expect(Number((betTx as any)?.balance_after)).toBe(
      Number((betTx as any)?.balance_before) - betAmount,
    );

    // Admin processes round (forces end and ticks). game_tick may return skipped=true due to advisory lock,
    // so we retry until DB shows completed/settled.
    let roundAfter: any = null;
    for (let i = 0; i < 12; i++) {
      const { error: forceErr } = await supabaseCallWithRetries(() =>
        adminSb.rpc("admin_force_process_round", {
          p_round_id: String(activeRound.id),
          p_result: null,
        }),
      );
      if (forceErr) throw new Error(forceErr.message);

      const { error: tickErr } = await supabaseCallWithRetries(() =>
        adminSb.rpc("admin_game_tick", {
          p_game_type: String(activeRound.game_type || "powerball"),
        }),
      );
      if (tickErr) throw new Error(tickErr.message);

      const { data, error: roundAfterErr } = await supabaseCallWithRetries(() =>
        adminSb
          .from("game_rounds")
          .select(
            "id, status, result, end_time, is_settled, settled_at, total_win_amount, total_bet_amount",
          )
          .eq("id", String(activeRound.id))
          .maybeSingle(),
      );

      if (roundAfterErr) throw new Error(roundAfterErr.message);
      if (
        data &&
        ["completed", "settled"].includes(String((data as any).status))
      ) {
        roundAfter = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(["completed", "settled"]).toContain(String(roundAfter?.status));
    expect(roundAfter?.result).toBeTruthy();
    expect(roundAfter?.is_settled).toBeTruthy();

    // Verify DB: bet is no longer pending (poll briefly since tick may take a moment)
    let betAfter: any = null;
    for (let i = 0; i < 10; i++) {
      const { data, error: betAfterErr } = await supabaseCallWithRetries(
        () =>
          userSb
            .from("game_bets")
            .select("id, status, win_amount")
            .eq("id", (betRow as any).id)
            .maybeSingle(),
        5,
      );

      if (betAfterErr) {
        throw new Error(betAfterErr.message);
      }
      if (data && (data as any).status && (data as any).status !== "pending") {
        betAfter = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(betAfter?.id).toBeTruthy();
    expect(["won", "lost"]).toContain(String((betAfter as any)?.status));

    if (String((betAfter as any)?.status) === "won") {
      const { data: winTx, error: winTxErr } = await supabaseCallWithRetries(
        () =>
          userSb
            .from("point_transactions")
            .select(
              "id, type, amount, balance_before, balance_after, related_id, related_type",
            )
            .eq("user_id", userId as string)
            .eq("type", "win")
            .eq("related_id", (betRow as any).id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        5,
      );

      if (winTxErr) throw new Error(winTxErr.message);
      expect((winTx as any)?.related_type).toBe("game_bets");
      expect(Number((winTx as any)?.amount)).toBeGreaterThan(0);
      expect(Number((winTx as any)?.balance_after)).toBe(
        Number((winTx as any)?.balance_before) + Number((winTx as any)?.amount),
      );
      expect(Number((betAfter as any)?.win_amount ?? 0)).toBeGreaterThan(0);
    }

    const { data: newRound, error: newRoundErr } =
      await supabaseCallWithRetries(
        () =>
          adminSb
            .from("game_rounds")
            .select("id, game_type, round_number, status, betting_end_time")
            .eq("game_type", "powerball")
            .eq("status", "betting")
            .gte("betting_end_time", new Date().toISOString())
            .order("round_number", { ascending: false })
            .limit(1)
            .maybeSingle(),
        5,
      );
    if (newRoundErr) throw new Error(newRoundErr.message);
    expect(Number((newRound as any)?.round_number)).toBeGreaterThan(
      roundNumber,
    );
  });

  test("Ladder: admin creates round -> user places bet -> admin processes round -> DB has result + bet settled + new round created", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const startedAt = new Date().toISOString();

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string,
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string,
    );

    const adminSb = createAuthedSupabaseClient(adminToken);

    const { error: initTickErr } = await supabaseCallWithRetries(() =>
      adminSb.rpc("admin_game_tick", {
        p_game_type: "ladder",
      }),
    );
    if (initTickErr) throw new Error(initTickErr.message);

    const testUser = await ensureFreshActiveUser(browser, adminSb, startedAt);
    const userSb = createAuthedSupabaseClient(testUser.token);
    const userId = testUser.id;

    const fetchActiveRound = async () => {
      const { data, error } = await supabaseCallWithRetries(() =>
        adminSb
          .from("game_rounds")
          .select("id, game_type, round_number, status, betting_end_time")
          .eq("game_type", "ladder")
          .eq("status", "betting")
          .gte("betting_end_time", new Date().toISOString())
          .order("round_number", { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
      if (error) throw new Error(error.message);
      return data as any;
    };

    const waitForFreshRound = async (minSecondsLeft: number) => {
      for (let i = 0; i < 30; i++) {
        const { error: tickErr } = await supabaseCallWithRetries(() =>
          adminSb.rpc("admin_game_tick", {
            p_game_type: "ladder",
          }),
        );
        if (tickErr) throw new Error(tickErr.message);

        const r = await fetchActiveRound();
        if (r?.id) {
          const endMs = new Date(String(r.betting_end_time)).getTime();
          const secondsLeft = Math.floor((endMs - Date.now()) / 1000);

          if (Number.isFinite(secondsLeft) && secondsLeft >= minSecondsLeft) {
            return r;
          }

          const { error: forceErr } = await supabaseCallWithRetries(() =>
            adminSb.rpc("admin_force_process_round", {
              p_round_id: String(r.id),
              p_result: null,
            }),
          );
          if (forceErr) throw new Error(forceErr.message);
        }

        await new Promise((res) => setTimeout(res, 500));
      }

      throw new Error("Could not obtain a fresh betting round");
    };

    const { data: pointsRow, error: pointsErr } = await supabaseCallWithRetries(
      () =>
        userSb
          .from("user_profiles")
          .select("points")
          .eq("id", userId as string)
          .single(),
      5,
    );
    if (pointsErr) throw new Error(pointsErr.message);
    const balanceBefore = Number((pointsRow as any)?.points ?? 0);

    if (balanceBefore < 1500) {
      const { error: topupErr } = await supabaseCallWithRetries(
        () =>
          adminSb.rpc("add_points", {
            p_user_id: userId as string,
            p_amount: 5000,
            p_type: "admin_adjust",
            p_reference_id: null,
            p_description: "E2E minigame topup",
          }),
        5,
      );
      if (topupErr) throw new Error(topupErr.message);
    }

    const { data: pointsRowBeforeBet, error: pointsBeforeBetErr } =
      await supabaseCallWithRetries(
        () =>
          userSb
            .from("user_profiles")
            .select("points")
            .eq("id", userId as string)
            .single(),
        5,
      );
    if (pointsBeforeBetErr) throw new Error(pointsBeforeBetErr.message);
    const balanceBeforeBet = Number((pointsRowBeforeBet as any)?.points ?? 0);

    const betAmount = 1000;
    const betType = "leftStart";

    const { data: settingsRow, error: settingsErr } =
      await supabaseCallWithRetries(
        () =>
          adminSb
            .from("game_settings")
            .select("odds")
            .eq("game_type", "ladder")
            .maybeSingle(),
        5,
      );
    if (settingsErr) throw new Error(settingsErr.message);
    const odds = Number(
      ((settingsRow as any)?.odds?.odds?.[betType] ?? 1.95) as any,
    );

    let activeRound: any = null;
    let betId: string | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      activeRound = await waitForFreshRound(90);

      const { data, error } = await supabaseCallWithRetries(
        () =>
          userSb.rpc("place_bet", {
            p_user_id: userId as string,
            p_round_id: String(activeRound.id),
            p_bet_type: betType,
            p_amount: betAmount,
            p_odds: odds,
          }),
        5,
      );

      if (error) {
        const msg = String(error.message || error);
        if (msg.includes("Betting is closed")) {
          await sleep(250);
          continue;
        }
        throw new Error(msg);
      }

      betId = String(data);
      break;
    }

    if (!activeRound?.id || !betId) {
      throw new Error(
        "Could not place bet after retries (betting kept closing)",
      );
    }

    const roundNumber = Number(activeRound.round_number);
    expect(roundNumber).toBeGreaterThan(0);

    let betRow: any = null;
    for (let i = 0; i < 10; i++) {
      const { data, error: betErr } = await supabaseCallWithRetries(() =>
        userSb
          .from("game_bets")
          .select("id, user_id, round_id, bet_type, bet_amount, status")
          .eq("user_id", userId as string)
          .eq("round_id", String(activeRound.id))
          .eq("bet_type", betType)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      );

      if (betErr) throw new Error(betErr.message);
      if (data?.id) {
        betRow = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(betRow?.id).toBeTruthy();
    expect(["pending", "won", "lost"]).toContain((betRow as any)?.status);

    const { data: betTx, error: betTxErr } = await supabaseCallWithRetries(
      () =>
        userSb
          .from("point_transactions")
          .select(
            "id, amount, balance_before, balance_after, related_id, related_type",
          )
          .eq("user_id", userId as string)
          .eq("type", "bet")
          .eq("related_id", (betRow as any).id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      5,
    );
    if (betTxErr) throw new Error(betTxErr.message);
    expect((betTx as any)?.amount).toBe(-1000);
    expect((betTx as any)?.related_type).toBe("game_bets");
    expect(Number((betTx as any)?.balance_after)).toBe(
      Number((betTx as any)?.balance_before) - betAmount,
    );
    void balanceBeforeBet;

    let roundAfter: any = null;
    for (let i = 0; i < 12; i++) {
      const { error: forceErr } = await supabaseCallWithRetries(() =>
        adminSb.rpc("admin_force_process_round", {
          p_round_id: String(activeRound.id),
          p_result: null,
        }),
      );
      if (forceErr) throw new Error(forceErr.message);

      const { error: tickErr } = await supabaseCallWithRetries(() =>
        adminSb.rpc("admin_game_tick", {
          p_game_type: String(activeRound.game_type || "ladder"),
        }),
      );
      if (tickErr) throw new Error(tickErr.message);

      const { data, error: roundAfterErr } = await supabaseCallWithRetries(() =>
        adminSb
          .from("game_rounds")
          .select(
            "id, status, result, end_time, is_settled, settled_at, total_win_amount, total_bet_amount",
          )
          .eq("id", String(activeRound.id))
          .maybeSingle(),
      );
      if (roundAfterErr) throw new Error(roundAfterErr.message);
      if (
        data &&
        ["completed", "settled"].includes(String((data as any).status))
      ) {
        roundAfter = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(["completed", "settled"]).toContain(String(roundAfter?.status));
    expect(roundAfter?.result).toBeTruthy();
    expect(roundAfter?.is_settled).toBeTruthy();

    let betAfter: any = null;
    for (let i = 0; i < 10; i++) {
      const { data, error: betAfterErr } = await supabaseCallWithRetries(() =>
        userSb
          .from("game_bets")
          .select("id, status, win_amount")
          .eq("id", (betRow as any).id)
          .maybeSingle(),
      );

      if (betAfterErr) throw new Error(betAfterErr.message);
      if (data && (data as any).status && (data as any).status !== "pending") {
        betAfter = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    expect(betAfter?.id).toBeTruthy();
    expect(["won", "lost"]).toContain(String((betAfter as any)?.status));

    if (String((betAfter as any)?.status) === "won") {
      const { data: winTx, error: winTxErr } = await supabaseCallWithRetries(
        () =>
          userSb
            .from("point_transactions")
            .select(
              "id, type, amount, balance_before, balance_after, related_id, related_type",
            )
            .eq("user_id", userId as string)
            .eq("type", "win")
            .eq("related_id", (betRow as any).id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        5,
      );

      if (winTxErr) throw new Error(winTxErr.message);
      expect((winTx as any)?.related_type).toBe("game_bets");
      expect(Number((winTx as any)?.amount)).toBeGreaterThan(0);
      expect(Number((winTx as any)?.balance_after)).toBe(
        Number((winTx as any)?.balance_before) + Number((winTx as any)?.amount),
      );
      expect(Number((betAfter as any)?.win_amount ?? 0)).toBeGreaterThan(0);
    }

    const { data: newRound, error: newRoundErr } =
      await supabaseCallWithRetries(
        () =>
          adminSb
            .from("game_rounds")
            .select("id, game_type, round_number, status, betting_end_time")
            .eq("game_type", "ladder")
            .eq("status", "betting")
            .gte("betting_end_time", new Date().toISOString())
            .order("round_number", { ascending: false })
            .limit(1)
            .maybeSingle(),
        5,
      );
    if (newRoundErr) throw new Error(newRoundErr.message);
    expect(Number((newRound as any)?.round_number)).toBeGreaterThan(
      roundNumber,
    );
  });
});
