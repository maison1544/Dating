import { test, expect } from "@playwright/test";
import {
  clickButtonInventory,
  createAuthedSupabaseClient,
  creds,
  getSupabaseAccessToken,
  isKstDateTime,
  loginUser,
} from "./utils";

test.describe("User button inventory + modal/date sanity", () => {
  test.skip(
    !creds.userEmail || !creds.userPassword,
    "Missing user credentials"
  );

  test("User routes button inventory (safe mode)", async ({ page }) => {
    await loginUser(page);

    const routes = ["/mypage", "/point", "/payment-history", "/profile-edit"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      await clickButtonInventory(page);
    }
  });

  test("Payment history: if list rows exist, date format uses YYYY-MM-DD HH:mm", async ({
    page,
  }) => {
    await loginUser(page);
    await page.goto("/payment-history");
    await expect(page.locator("body")).toBeVisible();

    const dateCell = page
      .locator("text=/\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}/")
      .first();

    if (await dateCell.count()) {
      const text = (await dateCell.textContent())?.trim() || "";
      expect(isKstDateTime(text)).toBeTruthy();
    }
  });

  test("User mypage: profile points matches DB user_profiles.points", async ({
    page,
  }) => {
    await loginUser(page);
    const accessToken = await getSupabaseAccessToken(page);
    const sb = createAuthedSupabaseClient(accessToken);

    const userRes = await sb.auth.getUser();
    const userId = userRes.data.user?.id;
    expect(userId).toBeTruthy();

    const { data: profileRow, error } = await sb
      .from("user_profiles")
      .select("points")
      .eq("id", userId as string)
      .single();

    if (error) throw new Error(error.message);

    await page.goto("/mypage");
    await expect(page.locator("body")).toBeVisible();

    const pointsCard = page
      .locator("div")
      .filter({ has: page.getByText("보유 포인트") })
      .first();

    const pointsText = await pointsCard
      .locator("p")
      .filter({ hasText: /\sP$/ })
      .first()
      .textContent();

    const uiNum = Number(String(pointsText || "").replace(/[^0-9]/g, ""));
    expect(uiNum).toBe(Number((profileRow as any)?.points ?? 0));
  });
});
