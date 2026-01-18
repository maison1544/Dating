import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  loginAdmin,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function poll<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  opts?: { timeoutMs?: number; intervalMs?: number; label?: string }
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 40_000;
  const intervalMs = opts?.intervalMs ?? 1000;
  const started = Date.now();

  let last: T | undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    last = await fn();
    if (predicate(last)) return last;

    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting: ${opts?.label || "condition"}`);
    }

    await sleep(intervalMs);
  }
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function getAdminSb() {
  const adminEmail = backofficeEmailFromUsername(creds.adminUsername as string);
  const token = await signInWithPassword(
    adminEmail,
    creds.adminPassword as string
  );
  return createAuthedSupabaseClient(token);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fillLabeledInput(
  root: import("@playwright/test").Locator,
  labelText: string,
  value: string
) {
  const label = root
    .locator("label")
    .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(labelText)}\\s*$`) })
    .first();

  await expect(label).toBeVisible({ timeout: 10_000 });

  const container = label.locator("xpath=..");
  const input = container.locator("input").first();

  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(value);
}

test.describe("Admin charging cards created_by", () => {
  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin credentials"
  );
  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (mutates charging_cards)");

  test("Create charging card -> DB created_by matches admin id", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const adminSb = await getAdminSb();
    const { data: authData, error: authErr } = await adminSb.auth.getUser();
    if (authErr) throw new Error(authErr.message);

    const adminId = authData.user?.id;
    expect(adminId).toBeTruthy();

    const startedAt = new Date().toISOString();
    const amount = (10 + Math.floor(Math.random() * 900)) * 1000;
    const bonus = Math.floor(Math.random() * 50) * 100;

    await loginAdmin(page, "admin");
    const pointsNav = page.getByRole("link", { name: "입출금 관리" }).first();
    await expect(pointsNav).toBeVisible({ timeout: 20_000 });
    await pointsNav.click();
    await expect(page).toHaveURL(/\/admin\/points(\/|$)/);
    await expect(
      page.getByRole("heading", { name: "입출금 관리" })
    ).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "충전카드 관리" }).click();
    await page.getByRole("button", { name: "새 충전권 추가" }).click();

    const modal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "새 충전권 추가" })
      .last();

    await expect(modal).toBeVisible({ timeout: 20_000 });

    await fillLabeledInput(modal, "기본 금액 (원)", String(amount));
    await fillLabeledInput(modal, "보너스 포인트 (원)", String(bonus));

    await modal.getByRole("button", { name: "추가하기" }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });

    let chargingCardId: string | null = null;

    try {
      const created = await poll(
        async () => {
          const { data, error } = await adminSb
            .from("charging_cards")
            .select("id, name, amount, bonus_amount, created_by, created_at")
            .eq("amount", amount)
            .eq("bonus_amount", bonus)
            .eq("created_by", adminId)
            .gte("created_at", startedAt)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw new Error(error.message);
          return data as any;
        },
        (row) => !!(row as any)?.id,
        { label: "charging card created" }
      );

      chargingCardId = String((created as any).id);

      expect(String((created as any).created_by || "")).toBe(String(adminId));
      expect(Number((created as any).amount || 0)).toBe(amount);
      expect(Number((created as any).bonus_amount || 0)).toBe(bonus);
    } finally {
      if (chargingCardId) {
        const { error } = await adminSb
          .from("charging_cards")
          .delete()
          .eq("id", chargingCardId);

        if (error) {
          await adminSb
            .from("charging_cards")
            .update({ is_active: false })
            .eq("id", chargingCardId);
        }
      }
    }
  });
});
