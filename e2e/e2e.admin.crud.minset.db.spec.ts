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
  const timeoutMs = opts?.timeoutMs ?? 40_000;
  const intervalMs = opts?.intervalMs ?? 1000;
  const started = Date.now();

  let last: T | undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    last = await fn();
    if (predicate(last)) return last;

    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting: ${opts?.label || "condition"}`);
    }

    await sleep(intervalMs);
  }
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function getAdminSb() {
  const adminEmail = backofficeEmailFromUsername(creds.adminUsername as string);
  const token = await signInWithPassword(
    adminEmail,
    creds.adminPassword as string
  );
  return createAuthedSupabaseClient(token);
}

async function fillLabeledInput(
  root: import("@playwright/test").Locator,
  labelText: string,
  value: string
) {
  const labelExact = (t: string) => ({ hasText: new RegExp(`^\\s*${t}\\s*$`) });

  const label = root.locator("label").filter(labelExact(labelText)).first();
  const labelExists = (await label.count()) > 0;

  const labelNode = labelExists
    ? label
    : root.getByText(labelText, { exact: true }).first();

  // Parent container is expected to contain the input right under the label.
  const container = labelNode.locator("xpath=..");
  const input = container.locator("input").first();

  await expect(labelNode).toBeVisible({ timeout: 10_000 });
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(value);
}

test.describe("Admin CRUD minimal set (destructive)", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !creds.adminUsername || !creds.adminPassword,
    "Missing admin credentials"
  );
  test.skip(!creds.mutate, "Requires E2E_MUTATE=true (mutates admin data)");

  test("/admin/notices: create -> pin -> edit -> delete (UI -> DB)", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const adminSb = await getAdminSb();

    const title = `E2E 공지 ${uniqueSuffix()}`;
    const content1 = `E2E content 1 ${uniqueSuffix()}`;
    const content2 = `E2E content 2 ${uniqueSuffix()}`;

    await loginAdmin(page, "admin");
    await page.goto("/admin/notices");

    await page.getByRole("button", { name: "새 공지사항 작성" }).click();

    const modal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "새 공지사항 작성" })
      .last();
    await expect(modal).toBeVisible();

    await modal
      .locator("input[placeholder='공지사항 제목을 입력하세요']")
      .fill(title);
    await modal
      .locator("textarea[placeholder='공지사항 내용을 입력하세요']")
      .fill(content1);

    await modal.getByRole("button", { name: "등록하기" }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });

    const created = await poll(
      async () => {
        const { data, error } = await adminSb
          .from("notices")
          .select("id, title, content, is_pinned")
          .eq("title", title)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id,
      { label: "notice created" }
    );

    const noticeId = String((created as any).id);

    // pin toggle
    const rowLocator = () =>
      page.locator("table tbody tr").filter({ hasText: title }).first();

    await expect(rowLocator()).toBeVisible({ timeout: 20_000 });

    await rowLocator().locator("button[title='고정']").click();

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("notices")
          .select("id, is_pinned")
          .eq("id", noticeId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id && !!row?.is_pinned,
      { label: "notice pinned" }
    );

    // edit
    await rowLocator().locator("button[title='수정']").click();

    const editModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "공지사항 수정" })
      .last();
    await expect(editModal).toBeVisible();

    await editModal
      .locator("textarea[placeholder='공지사항 내용을 입력하세요']")
      .fill(content2);
    await editModal.getByRole("button", { name: "수정하기" }).click();
    await expect(editModal).toBeHidden({ timeout: 20_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("notices")
          .select("id, content")
          .eq("id", noticeId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id && String(row?.content || "") === content2,
      { label: "notice content updated" }
    );

    // delete
    await expect(rowLocator()).toBeVisible({ timeout: 20_000 });
    await rowLocator().locator("button[title='삭제']").click();

    const deleteModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "공지사항 삭제 확인" })
      .last();
    await expect(deleteModal).toBeVisible();

    await deleteModal.getByRole("button", { name: "삭제하기" }).click();
    await expect(deleteModal).toBeHidden({ timeout: 20_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("notices")
          .select("id")
          .eq("id", noticeId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !row,
      { label: "notice deleted" }
    );
  });

  test("/admin/gifts: create -> price edit -> deactivate (UI -> DB)", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const adminSb = await getAdminSb();

    const name = `E2E 선물 ${uniqueSuffix()}`;
    const emoji = "🧪";
    const buyPrice = 1234;
    const sellPrice = 999;
    const sellPrice2 = 888;

    await loginAdmin(page, "admin");
    await page.goto("/admin/gifts");

    await page.getByRole("button", { name: "새 선물 추가" }).click();

    const modal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "새 선물 추가" })
      .last();
    await expect(modal).toBeVisible();

    await fillLabeledInput(modal, "이름", name);
    await fillLabeledInput(modal, "이모지", emoji);
    await fillLabeledInput(modal, "구매가(원)", String(buyPrice));
    await fillLabeledInput(modal, "판매가(P)", String(sellPrice));

    await modal.getByRole("button", { name: "생성" }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });

    const created = await poll(
      async () => {
        const { data, error } = await adminSb
          .from("gifts")
          .select("id, name, buy_price, sell_price, is_active")
          .eq("name", name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) =>
        !!row?.id &&
        Number(row?.buy_price) === buyPrice &&
        Number(row?.sell_price) === sellPrice,
      { label: "gift created" }
    );

    const giftId = String((created as any).id);

    const rowLocator = () =>
      page.locator("table tbody tr").filter({ hasText: name }).first();

    await expect(rowLocator()).toBeVisible({ timeout: 20_000 });

    // inline price edit
    await rowLocator().locator("button[title='가격 수정']").click();

    const sellInput = rowLocator().locator("input[type='number']").nth(1);
    await expect(sellInput).toBeVisible();
    await sellInput.fill(String(sellPrice2));

    await rowLocator().locator("button[title='저장']").click();

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("gifts")
          .select("id, sell_price")
          .eq("id", giftId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id && Number(row?.sell_price) === sellPrice2,
      { label: "gift price updated" }
    );

    // deactivate via delete modal
    await rowLocator().locator("button[title='삭제(비활성)']").click();

    const deleteModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "선물 삭제(비활성)" })
      .last();
    await expect(deleteModal).toBeVisible();

    await deleteModal.getByRole("button", { name: "확인" }).click();
    await expect(deleteModal).toBeHidden({ timeout: 20_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("gifts")
          .select("id, is_active")
          .eq("id", giftId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id && row?.is_active === false,
      { label: "gift deactivated" }
    );
  });

  test("/admin/chats: create -> edit -> soft delete (UI -> DB)", async ({
    page,
  }) => {
    test.setTimeout(140_000);

    const adminSb = await getAdminSb();

    const name = `E2E프로필 ${uniqueSuffix()}`;
    const job1 = `E2E직업-${uniqueSuffix()}`;
    const job2 = `E2E직업-수정-${uniqueSuffix()}`;

    await loginAdmin(page, "admin");
    await page.goto("/admin/chats");

    await page.getByRole("button", { name: "새 프로필 추가" }).click();

    const modal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "새 프로필 추가" })
      .last();
    await expect(modal).toBeVisible();

    await modal.locator("input[placeholder='이름을 입력하세요']").fill(name);
    await modal.locator("input[placeholder='직업을 입력하세요']").fill(job1);

    await modal.getByRole("button", { name: "추가하기" }).click();
    await expect(modal).toBeHidden({ timeout: 20_000 });

    const created = await poll(
      async () => {
        const { data, error } = await adminSb
          .from("chat_profiles")
          .select("id, name, job, is_active")
          .eq("name", name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id && String(row?.job || "") === job1,
      { label: "chat profile created" }
    );

    const profileId = String((created as any).id);

    const cardLocator = () =>
      page
        .locator("div.bg-gray-900.rounded-lg")
        .filter({ hasText: name })
        .first();

    await expect(cardLocator()).toBeVisible({ timeout: 20_000 });

    await cardLocator().getByRole("button", { name: "수정" }).click();

    const editModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "프로필 수정" })
      .last();
    await expect(editModal).toBeVisible();

    await editModal
      .locator("input[placeholder='직업을 입력하세요']")
      .fill(job2);

    await editModal.getByRole("button", { name: "수정하기" }).click();
    await expect(editModal).toBeHidden({ timeout: 20_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("chat_profiles")
          .select("id, job")
          .eq("id", profileId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id && String(row?.job || "") === job2,
      { label: "chat profile updated" }
    );

    await expect(cardLocator()).toBeVisible({ timeout: 20_000 });
    await cardLocator().getByRole("button", { name: "삭제" }).click();

    const deleteModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "프로필 삭제 확인" })
      .last();
    await expect(deleteModal).toBeVisible();

    await deleteModal.getByRole("button", { name: "삭제하기" }).click();
    await expect(deleteModal).toBeHidden({ timeout: 20_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("chat_profiles")
          .select("id, is_active")
          .eq("id", profileId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id && row?.is_active === false,
      { label: "chat profile soft deleted" }
    );
  });

  test("/admin/accounts: create agent -> delete agent (UI -> DB)", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const adminSb = await getAdminSb();

    const username = `e2e_agent_${uniqueSuffix()}`
      .toLowerCase()
      .replace(/[^a-z0-9_\-\.]/g, "");
    const name = `E2E Agent ${uniqueSuffix()}`;
    const password = `Pw!${uniqueSuffix()}a`;

    await loginAdmin(page, "admin");
    await page.goto("/admin/accounts");

    await page.getByRole("button", { name: "새 계정 생성" }).click();

    const modal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "계정 추가" })
      .last();
    await expect(modal).toBeVisible();

    await modal.getByRole("button", { name: "에이전트" }).click();

    await fillLabeledInput(modal, "USERNAME", username);
    await fillLabeledInput(modal, "이름", name);
    await fillLabeledInput(modal, "비밀번호", password);

    await modal.getByRole("button", { name: "생성" }).click();
    await expect(modal).toBeHidden({ timeout: 30_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("agents")
          .select("id, username, is_active")
          .eq("username", username)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !!row?.id,
      { label: "agent created in DB", timeoutMs: 60_000 }
    );

    // find in UI and delete
    await page.getByPlaceholder("계정명으로 검색...").fill(username);

    const card = page
      .locator("div.bg-gray-900")
      .filter({ hasText: username })
      .first();
    await expect(card).toBeVisible({ timeout: 30_000 });

    await card.getByRole("button", { name: "작업" }).click();

    const dropdown = page
      .locator("div.bg-gray-800")
      .filter({ has: page.getByRole("button", { name: "삭제" }) })
      .last();

    await dropdown.getByRole("button", { name: "삭제" }).click();

    const deleteModal = page
      .locator("div.fixed.inset-0")
      .filter({ hasText: "계정 삭제" })
      .last();
    await expect(deleteModal).toBeVisible();

    await deleteModal.getByRole("button", { name: "삭제" }).click();
    await expect(deleteModal).toBeHidden({ timeout: 60_000 });

    await poll(
      async () => {
        const { data, error } = await adminSb
          .from("agents")
          .select("id, is_active")
          .eq("username", username)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data as any;
      },
      (row) => !row || row?.is_active === false,
      { label: "agent deleted/disabled in DB", timeoutMs: 90_000 }
    );
  });
});
