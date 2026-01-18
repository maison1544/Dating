import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  loginAdmin,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function poll<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  opts?: { timeoutMs?: number; intervalMs?: number; label?: string }
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const intervalMs = opts?.intervalMs ?? 500;
  const started = Date.now();

  let last: T | undefined;
  while (Date.now() - started <= timeoutMs) {
    last = await fn();
    if (predicate(last)) return last;
    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting: ${opts?.label || "condition"}`);
}

function uniqueSuffix() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

let nonAdminUser: { email: string; password: string } | null = null;

async function getAdminSb() {
  const adminEmail = backofficeEmailFromUsername(creds.adminUsername as string);
  const adminToken = await signInWithPassword(
    adminEmail,
    creds.adminPassword as string
  );
  return createAuthedSupabaseClient(adminToken);
}

async function ensureNonAdminUser(browser: import("@playwright/test").Browser) {
  if (nonAdminUser) return nonAdminUser;

  const adminSb = await getAdminSb();

  const { data: userRow } = await adminSb
    .from("user_profiles")
    .select("id")
    .eq("email", creds.userEmail as string)
    .maybeSingle();

  const userId = userRow?.id;
  if (userId) {
    const [adminCheck, agentCheck] = await Promise.all([
      adminSb.from("admins").select("id").eq("id", userId).maybeSingle(),
      adminSb.from("agents").select("id").eq("id", userId).maybeSingle(),
    ]);

    if (!adminCheck.data?.id && !agentCheck.data?.id) {
      nonAdminUser = {
        email: creds.userEmail as string,
        password: creds.userPassword as string,
      };
      return nonAdminUser;
    }
  }

  if (!creds.mutate) {
    throw new Error(
      "Need a non-admin user for permission tests; set E2E_MUTATE=true"
    );
  }

  const startedAt = new Date().toISOString();
  const suffix = uniqueSuffix();
  const email = `e2e_perm_user_${suffix}@secretday.com`;
  const password = `E2ePerm!${suffix}`;

  const userContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const userPage = await userContext.newPage();
  const adminPage = await adminContext.newPage();

  await userPage.goto("/signup");
  await userPage.getByPlaceholder("이름을 입력하세요").fill("테스트");
  await userPage
    .getByPlaceholder("닉네임을 입력하세요")
    .fill(`권한${suffix.slice(-3)}`);
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

  const pending = await poll(
    async () => {
      const { data } = await adminSb
        .from("user_profiles")
        .select("id, email, status, created_at")
        .eq("email", email)
        .gte("created_at", startedAt)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    (row) => !!row?.id,
    { label: "pending user exists" }
  );

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

  await poll(
    async () => {
      const { data } = await adminSb
        .from("user_profiles")
        .select("id, status")
        .eq("id", String((pending as any).id))
        .maybeSingle();
      return data as any;
    },
    (r) => String(r?.status) === "active",
    { label: "user active" }
  );

  await userContext.close();
  await adminContext.close();

  nonAdminUser = { email, password };
  return nonAdminUser;
}

test.describe("Permissions + RLS denial cases (E2E + DB)", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !creds.userEmail || !creds.userPassword,
    "Missing user credentials"
  );
  test.skip(
    !creds.adminUsername ||
      !creds.adminPassword ||
      !creds.agentUsername ||
      !creds.agentPassword,
    "Missing admin/agent credentials"
  );
  test.skip(
    !creds.mutate,
    "Requires E2E_MUTATE=true (may create a non-admin user)"
  );

  test("Cross-role route blocking: user cannot access /admin/* or /agent/*", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    const u = await ensureNonAdminUser(browser);
    await page.goto("/login");
    await page.getByPlaceholder("이메일을 입력하세요").fill(u.email);
    await page.getByPlaceholder("비밀번호를 입력하세요").fill(u.password);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/admin");
    await poll(
      async () => page.url(),
      (url) => !url.includes("/admin"),
      {
        timeoutMs: 20_000,
        intervalMs: 500,
        label: "user redirected from /admin",
      }
    );
    expect(page.url()).not.toContain("/admin");

    await page.goto("/agent");
    await poll(
      async () => page.url(),
      (url) => !url.includes("/agent"),
      {
        timeoutMs: 20_000,
        intervalMs: 500,
        label: "user redirected from /agent",
      }
    );
    expect(page.url()).not.toContain("/agent");

    await ctx.close();
  });

  test("Cross-role route blocking: agent cannot access /admin/*", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await loginAdmin(page, "agent");

    await page.goto("/admin");
    await poll(
      async () => page.url(),
      (url) => !url.includes("/admin"),
      {
        timeoutMs: 20_000,
        intervalMs: 500,
        label: "agent redirected from /admin",
      }
    );
    expect(page.url()).not.toContain("/admin");

    await page.goto("/admin/users");
    await poll(
      async () => page.url(),
      (url) => !url.includes("/admin/users"),
      {
        timeoutMs: 20_000,
        intervalMs: 500,
        label: "agent redirected from /admin/users",
      }
    );
    expect(page.url()).not.toContain("/admin/users");

    await ctx.close();
  });

  test("DB/RLS: user cannot read agents table", async ({ page, browser }) => {
    test.setTimeout(120_000);

    void page;

    const u = await ensureNonAdminUser(browser);
    const userToken = await signInWithPassword(u.email, u.password);
    const userSb = createAuthedSupabaseClient(userToken);

    const res = await userSb.from("agents").select("id").limit(1);
    expect(res.error || (res.data || []).length === 0).toBeTruthy();
  });

  test("DB/RLS: user cannot read admins table", async () => {
    test.setTimeout(120_000);

    const u = nonAdminUser || {
      email: creds.userEmail as string,
      password: creds.userPassword as string,
    };

    const userToken = await signInWithPassword(u.email, u.password);
    const userSb = createAuthedSupabaseClient(userToken);

    const res = await userSb.from("admins").select("id").limit(1);
    expect(res.error || (res.data || []).length === 0).toBeTruthy();
  });

  test("DB/RLS: user cannot read other user's profile", async () => {
    test.setTimeout(120_000);

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    const u = nonAdminUser || {
      email: creds.userEmail as string,
      password: creds.userPassword as string,
    };

    const { data: meRow, error: meErr } = await adminSb
      .from("user_profiles")
      .select("id")
      .eq("email", u.email)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    const myId = meRow?.id;
    expect(myId).toBeTruthy();

    const { data: otherRow, error: otherErr } = await adminSb
      .from("user_profiles")
      .select("id")
      .neq("id", myId as string)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (otherErr) throw new Error(otherErr.message);
    const otherUserId = otherRow?.id;
    expect(otherUserId).toBeTruthy();

    const userToken = await signInWithPassword(u.email, u.password);
    const userSb = createAuthedSupabaseClient(userToken);

    const res = await userSb
      .from("user_profiles")
      .select("id, email")
      .eq("id", otherUserId as string)
      .maybeSingle();

    expect(res.error || !res.data).toBeTruthy();
  });

  test("DB/RLS: agent cannot read non-referred user profile", async () => {
    test.setTimeout(120_000);

    const agentEmail = backofficeEmailFromUsername(
      creds.agentUsername as string
    );
    const agentToken = await signInWithPassword(
      agentEmail,
      creds.agentPassword as string
    );
    const agentSb = createAuthedSupabaseClient(agentToken);

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    const { data: agentRow, error: agentErr } = await adminSb
      .from("agents")
      .select("id")
      .eq("username", creds.agentUsername as string)
      .maybeSingle();
    if (agentErr) throw new Error(agentErr.message);
    const agentId = agentRow?.id;
    expect(agentId).toBeTruthy();

    const { data: otherUser, error: otherUserErr } = await adminSb
      .from("user_profiles")
      .select("id")
      .eq("status", "active")
      .or(`agent_id.is.null,agent_id.neq.${String(agentId)}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (otherUserErr) throw new Error(otherUserErr.message);
    const otherUserId = otherUser?.id;
    expect(otherUserId).toBeTruthy();

    const res = await agentSb
      .from("user_profiles")
      .select("id, email")
      .eq("id", String(otherUserId))
      .maybeSingle();

    expect(res.error || !res.data).toBeTruthy();
  });
});
