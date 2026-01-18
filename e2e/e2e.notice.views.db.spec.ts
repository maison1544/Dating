import { test, expect } from "@playwright/test";
import {
  backofficeEmailFromUsername,
  createAuthedSupabaseClient,
  creds,
  loginAdmin,
  loginUser,
  signInWithPassword,
} from "./utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test.describe("Notice view_count increment", () => {
  test.skip(
    !creds.userEmail ||
      !creds.userPassword ||
      !creds.adminUsername ||
      !creds.adminPassword,
    "Missing user/admin credentials"
  );

  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (creates notices)");

  test("User opening a notice increments once; admin opening does not increment", async ({
    browser,
  }) => {
    test.setTimeout(150_000);

    const adminEmail = backofficeEmailFromUsername(
      creds.adminUsername as string
    );
    const adminToken = await signInWithPassword(
      adminEmail,
      creds.adminPassword as string
    );
    const adminSb = createAuthedSupabaseClient(adminToken);

    const adminRes = await adminSb.auth.getUser();
    const adminId = adminRes.data.user?.id ?? null;

    const uniq = String(Date.now());
    const title = `E2E Notice Views ${uniq}`;
    const content = `E2E content ${uniq}`;

    const { data: createdNotice, error: createErr } = await adminSb
      .from("notices")
      .insert({
        title,
        content,
        author_id: adminId,
        is_pinned: false,
        is_published: true,
      })
      .select("id, view_count")
      .single();

    if (createErr) throw new Error(createErr.message);
    const noticeId = String((createdNotice as any).id);
    expect(noticeId).toBeTruthy();

    const beforeCount = Number((createdNotice as any).view_count ?? 0);

    // USER: open the notice (should increment by +1)
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();

    await loginUser(userPage);
    await userPage.goto("/notice");

    await expect(
      userPage.getByRole("heading", { level: 1, name: /공지사항/ })
    ).toBeVisible();

    const noticeHeading = userPage
      .getByRole("heading", { name: title })
      .first();
    await expect(noticeHeading).toBeVisible({ timeout: 20_000 });
    await noticeHeading.click();

    await expect(userPage.getByText(content)).toBeVisible();

    let afterUserCount: number | null = null;
    for (let i = 0; i < 30; i++) {
      const { data, error } = await adminSb
        .from("notices")
        .select("view_count")
        .eq("id", noticeId)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const now = Number((data as any)?.view_count ?? 0);
      if (now === beforeCount + 1) {
        afterUserCount = now;
        break;
      }

      await sleep(500);
    }

    expect(afterUserCount).toBe(beforeCount + 1);

    // USER: opening the same notice again in this session should not increment again
    const closeBtn = userPage.getByRole("button", { name: "닫기" }).first();
    if (await closeBtn.count()) {
      await closeBtn.click();
    } else {
      await userPage.keyboard.press("Escape").catch(() => undefined);
    }

    await expect(userPage.getByText(content)).toBeHidden();

    await noticeHeading.click();
    await expect(userPage.getByText(content)).toBeVisible();

    for (let i = 0; i < 10; i++) {
      const { data, error } = await adminSb
        .from("notices")
        .select("view_count")
        .eq("id", noticeId)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const now = Number((data as any)?.view_count ?? 0);
      expect(now).toBe(beforeCount + 1);
      await sleep(200);
    }

    await userContext.close();

    // ADMIN: open the notice (should not increment)
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await loginAdmin(adminPage, "admin");
    await adminPage.goto("/notice");

    await expect(
      adminPage.getByRole("heading", { level: 1, name: /공지사항/ })
    ).toBeVisible();

    const adminNoticeHeading = adminPage
      .getByRole("heading", { name: title })
      .first();
    await expect(adminNoticeHeading).toBeVisible({ timeout: 20_000 });
    await adminNoticeHeading.click();

    await expect(adminPage.getByText(content)).toBeVisible();

    for (let i = 0; i < 20; i++) {
      const { data, error } = await adminSb
        .from("notices")
        .select("view_count")
        .eq("id", noticeId)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const now = Number((data as any)?.view_count ?? 0);
      if (now === beforeCount + 1) break;
      await sleep(250);
    }

    const { data: finalRow, error: finalErr } = await adminSb
      .from("notices")
      .select("view_count")
      .eq("id", noticeId)
      .single();
    if (finalErr) throw new Error(finalErr.message);

    const finalCount = Number((finalRow as any)?.view_count ?? 0);
    expect(finalCount).toBe(beforeCount + 1);

    await adminContext.close();
  });
});
