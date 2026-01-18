import { test, expect } from "@playwright/test";
import { creds, loginAdmin } from "./utils";

test.describe("Admin authenticated smoke", () => {
  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin credentials env"
  );

  test("Admin: can navigate all admin pages", async ({ page }) => {
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
    }
  });

  test("Admin chats: opens create modal and cancels", async ({ page }) => {
    await loginAdmin(page, "admin");
    await page.goto("/admin/chats");

    const addBtn = page
      .getByRole("button", {
        name: /추가|등록|생성|새 프로필|프로필 추가|추가하기/,
      })
      .first();
    if (await addBtn.count()) {
      await addBtn.click();
      const modal = page
        .locator("div.fixed.inset-0")
        .filter({
          has: page.getByRole("button", { name: /저장|등록|생성|취소/ }),
        });
      await expect(modal).toBeVisible();

      const closeBtn = modal.getByRole("button", { name: "취소" });
      if (await closeBtn.count()) {
        await closeBtn.click();
      } else {
        await modal.locator("button").first().click();
      }
      await expect(modal).toBeHidden();
    }
  });
});
