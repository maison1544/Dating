# Deployment Readiness Audit

## Recommendation

Do not immediately redeploy to production from the current App Router branch. Use this audit to fix high-risk compatibility/security issues, then deploy to staging/preview first.

## Overall Status

| Area | Status | Reason |
|---|---|---|
| Next.js build readiness | Blocked | Lint attempted, but local `node_modules` is missing so `eslint` cannot run |
| Supabase env mapping | Fixed in code | `import.meta.env` usage was removed from `apps/web` |
| Supabase schema compatibility | Partially confirmed | mcp2 schema matches the app domain, but mcp3 is empty |
| RPC compatibility | Needs audit | mcp2 has duplicate/overloaded RPCs and many SECURITY DEFINER functions |
| Edge Function compatibility | Needs audit | Functions exist, but `verify_jwt` is false in mcp2 |
| Realtime compatibility | Needs audit | mcp2 publishes many sensitive tables |
| Storage compatibility | Needs audit | mcp2 buckets are public; mcp3 has none |
| Package manager consistency | Needs fix | `pnpm` scripts and `pnpm-workspace.yaml` exist, but only `package-lock.json` was found |

## Critical Findings

### 1. Vite environment variable usage in Next.js code

File:

- `apps/web/hooks/useSupabase.ts`
- `apps/web/contexts/AuthContext.tsx`

Finding:

- Fixed: `import.meta.env` usage was replaced with `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Static search no longer finds `import.meta.env` in `apps/web`.

Risk:

- If deployment env vars are missing, Edge Function calls can still fail at runtime.

Required fix:

- Confirm required deployment env vars before staging.

### 2. `next.config.ts` hardcodes mcp2 Supabase image host

File:

- `apps/web/next.config.ts`

Finding:

- Fixed: remote image hostname is now derived from `NEXT_PUBLIC_SUPABASE_URL`, with the mcp2 host retained only as fallback.

Risk:

- Images break after switching to mcp3.
- Multi-environment deployment becomes brittle.

Required fix:

- Confirm `NEXT_PUBLIC_SUPABASE_URL` is set correctly for mcp3 before staging.

### 3. Browser `supabaseAdmin` is not an admin client

File:

- `apps/web/lib/supabase/client.ts`
- `apps/web/contexts/AuthContext.tsx`
- `apps/web/hooks/useSupabase.ts`

Finding:

- `supabaseAdmin` is exported as another browser anon client.
- It is created with `createBrowserClient` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, not a server-only service-role key.
- High-impact call sites assume this client can bypass RLS:
  - admin/agent login account lookup in `AuthContext.tsx`
  - realtime chat agent/profile mode in `useRealtimeChat`
  - profile sender/read flows in `useSendMessage` and `useMarkMessagesAsRead`
  - admin account, agent, user, point/payment, gift, notice, and game admin hooks in `useSupabase.ts`
  - admin action log writes after Edge Function calls

Risk:

- Code comments claim it can bypass RLS, but it cannot.
- Admin/agent flows may silently fail under strict RLS.
- If RLS is loosened to make it work, security can degrade.
- If broad RLS policies are added to satisfy browser admin hooks, ordinary authenticated users may gain excessive table access.

Required fix:

- Treat `supabaseAdmin` as an admin-session browser client only, not a privileged client.
- Do not put a service-role key in any browser bundle.
- For mcp3, implement privileged mutations and broad admin reads through Edge Functions or App Router API routes using server-side service-role.
- Keep browser reads constrained by role-aware RLS and narrow RPCs.
- Keep service-role keys server-only.

Detailed follow-up plan:

- See `supabase_admin_server_side_plan.md`.

### 4. Edge Functions report `verify_jwt: false` in mcp2

Functions:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

Risk:

- If function-level auth is incomplete, sensitive operations may be callable without proper authorization.

Observation:

- Several local functions do manually validate bearer tokens and role rows.
- `validate-referral-code` appears intentionally public-like.

Required fix:

- Review each function and deploy to mcp3 with JWT verification enabled by default unless custom auth/public access is explicitly required.

### 5. RPC overload and legacy drift risk

mcp2 contains overloaded/duplicate signatures for functions including:

- `admin_gift_grant`
- `admin_gift_revoke`
- `chat_send_message`
- `chat_send_gift_profile`
- `game_tick`
- `game_tick_client`
- `place_bet`
- `request_withdrawal_v2`
- minigame admin chat list functions

Risk:

- Current code may call one signature while migration recreates another.
- Historical functions may include obsolete behavior.

Required fix:

- For mcp3, create only the signatures needed by current App Router code plus policy/trigger dependencies.

### 6. Realtime privacy risk

mcp2 publishes sensitive tables such as:

- `messages`
- `chat_rooms`
- `game_bets`
- `user_profiles`
- `deposit_requests`
- `withdrawal_requests`

Risk:

- Misconfigured RLS can leak private data via realtime payloads.

Required fix:

- Validate RLS and subscription filters before enabling publications in mcp3.

### 7. Storage privacy risk

mcp2 buckets are public:

- `profile-images`
- `chat-profile-images`
- `chat-images`

Risk:

- Chat images may be publicly accessible by URL.

Required fix:

- Decide whether chat images must be public.
- If private, use signed URL flow and stricter storage policies.

### 8. Package manager drift

Finding:

- Root scripts use `pnpm`.
- `pnpm-workspace.yaml` exists.
- `package-lock.json` exists.
- `pnpm-lock.yaml` not found.

Risk:

- Deployment environment may install mismatched dependency graph.

Required fix:

- Normalize to `pnpm` and generate/commit `pnpm-lock.yaml`, or revert scripts to npm intentionally.

Recommended path:

- Keep `pnpm`, because root scripts and `pnpm-workspace.yaml` are already pnpm-based.
- After approval, run `pnpm install` from the repository root to generate `pnpm-lock.yaml`.
- Remove `package-lock.json` only after confirming npm is no longer the intended installer.
- Re-run `pnpm --filter web lint` and `pnpm --filter web build` after dependencies are installed.

### 9. App Router navigation compatibility

Finding:

- Fixed: Vite/React Router style navigation remnants were replaced with Next App Router-compatible `useRouter().push(...)`.
- Fixed: invalid render-time redirect JSX such as `router.push("/login" replace />` was removed.
- Fixed: `next/link` usage now uses `href` instead of React Router-style `to`.

Remaining risk:

- Build/lint still must be verified after dependencies are installed.

## Safe Deployment Path

### Step 1: No production deployment yet

Do not deploy the current branch directly to production.

### Step 2: Fix high-risk App Router compatibility issues

Minimum fixes before staging:

- Replace `import.meta.env` usage. Completed.
- Resolve hardcoded Supabase image host. Completed.
- Fix App Router navigation/link compatibility. Completed.
- Clarify/fix `supabaseAdmin` usage. Audit and replacement plan documented in `supabase_admin_server_side_plan.md`; implementation still required.
- Normalize package manager lockfile.

### Step 3: Build and lint

Run:

```powershell
pnpm --filter web lint
pnpm --filter web build
```

Current verification note:

- `pnpm --filter web lint` was attempted, but failed because local `node_modules` is missing and `eslint` is unavailable.
- Run `pnpm install` after choosing the package manager strategy, then rerun lint and build.

### Step 4: mcp3 clean migration staging

Do not replay all mcp2 migrations. Build a clean mcp3 schema from the dependency map.

### Step 5: Deploy to preview/staging

Validate:

- user login/signup/profile
- admin login/accounts/users/points/minigames
- agent login/members/chats/gifts
- chat creation/message/send/read/gift
- game rounds/bets/settlement/history
- deposit/withdrawal flows
- notifications/realtime
- image upload/display

### Step 6: Production deployment only after test pass

Promote only after all critical flows pass and Supabase advisors are reviewed.

## Decision

The safest path is:

1. Complete clean mcp3 migration design.
2. Apply mcp3 migration in phases.
3. Fix App Router compatibility issues.
4. Run build/lint and functional tests.
5. Deploy staging.
6. Promote to production after validation.
