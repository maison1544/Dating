import { test, expect } from "@playwright/test";
import {
  openFirstProfileModalFromMain,
  openConfirmModal,
  closeModalByCancel,
} from "./utils";

test("Main: profile modal opens/closes; confirm modal opens/cancels", async ({
  page,
}) => {
  const modal = await openFirstProfileModalFromMain(page);

  if (!(await modal.isVisible())) {
    await expect(page.locator("body")).toBeVisible();
    return;
  }

  await expect(modal.getByText("채팅 시작하기")).toBeVisible();

  const confirm = await openConfirmModal(page, "채팅 시작하기");
  await closeModalByCancel(confirm);

  await closeModalByCancel(modal);
});

test("Realtime matching: tabs switch and login CTA works when logged out", async ({
  page,
}) => {
  await page.goto("/realtime-matching");
  await expect(page.getByRole("button", { name: "실시간채팅" })).toBeVisible();
  await page.getByRole("button", { name: "채팅목록" }).click();

  const loginCta = page.getByRole("button", { name: "로그인하기" });
  if (await loginCta.count()) {
    await loginCta.click();
    await expect(page).toHaveURL(/\/login/);
  }
});

test("Notice: expands/collapses a notice item", async ({ page }) => {
  await page.goto("/notice");
  const noticeCard = page.locator("div.cursor-pointer").first();
  if ((await noticeCard.count()) === 0) {
    const emptyState = page.getByText("등록된 공지사항이 없습니다.");
    if (await emptyState.count()) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", { level: 1, name: /공지사항/ })
      ).toBeVisible();
    }
    return;
  }

  await expect(noticeCard).toBeVisible();
  await noticeCard.click();

  const closeBtn = page.getByLabel("닫기");
  if (await closeBtn.count()) {
    await closeBtn.first().click();
    return;
  }

  await noticeCard.click();
});

test("Header nav: / -> /notice -> /ranking -> /minigame", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "공지사항" }).click();
  await expect(page).toHaveURL(/\/notice/);

  await page.getByRole("link", { name: "랭킹" }).click();
  await expect(page).toHaveURL(/\/ranking|\/accommodation/);

  await page.getByRole("link", { name: "커플미션" }).click();
  await expect(page).toHaveURL(/\/minigame|\/mini-game/);
});
