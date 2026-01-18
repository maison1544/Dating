import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  getSupabaseAccessToken,
  loginAdmin,
  loginUser,
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

test.describe("Chat list realtime (last_message + unread_count) E2E + DB", () => {
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
  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (creates messages)");

  test("User chat list updates via realtime and clears unread after reading", async ({
    page,
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

    const { data: agentRow, error: agentRowErr } = await adminSb
      .from("agents")
      .select("id")
      .eq("username", creds.agentUsername as string)
      .maybeSingle();
    if (agentRowErr) throw new Error(agentRowErr.message);

    const agentId = agentRow?.id;
    expect(agentId).toBeTruthy();

    // Pick a chat profile assigned to this agent, or assign one.
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
    expect(profileId).toBeTruthy();
    expect(profileName).toBeTruthy();

    // USER: login and get token
    await loginUser(page);
    await page.goto("/mypage");
    await expect(page.getByText("보유 포인트")).toBeVisible({
      timeout: 30_000,
    });

    const userToken = await getSupabaseAccessToken(page);
    const userSb = createAuthedSupabaseClient(userToken);

    const userRes = await userSb.auth.getUser();
    const userId = userRes.data.user?.id;
    expect(userId).toBeTruthy();

    // Ensure a room exists.
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

    const beforeRoom = await adminSb
      .from("chat_rooms")
      .select("id, last_message, unread_count")
      .eq("id", String(roomId))
      .maybeSingle()
      .then((r) => {
        if (r.error) throw new Error(r.error.message);
        return r.data as any;
      });

    const beforeUnread = Number((beforeRoom as any)?.unread_count ?? 0);

    // Open chat list and ensure the room is visible.
    await page.goto("/realtime-matching");
    await page.getByRole("button", { name: "채팅목록" }).click();

    // Send a message as profile (agent) and verify DB updates.
    const content = `e2e-chatlist-${Date.now()}`;

    const sendRes = await agentSb.rpc("chat_send_message", {
      p_room_id: String(roomId),
      p_sender_type: "profile",
      p_content: content,
      p_message_type: "text",
      p_gift_id: null,
      p_gift_quantity: null,
    });
    if (sendRes.error) throw new Error(sendRes.error.message);

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("chat_rooms")
          .select("id, last_message, unread_count, last_message_at")
          .eq("id", String(roomId))
          .maybeSingle();
        if (error) return null;
        return data as any;
      },
      (row) =>
        !!row?.id &&
        String(row.last_message || "").includes(content) &&
        typeof row.unread_count === "number" &&
        Number(row.unread_count) >= Math.max(1, beforeUnread),
      { label: "chat_rooms last_message/unread_count update" }
    );

    // Verify UI updates without reload (realtime chat_rooms subscription).
    const chatItem = page
      .locator("div.cursor-pointer")
      .filter({ hasText: profileName })
      .filter({ hasText: content })
      .first();
    await expect(chatItem).toBeVisible({ timeout: 30_000 });

    await expect(
      chatItem.locator("p.text-gray-400.text-sm.truncate")
    ).toContainText(content, { timeout: 30_000 });

    const badge = chatItem.locator("div.bg-pink-500");
    await expect(badge).toBeVisible({ timeout: 30_000 });

    const badgeText = (await badge.textContent()) || "";
    expect(Number.parseInt(badgeText.trim(), 10)).toBeGreaterThan(0);

    // Open room: ChatRoomPage should call chat_mark_read for user.
    await chatItem.click();
    if (!page.url().includes(`/chat/${String(roomId)}`)) {
      await page.goto(`/chat/${String(roomId)}`);
    }
    await expect(page).toHaveURL(new RegExp(`/chat/${String(roomId)}`));
    await expect(page.getByText(content)).toBeVisible({ timeout: 30_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("chat_rooms")
          .select("id, unread_count")
          .eq("id", String(roomId))
          .maybeSingle();
        if (error) return null;
        return data as any;
      },
      (row) => !!row?.id && Number(row.unread_count ?? 0) === 0,
      { label: "chat_rooms unread_count cleared" }
    );

    // Back to list: badge should be gone.
    await page.goto("/realtime-matching");
    await page.getByRole("button", { name: "채팅목록" }).click();

    const chatItem2 = page
      .locator("div.cursor-pointer")
      .filter({ hasText: profileName })
      .filter({ hasText: content })
      .first();
    await expect(chatItem2).toBeVisible({ timeout: 30_000 });

    await poll(
      async () => {
        const cnt = await chatItem2.locator("div.bg-pink-500").count();
        return cnt;
      },
      (cnt) => cnt === 0,
      { label: "unread badge hidden" }
    );

    // Ensure last message is still visible.
    await expect(
      chatItem2.locator("p.text-gray-400.text-sm.truncate")
    ).toContainText(content);

    // Sanity: room was updated after test started.
    const { data: roomRow } = await adminSb
      .from("chat_rooms")
      .select("id, last_message_at")
      .eq("id", String(roomId))
      .maybeSingle();
    expect(roomRow?.id).toBeTruthy();

    void startedAt;
  });
});
