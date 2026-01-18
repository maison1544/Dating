import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  loginAdmin,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function closeCustomAlertIfPresent(
  page: import("@playwright/test").Page,
  titleText?: string
) {
  const alertRoot = page
    .locator("div.fixed.inset-0")
    .filter({ has: page.getByRole("button", { name: "확인" }) });

  const targeted = titleText
    ? alertRoot.filter({ hasText: titleText }).last()
    : alertRoot.last();

  const visible = await targeted
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (!visible) return;

  await targeted.getByRole("button", { name: "확인" }).click();
}

async function waitForUserProfileByEmail(
  adminSb: ReturnType<typeof createAuthedSupabaseClient>,
  email: string,
  startedAtIso: string
) {
  let row: any = null;
  for (let i = 0; i < 30; i++) {
    const { data, error } = await adminSb
      .from("user_profiles")
      .select("id, email, status, created_at, deleted_at")
      .eq("email", email)
      .gte("created_at", startedAtIso)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      await sleep(1000);
      continue;
    }

    if (Array.isArray(data) && data.length > 0) {
      row = data[0];
      break;
    }

    await sleep(1000);
  }

  if (!row) {
    throw new Error(`Could not find user_profiles row for email=${email}`);
  }

  return row;
}

test.describe("Signup -> pending -> admin approval -> login E2E + DB mapping", () => {
  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin credentials"
  );
  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (creates/approves user)");

  test("User signs up (pending) -> cannot login -> admin approves -> user can login", async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const startedAt = new Date().toISOString();

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    const suffix = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const email = `e2e_signup_${suffix}@secretday.com`;
    const password = `E2eSignup!${suffix}`;

    const userContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const userPage = await userContext.newPage();
    const adminPage = await adminContext.newPage();

    // USER: signup
    await userPage.goto("/signup");

    await userPage.getByPlaceholder("이름을 입력하세요").fill("테스트");
    await userPage
      .getByPlaceholder("닉네임을 입력하세요")
      .fill(`테스터${suffix.slice(-3)}`);
    await userPage.getByPlaceholder("이메일을 입력하세요").fill(email);
    await userPage.getByPlaceholder("'-' 없이 입력하세요").fill("01012345678");
    await userPage.getByPlaceholder("비밀번호를 입력하세요").fill(password);
    await userPage
      .getByPlaceholder("비밀번호를 다시 입력하세요")
      .fill(password);

    await userPage.getByRole("button", { name: "다음" }).click();

    await userPage.locator("select").first().selectOption("국민은행");
    await userPage.getByPlaceholder("'-' 없이 입력하세요").fill("123456789012");
    await userPage.getByPlaceholder("예금주 이름을 입력하세요").fill("테스터");

    await userPage.locator('input[type="checkbox"]').check();

    await userPage.getByRole("button", { name: "회원가입" }).click();
    await expect(userPage).toHaveURL(/\/login$/);

    await closeCustomAlertIfPresent(userPage, "회원가입 완료");

    // DB: profile exists and is pending
    const pendingRow = await waitForUserProfileByEmail(
      adminSb,
      email,
      startedAt
    );
    expect(String(pendingRow.status)).toBe("pending");

    // USER: login should be blocked while pending
    await userPage.getByPlaceholder("이메일을 입력하세요").fill(email);
    await userPage.getByPlaceholder("비밀번호를 입력하세요").fill(password);
    await userPage.getByRole("button", { name: "로그인" }).click();
    await expect(userPage).toHaveURL(/\/login$/);
    const pendingMsg = userPage.getByText("관리자 승인 대기 중입니다");
    const loginFailedMsg = userPage.getByText("로그인에 실패했습니다.");
    await expect(pendingMsg.or(loginFailedMsg)).toBeVisible({
      timeout: 10_000,
    });

    // ADMIN: approve user via UI
    await loginAdmin(adminPage, "admin");
    await adminPage.goto("/admin/users");

    await adminPage.getByRole("button", { name: /회원 승인 대기/ }).click();

    const approvalModal = adminPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "회원 가입 승인 관리" })
      .last();
    await expect(approvalModal).toBeVisible();

    const row = approvalModal
      .locator("tbody tr")
      .filter({ hasText: email })
      .first();
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: "승인" }).click();

    const confirmModal = adminPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "회원 가입 승인" })
      .last();
    await expect(confirmModal).toBeVisible();
    await confirmModal.getByRole("button", { name: "승인하기" }).click();

    // close success alert (CustomAlert)
    await closeCustomAlertIfPresent(adminPage, "처리 완료");

    // DB: now active
    let activeRow: any = null;
    for (let i = 0; i < 30; i++) {
      const { data, error } = await adminSb
        .from("user_profiles")
        .select("id, email, status, deleted_at")
        .eq("id", String(pendingRow.id))
        .maybeSingle();
      if (!error && data) {
        activeRow = data;
        if (String((data as any).status) === "active") break;
      }
      await sleep(1000);
    }

    if (!activeRow)
      throw new Error("Could not re-fetch user profile after approval");
    expect(String(activeRow.status)).toBe("active");
    expect(activeRow.deleted_at).toBeNull();

    // USER: login now succeeds
    await userPage.goto("/login");
    await userPage.getByPlaceholder("이메일을 입력하세요").fill(email);
    await userPage.getByPlaceholder("비밀번호를 입력하세요").fill(password);
    await userPage.getByRole("button", { name: "로그인" }).click();
    await expect(userPage).toHaveURL(/\/$/);

    await userContext.close();
    await adminContext.close();
  });
});
