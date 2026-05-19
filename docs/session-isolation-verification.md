---
title: Session Isolation Verification
---

# Session Isolation Verification

## Verification target

This document records browser-behavior verification for session isolation across:

- **User**: `/`, `app.localhost:3000`
- **Admin**: `/admin`, `admin.localhost:3000`
- **Agent**: `/agent`, `agent.localhost:3000`

The goal was to verify actual runtime behavior, not only structural separation.

## Test environment

- **App server**: `pnpm --filter web start -- -p 3000`
- **Build used**: `pnpm --filter web exec next build --webpack`
- **Browser**: Google Chrome via Chrome DevTools Protocol
- **Test runner**: `scripts/session-isolation-cdp-test.mjs`
- **Result artifact**: `artifacts/session-isolation/session-isolation-2026-05-18T22-40-00-008Z.json`

## Test credentials

- **User**: `testuser@dating.local`
- **Admin**: `testadmin`
- **Agent**: `testagent`

Passwords are intentionally not included in this report.

## Overall result

All session isolation assertions passed in a real Chrome browser run.

```json
{
  "case1AgentDoesNotPolluteUserRoot": true,
  "case2AdminDoesNotAuthenticateAgent": true,
  "case3UserDoesNotAuthenticateAdmin": true,
  "case4MultiTabBothSessionsIndependent": true,
  "case5HardRefreshNoHydrationContamination": true,
  "case6AgentLogoutKeepsUserSession": true,
  "case7LocalStorageNoAuthKeyCollision": true,
  "case8CookieNamespacesSeparate": true,
  "case9SsrCsrNoMismatchOnProtectedRoutes": true,
  "case10BrowserRestartPersistence": true,
  "subdomainAdminCleanPathWorks": true,
  "subdomainAgentCleanPathWorks": true,
  "subdomainCrossScopeIsolation": true
}
```

## Test case results

### 1. Agent login, then visit `/`

- **Steps**:
  - Log in as agent at `/agent/login`
  - Navigate to `/`
- **Expected**:
  - User home renders as logged out
  - No agent dashboard/header leaks into user UI
- **Observed**:
  - URL: `http://localhost:3000/`
  - User logged-out header with `로그인`/`회원가입`
  - No `에이전트 모드(testagent)` UI
- **Result**: Pass

### 2. Admin login, then access `/agent`

- **Steps**:
  - Log in as admin at `/admin/login`
  - Navigate to `/agent`
- **Expected**:
  - Admin session must not authenticate the agent app
  - Agent login page must render
- **Observed**:
  - URL: `http://localhost:3000/agent/login`
  - Agent login page rendered
  - No agent dashboard session
- **Result**: Pass

### 3. User login, then access `/admin`

- **Steps**:
  - Log in as user at `/login`
  - Navigate to `/admin`
- **Expected**:
  - User session must not authenticate admin app
  - Middleware redirects to admin login
- **Observed**:
  - URL: `http://localhost:3000/admin/login`
  - Admin login page rendered
  - No admin dashboard session
- **Result**: Pass

### 4. Multi-tab environment

- **Steps**:
  - Log in as user in one tab
  - Log in as agent in another tab
  - Revisit user `/mypage` and agent `/agent`
- **Expected**:
  - Both sessions remain independently active
- **Observed**:
  - User tab URL: `http://localhost:3000/mypage`
  - Agent tab URL: `http://localhost:3000/agent`
  - Both `sb-dating-user-auth-token` and `sb-dating-agent-auth-token` existed on localhost
  - User page rendered user session UI
  - Agent page rendered agent dashboard UI
- **Result**: Pass

### 5. Hard refresh hydration contamination

- **Steps**:
  - With multi-tab user + agent sessions active, hard refresh agent page
- **Expected**:
  - Agent page remains agent
  - No admin/user role flicker contaminates the agent route
- **Observed**:
  - URL: `http://localhost:3000/agent`
  - Agent dashboard rendered after refresh
  - `roleLeakage: false`
- **Result**: Pass

### 6. Logout isolation

- **Steps**:
  - User and agent both logged in
  - Log out from agent page
  - Revisit user `/mypage`
- **Expected**:
  - Agent session removed
  - User session remains active
- **Observed**:
  - Agent after logout URL: `http://localhost:3000/agent/login`
  - Remaining localhost scoped cookie: `sb-dating-user-auth-token`
  - User `/mypage` still authenticated
- **Result**: Pass

### 7. localStorage key collision

- **Expected**:
  - No unscoped Supabase auth localStorage key collision
  - Non-auth localStorage must be app-scoped where relevant
- **Observed**:
  - No localStorage keys containing `auth-token`
  - Notification keys were scoped:
    - `dating:user:notification_settings`
    - `dating:agent:notification_settings`
    - `dating:admin:notification_settings`
- **Result**: Pass

### 8. Cookie namespace collision

- **Expected**:
  - Each scope uses separate auth cookie names
- **Observed on localhost multi-tab**:
  - `localhost:sb-dating-user-auth-token`
  - `localhost:sb-dating-agent-auth-token`
- **Observed on subdomains**:
  - `app.localhost:sb-dating-user-auth-token`
  - `admin.localhost:sb-dating-admin-auth-token`
  - `agent.localhost:sb-dating-agent-auth-token`
- **Result**: Pass

### 9. SSR/CSR session mismatch

- **Expected**:
  - Middleware and client providers agree on the active app scope
  - Login pages do not flip role after hydration
- **Observed**:
  - `admin.localhost:3000/login` rendered admin login and admin login worked
  - `agent.localhost:3000/login` rendered agent login and agent login worked
  - Cross-scope protected routes rendered scoped login pages
- **Result**: Pass

### 10. Browser restart persistence

- **Steps**:
  - Persist browser profile state
  - Open a fresh page to `app.localhost:3000/mypage`
- **Expected**:
  - User session persists for the user subdomain only
- **Observed**:
  - URL: `http://app.localhost:3000/mypage`
  - User `/mypage` remained authenticated
  - Current host cookie: `app.localhost:sb-dating-user-auth-token`
- **Result**: Pass

## Host-based local subdomain verification

### `admin.localhost:3000`

- **Clean login path**: `http://admin.localhost:3000/login`
- **Internal route after login**: `http://admin.localhost:3000/admin`
- **Current host cookie**: `admin.localhost:sb-dating-admin-auth-token`
- **Result**: Pass

### `agent.localhost:3000`

- **Clean login path**: `http://agent.localhost:3000/login`
- **Internal route after login**: `http://agent.localhost:3000/agent`
- **Current host cookie**: `agent.localhost:sb-dating-agent-auth-token`
- **Result**: Pass

### `app.localhost:3000`

- **Login path**: `http://app.localhost:3000/login`
- **User page after login**: `http://app.localhost:3000/`
- **Current host cookie**: `app.localhost:sb-dating-user-auth-token`
- **Result**: Pass

## Network auth header verification

The CDP test captured Supabase REST and Edge Function requests.

- **Authenticated Supabase REST calls** included `Authorization: Bearer ...`
- **Requests also included API key headers where required**
- **Static storage asset requests did not include auth headers**, as expected
- **JWT subjects matched the active authenticated user for user-scoped REST calls**

The report redacts token values and stores only header presence and decoded `sub` values.

## Codebase leakage pattern scan

The project was scanned for the requested leakage patterns.

### Removed or absent patterns

- **`export const supabase`**: no results after refactor
- **`createBrowserClient(` singleton misuse**: no unscoped singleton results found by the final scan
- **`globalThis` auth cache**: no results
- **`global auth cache`**: no results
- **`shared session store`**: no results
- **`global auth provider`**: no results
- **`zustand` auth/session store**: no results
- **Legacy raw keys**:
  - `sb-user-auth-token`: no results
  - `sb-admin-auth-token`: no results
  - `sb-agent-auth-token`: no results

### Refactors performed during verification

- **Shared package singleton removed**:
  - `packages/shared/src/lib/supabase.ts` no longer exports static `supabase` / `supabaseAdmin` clients
  - It now exposes `createScopedSupabaseClient(instance)` with scoped storage keys
- **Web client lazy export hardened**:
  - `apps/web/lib/supabase/client.ts` no longer uses `export const supabase`
  - Legacy imports still work via named exports, but the default lazy client resolves the current browser app scope instead of forcing `user`
- **Subdomain host detection fixed**:
  - `apps/web/middleware.ts` uses the `Host` header first, so `admin.localhost` and `agent.localhost` resolve correctly
- **Hydration role leakage fixed**:
  - `AdminLoginPage` uses `AppScopeContext` in addition to pathname to decide admin vs agent login mode

## Conclusion

The app is verified beyond structural separation. In the tested Chrome browser runtime:

- **Agent login does not pollute user UI**
- **Admin/user/agent sessions do not cross-authenticate each other**
- **Role UI leakage was not observed after fixes**
- **Multi-tab sessions remain independent**
- **Hard refresh does not cause hydration contamination**
- **Logout is scoped to the active app area**
- **localStorage and cookie namespaces do not collide**
- **Subdomain-style local hosts preserve isolation**
- **Production subdomain architecture is supported by the same host-first scope resolver**
