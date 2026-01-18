import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  getSupabaseAccessToken,
  loginAdmin,
  loginUser,
  openConfirmModal,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test.describe("Payments E2E + DB mapping", () => {
  test.skip(
    !creds.userEmail ||
      !creds.userPassword ||
      !creds.adminUsername ||
      !creds.adminPassword,
    "Missing user/admin credentials"
  );
  test.skip(
    !creds.mutate,
    "Requires E2E_MUTATE=true (creates/approves requests)"
  );

  test("User creates deposit+withdrawal requests -> admin approves -> DB points + transactions reflect", async ({
    page,
    browser,
  }) => {
    test.setTimeout(150_000);

    const startedAt = new Date().toISOString();

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    const userContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const userPage = await userContext.newPage();
    const adminPage = await adminContext.newPage();

    // USER: login and create deposit request from /point
    await loginUser(userPage);
    await userPage.goto("/point");

    const userAccessToken = await getSupabaseAccessToken(userPage);
    const userSb = createAuthedSupabaseClient(userAccessToken);

    const userRes = await userSb.auth.getUser();
    const userId = userRes.data.user?.id;
    expect(userId).toBeTruthy();

    const { data: userProfileRow, error: userProfileErr } = await userSb
      .from("user_profiles")
      .select(
        "id, email, name, nickname, points, bank, account_number, account_holder"
      )
      .eq("id", userId as string)
      .single();
    if (userProfileErr) throw new Error(userProfileErr.message);

    const userEmail = String((userProfileRow as any)?.email || "");
    expect(userEmail).toBeTruthy();

    // Ensure withdrawal prerequisites: bank info + points >= 10,000
    const needBankInfo =
      !(userProfileRow as any)?.bank ||
      !(userProfileRow as any)?.account_number ||
      !(userProfileRow as any)?.account_holder;

    if (needBankInfo) {
      const { error: updErr } = await userSb
        .from("user_profiles")
        .update({
          bank: "KB국민은행",
          account_number: "1234567890",
          account_holder: "테스터",
        })
        .eq("id", userId as string);
      if (updErr) throw new Error(updErr.message);

      await userPage.reload();
      await expect(userPage.locator("body")).toBeVisible();
    }

    const withdrawalAmount = 10_000;

    // Top-up user points if needed (so withdrawal button can enable)
    const { data: pointsRow, error: pointsErr } = await userSb
      .from("user_profiles")
      .select("points")
      .eq("id", userId as string)
      .single();
    if (pointsErr) throw new Error(pointsErr.message);

    const pointsBeforeAll = Number((pointsRow as any)?.points ?? 0);

    if (pointsBeforeAll < withdrawalAmount + 5_000) {
      const { error: topupErr } = await adminSb.rpc("add_points", {
        p_user_id: userId as string,
        p_amount: 50_000,
        p_type: "admin_adjust",
        p_reference_id: null,
        p_description: "E2E payments topup",
      });
      if (topupErr) throw new Error(topupErr.message);

      await userPage.reload();
      await expect(userPage.locator("body")).toBeVisible();
    }

    const { data: pointsRowBeforeDeposit, error: pointsBeforeDepositErr } =
      await userSb
        .from("user_profiles")
        .select("points")
        .eq("id", userId as string)
        .single();

    if (pointsBeforeDepositErr) throw new Error(pointsBeforeDepositErr.message);
    const balanceBeforeDeposit = Number(
      (pointsRowBeforeDeposit as any)?.points ?? 0
    );

    const confirmDeposit = await openConfirmModal(userPage, "충전하기");
    await confirmDeposit.getByRole("button", { name: "확인" }).click();

    // Verify DB: pending deposit request exists
    let depositReq: any = null;
    for (let i = 0; i < 20; i++) {
      const { data, error } = await userSb
        .from("deposit_requests")
        .select("*")
        .eq("user_id", userId as string)
        .eq("status", "pending")
        .gte("created_at", startedAt)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (data?.id) {
        depositReq = data;
        break;
      }
      await sleep(500);
    }

    expect(depositReq?.id).toBeTruthy();
    const depositCredit =
      Number((depositReq as any).amount || 0) +
      Number((depositReq as any).bonus_amount || 0);
    expect(depositCredit).toBeGreaterThan(0);

    // ADMIN: approve deposit in UI
    await loginAdmin(adminPage, "admin");
    await adminPage.goto("/admin/points");

    const search = adminPage.getByPlaceholder(
      "회원 이름, 닉네임, 이메일로 검색"
    );
    await expect(search).toBeVisible();
    await search.fill(userEmail);

    const depositAmountText = `+${Number(
      (depositReq as any).amount || 0
    ).toLocaleString()}원`;
    const depositRow = adminPage
      .locator("tr")
      .filter({ hasText: userEmail })
      .filter({ hasText: depositAmountText })
      .first();

    await expect(depositRow).toBeVisible({ timeout: 20_000 });

    const approveDepositBtn = depositRow.getByRole("button", { name: "승인" });
    await expect(approveDepositBtn).toBeEnabled();
    await approveDepositBtn.click();

    const confirmApproveDeposit = adminPage
      .locator("div.fixed.inset-0")
      .filter({ has: adminPage.getByRole("button", { name: "승인" }) })
      .last();
    await expect(confirmApproveDeposit).toBeVisible();
    await confirmApproveDeposit.getByRole("button", { name: "승인" }).click();

    // Verify DB: deposit approved + points credited + charge transaction exists
    for (let i = 0; i < 30; i++) {
      const { data, error } = await adminSb
        .from("deposit_requests")
        .select("status, processed_by")
        .eq("id", (depositReq as any).id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (String((data as any)?.status) === "approved") {
        expect((data as any)?.processed_by).toBeTruthy();
        break;
      }
      await sleep(500);
    }

    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("user_profiles")
        .select("points")
        .eq("id", userId as string)
        .single();
      if (error) throw new Error(error.message);
      const now = Number((data as any)?.points ?? 0);
      if (now === balanceBeforeDeposit + depositCredit) break;
      await sleep(500);
    }

    const { data: pointsAfterDepositRow, error: pointsAfterDepositErr } =
      await userSb
        .from("user_profiles")
        .select("points")
        .eq("id", userId as string)
        .single();
    if (pointsAfterDepositErr) throw new Error(pointsAfterDepositErr.message);

    const balanceAfterDeposit = Number(
      (pointsAfterDepositRow as any)?.points ?? 0
    );
    expect(balanceAfterDeposit).toBe(balanceBeforeDeposit + depositCredit);

    const { data: chargeTxs, error: chargeTxErr } = await userSb
      .from("point_transactions")
      .select("id, type, amount, related_id, description, created_at")
      .eq("user_id", userId as string)
      .eq("type", "charge")
      .gte("created_at", startedAt)
      .order("created_at", { ascending: false })
      .limit(25);
    if (chargeTxErr) throw new Error(chargeTxErr.message);

    const chargeTx = (chargeTxs || []).find(
      (t: any) =>
        Number(t.amount || 0) === depositCredit &&
        (String(t.related_id || "") === String((depositReq as any).id) ||
          String(t.description || "").includes("입금"))
    );
    expect(chargeTx?.id).toBeTruthy();

    // USER: create withdrawal request from /point
    await userPage.goto("/point");
    await userPage.getByRole("button", { name: "출금" }).click();

    const withdrawInput = userPage.getByPlaceholder(
      "출금할 포인트를 입력하세요 (최소 10,000P)"
    );
    await expect(withdrawInput).toBeVisible();
    await withdrawInput.fill(String(withdrawalAmount));

    const confirmWithdraw = await openConfirmModal(userPage, "출금 신청");
    await confirmWithdraw.getByRole("button", { name: "확인" }).click();

    // Verify DB: pending withdrawal request exists
    let withdrawalReq: any = null;
    for (let i = 0; i < 20; i++) {
      const { data, error } = await userSb
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", userId as string)
        .eq("status", "pending")
        .gte("created_at", startedAt)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (data?.id) {
        withdrawalReq = data;
        break;
      }
      await sleep(500);
    }

    expect(withdrawalReq?.id).toBeTruthy();
    expect(Number((withdrawalReq as any)?.amount ?? 0)).toBe(withdrawalAmount);

    // ADMIN: approve withdrawal in UI
    await adminPage.goto("/admin/points");
    await expect(search).toBeVisible();
    await search.fill(userEmail);

    const withdrawalAmountText = `-${withdrawalAmount.toLocaleString()}원`;
    const withdrawalRow = adminPage
      .locator("tr")
      .filter({ hasText: userEmail })
      .filter({ hasText: withdrawalAmountText })
      .first();

    await expect(withdrawalRow).toBeVisible({ timeout: 20_000 });

    const approveWithdrawalBtn = withdrawalRow.getByRole("button", {
      name: "승인",
    });
    await expect(approveWithdrawalBtn).toBeEnabled();
    await approveWithdrawalBtn.click();

    const confirmApproveWithdrawal = adminPage
      .locator("div.fixed.inset-0")
      .filter({ has: adminPage.getByRole("button", { name: "승인" }) })
      .last();
    await expect(confirmApproveWithdrawal).toBeVisible();
    await confirmApproveWithdrawal
      .getByRole("button", { name: "승인" })
      .click();

    // Verify DB: withdrawal approved + points debited + withdraw tx exists
    for (let i = 0; i < 30; i++) {
      const { data, error } = await adminSb
        .from("withdrawal_requests")
        .select("status, processed_by")
        .eq("id", (withdrawalReq as any).id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (String((data as any)?.status) === "approved") {
        expect((data as any)?.processed_by).toBeTruthy();
        break;
      }
      await sleep(500);
    }

    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("user_profiles")
        .select("points")
        .eq("id", userId as string)
        .single();
      if (error) throw new Error(error.message);
      const now = Number((data as any)?.points ?? 0);
      if (now === balanceAfterDeposit - withdrawalAmount) break;
      await sleep(500);
    }

    const { data: pointsAfterAllRow, error: pointsAfterAllErr } = await userSb
      .from("user_profiles")
      .select("points")
      .eq("id", userId as string)
      .single();
    if (pointsAfterAllErr) throw new Error(pointsAfterAllErr.message);

    const balanceAfterAll = Number((pointsAfterAllRow as any)?.points ?? 0);
    expect(balanceAfterAll).toBe(balanceAfterDeposit - withdrawalAmount);

    const { data: withdrawTxs, error: withdrawTxErr } = await userSb
      .from("point_transactions")
      .select("id, type, amount, related_id, description, created_at")
      .eq("user_id", userId as string)
      .eq("type", "withdraw")
      .gte("created_at", startedAt)
      .order("created_at", { ascending: false })
      .limit(25);
    if (withdrawTxErr) throw new Error(withdrawTxErr.message);

    const withdrawTx = (withdrawTxs || []).find(
      (t: any) =>
        Number(t.amount || 0) === -withdrawalAmount &&
        (String(t.related_id || "") === String((withdrawalReq as any).id) ||
          String(t.description || "").includes("출금"))
    );
    expect(withdrawTx?.id).toBeTruthy();

    await userContext.close();
    await adminContext.close();

    void page;
  });
});
