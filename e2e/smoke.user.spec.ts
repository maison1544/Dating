import { test, expect } from "@playwright/test";
import { creds, loginUser } from "./utils";

test.describe("User authenticated smoke", () => {
  test.skip(
    !creds.userEmail || !creds.userPassword,
    "Missing user credentials env"
  );

  test("Login -> MyPage -> Point -> Payment history basic navigation", async ({
    page,
  }) => {
    await loginUser(page);

    await page.goto("/mypage");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/point");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/payment-history");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Point gift tab: opens quantity modal (cancel only by default)", async ({
    page,
  }) => {
    await loginUser(page);
    await page.goto("/point");

    const giftTab = page.getByRole("button", { name: "기프트" });
    if (await giftTab.count()) {
      await giftTab.click();
    }

    const buyBtn = page.getByRole("button", { name: /구매/ }).first();
    if (await buyBtn.count()) {
      await buyBtn.click();
      const modal = page.locator("div.fixed.inset-0.z-50");
      await expect(modal).toBeVisible();

      await modal.getByRole("button", { name: "취소" }).click();
      await expect(modal).toBeHidden();
    }
  });
});
