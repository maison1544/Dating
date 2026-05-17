# Supabase Admin Server-Side Replacement Plan

## Purpose

Remove the unsafe assumption that `supabaseAdmin` in the browser can bypass RLS.

Current fact:

- `apps/web/lib/supabase/client.ts` exports `supabaseAdmin` as `createBrowserClient(...)`.
- It uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- It is not a service-role client and cannot bypass RLS.

This plan keeps service-role access server-only and avoids weakening mcp3 RLS to make browser admin hooks work.

## Non-Negotiable Rules

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Do not solve admin UI failures by creating broad authenticated-user RLS policies.
- Keep mcp1 and mcp2 read-only.
- Apply changes only to mcp3 after explicit approval.
- Deploy Edge Functions with JWT verification enabled unless custom auth/public access is explicitly justified.

## Existing Safe Server-Side Pattern

Existing Edge Functions already use the correct pattern:

- `supabase/functions/admin-create-backoffice-account/index.ts`
- `supabase/functions/admin-delete-backoffice-account/index.ts`
- `supabase/functions/admin-update-user-password/index.ts`

Pattern:

1. Read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from server environment.
2. Validate the caller's bearer JWT with `auth.getUser(jwt)`.
3. Check role rows in `admins` or `agents`.
4. Perform privileged mutation using service-role client.
5. Return narrow response payload.

## Browser Call Sites That Need Replacement

### 1. Auth and backoffice session lookup

Files:

- `apps/web/contexts/AuthContext.tsx`

Current risk:

- `fetchAdminAccount` reads `admins` and `agents` through browser `supabaseAdmin`.
- This requires RLS policies that expose admin/agent rows to browser clients.

Recommended replacement:

- Add a narrow RPC or Edge Function for current-user backoffice account lookup.
- Input: caller JWT only.
- Server verifies JWT and returns only the caller's own admin/agent account fields.
- Do not allow arbitrary user id lookup from the browser.

### 2. Backoffice account actions

Files:

- `apps/web/hooks/useSupabase.ts`

Existing partial server coverage:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-update-user-password`

Remaining risk:

- Browser still inserts `admin_action_logs` after function success.
- Browser directly updates `chat_profiles.assigned_agent_id` in `assignChatProfilesToAgent`.

Recommended replacement:

- Move action-log writes into each Edge Function.
- Add `admin-assign-chat-profiles` Edge Function.
- The function should validate admin role, update assignments, and write `admin_action_logs` atomically where practical.

### 3. Admin account, agent, and user management reads/writes

Files:

- `apps/web/hooks/useSupabase.ts`

Affected hooks include:

- `useAdminAccounts`
- `useAgents`
- `useUsers`
- `useDashboardStats`
- `useAdminUserActions`

Current risk:

- Browser performs broad table reads across `admins`, `agents`, `user_profiles`, `point_transactions`, `withdrawal_requests`, `game_bets`, and `gift_transactions`.
- Browser performs privileged mutations such as user status changes and point adjustments.

Recommended replacement:

- Keep low-risk, role-scoped reads in RLS only if policies can be narrow and testable.
- Move privileged mutations to server-side endpoints:
  - `admin-adjust-user-points`
  - `admin-set-user-status`
  - `admin-update-user-password` already exists, but logging should be inside the function
  - `admin-update-agent`
  - `admin-update-admin-account`
- Move dashboard aggregation to a single server-side endpoint or SECURITY DEFINER RPC with hardened `search_path` and strict role checks.

### 4. Admin notifications

Files:

- `apps/web/hooks/useAdminNotifications.ts`

Current risk:

- Browser subscribes to `deposit_requests`, `withdrawal_requests`, and `user_profiles` changes.
- Browser fetches pending financial and registration records directly.

Recommended replacement options:

Option A, RLS-based:

- Allow only verified admins to select pending notification summaries.
- Realtime payload must not leak sensitive fields beyond notification needs.

Option B, server-mediated:

- Create an admin notification summary endpoint.
- Use realtime only as an invalidation signal, then refetch summaries from server.

Preferred for mcp3:

- Start with Option B for financial records.
- Use narrow RLS only where payload exposure is acceptable.

### 5. Agent chat notifications and agent chat operations

Files:

- `apps/web/hooks/useAgentChatNotifications.ts`
- `apps/web/hooks/useSupabase.ts`

Affected hooks include:

- `useRealtimeChat`
- `useSendMessage`
- `useMarkMessagesAsRead`
- `useAgentChatNotifications`

Current risk:

- Agent/profile mode assumes browser `supabaseAdmin` can bypass RLS.
- It subscribes to all `messages` inserts and filters client-side in some flows.

Recommended replacement:

- Define agent-specific RLS policies based on assigned chat profiles.
- Prefer narrow RPCs for mutations:
  - `agent_send_profile_message`
  - `agent_mark_profile_room_read`
- For realtime, avoid broad `messages` publications where possible.
- Use room/profile filters and RLS tests to ensure agents see only assigned rooms.

### 6. Point, payment, and game admin mutations

Files:

- `apps/web/hooks/useSupabase.ts`

Current risk:

- Admin mutations may run from browser clients against sensitive financial/game tables.

Recommended replacement:

- All point balance changes must be server-side or RPC-mediated and atomic.
- Financial approval/rejection should be server-side:
  - `admin-approve-deposit`
  - `admin-reject-deposit`
  - `admin-approve-withdrawal`
  - `admin-reject-withdrawal`
- Game settlement/admin override actions should be server-side only.

## Implementation Priority

### Priority 1: Security-critical mutations

- Move admin point adjustments server-side.
- Move user status changes server-side.
- Move deposit/withdrawal approval/rejection server-side.
- Move chat profile assignment server-side.
- Move action-log writes into server-side functions.

### Priority 2: Broad admin reads

- Replace dashboard statistics with server aggregation.
- Replace broad user/admin/agent list reads with role-checked endpoints or narrow RPCs.

### Priority 3: Realtime privacy

- Replace broad realtime subscriptions or limit them with tested RLS.
- Use realtime as an invalidation trigger where payload privacy is uncertain.

### Priority 4: Naming cleanup

- Rename browser `supabaseAdmin` to avoid misleading privilege assumptions.
- Suggested names:
  - `supabaseBackoffice`
  - `supabaseBrowserAdminSession`
  - or remove the alias and use `supabase` consistently for browser calls.

## Suggested Endpoint Inventory

Minimum new server-side functions/routes before production mcp3 deployment:

- `backoffice-current-account`
- `admin-assign-chat-profiles`
- `admin-adjust-user-points`
- `admin-set-user-status`
- `admin-dashboard-stats`
- `admin-list-users`
- `admin-list-agents`
- `admin-list-admins`
- `admin-approve-deposit`
- `admin-reject-deposit`
- `admin-approve-withdrawal`
- `admin-reject-withdrawal`

Existing functions to retain and harden:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-update-user-password`
- `admin-force-logout`
- `backoffice-record-login`
- `user-record-login`
- `request-withdrawal`
- `validate-referral-code`

## Verification Checklist

Before mcp3 production deployment:

- No service-role key in any `NEXT_PUBLIC_*` env var.
- Browser code no longer claims RLS bypass.
- All privileged mutations validate caller role server-side.
- All server-side functions write their own audit logs.
- Supabase advisors reviewed after schema/RLS changes.
- RLS tests confirm ordinary users cannot read admin, agent, payment, or other users' private rows.
- Agent tests confirm agents can only access assigned chat profiles and rooms.
- Lint/build pass after dependency installation and package-manager normalization.
