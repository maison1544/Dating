# mcp3 Migration Execution Plan

## Goal

Build a clean, secure Supabase backend on mcp3 for the current Next.js App Router DatingDesignPrototype app.

This is not a direct clone of mcp2 and not a crypto schema migration. mcp2 is the dating reference; mcp1 is only a security/operational pattern reference.

## Non-Negotiable Rules

- mcp1: read only.
- mcp2: read only.
- mcp3: only writable target, but only after explicit approval.
- No production deployment until build/lint/security/functional checks pass.
- No service-role secrets in browser code.
- No broad realtime publications without RLS verification.
- No Edge Function deployment with JWT disabled unless explicitly justified.

## Execution Strategy

Use clean consolidated migrations instead of replaying mcp2's historical migration chain.

Reasons:

- mcp2 has a long history of schema rebuilds, fixes, duplicate/overloaded functions, and security patches.
- Replaying all migrations would be slower and risk preserving obsolete artifacts.
- A clean migration can include only the current App Router app's real dependencies.

## Phase 0: Pre-Migration Code Fixes

Before any mcp3 migration or deployment:

1. Replace `import.meta.env.VITE_SUPABASE_URL` with Next.js-compatible env access. Completed in code.
2. Make `next.config.ts` image remote host environment-driven or include mcp3 host after project selection. Completed in code.
3. Audit `supabaseAdmin` browser client usage and move sensitive flows server-side or to Edge Functions. Audit completed; implementation still required.
4. Normalize package manager lockfile.
5. Confirm required deployment env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_INSTANCE`
   - server-only service-role vars only where needed.

Additional App Router compatibility fixes completed in code:

- Standardized `useRouter()` variables to `router`.
- Removed invalid render-time redirect JSX.
- Replaced `next/link` React Router-style `to` props with `href`.

Verification status:

- Static searches no longer find `import.meta.env`, broken `` `nimport `` strings, `const navigate = useRouter()`, `replace />`, or `Link to=` patterns in `apps/web`.
- `pnpm --filter web lint` is currently blocked because local `node_modules` is missing.
- `supabaseAdmin` is a browser anon client created with `createBrowserClient`, not a service-role client. mcp3 must not rely on it for RLS bypass.
- Detailed server-side replacement plan is documented in `supabase_admin_server_side_plan.md`.
- Package manager normalization is still pending: root scripts and `pnpm-workspace.yaml` use pnpm, but only `package-lock.json` exists and `pnpm-lock.yaml` is missing.
- Recommended package-manager path is to keep pnpm, generate `pnpm-lock.yaml` with `pnpm install`, and remove `package-lock.json` only after confirming npm is not intended.

## Phase 1: Core Schema Foundation

Create mcp3 foundation tables:

- `admins`
- `agents`
- `user_profiles`
- `system_settings`
- `login_logs`
- `admin_action_logs`

Create required constraints and indexes:

- primary keys
- username/referral-code uniqueness
- user profile status/email/agent indexes
- FK indexes

Create helper functions:

- `is_admin`
- `is_super_admin`
- `check_admin_account`
- `get_session_timeout`
- `check_session_valid`
- `heartbeat_session`
- `update_admin_last_active`

## Phase 2: Chat and Matching

Create tables:

- `chat_profiles`
- `chat_rooms`
- `messages`
- `chat_room_history`

Create helper functions/RPC:

- `agent_owns_chat_profile`
- `agent_owns_chat_room`
- `create_or_get_chat_room`
- `chat_send_message`
- `chat_mark_read`
- `get_chat_room_user_profiles`
- `get_user_total_room_counts`

Create triggers:

- profile active/online enforcement
- image object id derivation
- room/message counter updates
- chat room history insert

## Phase 3: Gifts

Create tables:

- `gifts`
- `gift_inventory`
- `gift_transactions`

Create RPC/triggers:

- `gift_buy`
- `gift_sell`
- `admin_gift_grant`
- `admin_gift_revoke`
- `admin_reclaim_gift_inventory`
- `chat_send_gift_user`
- `chat_send_gift_profile`
- gift stat update triggers

Seed only required default gifts after user approval.

## Phase 4: Points and Payments

Create tables:

- `charging_cards`
- `deposit_requests`
- `withdrawal_requests`
- `point_transactions`

Create functions:

- `add_points`
- `request_withdrawal_v2`
- charging card ordering/default-created-by helpers

Ensure:

- point changes are atomic
- withdrawals are pre-deducted and refundable on rejection
- direct client point mutation is impossible

## Phase 5: Game Modules

Create tables/views:

- `game_settings`
- `game_rounds`
- `game_rounds_secure`
- `game_bets`
- `game_chats`
- `ladder_game_chats`
- `powerball_game_chats`

Create functions:

- `place_bet`
- `game_tick`
- `game_tick_client`
- `admin_game_tick`
- `admin_force_process_round`
- `get_server_time`
- result generation/resolution helpers
- game chat list/get/send functions
- minigame admin chat list functions

Ensure:

- reserved/internal results are hidden from users
- betting cutoff is enforced server-side
- settlement is idempotent
- duplicate active betting round constraints exist

## Phase 6: RLS and Grants

Enable RLS and add policies for:

- user ownership
- admin management
- agent assigned/referred visibility
- public read only where product requires it
- no direct client writes to sensitive tables

Review:

- RLS recursion
- overbroad public policies
- SECURITY DEFINER grants
- function search_path hardening

## Phase 7: Storage

Create buckets:

- `profile-images`
- `chat-profile-images`
- `chat-images`

Default recommendation:

- evaluate whether `chat-images` should remain public
- apply MIME and size restrictions
- add storage object policies

## Phase 8: Realtime

Enable publications only after RLS tests:

- `agents`
- `chat_rooms`
- `deposit_requests`
- `game_bets`
- `game_chats`
- `game_rounds`
- `ladder_game_chats`
- `messages`
- `notices`
- `powerball_game_chats`
- `user_profiles`
- `withdrawal_requests`

Add replica identity only where update payloads require it.

## Phase 9: Edge Functions

Deploy to mcp3:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

Deployment rule:

- `verify_jwt: true` by default.
- Set `verify_jwt: false` only for explicitly public/custom-auth functions after review.

Known required update:

- `admin-create-backoffice-account` currently generates random-suffix referral codes in local dating function. If product requirement is username-only referral code, update before deploying.

## Phase 10: Validation

Run local validation:

```powershell
pnpm --filter web lint
pnpm --filter web build
```

Run Supabase validation:

- advisors security/performance
- RLS matrix tests
- RPC direct-call tests
- Edge Function auth tests
- Realtime privacy tests
- Storage upload/read/delete tests

Functional tests:

- user signup/login/session timeout
- user profile and image upload
- point charge/withdrawal
- chat room creation/messages/read status
- gifts buy/sell/send/admin grant/revoke
- powerball/ladder game round/bet/settlement/history
- admin account/user/point/minigame management
- agent members/chats/gifts dashboard

## Rollback Plan

For each mcp3 migration batch:

1. Record created objects.
2. Provide reverse-order rollback notes.
3. Disable realtime before dropping tables.
4. Drop policies before dropping tables/functions.
5. Disable Edge Functions before removing dependent RPCs.
6. Never drop production data without backup and user approval.

## Current Status

This execution plan is ready for review. Actual mcp3 schema migration has not started.
