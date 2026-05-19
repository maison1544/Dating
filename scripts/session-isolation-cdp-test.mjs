import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const CHROME_PATH = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = Number(process.env.CDP_PORT || 9223);
const PROFILE_DIR = path.join(os.tmpdir(), `dating-session-isolation-${Date.now()}`);
const OUT_DIR = path.resolve("artifacts/session-isolation");
const OUT_FILE = path.join(OUT_DIR, `session-isolation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);

const CREDS = {
  user: { email: "testuser@dating.local", password: "TestUser!2026" },
  admin: { username: "testadmin", password: "AdminTest!2026" },
  agent: { username: "testagent", password: "AgentTest!2026" },
};

let seq = 0;

function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });
}

async function waitForChrome() {
  const endpoint = `http://127.0.0.1:${DEBUG_PORT}/json/version`;
  for (let i = 0; i < 80; i += 1) {
    try {
      return await requestJson(endpoint);
    } catch {
      await delay(250);
    }
  }
  throw new Error("Chrome CDP endpoint did not become ready");
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result || {});
      return;
    }
    if (msg.method && listeners.has(msg.method)) {
      for (const listener of listeners.get(msg.method)) listener(msg.params || {});
    }
  });

  return {
    ready: new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    }),
    send(method, params = {}) {
      const id = ++seq;
      const { sessionId, ...rest } = params;
      ws.send(JSON.stringify({ id, method, params: rest, sessionId }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    on(method, listener) {
      const list = listeners.get(method) || [];
      list.push(listener);
      listeners.set(method, list);
    },
    close() {
      ws.close();
    },
  };
}

async function createPage(browser) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  return {
    targetId,
    sessionId,
    send(method, params = {}) {
      return browser.send(method, { ...params, sessionId });
    },
  };
}

async function evalExpr(page, expression, awaitPromise = true) {
  const result = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails));
  }
  return result.result?.value;
}

async function navigate(page, url) {
  await page.send("Page.navigate", { url });
  await delay(1600);
}

async function waitForText(page, pattern, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const text = await bodyText(page).catch(() => "");
    if (new RegExp(pattern).test(text)) return text;
    await delay(300);
  }
  return bodyText(page).catch(() => "");
}

async function bodyText(page) {
  return evalExpr(page, `document.body?.innerText || ""`);
}

async function clickLogin(page) {
  await evalExpr(page, `(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find((b) => /로그인/.test(b.innerText || b.textContent || ''));
    if (!button) throw new Error('login button not found');
    button.click();
  })()`);
}

async function fillInputs(page, values) {
  const count = await evalExpr(page, `document.querySelectorAll('input').length`);
  if (count < values.length) {
    throw new Error(`not enough inputs: ${count}`);
  }

  for (let index = 0; index < values.length; index += 1) {
    await evalExpr(page, `(() => {
      const input = document.querySelectorAll('input')[${index}];
      input.focus();
      input.select();
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await page.send("Input.insertText", { text: values[index] });
    await delay(100);
  }
}

async function loginUser(page, base) {
  await navigate(page, `${base}/login`);
  await fillInputs(page, [CREDS.user.email, CREDS.user.password]);
  await clickLogin(page);
  await delay(2200);
}

async function loginAdmin(page, base, cleanPath = false) {
  await navigate(page, `${base}${cleanPath ? "/login" : "/admin/login"}`);
  await fillInputs(page, [CREDS.admin.username, CREDS.admin.password]);
  await clickLogin(page);
  await delay(2200);
}

async function loginAgent(page, base, cleanPath = false) {
  await navigate(page, `${base}${cleanPath ? "/login" : "/agent/login"}`);
  await fillInputs(page, [CREDS.agent.username, CREDS.agent.password]);
  await clickLogin(page);
  await delay(2200);
}

async function logoutIfVisible(page) {
  return evalExpr(page, `(() => {
    const el = Array.from(document.querySelectorAll('button,a,div,span')).find((node) => /^로그아웃$/.test((node.innerText || node.textContent || '').trim()));
    if (!el) return false;
    el.click();
    return true;
  })()`);
}

async function storage(page) {
  return evalExpr(page, `(() => ({
    localStorage: Object.fromEntries(Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key) ? '<present>' : '<empty>'])),
    sessionStorage: Object.fromEntries(Object.keys(sessionStorage).sort().map((key) => [key, sessionStorage.getItem(key) ? '<present>' : '<empty>'])),
  }))()`);
}

async function cookies(page) {
  const currentUrl = await evalExpr(page, `location.href`);
  const { cookies: raw } = await page.send("Network.getAllCookies");
  const { cookies: currentRaw } = await page.send("Network.getCookies", {
    urls: [currentUrl],
  });
  const mapCookie = (cookie) => ({
    name: cookie.name,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    hasValue: Boolean(cookie.value),
  });
  const filterCookie = (cookie) =>
    cookie.name.includes("sb-dating") || cookie.name.includes("auth-token");

  return {
    currentUrl,
    currentHostCookies: currentRaw
      .filter(filterCookie)
      .map(mapCookie)
      .sort((a, b) => `${a.domain}:${a.name}`.localeCompare(`${b.domain}:${b.name}`)),
    allScopedCookies: raw
    .filter((cookie) => cookie.name.includes("sb-dating") || cookie.name.includes("auth-token"))
      .map(mapCookie)
      .sort((a, b) => `${a.domain}:${a.name}`.localeCompare(`${b.domain}:${b.name}`)),
  };
}

async function snapshot(page, label) {
  const text = (await bodyText(page)).replace(/\s+/g, " ").trim();
  return {
    label,
    url: await evalExpr(page, `location.href`),
    textHead: text.slice(0, 600),
    markers: {
      userLoggedIn: /마이페이지.*로그아웃|testuser@dating\.local|user테스트|테스트유저/.test(text),
      userSessionUi: /홈 실시간채팅 공지사항.*마이페이지.*로그아웃/.test(text),
      userLoggedOutHome: /로그인.*회원가입/.test(text) && !/마이페이지.*로그아웃/.test(text),
      adminDashboard: /관리자 모드\(testadmin|관리자 대시보드|관리자 계정|입출금 관리/.test(text),
      adminLogin: /관리자 로그인|관리자 페이지/.test(text),
      agentDashboard: /에이전트 모드\(testagent|에이전트 대시보드|추천코드 TESTAGENT/.test(text),
      agentLogin: /에이전트 로그인|에이전트 페이지/.test(text),
      roleLeakage: /에이전트 모드\(|관리자 모드\(/.test(text) && /홈 실시간채팅 공지사항/.test(text),
    },
    storage: await storage(page),
    cookies: await cookies(page),
  };
}

async function clearAll(page) {
  await page.send("Network.clearBrowserCookies");
  for (const url of ["http://localhost:3000", "http://app.localhost:3000", "http://admin.localhost:3000", "http://agent.localhost:3000"]) {
    await navigate(page, url);
    await evalExpr(page, `localStorage.clear(); sessionStorage.clear();`);
  }
}

function summarizeNetwork(requests) {
  return requests.slice(-120).map((request) => ({
    url: request.url.replace(/([?&]apikey=)[^&]+/g, "$1<redacted>"),
    method: request.method,
    hasAuthorization: Boolean(request.headers.Authorization || request.headers.authorization),
    hasApiKey: Boolean(request.headers.apikey || request.headers.apiKey),
    authorizationSub: request.authorizationSub,
  }));
}

function decodeJwtSub(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).sub || null;
  } catch {
    return null;
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-popup-blocking",
    "--window-size=1440,1100",
    "about:blank",
  ], { stdio: "ignore", detached: true });

  const version = await waitForChrome();
  const browser = connect(version.webSocketDebuggerUrl);
  await browser.ready;

  const networkRequests = [];
  browser.on("Network.requestWillBeSent", (params) => {
    if (!params.request.url.includes("supabase.co") && !params.request.url.includes("/functions/v1/")) return;
    const auth = params.request.headers.Authorization || params.request.headers.authorization;
    networkRequests.push({
      url: params.request.url,
      method: params.request.method,
      headers: params.request.headers,
      authorizationSub: decodeJwtSub(auth),
    });
  });

  const page = await createPage(browser);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Network.enable");

  const result = {
    generatedAt: new Date().toISOString(),
    chromePath: CHROME_PATH,
    cases: {},
    network: [],
    assertions: {},
  };

  await clearAll(page);

  await loginAgent(page, "http://localhost:3000");
  result.cases.agentLogin = await snapshot(page, "agent login");
  await navigate(page, "http://localhost:3000/");
  result.cases.case1AgentThenUserRoot = await snapshot(page, "agent then user root");

  await clearAll(page);
  await loginAdmin(page, "http://localhost:3000");
  result.cases.adminLogin = await snapshot(page, "admin login");
  await navigate(page, "http://localhost:3000/agent");
  result.cases.case2AdminThenAgent = await snapshot(page, "admin then agent");

  await clearAll(page);
  await loginUser(page, "http://localhost:3000");
  result.cases.userLogin = await snapshot(page, "user login");
  await navigate(page, "http://localhost:3000/admin");
  result.cases.case3UserThenAdmin = await snapshot(page, "user then admin");

  await clearAll(page);
  await loginUser(page, "http://localhost:3000");
  const userTab = page;
  const agentTab = await createPage(browser);
  await agentTab.send("Page.enable");
  await agentTab.send("Runtime.enable");
  await agentTab.send("Network.enable");
  await loginAgent(agentTab, "http://localhost:3000");
  await navigate(userTab, "http://localhost:3000/mypage");
  result.cases.case4MultiTabUser = await snapshot(userTab, "multi-tab user");
  result.cases.case4MultiTabAgent = await snapshot(agentTab, "multi-tab agent");

  await agentTab.send("Page.reload", { ignoreCache: true });
  await delay(1800);
  result.cases.case5HardRefreshAgent = await snapshot(agentTab, "hard refresh agent");

  result.cases.case6AgentLogoutClicked = await logoutIfVisible(agentTab);
  await delay(1800);
  result.cases.case6AgentAfterLogout = await snapshot(agentTab, "agent after logout");
  await navigate(userTab, "http://localhost:3000/mypage");
  result.cases.case6UserAfterAgentLogout = await snapshot(userTab, "user after agent logout");

  await clearAll(page);
  await loginAdmin(page, "http://admin.localhost:3000", true);
  result.cases.subdomainAdminLogin = await snapshot(page, "subdomain admin login");
  await navigate(page, "http://agent.localhost:3000/");
  result.cases.subdomainAdminThenAgent = await snapshot(page, "subdomain admin then agent");
  await navigate(page, "http://admin.localhost:3000/");
  result.cases.subdomainAdminPersistence = await snapshot(page, "subdomain admin persistence");

  await clearAll(page);
  await loginAgent(page, "http://agent.localhost:3000", true);
  result.cases.subdomainAgentLogin = await snapshot(page, "subdomain agent login");
  await navigate(page, "http://app.localhost:3000/");
  result.cases.subdomainAgentThenApp = await snapshot(page, "subdomain agent then app");

  await clearAll(page);
  await loginUser(page, "http://app.localhost:3000");
  result.cases.subdomainUserLogin = await snapshot(page, "subdomain user login");
  await navigate(page, "http://admin.localhost:3000/");
  result.cases.subdomainUserThenAdmin = await snapshot(page, "subdomain user then admin");

  const restartPage = await createPage(browser);
  await restartPage.send("Page.enable");
  await restartPage.send("Runtime.enable");
  await restartPage.send("Network.enable");
  await navigate(restartPage, "http://app.localhost:3000/mypage");
  result.cases.case10BrowserRestartPersistence = await snapshot(restartPage, "browser restart persistence simulation");

  result.network = summarizeNetwork(networkRequests);

  const c = result.cases;
  result.assertions = {
    case1AgentDoesNotPolluteUserRoot: c.case1AgentThenUserRoot.markers.userLoggedOutHome && !c.case1AgentThenUserRoot.markers.agentDashboard,
    case2AdminDoesNotAuthenticateAgent: c.case2AdminThenAgent.markers.agentLogin && !c.case2AdminThenAgent.markers.agentDashboard,
    case3UserDoesNotAuthenticateAdmin: c.case3UserThenAdmin.markers.adminLogin && !c.case3UserThenAdmin.markers.adminDashboard,
    case4MultiTabBothSessionsIndependent: c.case4MultiTabUser.markers.userSessionUi && c.case4MultiTabAgent.markers.agentDashboard,
    case5HardRefreshNoHydrationContamination: c.case5HardRefreshAgent.markers.agentDashboard && !c.case5HardRefreshAgent.markers.adminDashboard,
    case6AgentLogoutKeepsUserSession: c.case6AgentAfterLogout.markers.agentLogin && c.case6UserAfterAgentLogout.markers.userSessionUi,
    case7LocalStorageNoAuthKeyCollision: Object.keys(c.case4MultiTabUser.storage.localStorage).filter((key) => key.includes("auth-token")).length === 0,
    case8CookieNamespacesSeparate: c.case4MultiTabUser.cookies.allScopedCookies.some((cookie) => cookie.name === "sb-dating-user-auth-token") && c.case4MultiTabUser.cookies.allScopedCookies.some((cookie) => cookie.name === "sb-dating-agent-auth-token"),
    case9SsrCsrNoMismatchOnProtectedRoutes: c.case3UserThenAdmin.markers.adminLogin && c.case2AdminThenAgent.markers.agentLogin,
    case10BrowserRestartPersistence: c.case10BrowserRestartPersistence.markers.userSessionUi,
    subdomainAdminCleanPathWorks: c.subdomainAdminLogin.markers.adminDashboard,
    subdomainAgentCleanPathWorks: c.subdomainAgentLogin.markers.agentDashboard,
    subdomainCrossScopeIsolation: c.subdomainAdminThenAgent.markers.agentLogin && c.subdomainAgentThenApp.markers.userLoggedOutHome && c.subdomainUserThenAdmin.markers.adminLogin,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(result, null, 2), "utf8");
  console.log(OUT_FILE);
  console.log(JSON.stringify(result.assertions, null, 2));

  browser.close();
  chrome.kill();
}

main().catch(async (error) => {
  await fs.mkdir(OUT_DIR, { recursive: true }).catch(() => {});
  await fs.writeFile(path.join(OUT_DIR, "session-isolation-error.log"), String(error?.stack || error), "utf8").catch(() => {});
  console.error(error);
  process.exit(1);
});
