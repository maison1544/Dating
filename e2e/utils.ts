import { expect, Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const env: Record<string, string | undefined> =
  (((globalThis as any)?.["process"] as any)?.env as Record<
    string,
    string | undefined
  >) || {};

export const creds = {
  userEmail: env.E2E_USER_EMAIL,
  userPassword: env.E2E_USER_PASSWORD,
  adminUsername: env.E2E_ADMIN_USERNAME,
  adminPassword: env.E2E_ADMIN_PASSWORD,
  agentUsername: env.E2E_AGENT_USERNAME,
  agentPassword: env.E2E_AGENT_PASSWORD,
  mutate: env.E2E_MUTATE === "true",
};

function requireSupabaseEnv() {
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

export async function getSupabaseAccessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!authKey) return null;
    const raw = localStorage.getItem(authKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed?.access_token === "string"
        ? parsed.access_token
        : null;
    } catch {
      return null;
    }
  });

  if (!token) {
    throw new Error("Could not find Supabase access token in localStorage");
  }
  return token;
}

export function createAuthedSupabaseClient(accessToken: string) {
  const { url, anonKey } = requireSupabaseEnv();
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const { url, anonKey } = requireSupabaseEnv();
  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  const token = data.session?.access_token;
  if (!token) throw new Error("Missing access token after sign-in");
  return token;
}

export function backofficeEmailFromUsername(username: string) {
  const safe = (username || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\.]/g, "");
  if (!safe) throw new Error("Invalid username");
  return `${safe}@backoffice.local`;
}

export async function invokeEdgeFunction<T>(
  accessToken: string,
  functionName: string,
  body?: unknown
): Promise<T> {
  const { url, anonKey } = requireSupabaseEnv();

  const resp = await fetch(`${url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!resp.ok) {
    let text = "";
    try {
      text = await resp.clone().text();
    } catch {
      text = "";
    }

    throw new Error(
      `Edge Function returned a non-2xx status code (status=${resp.status} ${
        resp.statusText
      }${text ? `, body=${text}` : ""})`
    );
  }

  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await resp.json()) as T;
  }

  return (await resp.text()) as unknown as T;
}

export function isKstDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value);
}

export async function closeAnyModal(page: Page) {
  const modal = page.locator("div.fixed.inset-0");
  if (!(await modal.count())) return;

  const candidates = modal.filter({ has: page.locator("button") });
  const cnt = await candidates.count();
  if (cnt === 0) return;

  let visible: ReturnType<Page["locator"]> | null = null;
  for (let i = cnt - 1; i >= 0; i--) {
    const candidate = candidates.nth(i);
    const isVis = await candidate.isVisible().catch(() => false);
    if (isVis) {
      visible = candidate;
      break;
    }
  }
  if (!visible) return;

  await page.keyboard.press("Escape").catch(() => undefined);

  const cancel = visible.getByRole("button", { name: /취소|닫기/ }).first();
  if (await cancel.count()) {
    await cancel.click().catch(() => undefined);
  } else {
    const closeX = visible
      .locator("button")
      .filter({ has: visible.locator("svg") })
      .first();
    if (await closeX.count()) {
      await closeX.click().catch(() => undefined);
    }
  }

  await page.keyboard.press("Escape").catch(() => undefined);
}

function isLikelyDestructiveButtonText(text: string) {
  const t = (text || "").trim();
  if (!t) return false;
  return /(삭제|승인|거절|저장|등록|생성|추가|변경|정산|처리|확인|로그아웃|탈퇴|신청)$/.test(
    t
  );
}

export async function clickButtonInventory(page: Page) {
  const startUrl = page.url();
  const buttons = await page.$$("button");

  for (const handle of buttons) {
    const isAttached = await handle
      .evaluate((el) => !!el.isConnected)
      .catch(() => false);
    if (!isAttached) continue;

    const meta = await handle.evaluate((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const style = window.getComputedStyle(el as HTMLElement);
      const text = ((el as HTMLElement).innerText || "").trim();
      const ariaLabel = (
        (el as HTMLElement).getAttribute("aria-label") || ""
      ).trim();
      const disabled = (el as HTMLButtonElement).disabled;
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        style.opacity !== "0";
      const type = (
        (el as HTMLButtonElement).getAttribute("type") || ""
      ).toLowerCase();
      return { text, ariaLabel, disabled, visible, type };
    });

    if (!meta.visible) continue;
    if (meta.disabled) continue;
    if (meta.type === "submit" && !creds.mutate) continue;

    const label = meta.text || meta.ariaLabel;
    if (!creds.mutate && isLikelyDestructiveButtonText(label)) continue;

    const beforeUrl = page.url();
    try {
      await handle.click({ timeout: 2000 });
    } catch {
      await handle
        .evaluate((el) => (el as HTMLElement).click())
        .catch(() => undefined);
    }

    await closeAnyModal(page);

    const afterUrl = page.url();
    if (afterUrl !== beforeUrl) {
      const wentBack = await page
        .goBack()
        .then(() => true)
        .catch(() => false);
      if (!wentBack) {
        await page.goto(startUrl);
      }
      await expect(page.locator("body")).toBeVisible();
    }
  }
}

export async function gotoHome(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
}

export async function loginUser(page: Page) {
  if (!creds.userEmail || !creds.userPassword) {
    throw new Error("Missing E2E_USER_EMAIL/E2E_USER_PASSWORD");
  }

  await page.goto("/login");
  await page.getByPlaceholder("이메일을 입력하세요").fill(creds.userEmail);
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(creds.userPassword);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginAdmin(page: Page, mode: "admin" | "agent") {
  const username = mode === "admin" ? creds.adminUsername : creds.agentUsername;
  const password = mode === "admin" ? creds.adminPassword : creds.agentPassword;
  if (!username || !password) {
    throw new Error(
      mode === "admin"
        ? "Missing E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD"
        : "Missing E2E_AGENT_USERNAME/E2E_AGENT_PASSWORD"
    );
  }

  await page.goto(mode === "admin" ? "/admin/login" : "/agent/login");
  await page
    .getByPlaceholder(mode === "admin" ? "admin" : "agent")
    .fill(username);
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();

  if (mode === "admin") {
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await expect(page).toHaveURL(/\/admin(\/|$)/);
  } else {
    await expect(page).not.toHaveURL(/\/agent\/login/);
    await expect(page).toHaveURL(/\/agent(\/|$)/);
  }
}

export async function openFirstProfileModalFromMain(page: Page) {
  await gotoHome(page);
  const cards = page.locator("section").first().locator(".cursor-pointer");
  if ((await cards.count()) === 0) {
    await expect(page.locator("body")).toBeVisible();
    return page.locator("div.fixed.inset-0.z-50");
  }

  await cards.first().click();

  const modal = page.locator("div.fixed.inset-0.z-50");
  await expect(modal).toBeVisible();
  return modal;
}

export async function closeModalByCancel(
  modalRoot: ReturnType<Page["locator"]>
) {
  const cancelBtn = modalRoot.getByRole("button", { name: "취소" });
  if (await cancelBtn.count()) {
    await cancelBtn.click();
    await expect(modalRoot).toBeHidden();
    return;
  }

  await modalRoot.locator("button").first().click();
  await expect(modalRoot).toBeHidden();
}

export async function openConfirmModal(page: Page, triggerButtonText: string) {
  const trigger = page.getByRole("button", { name: triggerButtonText }).first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const confirm = page
    .locator("div.fixed.inset-0.z-50")
    .filter({
      has: page.getByRole("button", { name: "확인" }),
    })
    .last();
  await expect(confirm).toBeVisible();
  return confirm;
}
