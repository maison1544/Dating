import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  getSupabaseAccessToken,
  loginUser,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitAndCloseCustomAlert(
  page: import("@playwright/test").Page,
  titleText: string,
  timeoutMs = 30_000
) {
  const alertRoot = page
    .locator("div.fixed.inset-0")
    .filter({ hasText: titleText })
    .filter({ has: page.getByRole("button", { name: "확인" }) })
    .last();

  await expect(alertRoot).toBeVisible({ timeout: timeoutMs });
  await alertRoot.getByRole("button", { name: "확인" }).click();
  await expect(alertRoot).toBeHidden({ timeout: 10_000 });
}

async function waitForQuantityModal(
  page: import("@playwright/test").Page,
  title: RegExp
) {
  const modal = page
    .locator("div.fixed.inset-0.z-50")
    .filter({ hasText: "총 금액" })
    .filter({ has: page.getByRole("button", { name: "확인" }) })
    .last();

  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText(title);
  return modal;
}

async function openQuantityModal(
  page: import("@playwright/test").Page,
  button: ReturnType<import("@playwright/test").Page["locator"]>,
  title: RegExp
) {
  const modal = page
    .locator("div.fixed.inset-0.z-50")
    .filter({ hasText: "총 금액" })
    .filter({ has: page.getByRole("button", { name: "확인" }) })
    .last();

  for (let attempt = 0; attempt < 5; attempt++) {
    await expect(button).toBeVisible();
    const isDisabled = await button
      .evaluate((el) => (el as HTMLButtonElement).disabled)
      .catch(() => false);
    if (isDisabled) {
      throw new Error("Target button is disabled");
    }

    const alreadyVisible = await modal
      .isVisible({ timeout: 500 })
      .catch(() => false);
    if (alreadyVisible) {
      await expect(modal).toContainText(title);
      return modal;
    }

    const url = page.url();
    if (!/\/point(\?|#|$)/.test(url)) {
      throw new Error(`Unexpected URL while opening modal: ${url}`);
    }

    // Try DOM click first (avoids Playwright actionability retries while React re-renders)
    await button
      .evaluate((el) => (el as HTMLElement).click())
      .catch(() => undefined);

    let visible = await modal.isVisible({ timeout: 1500 }).catch(() => false);
    if (!visible) {
      // Fallback: Playwright click but with a bounded timeout so it cannot hang the whole test
      await button.click({ timeout: 3000 }).catch(() => undefined);
      visible = await modal.isVisible({ timeout: 1500 }).catch(() => false);
    }

    if (visible) {
      await expect(modal).toContainText(title);
      return modal;
    }
  }

  return await waitForQuantityModal(page, title);
}

async function waitForPointTx(
  userSb: ReturnType<typeof createAuthedSupabaseClient>,
  userId: string,
  type: string,
  relatedId: string,
  startedAtIso: string
) {
  let row: any = null;
  for (let i = 0; i < 30; i++) {
    const { data, error } = await userSb
      .from("point_transactions")
      .select("id, type, amount, related_id, related_type, created_at")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("related_id", relatedId)
      .gte("created_at", startedAtIso)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      row = data[0];
      break;
    }

    await sleep(1000);
  }

  if (!row) {
    throw new Error(
      `Could not find point_transactions row type=${type} related_id=${relatedId}`
    );
  }

  return row;
}

test.describe("Gift shop buy/sell E2E + DB mapping", () => {
  test.skip(
    !creds.userEmail ||
      !creds.userPassword ||
      !creds.adminUsername ||
      !creds.adminPassword,
    "Missing user/admin credentials"
  );
  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (creates buy/sell tx)");

  test("User buys gift from /point then sells it -> DB points/inventory/transactions consistent", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    page.on("pageerror", (err) => {
      // eslint-disable-next-line no-console
      console.log("[pageerror]", err?.message || String(err));
    });
    page.on("console", (msg) => {
      // eslint-disable-next-line no-console
      console.log(`[console:${msg.type()}]`, msg.text());
    });

    const startedAt = new Date().toISOString();

    // login user via UI
    await loginUser(page);
    await page.goto("/point");

    const userAccessToken = await getSupabaseAccessToken(page);
    const userSb = createAuthedSupabaseClient(userAccessToken);

    const userRes = await userSb.auth.getUser();
    const userId = userRes.data.user?.id;
    expect(userId).toBeTruthy();

    // admin sb for top-ups if needed
    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    // pick first active gift
    const { data: gifts, error: giftsErr } = await userSb
      .from("gifts")
      .select("id, name, emoji, buy_price, sell_price, is_active")
      .eq("is_active", true)
      .order("buy_price", { ascending: true })
      .limit(1);
    if (giftsErr) throw new Error(giftsErr.message);
    const gift = (gifts || [])[0] as any;
    expect(gift?.id).toBeTruthy();

    const giftId = String(gift.id);
    const giftName = String(gift.name);
    const buyPrice = Number(gift.buy_price);
    const sellPrice = Number(gift.sell_price);

    const buyQty = 2;
    const sellQty = 1;

    // baseline: points + inventory
    const { data: profileBefore, error: profBeforeErr } = await userSb
      .from("user_profiles")
      .select("id, points")
      .eq("id", userId as string)
      .single();
    if (profBeforeErr) throw new Error(profBeforeErr.message);

    const pointsBefore = Number((profileBefore as any)?.points ?? 0);

    const { data: invBeforeRows, error: invBeforeErr } = await userSb
      .from("gift_inventory")
      .select("id, gift_id, quantity")
      .eq("user_id", userId as string)
      .eq("gift_id", giftId)
      .limit(1);
    if (invBeforeErr) throw new Error(invBeforeErr.message);

    const invBefore =
      Array.isArray(invBeforeRows) && invBeforeRows.length > 0
        ? invBeforeRows[0]
        : null;
    const qtyBefore = Number((invBefore as any)?.quantity ?? 0);

    const need = buyPrice * buyQty;
    if (pointsBefore < need + 100) {
      const { error: topupErr } = await adminSb.rpc("add_points", {
        p_user_id: userId as string,
        p_amount: 50_000,
        p_type: "admin_adjust",
        p_reference_id: null,
        p_description: "E2E giftshop topup",
      });
      if (topupErr) throw new Error(topupErr.message);

      await page.reload();
      await expect(page.locator("body")).toBeVisible();
    }

    const { data: profileBeforeEffective, error: profBeforeEffectiveErr } =
      await userSb
        .from("user_profiles")
        .select("points")
        .eq("id", userId as string)
        .single();
    if (profBeforeEffectiveErr) throw new Error(profBeforeEffectiveErr.message);
    const pointsBeforeEffective = Number(
      (profileBeforeEffective as any)?.points ?? 0
    );

    // go to gift tab
    await page.getByRole("button", { name: "기프트" }).click();

    // buy flow
    const giftCard = page
      .locator("div.bg-gray-900.rounded-lg.p-4.border")
      .filter({ has: page.getByRole("heading", { name: giftName }) })
      .first();
    await expect(giftCard).toBeVisible();
    const buyBtn = giftCard.getByRole("button", { name: "구매하기" });
    await expect(buyBtn).toBeVisible();
    await buyBtn.scrollIntoViewIfNeeded().catch(() => undefined);

    const qtyModal = await openQuantityModal(page, buyBtn, /기프트\s*구매/);

    // increase to desired quantity
    for (let i = 1; i < buyQty; i++) {
      await qtyModal.getByRole("button", { name: "수량 증가" }).click();
    }

    await qtyModal.getByRole("button", { name: "확인" }).click();
    await waitAndCloseCustomAlert(page, "구매 완료");

    // DB verify buy: gift_transactions + point_transactions + inventory + points
    let buyTx: any = null;
    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("gift_transactions")
        .select(
          "id, created_at, gift_id, quantity, points_amount, sender_id, sender_type, receiver_id, receiver_type, transaction_type"
        )
        .eq("gift_id", giftId)
        .eq("sender_type", "user")
        .eq("receiver_type", "user")
        .eq("transaction_type", "buy")
        .eq("sender_id", userId as string)
        .eq("receiver_id", userId as string)
        .gte("created_at", startedAt)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        buyTx = data[0];
        if (Number((buyTx as any).quantity) === buyQty) break;
      }

      await sleep(1000);
    }

    if (!buyTx) throw new Error("Could not find gift_transactions buy row");
    expect(String(buyTx.transaction_type)).toBe("buy");
    expect(Number(buyTx.quantity)).toBe(buyQty);
    expect(Number(buyTx.points_amount)).toBe(buyPrice * buyQty);

    const buyPointTx = await waitForPointTx(
      userSb,
      userId as string,
      "gift_buy",
      String(buyTx.id),
      startedAt
    );
    expect(Number(buyPointTx.amount)).toBe(-(buyPrice * buyQty));

    const { data: profileAfterBuy, error: profAfterBuyErr } = await userSb
      .from("user_profiles")
      .select("points")
      .eq("id", userId as string)
      .single();
    if (profAfterBuyErr) throw new Error(profAfterBuyErr.message);
    const pointsAfterBuy = Number((profileAfterBuy as any)?.points ?? 0);

    expect(pointsAfterBuy).toBe(pointsBeforeEffective - buyPrice * buyQty);

    const { data: invAfterBuy, error: invAfterBuyErr } = await userSb
      .from("gift_inventory")
      .select("gift_id, quantity")
      .eq("user_id", userId as string)
      .eq("gift_id", giftId)
      .single();
    if (invAfterBuyErr) throw new Error(invAfterBuyErr.message);
    expect(Number((invAfterBuy as any).quantity)).toBe(qtyBefore + buyQty);

    // sell flow (sellQty)
    const sellBtn = giftCard.getByRole("button", { name: "판매하기" });
    await expect(sellBtn).toBeVisible();
    await sellBtn.scrollIntoViewIfNeeded().catch(() => undefined);

    const sellModal = await openQuantityModal(page, sellBtn, /기프트\s*판매/);

    // ensure quantity is sellQty
    if (sellQty === 1) {
      // default is 1
    } else {
      for (let i = 1; i < sellQty; i++) {
        await sellModal.getByRole("button", { name: "수량 증가" }).click();
      }
    }

    await sellModal.getByRole("button", { name: "확인" }).click();
    await waitAndCloseCustomAlert(page, "판매 완료");

    // DB verify sell
    let sellTx: any = null;
    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("gift_transactions")
        .select(
          "id, created_at, gift_id, quantity, points_amount, sender_id, sender_type, receiver_id, receiver_type, transaction_type"
        )
        .eq("gift_id", giftId)
        .eq("sender_type", "user")
        .eq("receiver_type", "user")
        .eq("transaction_type", "sell")
        .eq("sender_id", userId as string)
        .eq("receiver_id", userId as string)
        .gte("created_at", startedAt)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        sellTx = data[0];
        if (Number((sellTx as any).quantity) === sellQty) break;
      }

      await sleep(1000);
    }

    if (!sellTx) throw new Error("Could not find gift_transactions sell row");
    expect(String(sellTx.transaction_type)).toBe("sell");
    expect(Number(sellTx.quantity)).toBe(sellQty);
    expect(Number(sellTx.points_amount)).toBe(sellPrice * sellQty);

    const sellPointTx = await waitForPointTx(
      userSb,
      userId as string,
      "gift_sell",
      String(sellTx.id),
      startedAt
    );
    expect(Number(sellPointTx.amount)).toBe(sellPrice * sellQty);

    const { data: profileAfterSell, error: profAfterSellErr } = await userSb
      .from("user_profiles")
      .select("points")
      .eq("id", userId as string)
      .single();
    if (profAfterSellErr) throw new Error(profAfterSellErr.message);

    const pointsAfterSell = Number((profileAfterSell as any)?.points ?? 0);

    const { data: invAfterSell, error: invAfterSellErr } = await userSb
      .from("gift_inventory")
      .select("gift_id, quantity")
      .eq("user_id", userId as string)
      .eq("gift_id", giftId)
      .single();
    if (invAfterSellErr) throw new Error(invAfterSellErr.message);

    expect(Number((invAfterSell as any).quantity)).toBe(
      qtyBefore + buyQty - sellQty
    );

    // expected points change from initial: -buyPrice*buyQty + sellPrice*sellQty
    const expectedDelta = -buyPrice * buyQty + sellPrice * sellQty;
    expect(pointsAfterSell).toBe(pointsBeforeEffective + expectedDelta);
  });
});
