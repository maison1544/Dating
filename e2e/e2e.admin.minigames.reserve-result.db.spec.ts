import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  loginAdmin,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForFreshBettingRound(
  adminSb: ReturnType<typeof createAuthedSupabaseClient>,
  gameType: "powerball" | "ladder",
  minSecondsLeft: number
) {
  for (let i = 0; i < 30; i++) {
    const { error: tickErr } = await adminSb.rpc("admin_game_tick", {
      p_game_type: gameType,
    });
    if (tickErr) throw new Error(tickErr.message);

    const { data, error } = await adminSb
      .from("game_rounds")
      .select(
        "id, game_type, round_number, status, betting_end_time, reserved_result, reserved_by, reserved_at"
      )
      .eq("game_type", gameType)
      .eq("status", "betting")
      .gte("betting_end_time", new Date().toISOString())
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (data?.id) {
      const endMs = new Date(String((data as any).betting_end_time)).getTime();
      const secondsLeft = Math.floor((endMs - Date.now()) / 1000);
      if (Number.isFinite(secondsLeft) && secondsLeft >= minSecondsLeft) {
        return data as any;
      }

      const { error: forceErr } = await adminSb.rpc(
        "admin_force_process_round",
        {
          p_round_id: String((data as any).id),
          p_result: null,
        }
      );
      if (forceErr) throw new Error(forceErr.message);
    }

    await sleep(500);
  }

  throw new Error("Could not obtain a fresh betting round");
}

async function waitForReservedResult(
  adminSb: ReturnType<typeof createAuthedSupabaseClient>,
  roundId: string,
  expected: Record<string, unknown> | null
) {
  let row: any = null;
  for (let i = 0; i < 30; i++) {
    const { data, error } = await adminSb
      .from("game_rounds")
      .select("id, reserved_result, reserved_by, reserved_at")
      .eq("id", roundId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    row = data;

    const reserved = (data as any)?.reserved_result;

    if (expected === null) {
      if (!reserved) return data as any;
    } else {
      if (reserved) {
        const keysOk = Object.keys(expected).every(
          (k) => (reserved as any)?.[k] === (expected as any)[k]
        );
        if (
          keysOk &&
          (data as any)?.reserved_by &&
          (data as any)?.reserved_at
        ) {
          return data as any;
        }
      }
    }

    await sleep(1000);
  }

  throw new Error("Timed out waiting for reserved_result update");
}

async function waitForRoundResult(
  adminSb: ReturnType<typeof createAuthedSupabaseClient>,
  roundId: string,
  expected: Record<string, unknown>
) {
  let row: any = null;
  for (let i = 0; i < 30; i++) {
    const { data, error } = await adminSb
      .from("game_rounds")
      .select("id, status, result")
      .eq("id", roundId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    row = data;

    const status = String((data as any)?.status || "");
    const result = (data as any)?.result;

    if (["completed", "settled"].includes(status) && result) {
      const keysOk = Object.keys(expected).every(
        (k) => (result as any)?.[k] === (expected as any)[k]
      );
      if (keysOk) return data as any;
    }

    await sleep(1000);
  }

  throw new Error("Timed out waiting for round settlement/result");
}

test.describe("Admin Minigames reserve result (UI) -> DB reserved_result -> settlement uses reserved", () => {
  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin credentials"
  );
  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (mutates game_rounds)");

  test("Powerball: reserve result via UI -> cancel -> reserve again -> DB reserved_result set -> settlement uses it", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    const round = await waitForFreshBettingRound(adminSb, "powerball", 120);
    const roundId = String((round as any).id);
    const roundNumber = Number((round as any).round_number);
    expect(roundId).toBeTruthy();
    expect(roundNumber).toBeGreaterThan(0);

    // Admin UI: open result adjustment modal
    await loginAdmin(page, "admin");
    await page.goto("/admin/minigames");

    await page.getByRole("button", { name: "결과조정" }).click();

    const modal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "결과조정" })
      .last();
    await expect(modal).toBeVisible();

    const card = modal
      .locator("div.bg-gray-800.rounded-lg")
      .filter({ hasText: "파워볼" })
      .filter({ hasText: `#${roundNumber}회차` })
      .first();
    await expect(card).toBeVisible();

    // choose a deterministic selection: normalBallOddEven = 홀
    await card.locator("select").first().selectOption("홀");

    // Reserve
    await card.getByRole("button", { name: "결과 예약" }).click();

    const expectedReserved = {
      normalOddEven: "odd",
      normalUnderOver: "under",
      powerballOddEven: "odd",
      powerballUnderOver: "under",
    };

    await waitForReservedResult(adminSb, roundId, expectedReserved);

    // Cancel via UI
    const cancelBtn = card.getByRole("button", { name: "예약 취소" });
    await expect(cancelBtn).toBeVisible({ timeout: 20_000 });
    await cancelBtn.click();
    await waitForReservedResult(adminSb, roundId, null);

    // Reserve again
    await card.locator("select").first().selectOption("홀");
    await card.getByRole("button", { name: "결과 예약" }).click();
    await waitForReservedResult(adminSb, roundId, expectedReserved);

    // Force process and tick until complete; p_result is null so server should apply reserved_result.
    for (let i = 0; i < 12; i++) {
      const { error: forceErr } = await adminSb.rpc(
        "admin_force_process_round",
        {
          p_round_id: roundId,
          p_result: null,
        }
      );
      if (forceErr) throw new Error(forceErr.message);

      const { error: tickErr } = await adminSb.rpc("admin_game_tick", {
        p_game_type: "powerball",
      });
      if (tickErr) throw new Error(tickErr.message);

      const { data } = await adminSb
        .from("game_rounds")
        .select("status")
        .eq("id", roundId)
        .maybeSingle();

      if (
        data &&
        ["completed", "settled"].includes(String((data as any).status))
      ) {
        break;
      }

      await sleep(500);
    }

    await waitForRoundResult(adminSb, roundId, expectedReserved);
  });
});
