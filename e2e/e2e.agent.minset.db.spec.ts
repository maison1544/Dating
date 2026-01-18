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
  const timeoutMs = opts?.timeoutMs ?? 45_000;
  const intervalMs = opts?.intervalMs ?? 750;
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

async function getAdminSb() {
  const adminEmail = backofficeEmailFromUsername(creds.adminUsername as string);
  const token = await signInWithPassword(
    adminEmail,
    creds.adminPassword as string
  );
  return createAuthedSupabaseClient(token);
}

async function getAgentSb() {
  const agentEmail = backofficeEmailFromUsername(creds.agentUsername as string);
  const token = await signInWithPassword(
    agentEmail,
    creds.agentPassword as string
  );
  return createAuthedSupabaseClient(token);
}

test.describe("Agent /members + /gifts minimal set (UI + DB)", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !creds.adminUsername ||
      !creds.adminPassword ||
      !creds.agentUsername ||
      !creds.agentPassword ||
      !creds.userEmail ||
      !creds.userPassword,
    "Missing admin/agent/user credentials"
  );
  test.skip(
    !creds.mutate,
    "Requires E2E_MUTATE=true (may create member/transactions)"
  );

  test("/agent/members shows referred member and opens read-only detail modal", async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const startedAt = new Date().toISOString();

    const adminSb = await getAdminSb();
    const agentSb = await getAgentSb();

    const agentRes = await agentSb.auth.getUser();
    const agentId = agentRes.data.user?.id;
    expect(agentId).toBeTruthy();

    const { data: agentRow, error: agentRowErr } = await adminSb
      .from("agents")
      .select("id, referral_code")
      .eq("id", agentId as string)
      .maybeSingle();
    if (agentRowErr) throw new Error(agentRowErr.message);
    expect(agentRow?.referral_code).toBeTruthy();

    const referralCode = String((agentRow as any).referral_code);

    let memberRow = await adminSb
      .from("user_profiles")
      .select("id, email, name, nickname, status, agent_id")
      .eq("agent_id", agentId as string)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r) => {
        if (r.error) throw new Error(r.error.message);
        return r.data as any;
      });

    if (!memberRow?.id) {
      const suffix = uniqueSuffix();
      const email = `e2e_agent_member_${suffix}@secretday.com`;
      const password = `E2eAgent!${suffix}`;

      const userContext = await browser.newContext();
      const adminContext = await browser.newContext();
      const userPage = await userContext.newPage();
      const adminPage = await adminContext.newPage();

      await userPage.goto("/signup");
      await userPage.getByPlaceholder("이름을 입력하세요").fill("테스트");
      await userPage
        .getByPlaceholder("닉네임을 입력하세요")
        .fill(`에이전트${suffix.slice(-3)}`);
      await userPage.getByPlaceholder("이메일을 입력하세요").fill(email);
      await userPage
        .getByPlaceholder("'-' 없이 입력하세요")
        .fill("01012345678");
      await userPage.getByPlaceholder("비밀번호를 입력하세요").fill(password);
      await userPage
        .getByPlaceholder("비밀번호를 다시 입력하세요")
        .fill(password);
      await userPage.getByRole("button", { name: "다음" }).click();

      await userPage.locator("select").first().selectOption("국민은행");
      await userPage
        .getByPlaceholder("'-' 없이 입력하세요")
        .fill("123456789012");
      await userPage
        .getByPlaceholder("예금주 이름을 입력하세요")
        .fill("테스터");

      await userPage
        .getByPlaceholder("추천 코드를 입력하세요")
        .fill(referralCode);
      await expect(userPage.getByText("유효한 추천코드입니다.")).toBeVisible({
        timeout: 30_000,
      });

      await userPage.locator('input[type="checkbox"]').check();
      await userPage.getByRole("button", { name: "회원가입" }).click();
      await expect(userPage).toHaveURL(/\/login$/);

      const pending = await poll(
        async () => {
          const { data, error } = await adminSb
            .from("user_profiles")
            .select("id, email, status, agent_id, created_at")
            .eq("email", email)
            .gte("created_at", startedAt)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) return null;
          return data as any;
        },
        (row) => !!row?.id,
        { label: "new pending user profile" }
      );

      expect(String((pending as any).status)).toBe("pending");
      expect(String((pending as any).agent_id)).toBe(String(agentId));

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

      memberRow = await poll(
        async () => {
          const { data, error } = await adminSb
            .from("user_profiles")
            .select("id, email, name, nickname, status, agent_id")
            .eq("id", String((pending as any).id))
            .maybeSingle();
          if (error) return null;
          return data as any;
        },
        (row2) => String(row2?.status) === "active",
        { label: "user profile becomes active" }
      );

      await userContext.close();
      await adminContext.close();
    }

    expect(memberRow?.email).toBeTruthy();

    const agentContext = await browser.newContext();
    const agentPage = await agentContext.newPage();

    await loginAdmin(agentPage, "agent");
    await agentPage.goto("/agent/members");

    await expect(
      agentPage.getByRole("heading", { name: "회원 관리" })
    ).toBeVisible({
      timeout: 30_000,
    });

    const memberTr = agentPage
      .locator("tbody tr")
      .filter({ hasText: String((memberRow as any).email) })
      .first();
    await expect(memberTr).toBeVisible({ timeout: 30_000 });

    await memberTr.locator('button[title="더보기"]').click();

    const modal = agentPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "회원 상세 정보" })
      .last();
    await expect(modal).toBeVisible({ timeout: 20_000 });

    await expect(
      modal.getByRole("button", { name: "회원 정보" })
    ).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "포인트 내역" })
    ).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "기프트 내역" })
    ).toBeVisible();
    await expect(
      modal.getByRole("button", { name: "미니게임 배팅내역" })
    ).toBeVisible();
    await expect(modal.getByRole("button", { name: "채팅 내역" })).toHaveCount(
      0
    );

    const closeBtn = modal.locator("button:has(svg.lucide-x)").first();
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click();
    } else {
      await agentPage.keyboard.press("Escape").catch(() => undefined);
    }

    await expect(modal).toBeHidden({ timeout: 20_000 });

    await agentContext.close();
  });

  test("/agent/gifts shows latest gift transaction and inventory modal", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);

    const startedAt = new Date().toISOString();

    const adminSb = await getAdminSb();
    const agentSb = await getAgentSb();

    const agentRes = await agentSb.auth.getUser();
    const agentId = agentRes.data.user?.id;
    expect(agentId).toBeTruthy();

    let { data: agentProfile, error: agentProfileErr } = await adminSb
      .from("chat_profiles")
      .select("id, name, is_active, is_online, assigned_agent_id")
      .eq("assigned_agent_id", agentId as string)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (agentProfileErr) throw new Error(agentProfileErr.message);

    if (!agentProfile?.id) {
      const { data: anyProfile, error: anyProfileErr } = await adminSb
        .from("chat_profiles")
        .select("id, name")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (anyProfileErr) throw new Error(anyProfileErr.message);
      expect(anyProfile?.id).toBeTruthy();

      const { error: assignErr } = await adminSb
        .from("chat_profiles")
        .update({ assigned_agent_id: agentId as string, is_online: true })
        .eq("id", String((anyProfile as any).id));
      if (assignErr) throw new Error(assignErr.message);

      agentProfile = {
        ...(anyProfile as any),
        is_active: true,
        is_online: true,
        assigned_agent_id: agentId as string,
      } as any;
    }

    const profileId = String((agentProfile as any).id);
    const profileName = String((agentProfile as any).name);

    const { data: giftRow, error: giftErr } = await adminSb
      .from("gifts")
      .select("id, name, emoji, buy_price, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (giftErr) throw new Error(giftErr.message);
    expect(giftRow?.id).toBeTruthy();

    const giftId = String((giftRow as any).id);
    const giftName = String((giftRow as any).name);

    const userToken = await signInWithPassword(
      creds.userEmail as string,
      creds.userPassword as string
    );
    const userSb = createAuthedSupabaseClient(userToken);

    const userRes = await userSb.auth.getUser();
    const userId = userRes.data.user?.id;
    expect(userId).toBeTruthy();

    await adminSb.rpc("add_points", {
      p_user_id: userId as string,
      p_amount: 50_000,
      p_type: "admin_adjust",
      p_reference_id: null,
      p_description: "E2E agent gifts setup",
    });

    const qty = 2;

    const buyRes = await userSb.rpc("gift_buy", {
      p_gift_id: giftId,
      p_quantity: qty,
    });
    if (buyRes.error) throw new Error(buyRes.error.message);

    const roomRef = await userSb.rpc("create_or_get_chat_room", {
      p_profile_id: profileId,
    });
    if (roomRef.error) throw new Error(roomRef.error.message);

    const roomId =
      typeof roomRef.data === "string"
        ? roomRef.data
        : (roomRef.data as any)?.id ||
          (roomRef.data as any)?.room_id ||
          (roomRef.data as any)?.roomId ||
          (roomRef.data as any)?.chat_room_id;

    expect(roomId).toBeTruthy();

    const sendRes = await userSb.rpc("chat_send_gift_user", {
      p_room_id: String(roomId),
      p_gift_id: giftId,
      p_quantity: qty,
    });
    if (sendRes.error) throw new Error(sendRes.error.message);

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("gift_transactions")
          .select(
            "id, created_at, room_id, gift_id, quantity, points_amount, sender_type, sender_id, receiver_type, receiver_id, transaction_type"
          )
          .eq("room_id", String(roomId))
          .eq("gift_id", giftId)
          .eq("sender_type", "user")
          .eq("sender_id", userId as string)
          .eq("receiver_type", "profile")
          .eq("receiver_id", profileId)
          .eq("transaction_type", "send")
          .gte("created_at", startedAt)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return null;
        return data as any;
      },
      (row) => !!row?.id,
      { label: "gift transaction exists" }
    );

    await loginAdmin(page, "agent");
    await page.goto("/agent/gifts");

    await expect(
      page.getByRole("heading", { name: "기프트 관리" })
    ).toBeVisible({
      timeout: 30_000,
    });

    const tr = page.locator("tbody tr").filter({ hasText: giftName }).first();
    await expect(tr).toBeVisible({ timeout: 30_000 });
    await expect(tr).toContainText(profileName);

    await page
      .locator("button")
      .filter({ hasText: "받은 기프트:" })
      .first()
      .click();

    const inventoryModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "받은 기프트 인벤토리" })
      .last();
    await expect(inventoryModal).toBeVisible({ timeout: 20_000 });
    await expect(inventoryModal).toContainText(giftName);

    await inventoryModal.locator("button").first().click();
    await expect(inventoryModal).toBeHidden({ timeout: 20_000 });

    void browser;
  });
});
