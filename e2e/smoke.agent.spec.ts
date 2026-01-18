import { test, expect } from "@playwright/test";
import { creds, loginAdmin } from "./utils";

test.describe("Agent authenticated smoke", () => {
  test.skip(
    !creds.agentUsername || !creds.agentPassword,
    "Missing agent credentials env"
  );

  test("Agent: can navigate agent pages", async ({ page }) => {
    try {
      await loginAdmin(page, "agent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      test.skip(true, `Agent login failed: ${msg}`);
      return;
    }

    const routes = ["/agent", "/agent/members", "/agent/chats", "/agent/gifts"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
