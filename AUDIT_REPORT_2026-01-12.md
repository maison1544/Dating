# AUDIT REPORT — 2026-01-12

## Scope

This audit covers:

- Public routes (logged out)
- User-authenticated routes
- Admin-authenticated routes
- Agent-authenticated routes

Two sources of evidence were used:

- **Automated**: Playwright E2E suite
- **Manual**: Chrome DevTools MCP navigation + console/network inspection

Target environment:

- Base URL: `http://127.0.0.1:5174`
- Backend: Supabase project `beyzubmbwygxiixuieiy`

## Automated test results (Playwright)

Run command:

- `npm run test:e2e`

Result:

- **61 passed**
- **0 failed**

Notes:

- Tests include public pages, user protected pages, admin protected pages, agent protected pages, minigame smoke flows, and permissions/RLS checks.

## Manual inspection results (Chrome DevTools MCP)

Inspection method:

- Navigate to route
- Confirm key UI text renders (snapshot evidence)
- Check Console messages (focus: errors)
- Check Network requests (focus: 4xx/5xx)

### Legend

- **Console**
  - OK: no errors
  - Issue: non-blocking browser “issue” messages (a11y / form recommendations)
  - Error: runtime error or failed resource
- **Network**
  - OK: no 4xx/5xx to backend APIs
  - Note: `304` is not a backend failure in this context (cache revalidation)

## Findings by route group

### Public routes

(Previously inspected in the audit process; key known issues were re-validated after the fixes below.)

- **Overall**
  - Console: mostly OK
  - Network: Supabase requests OK

### User-authenticated routes

#### `/point`

- **Render**: “포인트” page loads and displays balances and charge history.
- **Console**: OK
- **Network**: OK (Supabase REST calls returned 200)

#### `/mypage`

- **Render**: MyPage loads (user info, points, gift count).
- **Console**: OK
- **Network**: OK

#### `/profile-edit`

- **Render**: Profile edit form loads (name/nickname/email, bank/account fields).
- **Console**: Issue
  - “A form field element should have an id or name attribute”
- **Network**: OK

#### `/payment-history`

- **Render**: “충전/출금 내역” list loads.
- **Console**: OK
- **Network**: OK

#### `/ranking`

- **Render**: Ranking page loads.
- **Console/Network**: FIXED (see “Fixes applied”)

#### `/chat/:id`

- **Render**: Chat room loads and messages render.
- **Console/Network**: FIXED (see “Fixes applied”)

### Admin-authenticated routes

Admin login:

- `/admin/login` (username/password)

Routes inspected:

- `/admin` (dashboard)
- `/admin/users`
- `/admin/accounts`
- `/admin/points`
- `/admin/notices`
- `/admin/chats`
- `/admin/gifts`
- `/admin/minigames`

Results summary:

- **Console**: mostly OK
  - Some pages show non-blocking form/a11y issue warnings (missing `id`/`name` attributes)
- **Network**: OK
  - Supabase REST calls generally returned 200

### Agent-authenticated routes

Agent login:

- `/agent/login` (username/password)

Routes inspected:

- `/agent` (dashboard)
- `/agent/members`
- `/agent/gifts`
- `/agent/chats`

Results summary:

- **Console**: mostly OK
  - Some pages show non-blocking form/a11y issue warnings
- **Network**: OK

#### `/agent/members`

- **Render**: “회원 관리” heading visible; member list renders.
- **Console**: Issue
  - “A form field element should have an id or name attribute”
- **Network**: OK
  - `GET /rest/v1/user_profiles?...agent_id=eq.<agent_id>` -> 200
  - Ancillary reads (`admins`, `agents`, `chat_profiles`) -> 200

#### `/agent/gifts`

- **Render**: “기프트 관리” heading visible; history list renders.
- **Console**: Issue
  - “A form field element should have an id or name attribute”
- **Network**: OK
  - `GET /rest/v1/gift_transactions?select=*,gifts(*)...` -> 200
  - `GET /rest/v1/gifts?is_active=eq.true...` -> 200
  - `GET /rest/v1/user_profiles?id=in.(...)` -> 200

#### `/agent/chats`

- **Render**: “채팅 관리” heading visible; chat list renders.
- **Console**: OK
- **Network**: OK
  - `GET /rest/v1/chat_rooms?select=...` -> 200
  - Note: some navigations may show `304` on the document request due to cache revalidation (not a backend failure).

#### Agent logout

- **Action**: Click “로그아웃” from agent pages.
- **Result**: Redirects to `/agent/login` and completes logout API call.
- **Network**: `POST /auth/v1/logout?scope=global` -> 204
- **Console/UX**: No “Auth session missing” failure alert after applying the sign-out fix.

## Fixes applied during audit

### 1) `/ranking` — Removed failing PostgREST aggregate query

- **Problem**: Supabase PostgREST aggregate `.sum()` query caused 400 errors, leading to console/network noise and potential empty ranking rendering.
- **Fix**: Removed the aggregate call and always used the existing pagination-based aggregation fallback.
- **Impact**: Ranking page loads without 400 console/network errors.

### 2) `/chat/:id` — Removed invalid PostgREST relationship join causing 400 (PGRST200)

- **Problem**: Chat message query attempted `messages?select=*,gift_items:gifts(*)`, but PostgREST schema cache had **no FK relationship** between `messages` and `gifts`, producing:
  - `PGRST200 Could not find a relationship between 'messages' and 'gifts'`
  - Console error + a failed network request
- **Fix**:
  - Query `messages` via `select('*')`
  - Hydrate `gift_items` client-side by fetching `gifts` via `gift_id`
- **Impact**: Chat room loads without the initial failing 400 request.

### 3) Logout UX — Ignore “Auth session missing” during sign-out

- **Problem**: Clicking logout could show a modal/alert:
  - `로그아웃에 실패했습니다: Auth session missing!`
  - This is a common edge case when the client session is already cleared.
- **Fix**: Treat this message as ignorable and still clear local auth state.
- **Impact**: Logout no longer surfaces a false-negative “failure” to users when the session is already missing.

Verification:

- Confirmed by logging out from the agent UI and observing successful redirect to `/agent/login` without a failure alert.

## Risks / Recommendations

### High priority

- **Logout robustness**
  - Ensure all logout entry points consistently ignore “Auth session missing” and still clear local state.

### Medium priority

- **Accessibility / form semantics**
  - Multiple pages emit browser issues:
    - “A form field element should have an id or name attribute”
    - Missing `autocomplete` suggestions
  - Recommendation: add `id`/`name` attributes and proper `autocomplete` values on inputs.

### Low priority

- **Caching (304)**
  - Several document requests show 304 in DevTools logs. This is not a failure but can confuse audits.
  - Recommendation: when reporting, treat 304 as non-issue.

## Conclusion

- The automated E2E suite is green (**61 passed**).
- Manual DevTools inspection across user/admin/agent flows found **no remaining 4xx/5xx backend failures** after applying the fixes above.
- Remaining console findings are mainly **non-blocking form/a11y recommendations**.
