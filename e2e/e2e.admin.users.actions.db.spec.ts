import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  loginAdmin,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function uniqueSuffix() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

async function ensureFreshActiveUser(
  browser: import("@playwright/test").Browser,
  adminSb: ReturnType<typeof createAuthedSupabaseClient>,
  startedAtIso: string
) {
  const suffix = uniqueSuffix();
  const email = `e2e_admin_users_actions_${suffix}@secretday.com`;
  const password = `E2eAdminUsers!${suffix}`;

  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();

  await userPage.goto("/signup");
  await userPage.getByPlaceholder("이름을 입력하세요").fill("테스트");
  await userPage
    .getByPlaceholder("닉네임을 입력하세요")
    .fill(`유저${suffix.slice(-3)}`);
  await userPage.getByPlaceholder("이메일을 입력하세요").fill(email);
  await userPage.getByPlaceholder("'-' 없이 입력하세요").fill("01012345678");
  await userPage.getByPlaceholder("비밀번호를 입력하세요").fill(password);
  await userPage.getByPlaceholder("비밀번호를 다시 입력하세요").fill(password);
  await userPage.getByRole("button", { name: "다음" }).click();

  await userPage.locator("select").first().selectOption("국민은행");
  await userPage.getByPlaceholder("'-' 없이 입력하세요").fill("123456789012");
  await userPage.getByPlaceholder("예금주 이름을 입력하세요").fill("테스터");

  await userPage.locator('input[type="checkbox"]').check();
  await userPage.getByRole("button", { name: "회원가입" }).click();
  await expect(userPage).toHaveURL(/\/login$/);

  const pending = await (async () => {
    for (let i = 0; i < 30; i++) {
      const { data, error } = await adminSb
        .from("user_profiles")
        .select("id, email, status, created_at")
        .eq("email", email)
        .gte("created_at", startedAtIso)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) return data as any;
      await sleep(1000);
    }
    throw new Error(`Could not find created user_profiles row for ${email}`);
  })();

  await adminSb
    .from("user_profiles")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", String((pending as any).id));

  await (async () => {
    for (let i = 0; i < 30; i++) {
      const { data, error } = await adminSb
        .from("user_profiles")
        .select("id, status")
        .eq("id", String((pending as any).id))
        .maybeSingle();
      if (!error && data && String((data as any).status) === "active") return;
      await sleep(1000);
    }
    throw new Error("User did not become active");
  })();

  await userContext.close();
  return { email, password, id: String((pending as any).id) };
}

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

async function waitForUserStatus(
  sb: ReturnType<typeof createAuthedSupabaseClient>,
  userId: string,
  status: string
) {
  let row: any = null;
  for (let i = 0; i < 30; i++) {
    const { data, error } = await sb
      .from("user_profiles")
      .select("id, status, points")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) {
      row = data;
      if (String((data as any).status) === status) break;
    }
    await sleep(1000);
  }
  if (!row) throw new Error("Could not fetch user profile");
  expect(String(row.status)).toBe(status);
  return row;
}

async function waitForPointTx(
  sb: ReturnType<typeof createAuthedSupabaseClient>,
  userId: string,
  startedAtIso: string,
  amount: number
) {
  let row: any = null;
  for (let i = 0; i < 30; i++) {
    const { data, error } = await sb
      .from("point_transactions")
      .select("id, type, amount, description, created_at")
      .eq("user_id", userId)
      .eq("type", "admin_adjust")
      .eq("amount", amount)
      .gte("created_at", startedAtIso)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error && Array.isArray(data) && data.length > 0) {
      row = data[0];
      break;
    }
    await sleep(1000);
  }
  if (!row) throw new Error("Could not find admin_adjust point transaction");
  return row;
}

async function waitForGiftTx(
  sb: ReturnType<typeof createAuthedSupabaseClient>,
  userId: string,
  giftId: string,
  startedAtIso: string,
  txType: string,
  quantity: number
) {
  let row: any = null;
  for (let i = 0; i < 30; i++) {
    const { data, error } = await sb
      .from("gift_transactions")
      .select(
        "id, transaction_type, gift_id, quantity, points_amount, created_at"
      )
      .eq("sender_type", "user")
      .eq("receiver_type", "user")
      .eq("sender_id", userId)
      .eq("receiver_id", userId)
      .eq("gift_id", giftId)
      .eq("transaction_type", txType)
      .eq("quantity", quantity)
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
    throw new Error(`Could not find gift_transactions txType=${txType}`);
  }
  return row;
}

test.describe("Admin Users actions E2E + DB mapping", () => {
  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin credentials"
  );
  test.skip(
    !creds.mutate,
    "Requires E2E_MUTATE=true (mutates user status/points/gifts)"
  );

  test("Admin can suspend/unsuspend user, adjust points, grant/revoke gifts (UI) -> DB reflects", async ({
    browser,
  }) => {
    test.setTimeout(240_000);

    const startedAt = new Date().toISOString();

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    const testUser = await ensureFreshActiveUser(browser, adminSb, startedAt);
    const userId = testUser.id;

    // Baseline: ensure user is active
    await adminSb
      .from("user_profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", userId as string);
    await waitForUserStatus(adminSb, userId as string, "active");

    // Pick one active gift to use for grant/revoke checks
    const { data: gifts, error: giftsErr } = await adminSb
      .from("gifts")
      .select("id, name, sell_price")
      .eq("is_active", true)
      .order("sell_price", { ascending: true })
      .limit(1);
    if (giftsErr) throw new Error(giftsErr.message);
    const gift = (gifts || [])[0] as any;
    expect(gift?.id).toBeTruthy();
    const giftId = String(gift.id);

    const { data: invBeforeRows, error: invBeforeErr } = await adminSb
      .from("gift_inventory")
      .select("quantity")
      .eq("user_id", userId as string)
      .eq("gift_id", giftId)
      .limit(1);
    if (invBeforeErr) throw new Error(invBeforeErr.message);
    const invBeforeQty =
      Array.isArray(invBeforeRows) && invBeforeRows.length > 0
        ? Number((invBeforeRows[0] as any).quantity ?? 0)
        : 0;

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    adminPage.on("pageerror", (err) => {
      // eslint-disable-next-line no-console
      console.log("[pageerror]", err?.message || String(err));
    });
    adminPage.on("console", (msg) => {
      // eslint-disable-next-line no-console
      console.log(`[console:${msg.type()}]`, msg.text());
    });

    await loginAdmin(adminPage, "admin");
    await adminPage.goto("/admin/users");

    // Search the user
    await adminPage
      .getByPlaceholder("회원 이름, 닉네임, 이메일, IP로 검색")
      .fill(String(testUser.email));

    const userRow = adminPage
      .locator("tbody tr")
      .filter({ hasText: String(testUser.email) })
      .first();
    await expect(userRow).toBeVisible();

    // Open details modal
    await userRow.locator('button[title="더보기"]').click();

    const detailModal = adminPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "회원 상세 정보" })
      .last();
    await expect(detailModal).toBeVisible();

    // Suspend user
    await detailModal.getByRole("button", { name: "회원 정지" }).click();

    const suspendModal = adminPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "회원 정지" })
      .last();
    await expect(suspendModal).toBeVisible();
    await suspendModal
      .getByPlaceholder("정지 사유를 입력하세요")
      .fill("E2E suspend");
    await suspendModal.getByRole("button", { name: "확인" }).click();
    await waitAndCloseCustomAlert(adminPage, "처리 완료");

    await waitForUserStatus(adminSb, userId as string, "suspended");

    // Unsuspend
    await detailModal.getByRole("button", { name: "정지 해제" }).click();
    const unsuspendModal = adminPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "정지 해제" })
      .last();
    await expect(unsuspendModal).toBeVisible();
    await unsuspendModal.getByRole("button", { name: "확인" }).click();
    await waitAndCloseCustomAlert(adminPage, "처리 완료");

    await waitForUserStatus(adminSb, userId as string, "active");

    // Adjust points +1000
    const { data: beforePointsRow, error: beforePointsErr } = await adminSb
      .from("user_profiles")
      .select("points")
      .eq("id", userId as string)
      .single();
    if (beforePointsErr) throw new Error(beforePointsErr.message);
    const pointsBefore = Number((beforePointsRow as any).points ?? 0);

    await detailModal.getByRole("button", { name: "조정" }).click();
    await expect(
      detailModal.getByRole("heading", { name: "포인트 조정" })
    ).toBeVisible();
    await detailModal.getByPlaceholder("금액 입력").fill("1000");
    await detailModal.getByRole("button", { name: "확인" }).first().click();
    await waitAndCloseCustomAlert(adminPage, "처리 완료");

    const afterAdd = await waitForUserStatus(
      adminSb,
      userId as string,
      "active"
    );
    expect(Number((afterAdd as any).points ?? 0)).toBe(pointsBefore + 1000);
    await waitForPointTx(adminSb, userId as string, startedAt, 1000);

    // Adjust points -500
    await detailModal.getByRole("button", { name: "조정" }).click();
    await expect(
      detailModal.getByRole("heading", { name: "포인트 조정" })
    ).toBeVisible();
    await detailModal.locator("select").first().selectOption("subtract");
    await detailModal.getByPlaceholder("금액 입력").fill("500");
    await detailModal.getByRole("button", { name: "확인" }).first().click();
    await waitAndCloseCustomAlert(adminPage, "처리 완료");

    const afterSub = await waitForUserStatus(
      adminSb,
      userId as string,
      "active"
    );
    expect(Number((afterSub as any).points ?? 0)).toBe(
      pointsBefore + 1000 - 500
    );
    await waitForPointTx(adminSb, userId as string, startedAt, -500);

    // Gifts grant/revoke (UserDetailModal -> 기프트 내역 -> 기프트 증감)
    await detailModal.getByRole("button", { name: "기프트 내역" }).click();
    await expect(
      detailModal.getByRole("button", { name: "기프트 증감" })
    ).toBeVisible();

    // Grant 2
    await detailModal.getByRole("button", { name: "기프트 증감" }).click();
    const giftModal = adminPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "기프트 증감 관리" })
      .last();
    await expect(giftModal).toBeVisible();
    await giftModal.locator("select").first().selectOption(giftId);
    await giftModal.getByPlaceholder("수량을 입력하세요").fill("2");
    await giftModal.getByRole("button", { name: "지급", exact: true }).click();
    await waitAndCloseCustomAlert(adminPage, "처리 완료");

    await waitForGiftTx(
      adminSb,
      userId as string,
      giftId,
      startedAt,
      "admin_grant",
      2
    );

    // Revoke 1
    await detailModal.getByRole("button", { name: "기프트 증감" }).click();
    const giftModal2 = adminPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "기프트 증감 관리" })
      .last();
    await expect(giftModal2).toBeVisible();
    await giftModal2.getByRole("button", { name: "회수 (-)" }).click();
    await giftModal2.locator("select").first().selectOption(giftId);
    await giftModal2.getByPlaceholder("수량을 입력하세요").fill("1");
    await giftModal2.getByRole("button", { name: "회수", exact: true }).click();
    await waitAndCloseCustomAlert(adminPage, "처리 완료");

    await waitForGiftTx(
      adminSb,
      userId as string,
      giftId,
      startedAt,
      "admin_revoke",
      1
    );

    // Inventory check after grant/revoke
    const { data: invAfter, error: invAfterErr } = await adminSb
      .from("gift_inventory")
      .select("quantity")
      .eq("user_id", userId as string)
      .eq("gift_id", giftId)
      .maybeSingle();
    if (invAfterErr) throw new Error(invAfterErr.message);
    const qtyAfter = Number((invAfter as any)?.quantity ?? 0);
    expect(qtyAfter).toBe(invBeforeQty + 2 - 1);

    await adminContext.close();
  });
});
