import { test, expect } from "@playwright/test";
import { clickButtonInventory, creds, loginAdmin } from "./utils";

test.describe("Agent button inventory", () => {
  test.skip(
    !creds.agentUsername || !creds.agentPassword,
    "Missing agent creds"
  );

  test("Agent routes button inventory (safe mode)", async ({ page }) => {
    await loginAdmin(page, "agent");

    const routes = ["/agent", "/agent/members", "/agent/chats", "/agent/gifts"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      await clickButtonInventory(page);
    }
  });
});
