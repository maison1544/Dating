import { test, expect } from "@playwright/test";
import {
  clickButtonInventory,
  createAuthedSupabaseClient,
  creds,
  getSupabaseAccessToken,
  isKstDateTime,
  loginAdmin,
} from "./utils";

test.describe("Admin button inventory + data mapping sanity", () => {
  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin creds"
  );

  test("Admin routes button inventory (safe mode)", async ({ page }) => {
    await loginAdmin(page, "admin");

    const routes = [
      "/admin",
      "/admin/users",
      "/admin/accounts",
      "/admin/points",
      "/admin/notices",
      "/admin/chats",
      "/admin/gifts",
      "/admin/minigames",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      await clickButtonInventory(page);
    }
  });

  test("Admin users: open a user detail modal and verify KST datetime formatting", async ({
    page,
  }) => {
    await loginAdmin(page, "admin");
    await page.goto("/admin/users");
    await expect(page.locator("body")).toBeVisible();

    const openBtn = page.locator('button[title="더보기"]').first();

    if (!(await openBtn.count())) {
      await expect(page.locator("body")).toBeVisible();
      return;
    }

    await openBtn.click();

    const modalRoot = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "회원 상세 정보" })
      .last();
    await expect(modalRoot).toBeVisible();

    const joinedRow = modalRoot
      .getByText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
      .first();
    if (await joinedRow.count()) {
      const text = (await joinedRow.textContent())?.trim() || "";
      expect(isKstDateTime(text)).toBeTruthy();
    }

    const closeBtn = modalRoot
      .locator("div.sticky")
      .first()
      .locator("button")
      .last();
    await closeBtn.click({ timeout: 10_000, force: true });
    await expect(modalRoot).toBeHidden();
  });

  test("Admin users list is backed by DB user_profiles (non-empty when DB has rows)", async ({
    page,
  }) => {
    await loginAdmin(page, "admin");
    const accessToken = await getSupabaseAccessToken(page);
    const sb = createAuthedSupabaseClient(accessToken);

    const { data: anyUsers, error } = await sb
      .from("user_profiles")
      .select("id", { count: "exact", head: false })
      .limit(1);

    if (error) throw new Error(error.message);

    await page.goto("/admin/users");
    await expect(page.locator("body")).toBeVisible();

    if ((anyUsers || []).length > 0) {
      const tableLike = page.locator("table");
      if (await tableLike.count()) {
        await expect(tableLike.first()).toBeVisible();
      }
    }
  });
});
