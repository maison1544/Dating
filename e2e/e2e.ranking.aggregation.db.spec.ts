import { test, expect } from "@playwright/test";
import {
  createAuthedSupabaseClient,
  creds,
  getSupabaseAccessToken,
  loginUser,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function poll<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  opts?: { timeoutMs?: number; intervalMs?: number; label?: string }
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 45_000;
  const intervalMs = opts?.intervalMs ?? 750;
  const started = Date.now();

  let last: T | undefined;
  while (Date.now() - started <= timeoutMs) {
    last = await fn();
    if (predicate(last)) return last;
    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting: ${opts?.label || "condition"}`);
}

function displayNameFromUserRow(user: any) {
  const nick = String(user?.nickname || "").trim();
  const name = String(user?.name || "").trim();
  return nick || name || "익명";
}

test.describe("Ranking aggregation (monthly) E2E + DB verification", () => {
  test.skip(
    !creds.userEmail || !creds.userPassword,
    "Missing user credentials"
  );

  test("/ranking matches DB aggregation (monthly)", async ({ page }) => {
    test.setTimeout(180_000);

    await loginUser(page);
    await page.goto("/mypage");
    await expect(page.getByText("보유 포인트")).toBeVisible({
      timeout: 30_000,
    });

    const userToken = await getSupabaseAccessToken(page);
    const userSb = createAuthedSupabaseClient(userToken);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1);
    const sinceIso = startDate.toISOString();

    const giftStats = new Map<string, { count: number; value: number }>();

    const baseAggQuery = userSb
      .from("gift_transactions")
      .select(
        "sender_id, quantity_sum:quantity.sum(), points_amount_sum:points_amount.sum()"
      )
      .eq("sender_type", "user")
      .eq("receiver_type", "profile")
      .eq("transaction_type", "send")
      .gte("created_at", sinceIso);

    const { data: aggData, error: aggError } = await baseAggQuery
      .order("quantity_sum", { ascending: false })
      .order("points_amount_sum", { ascending: false })
      .limit(200);

    if (aggError) {
      const pageSize = 1000;
      const maxRows = 20_000;

      for (let from = 0; from < maxRows; from += pageSize) {
        const { data: pageTx, error: pageErr } = await userSb
          .from("gift_transactions")
          .select("sender_id, quantity, points_amount, created_at")
          .eq("sender_type", "user")
          .eq("receiver_type", "profile")
          .eq("transaction_type", "send")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (pageErr) throw new Error(pageErr.message);
        if (!pageTx || pageTx.length === 0) break;

        for (const t of pageTx) {
          const senderId = (t as any)?.sender_id as string | null;
          if (!senderId) continue;

          const quantity = Number((t as any)?.quantity ?? 1);
          const value = Number((t as any)?.points_amount ?? 0);

          const prev = giftStats.get(senderId) || { count: 0, value: 0 };
          giftStats.set(senderId, {
            count: prev.count + quantity,
            value: prev.value + value,
          });
        }

        if (pageTx.length < pageSize) break;
      }
    } else {
      for (const row of aggData || []) {
        const senderId = (row as any)?.sender_id as string | null;
        if (!senderId) continue;

        const count = Number(
          (row as any)?.quantity_sum ?? (row as any)?.quantity_sum?.sum ?? 0
        );
        const value = Number(
          (row as any)?.points_amount_sum ??
            (row as any)?.points_amount_sum?.sum ??
            0
        );

        giftStats.set(senderId, { count: count || 0, value: value || 0 });
      }
    }

    const sortedGiftSenders = Array.from(giftStats.entries())
      .sort((a, b) => {
        const countDiff = b[1].count - a[1].count;
        if (countDiff !== 0) return countDiff;
        return b[1].value - a[1].value;
      })
      .slice(0, 200);

    const topSenderIds = sortedGiftSenders.map(([id]) => id);

    let topUsers: any[] = [];
    if (topSenderIds.length > 0) {
      const { data, error } = await userSb
        .from("user_profiles")
        .select("id, name, nickname, points")
        .eq("status", "active")
        .in("id", topSenderIds);
      if (error) throw new Error(error.message);
      topUsers = data || [];
    }

    const userMap = new Map((topUsers || []).map((u: any) => [u.id, u]));

    const ranked: any[] = [];
    let rank = 1;

    for (const [userId, stats] of sortedGiftSenders) {
      const user = userMap.get(userId);
      if (!user) continue;

      ranked.push({
        ...user,
        gifts_sent_count: stats.count,
        gifts_sent_value: stats.value,
        rank,
      });

      rank += 1;
      if (ranked.length >= 50) break;
    }

    if (ranked.length < 50) {
      const { data: fillerUsers, error: fillerError } = await userSb
        .from("user_profiles")
        .select("id, name, nickname, points")
        .eq("status", "active")
        .order("points", { ascending: false })
        .limit(50);

      if (fillerError) throw new Error(fillerError.message);

      for (const u of fillerUsers || []) {
        if (ranked.length >= 50) break;
        if (ranked.some((r) => r.id === (u as any).id)) continue;

        ranked.push({
          ...(u as any),
          gifts_sent_count: 0,
          gifts_sent_value: 0,
          rank,
        });
        rank += 1;
      }
    }

    await page.goto("/ranking");

    const noData = page.getByText("아직 랭킹 데이터가 없습니다.");
    const errorText = page.getByText("랭킹을 불러오는 데 실패했습니다.");
    const list = page.locator("div.divide-y.divide-gray-800").first();

    const state = await poll(
      async () => {
        const noDataVisible = await noData.isVisible().catch(() => false);
        const errorVisible = await errorText.isVisible().catch(() => false);
        const rowCount = await list.locator(":scope > div").count();
        return { noDataVisible, errorVisible, rowCount };
      },
      (s) => s.noDataVisible || s.errorVisible || s.rowCount > 0,
      { timeoutMs: 20_000, intervalMs: 500, label: "ranking list/no-data" }
    );

    if (state.errorVisible) {
      await expect(errorText).toBeVisible();
      throw new Error("Ranking page shows error state");
    }

    if (state.noDataVisible) {
      await expect(noData).toBeVisible();
      expect(ranked.length).toBe(0);
      return;
    }

    const take = Math.min(10, ranked.length);

    for (let i = 0; i < take; i++) {
      const expected = ranked[i];
      const expectedName = displayNameFromUserRow(expected);
      const expectedGifts = Number((expected as any).gifts_sent_count ?? 0);
      const expectedPoints = Number((expected as any).points ?? 0);

      const row = list.locator(":scope > div").nth(i);
      await expect(row).toContainText(expectedName);
      await expect(row).toContainText(`${expectedGifts}개 선물`);

      const pointsText =
        (await row.locator("p.text-pink-500.font-bold").textContent()) || "";
      const pointsNum = Number(pointsText.replace(/[^0-9]/g, ""));
      expect(pointsNum).toBe(expectedPoints);
    }

    await poll(
      async () => page.locator("body").isVisible(),
      (v) => v === true,
      { label: "page stable" }
    );
  });
});
