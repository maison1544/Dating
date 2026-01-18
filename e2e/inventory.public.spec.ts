import { test, expect } from "@playwright/test";
import {
  clickButtonInventory,
  closeModalByCancel,
  isKstDateTime,
  openConfirmModal,
  openFirstProfileModalFromMain,
} from "./utils";

const inventoryRoutes = [
  "/",
  "/notice",
  "/ranking",
  "/realtime-matching",
  "/minigame",
  "/ladder-game",
  "/dice-game",
  "/login",
  "/signup",
] as const;

for (const route of inventoryRoutes) {
  test(`Public button inventory: ${route}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    await clickButtonInventory(page);
  });
}

test("Main: profile modal content sanity + confirm modal cancel", async ({
  page,
}) => {
  const modal = await openFirstProfileModalFromMain(page);

  if (!(await modal.isVisible())) {
    await expect(page.locator("body")).toBeVisible();
    return;
  }

  await expect(modal.getByText("나를 말하자면..")).toBeVisible();
  await expect(modal.getByText(/\d+세/)).toBeVisible();

  const confirm = await openConfirmModal(page, "채팅 시작하기");
  await closeModalByCancel(confirm);

  await closeModalByCancel(modal);
});

test("Notice: if a notice item exists, expanded content shows KST-like datetime when present", async ({
  page,
}) => {
  await page.goto("/notice");
  await expect(page.locator("body")).toBeVisible();

  const noticeCard = page.locator("div.cursor-pointer").first();
  if ((await noticeCard.count()) === 0) return;

  await noticeCard.click();

  const kstCandidate = page
    .locator("text=/\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}/")
    .first();
  if (await kstCandidate.count()) {
    const text = (await kstCandidate.textContent())?.trim() || "";
    expect(isKstDateTime(text)).toBeTruthy();
  }

  const closeBtn = page.getByLabel("닫기");
  if (await closeBtn.count()) {
    await closeBtn.first().click();
  } else {
    await noticeCard.click();
  }
});
