import { test, expect } from "@playwright/test";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/notice",
  "/ranking",
  "/realtime-matching",
  "/minigame",
  "/dice-game",
  "/ladder-game",
];

const protectedUserRoutes = [
  "/mypage",
  "/point",
  "/payment-history",
  "/profile-edit",
];

const protectedAdminRoutes = [
  "/admin",
  "/admin/users",
  "/admin/accounts",
  "/admin/points",
  "/admin/notices",
  "/admin/chats",
  "/admin/gifts",
  "/admin/minigames",
];

const protectedAgentRoutes = [
  "/agent",
  "/agent/members",
  "/agent/chats",
  "/agent/gifts",
];

test("Public routes render without crashing", async ({ page }) => {
  for (const route of publicRoutes) {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
  }
});

test("User protected routes redirect to /login when logged out", async ({
  page,
}) => {
  for (const route of protectedUserRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("Admin protected routes redirect to /admin/login when logged out", async ({
  page,
}) => {
  for (const route of protectedAdminRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login/);
  }
});

test("Agent protected routes redirect to /agent/login when logged out", async ({
  page,
}) => {
  for (const route of protectedAgentRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/agent\/login/);
  }
});
