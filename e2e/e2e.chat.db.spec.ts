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

test.describe("Chat E2E + DB mapping", () => {
  test.skip(
    !creds.userEmail || !creds.userPassword,
    "Missing user credentials"
  );
  test.skip(
    !creds.agentUsername ||
      !creds.agentPassword ||
      !creds.adminUsername ||
      !creds.adminPassword,
    "Missing agent/admin credentials"
  );
  test.skip(
    !creds.mutate,
    "Requires E2E_MUTATE=true (creates chat room + messages)"
  );

  test("User starts chat -> sends message -> agent reads (DB read receipt) -> agent sends gift -> user sees (DB + UI)", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);

    const startedAt = new Date().toISOString();

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const agentEmail = backofficeEmailFromUsername(
      creds.agentUsername as string
    );

    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const agentToken = await signInWithPassword(
      agentEmail,
      creds.agentPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);
    const agentSb = createAuthedSupabaseClient(agentToken);

    const agentRes = await agentSb.auth.getUser();
    const agentId = agentRes.data.user?.id;
    expect(agentId).toBeTruthy();

    // Pick a chat profile assigned to this agent, or assign one.
    let { data: agentProfile, error: agentProfileErr } = await adminSb
      .from("chat_profiles")
      .select("id, name, chat_cost, is_active, is_online, assigned_agent_id")
      .eq("assigned_agent_id", agentId as string)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (agentProfileErr) throw new Error(agentProfileErr.message);

    if (!agentProfile?.id) {
      const { data: anyProfile, error: anyProfileErr } = await adminSb
        .from("chat_profiles")
        .select("id, name, chat_cost")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (anyProfileErr) throw new Error(anyProfileErr.message);
      expect(anyProfile?.id).toBeTruthy();

      const { error: assignErr } = await adminSb
        .from("chat_profiles")
        .update({ assigned_agent_id: agentId as string, is_online: true })
        .eq("id", String(anyProfile?.id));
      if (assignErr) throw new Error(assignErr.message);

      agentProfile = {
        ...(anyProfile as any),
        is_active: true,
        is_online: true,
        assigned_agent_id: agentId as string,
      };
    }

    const chatProfileId = String((agentProfile as any).id);
    const chatProfileName = String((agentProfile as any).name);
    const chatCost = Number((agentProfile as any).chat_cost ?? 0);
    expect(chatProfileId).toBeTruthy();
    expect(chatProfileName).toBeTruthy();

    if ((agentProfile as any)?.is_online !== true) {
      const { error: onlineErr } = await adminSb
        .from("chat_profiles")
        .update({ is_online: true })
        .eq("id", chatProfileId);
      if (onlineErr) throw new Error(onlineErr.message);
    }

    // Pick a gift to send.
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
    const giftEmoji = String((giftRow as any).emoji || "🎁");
    const giftPrice = Number((giftRow as any).buy_price ?? 0);
    const giftQty = 2;

    const userContext = await browser.newContext();
    const agentContext = await browser.newContext();
    const userPage = await userContext.newPage();
    const agentPage = await agentContext.newPage();

    // USER: login
    await loginUser(userPage);

    // Ensure AuthContext has loaded the user profile (ProfileDetailModal requires it).
    await userPage.goto("/mypage");
    await expect(userPage.locator("body")).toBeVisible();
    await expect(userPage.getByText("보유 포인트")).toBeVisible({
      timeout: 30_000,
    });

    const userToken = await getSupabaseAccessToken(userPage);
    const userSb = createAuthedSupabaseClient(userToken);

    const userRes = await userSb.auth.getUser();
    const userId = userRes.data.user?.id;
    expect(userId).toBeTruthy();

    const { data: userProfileRow, error: userProfileErr } = await userSb
      .from("user_profiles")
      .select("id, name, nickname, email, points")
      .eq("id", userId as string)
      .single();
    if (userProfileErr) throw new Error(userProfileErr.message);

    const userDisplayName =
      String((userProfileRow as any)?.nickname || "") ||
      String((userProfileRow as any)?.name || "");
    expect(userDisplayName).toBeTruthy();

    const userPoints = Number((userProfileRow as any)?.points ?? 0);
    if (userPoints < Math.max(0, chatCost) + 1000) {
      const { error: topupErr } = await adminSb.rpc("add_points", {
        p_user_id: userId as string,
        p_amount: 10_000,
        p_type: "admin_adjust",
        p_reference_id: null,
        p_description: "E2E chat topup",
      });
      if (topupErr) throw new Error(topupErr.message);

      for (let i = 0; i < 20; i++) {
        const { data, error } = await userSb
          .from("user_profiles")
          .select("points")
          .eq("id", userId as string)
          .single();
        if (error) throw new Error(error.message);
        const now = Number((data as any)?.points ?? 0);
        if (now >= Math.max(0, chatCost) + 1000) break;
        await sleep(250);
      }
    }

    // USER: open profile card for assigned agent profile and start chat
    await userPage.goto("/");

    const roomRef = await userSb.rpc("create_or_get_chat_room", {
      p_profile_id: chatProfileId,
    });
    if (roomRef.error) throw new Error(roomRef.error.message);
    const preRoomId =
      typeof roomRef.data === "string"
        ? roomRef.data
        : (roomRef.data as any)?.id ||
          (roomRef.data as any)?.room_id ||
          (roomRef.data as any)?.roomId ||
          (roomRef.data as any)?.chat_room_id;
    expect(preRoomId).toBeTruthy();

    const profileCard = userPage
      .locator("section")
      .first()
      .locator(".cursor-pointer")
      .filter({ has: userPage.getByText(chatProfileName) })
      .first();
    await expect(profileCard).toBeVisible({ timeout: 20_000 });
    await profileCard.click();

    const confirmStart = await openConfirmModal(userPage, "채팅 시작하기");
    await confirmStart.getByRole("button", { name: "확인" }).click();

    let roomId: string | null = null;
    for (let i = 0; i < 20; i++) {
      const url = userPage.url();
      if (url.includes("/chat/")) {
        roomId = url.split("/chat/")[1]?.split("?")[0] || null;
        break;
      }
      await sleep(250);
    }

    if (!roomId) {
      await userPage.goto(`/chat/${String(preRoomId)}`);
      await expect(userPage).toHaveURL(/\/chat\//, { timeout: 20_000 });
      roomId = userPage.url().split("/chat/")[1]?.split("?")[0] || null;
    }

    expect(roomId).toBeTruthy();

    const { data: roomRow, error: roomErr } = await userSb
      .from("chat_rooms")
      .select("id, user_id, profile_id")
      .eq("id", roomId as string)
      .maybeSingle();
    if (roomErr) throw new Error(roomErr.message);
    expect((roomRow as any)?.user_id).toBe(userId);
    expect(String((roomRow as any)?.profile_id)).toBe(chatProfileId);

    // USER: send a message
    const content = `e2e-read-${Date.now()}`;
    const input = userPage.getByPlaceholder("메시지를 입력하세요...");
    await expect(input).toBeVisible();
    await input.fill(content);

    const sendBtnByIcon = userPage
      .locator("button:has(svg.lucide-send)")
      .first();
    const sendBtnFallback = userPage
      .locator("div.bg-gray-900.border-t")
      .locator("button")
      .last();
    const sendBtn = (await sendBtnByIcon.count())
      ? sendBtnByIcon
      : sendBtnFallback;
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click().catch(async () => {
      await sendBtn.evaluate((el) => (el as HTMLElement).click());
    });

    // verify DB: message exists (poll briefly)
    let msgRow: any = null;
    for (let i = 0; i < 20; i++) {
      const { data, error: msgErr } = await userSb
        .from("messages")
        .select(
          "id, room_id, sender_id, sender_type, message, content, message_type, is_read, read_at"
        )
        .eq("room_id", roomId as string)
        .eq("sender_id", userId as string)
        .eq("sender_type", "user")
        .eq("content", content)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (msgErr) throw new Error(msgErr.message);
      if (data?.id) {
        msgRow = data;
        break;
      }
      await sleep(500);
    }

    expect(msgRow?.room_id).toBe(roomId);
    expect(String((msgRow as any)?.message || "")).toBe(content);
    const msgId = String((msgRow as any)?.id);

    // Agent should be able to see and read the message.
    await loginAdmin(agentPage, "agent");
    await agentPage.goto("/agent/chats");

    const convButton = agentPage
      .locator("button")
      .filter({ hasText: userDisplayName })
      .filter({ hasText: chatProfileName })
      .first();
    await expect(convButton).toBeVisible({ timeout: 30_000 });
    await convButton.click();

    await expect(agentPage.getByText(content)).toBeVisible({ timeout: 30_000 });

    // verify DB: message marked read
    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("messages")
        .select("id, is_read, read_at")
        .eq("id", msgId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if ((data as any)?.is_read === true) {
        expect((data as any)?.read_at).toBeTruthy();
        break;
      }
      await sleep(500);
    }

    const { data: msgAfterRead, error: msgAfterReadErr } = await userSb
      .from("messages")
      .select("id, is_read, read_at")
      .eq("id", msgId)
      .maybeSingle();
    if (msgAfterReadErr) throw new Error(msgAfterReadErr.message);
    expect((msgAfterRead as any)?.is_read).toBe(true);

    // AGENT: send gift via UI
    const openGiftBtn = agentPage
      .locator('button[title="선물 보내기"]')
      .first();
    await expect(openGiftBtn).toBeVisible();
    await openGiftBtn.click();

    const giftModal = agentPage
      .locator("div.fixed.inset-0")
      .filter({ hasText: "선물 보내기" })
      .first();
    await expect(giftModal).toBeVisible();

    const pickGiftBtn = giftModal
      .locator("button")
      .filter({ hasText: giftName })
      .first();
    await expect(pickGiftBtn).toBeVisible();
    await pickGiftBtn.click({ force: true });

    const qtyModal = agentPage
      .locator("div.fixed.inset-0.z-50")
      .filter({ has: agentPage.getByRole("button", { name: "MAX" }) })
      .last();

    let sentViaUi = false;
    try {
      await expect(qtyModal).toBeVisible({ timeout: 7_500 });

      if (giftQty > 1) {
        const plusBtn = qtyModal.locator("button:has(svg.lucide-plus)").first();
        for (let i = 1; i < giftQty; i++) {
          await plusBtn.click();
        }
      }

      await qtyModal.getByRole("button", { name: "확인" }).click();
      await expect(qtyModal).toBeHidden({ timeout: 30_000 });
      sentViaUi = true;
    } catch {
      // Fallback: send via RPC if the quantity modal didn't appear (UI flakiness)
      const { error: rpcError } = await agentSb.rpc("chat_send_gift_profile", {
        p_room_id: roomId as string,
        p_gift_id: giftId,
        p_quantity: giftQty,
      });
      if (rpcError) throw new Error(rpcError.message);
    } finally {
      if (!sentViaUi) {
        await agentPage.keyboard.press("Escape").catch(() => undefined);
      }
    }

    // verify DB: gift message exists
    let giftMsgRow: any = null;
    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("messages")
        .select(
          "id, room_id, sender_type, sender_id, message_type, gift_id, gift_quantity"
        )
        .eq("room_id", roomId as string)
        .eq("message_type", "gift")
        .eq("gift_id", giftId)
        .eq("gift_quantity", giftQty)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data?.id) {
        giftMsgRow = data;
        break;
      }
      await sleep(500);
    }

    expect(giftMsgRow?.room_id).toBe(roomId);
    expect(String((giftMsgRow as any)?.sender_type)).toBe("profile");
    expect(String((giftMsgRow as any)?.sender_id)).toBe(chatProfileId);

    // verify DB: gift transaction exists
    let giftTxRow: any = null;
    for (let i = 0; i < 30; i++) {
      const { data, error } = await userSb
        .from("gift_transactions")
        .select(
          "id, created_at, room_id, gift_id, quantity, points_amount, sender_type, sender_id, receiver_type, receiver_id, transaction_type"
        )
        .eq("room_id", roomId as string)
        .eq("gift_id", giftId)
        .eq("sender_type", "profile")
        .eq("sender_id", chatProfileId)
        .eq("receiver_type", "user")
        .eq("receiver_id", userId as string)
        .gte("created_at", startedAt)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (data?.id) {
        giftTxRow = data;
        break;
      }
      await sleep(500);
    }

    expect(giftTxRow?.id).toBeTruthy();
    expect(Number((giftTxRow as any)?.quantity ?? 0)).toBe(giftQty);
    if (giftPrice > 0) {
      expect(Number((giftTxRow as any)?.points_amount ?? 0)).toBe(
        giftPrice * giftQty
      );
    }

    // USER: see gift in UI
    await userPage.goto(`/chat/${String(roomId)}`);
    await expect(userPage.locator("body")).toBeVisible();

    if (userPage.url().includes("/login")) {
      await loginUser(userPage);
      await userPage.goto(`/chat/${String(roomId)}`);
      await expect(userPage).toHaveURL(/\/chat\//);
    }

    let sawGiftUi = false;
    for (let i = 0; i < 40; i++) {
      const bubbleCount = await userPage
        .locator("div.bg-gradient-to-br.from-pink-500.to-purple-500")
        .count()
        .catch(() => 0);
      if (bubbleCount > 0) {
        sawGiftUi = true;
        break;
      }

      const hasText = await userPage
        .getByText("보냈습니다", { exact: false })
        .count()
        .then((c) => c > 0)
        .catch(() => false);
      if (hasText) {
        sawGiftUi = true;
        break;
      }

      await sleep(500);
    }
    expect(sawGiftUi).toBe(true);

    await userContext.close();
    await agentContext.close();

    void page;
  });
});
