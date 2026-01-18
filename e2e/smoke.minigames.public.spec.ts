import { test, expect } from "@playwright/test";
import {
  createAuthedSupabaseClient,
  creds,
  getSupabaseAccessToken,
  loginUser,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function floatingChatBtn(page: import("@playwright/test").Page) {
  const byIcon = page
    .locator(
      'button:has(svg.lucide-message-circle), button:has(svg[data-lucide="message-circle"])'
    )
    .first();
  const byClass = page.locator("button.fixed.bottom-24.left-6").first();
  return byIcon.or(byClass).first();
}

function floatingHistoryBtn(page: import("@playwright/test").Page) {
  const byIcon = page
    .locator(
      'button:has(svg.lucide-history), button:has(svg[data-lucide="history"])'
    )
    .first();
  const byClass = page.locator("button.fixed.bottom-6.left-6").first();
  return byIcon.or(byClass).first();
}

async function waitForMinigameOverlayToClear(
  page: import("@playwright/test").Page,
  titleText: string
) {
  const titled = page
    .locator("div.fixed.inset-0.z-50")
    .filter({ hasText: titleText });
  const anyResult = page
    .locator("div.fixed.inset-0.z-50")
    .filter({ hasText: "결과" });
  const overlay = titled.or(anyResult);

  // The result overlay can appear slightly after navigation/reload.
  // Poll briefly: if it appears, wait for it to clear.
  for (let i = 0; i < 20; i++) {
    const visible = await overlay.isVisible().catch(() => false);
    if (visible) {
      await overlay
        .first()
        .waitFor({ state: "hidden", timeout: 15_000 })
        .catch(() => {
          // If it never clears, the following click will fail anyway and surface a better error.
        });
      return;
    }
    await sleep(250);
  }
}

test("Minigame main navigates to ladder and powerball pages", async ({
  page,
}) => {
  await page.goto("/minigame");

  const playButtons = page.getByRole("button", { name: "플레이하기" });
  await expect(playButtons.first()).toBeVisible();

  await playButtons.first().click();
  await expect(page).toHaveURL(/\/ladder-game/);

  await page.goto("/minigame");
  await playButtons.nth(1).click();
  await expect(page).toHaveURL(/\/dice-game/);
});

test("Ladder game: opens and closes chat modal and bet history modal", async ({
  page,
}) => {
  await page.goto("/ladder-game");

  await expect(page.getByText("사다리 게임 5분")).toBeVisible({
    timeout: 30_000,
  });

  await waitForMinigameOverlayToClear(page, "사다리 결과");

  const chatBtn = floatingChatBtn(page);
  await expect(chatBtn).toBeVisible({ timeout: 30_000 });
  await chatBtn.evaluate((el) => (el as HTMLElement).click());

  const chatModal = page.locator("div.fixed.inset-0").filter({
    has: page.getByText("채팅"),
  });
  await expect(chatModal).toBeVisible();
  await chatModal.locator("div.bg-pink-500\\/20 button").click();
  await expect(chatModal).toBeHidden();

  const historyBtn = floatingHistoryBtn(page);
  await expect(historyBtn).toBeVisible({ timeout: 30_000 });
  await historyBtn.evaluate((el) => (el as HTMLElement).click());

  const historyModal = page.locator("div.fixed.inset-0").filter({
    has: page.getByText("배팅 기록"),
  });
  await expect(historyModal).toBeVisible();
  await historyModal.locator("div.bg-blue-500\\/20 button").click();
  await expect(historyModal).toBeHidden();
});

test("Powerball game: opens and closes chat modal and bet history modal", async ({
  page,
}) => {
  await page.goto("/dice-game");

  await expect(page.getByText("동행복권 파워볼 5분")).toBeVisible({
    timeout: 30_000,
  });

  await waitForMinigameOverlayToClear(page, "파워볼 결과");

  const chatBtn = floatingChatBtn(page);
  await expect(chatBtn).toBeVisible({ timeout: 30_000 });
  await chatBtn.evaluate((el) => (el as HTMLElement).click());

  const chatModal = page.locator("div.fixed.inset-0").filter({
    has: page.getByText("채팅"),
  });
  await expect(chatModal).toBeVisible();
  await chatModal.locator("div.bg-pink-500\\/20 button").click();
  await expect(chatModal).toBeHidden();

  const historyBtn = floatingHistoryBtn(page);
  await expect(historyBtn).toBeVisible({ timeout: 30_000 });
  await historyBtn.evaluate((el) => (el as HTMLElement).click());

  const historyModal = page.locator("div.fixed.inset-0").filter({
    has: page.getByText("배팅 기록"),
  });
  await expect(historyModal).toBeVisible();
  await historyModal.locator("div.bg-blue-500\\/20 button").click();
  await expect(historyModal).toBeHidden();

  const betBtn = page.getByRole("button", { name: "배팅하기" });
  await expect(betBtn).toBeVisible();
  await expect(betBtn).toBeDisabled();
});

test.describe("Minigame chat (authenticated)", () => {
  test.skip(
    !creds.userEmail || !creds.userPassword,
    "Missing user credentials"
  );

  async function sendAndWaitForGameChat(
    page: import("@playwright/test").Page,
    gameType: "ladder" | "powerball",
    content: string
  ) {
    const token = await getSupabaseAccessToken(page);
    const sb = createAuthedSupabaseClient(token);

    const rpcSend =
      gameType === "ladder"
        ? "ladder_game_chat_send"
        : "powerball_game_chat_send";
    const rpcList =
      gameType === "ladder"
        ? "ladder_game_chat_list"
        : "powerball_game_chat_list";

    const { error: sendErr } = await sb.rpc(
      rpcSend as any,
      {
        p_message: content,
      } as any
    );
    if (sendErr) throw new Error(sendErr.message);

    for (let i = 0; i < 30; i++) {
      const { data, error } = await sb.rpc(
        rpcList as any,
        { p_limit: 50 } as any
      );
      if (
        !error &&
        Array.isArray(data) &&
        data.some((m: any) => m?.message === content)
      ) {
        return;
      }
      await sleep(500);
    }

    throw new Error("Game chat message did not appear in RPC list");
  }

  test("Ladder: send chat message and it appears after reload", async ({
    page,
  }) => {
    await loginUser(page);
    await page.goto("/ladder-game");

    await expect(page.getByText("사다리 게임 5분")).toBeVisible({
      timeout: 30_000,
    });

    await waitForMinigameOverlayToClear(page, "사다리 결과");

    const chatBtn = floatingChatBtn(page);
    await expect(chatBtn).toBeVisible({ timeout: 30_000 });
    await chatBtn.evaluate((el) => (el as HTMLElement).click());

    const chatModal = page.locator("div.fixed.inset-0").filter({
      has: page.getByText("채팅"),
    });
    await expect(chatModal).toBeVisible();

    const content = `e2e-minigame-chat-${Date.now()}`;
    await sendAndWaitForGameChat(page, "ladder", content);

    await page.reload();
    await expect(page.getByText("사다리 게임 5분")).toBeVisible({
      timeout: 30_000,
    });
    await waitForMinigameOverlayToClear(page, "사다리 결과");
    await floatingChatBtn(page).evaluate((el) => (el as HTMLElement).click());
    await expect(chatModal).toBeVisible();

    const listAfterReload = chatModal.locator(
      "div.h-\\[400px\\].overflow-y-auto"
    );
    await expect(listAfterReload).toContainText(content, { timeout: 60_000 });
  });

  test("Powerball: send chat message and it appears after reload", async ({
    page,
  }) => {
    await loginUser(page);
    await page.goto("/dice-game");

    await expect(page.getByText("동행복권 파워볼 5분")).toBeVisible({
      timeout: 30_000,
    });

    await waitForMinigameOverlayToClear(page, "파워볼 결과");

    const chatBtn = floatingChatBtn(page);
    await expect(chatBtn).toBeVisible({ timeout: 60_000 });
    await chatBtn.evaluate((el) => (el as HTMLElement).click());

    const chatModal = page.locator("div.fixed.inset-0").filter({
      has: page.getByText("채팅"),
    });
    await expect(chatModal).toBeVisible();

    const content = `e2e-minigame-chat-${Date.now()}`;
    await sendAndWaitForGameChat(page, "powerball", content);

    await page.reload();
    await expect(page.getByText("동행복권 파워볼 5분")).toBeVisible({
      timeout: 30_000,
    });
    await waitForMinigameOverlayToClear(page, "파워볼 결과");
    await floatingChatBtn(page).evaluate((el) => (el as HTMLElement).click());
    await expect(chatModal).toBeVisible();

    const listAfterReload = chatModal.locator(
      "div.h-\\[400px\\].overflow-y-auto"
    );
    await expect(listAfterReload).toContainText(content, { timeout: 60_000 });
  });
});
