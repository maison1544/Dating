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

    const alreadyVisible = await modal
      .isVisible({ timeout: 500 })
      .catch(() => false);
    if (alreadyVisible) {
      await expect(modal).toContainText(title);
      return modal;
    }

    await button
      .evaluate((el) => (el as HTMLElement).click())
      .catch(() => undefined);

    let visible = await modal.isVisible({ timeout: 1500 }).catch(() => false);
    if (!visible) {
      await button.click({ timeout: 3000 }).catch(() => undefined);
      visible = await modal.isVisible({ timeout: 1500 }).catch(() => false);
    }

    if (visible) {
      await expect(modal).toContainText(title);
      return modal;
    }
  }

  await expect(modal).toBeVisible({ timeout: 20_000 });
  await expect(modal).toContainText(title);
  return modal;
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

test.describe("MyPage gift sell E2E + DB mapping", () => {
  test.skip(
    !creds.userEmail ||
      !creds.userPassword ||
      !creds.adminUsername ||
      !creds.adminPassword,
    "Missing user/admin credentials"
  );
  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (grants/sells gift)");

  test("Admin grants user a gift -> user sells from /mypage -> DB points/inventory/transactions consistent", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const startedAt = new Date().toISOString();

    page.on("pageerror", (err) => {
      // eslint-disable-next-line no-console
      console.log("[pageerror]", err?.message || String(err));
    });
    page.on("console", (msg) => {
      // eslint-disable-next-line no-console
      console.log(`[console:${msg.type()}]`, msg.text());
    });

    // USER login
    await loginUser(page);

    const userAccessToken = await getSupabaseAccessToken(page);
    const userSb = createAuthedSupabaseClient(userAccessToken);

    const userRes = await userSb.auth.getUser();
    const userId = userRes.data.user?.id;
    expect(userId).toBeTruthy();

    // ADMIN client (for gift grant)
    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    // pick first active gift
    const { data: gifts, error: giftsErr } = await adminSb
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
    const sellPrice = Number(gift.sell_price);

    const grantQty = 3;
    const sellQty = 2;

    // baseline points + inventory
    const { data: profileBefore, error: profBeforeErr } = await userSb
      .from("user_profiles")
      .select("points")
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

    // ADMIN: grant gifts
    const { error: grantErr } = await adminSb.rpc("admin_gift_grant", {
      p_user_id: userId as string,
      p_gift_id: giftId,
      p_quantity: grantQty,
    });
    if (grantErr) throw new Error(grantErr.message);

    // wait DB inventory reflects grant
    let qtyAfterGrant: number | null = null;
    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("gift_inventory")
        .select("quantity")
        .eq("user_id", userId as string)
        .eq("gift_id", giftId)
        .maybeSingle();
      if (!error && data) {
        qtyAfterGrant = Number((data as any).quantity ?? 0);
        if (qtyAfterGrant >= qtyBefore + grantQty) break;
      }
      await sleep(500);
    }
    if (qtyAfterGrant == null)
      throw new Error("Could not verify grant inventory");

    // USER: go to mypage inventory tab and sell
    await page.goto("/mypage");

    await page.getByRole("button", { name: "선물 인벤토리" }).click();

    const itemCard = page
      .locator("div.bg-gray-900.rounded-lg.p-4.border")
      .filter({ hasText: giftName })
      .first();
    await expect(itemCard).toBeVisible();

    const sellBtn = itemCard.getByRole("button", { name: "판매" });
    await expect(sellBtn).toBeVisible();

    const sellModal = await openQuantityModal(page, sellBtn, /기프트\s*판매/);

    // set qty to sellQty
    if (sellQty > 1) {
      for (let i = 1; i < sellQty; i++) {
        await sellModal.getByRole("button", { name: "수량 증가" }).click();
      }
    }

    await sellModal.getByRole("button", { name: "확인" }).click();
    await waitAndCloseCustomAlert(page, "판매 완료");

    // DB: sell transaction exists
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

    const { data: profileAfter, error: profAfterErr } = await userSb
      .from("user_profiles")
      .select("points")
      .eq("id", userId as string)
      .single();
    if (profAfterErr) throw new Error(profAfterErr.message);
    const pointsAfter = Number((profileAfter as any)?.points ?? 0);

    const { data: invAfter, error: invAfterErr } = await userSb
      .from("gift_inventory")
      .select("quantity")
      .eq("user_id", userId as string)
      .eq("gift_id", giftId)
      .single();
    if (invAfterErr) throw new Error(invAfterErr.message);
    const qtyAfter = Number((invAfter as any)?.quantity ?? 0);

    expect(qtyAfter).toBe(qtyBefore + grantQty - sellQty);
    expect(pointsAfter).toBe(pointsBefore + sellPrice * sellQty);
  });
});
