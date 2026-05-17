# Dating Supabase Migration Plan

## Scope

This document defines the phased plan for safely migrating selected Supabase architecture patterns from the existing crypto production project into the new DatingDesignPrototype target Supabase project.

## Hard Safety Rules

- **mcp1 / crypto production**: read only, analysis only, no writes.
- **mcp2 / dating reference**: read only, comparison only, no writes.
- **mcp3 / current dating target**: the only environment where future migrations, Edge Functions, RPC, RLS, triggers, realtime, storage, auth integration, and security patches may be applied.
- No schema migration before dependency mapping is complete.
- Every migration must be rollback-aware and preferably split into reversible, small units.
- Crypto is a reference baseline, not a copy source.

## Current Repository Baseline

- Repository cloned from `https://github.com/ttaa1235/DatingDesignPrototype.git`.
- Current branch: `main`.
- Current HEAD: `0433d53`.
- Required commit analyzed: `0433d53 Merge: Next.js App Router architecture migration`.
- Migration branch commit included in merge: `49ab579 feat: migrate to Next.js App Router architecture`.

## Current App Architecture

- Next.js 16 App Router app lives in `apps/web`.
- Root scripts now delegate through `pnpm --filter web`.
- App routes include:
  - user route group: `apps/web/app/(user)`
  - admin routes: `apps/web/app/admin`
  - agent routes: `apps/web/app/agent`
  - API routes: `apps/web/app/api`
- Supabase integration files:
  - `apps/web/lib/supabase/client.ts`
  - `apps/web/lib/supabase/server.ts`
  - `apps/web/lib/supabase/proxy.ts`
  - `apps/web/lib/supabase/config.ts`
  - `apps/web/middleware.ts`
- Typed DB contract exists at `apps/web/lib/types/database.types.ts`.

## Dating Domain Tables Required by Code

The current frontend type contract references these public tables:

- `admin_action_logs`
- `admins`
- `agents`
- `charging_cards`
- `chat_profiles`
- `chat_rooms`
- `deposit_requests`
- `game_bets`
- `game_chats`
- `game_rounds`
- `game_settings`
- `gift_inventory`
- `gift_transactions`
- `gifts`
- `login_logs`
- `messages`
- `notices`
- `point_transactions`
- `user_profiles`
- `system_settings`
- `withdrawal_requests`

## Dating RPC Functions Required by Code

The current frontend type contract references these functions:

- `add_points`
- `admin_force_process_round`
- `admin_gift_grant`
- `admin_gift_revoke`
- `admin_game_tick`
- `admin_reclaim_gift_inventory`
- `game_tick_client`
- `game_chat_send`
- `game_chat_list`
- `game_chat_get`
- `ladder_game_chat_send`
- `ladder_game_chat_list`
- `ladder_game_chat_get`
- `ladder_game_chat_list_admin`
- `powerball_game_chat_send`
- `powerball_game_chat_list`
- `powerball_game_chat_get`
- `powerball_game_chat_list_admin`
- `gift_buy`
- `gift_sell`
- `get_server_time`
- `increment_notice_view`
- `chat_mark_read`
- `chat_send_gift_profile`
- `chat_send_gift_user`
- `chat_send_message`
- `check_phone_duplicate`
- `create_or_get_chat_room`
- `place_bet`
- `update_chat_profile_gift_stats`
- `update_chat_room_gift_stats`
- `get_session_timeout`
- `update_admin_last_active`

## Existing Local Edge Functions

Local `supabase/functions` contains:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

These are not yet deployed to the mcp3 target project.

## Current Supabase Environment Observations

### mcp1 crypto production, read only

Observed:

- Active schema with 24+ public business tables.
- RLS enabled across crypto tables.
- Many SECURITY DEFINER RPC functions exist.
- Edge Functions deployed for backoffice account management, signup/login, referral validation, and login records.
- Storage buckets are currently empty in queried project.
- Realtime publication includes `agent_commissions` and `withdrawals`.

### mcp2 dating reference, read only

Observed:

- URL lookup succeeds for `https://beyzubmbwygxiixuieiy.supabase.co`.
- Public dating-domain schema is available and broadly matches the local type contract.
- Business tables include core identity, chat, gifts, games, points/payments, notices, logs, and system settings.
- Storage buckets exist:
  - `profile-images`
  - `chat-profile-images`
  - `chat-images`
- Edge Functions exist:
  - `admin-create-backoffice-account`
  - `admin-delete-backoffice-account`
  - `admin-force-logout`
  - `admin-update-user-password`
  - `backoffice-record-login`
  - `request-withdrawal`
  - `user-record-login`
  - `validate-referral-code`
- Realtime publication includes `agents`, `chat_rooms`, `deposit_requests`, `game_bets`, `game_chats`, `game_rounds`, `ladder_game_chats`, `messages`, `notices`, `powerball_game_chats`, `user_profiles`, and `withdrawal_requests`.
- Many SECURITY DEFINER RPCs, triggers, RLS policies, and FK/performance indexes exist and should be used as the main dating reference.

### mcp3 dating target, writable later only

Observed:

- Storage schema exists.
- No public business tables found yet.
- No migrations found.
- No Edge Functions found.
- No public RPC, policies, triggers, indexes, storage buckets, or realtime publications were found through metadata queries.

## Phase 1: Analysis and Design Only

Status: in progress.

Deliverables:

- `migration_plan.md`
- `architecture_comparison.md`
- `risk_analysis.md`
- Cascade workflow/skill
- Cascade memory

No DB writes are allowed in this phase.

## Phase 2: Dependency Mapping

Before writing any migration:

1. Extract complete table/RPC/Edge Function dependencies from local code.
2. Verify which local docs are stale after App Router migration.
3. Correct `README.md` and `REFERENCE.md` later if requested because they still describe Vite-era structure.
4. Use mcp2 metadata as the primary dating reference while still validating every item against current App Router code.
5. Build a dependency graph:
   - auth.users dependencies
   - table foreign keys
   - trigger-to-function dependencies
   - RPC-to-table dependencies
   - Edge Function-to-RPC dependencies
   - realtime publication dependencies
   - storage bucket dependencies
   - frontend route/hook dependencies

## Phase 3: Schema Foundation on mcp3

Only after user approval:

1. Create core role/account tables first:
   - `admins`
   - `agents`
   - `user_profiles`
   - `system_settings`
   - `login_logs`
   - `admin_action_logs`
2. Add constraints and FK indexes.
3. Add minimal seed data only through explicit user-approved migration.
4. Add rollback notes for every DDL block.

## Phase 4: Points, Payments, Gifts, Chat

1. Add point ledger tables and RPC:
   - `point_transactions`
   - `deposit_requests`
   - `withdrawal_requests`
   - `charging_cards`
   - `add_points`
2. Add gift tables and RPC:
   - `gifts`
   - `gift_inventory`
   - `gift_transactions`
   - gift buy/sell/admin grant/revoke flows
3. Add chat tables and RPC:
   - `chat_profiles`
   - `chat_rooms`
   - `messages`
   - chat read/send/gift RPC

## Phase 5: Game Modules

1. Add game tables:
   - `game_settings`
   - `game_rounds`
   - `game_bets`
   - `game_chats`
2. Add game RPC:
   - tick functions
   - bet placement
   - chat functions
   - server-time function
3. Validate result processing and hidden result security.
4. Avoid crypto-style cron/settlement logic unless adapted to game timing requirements.

## Phase 6: RLS and Security Hardening

1. Enable RLS table-by-table.
2. Start deny-by-default for sensitive tables.
3. Avoid direct client writes for balance/game settlement operations.
4. SECURITY DEFINER functions must:
   - set `search_path`
   - validate `auth.uid()` or service-role context
   - avoid RLS recursion
   - expose only required EXECUTE grants
5. Validate anonymous/authenticated EXECUTE permissions.
6. Run Supabase advisors after migrations.

## Phase 7: Edge Functions

Deploy to mcp3 only after schema/RPC are in place:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

Prefer Next.js API routes for sensitive browser-triggered operations when App Router compatibility and server-side service-role usage are required.

## Phase 8: Realtime and Storage

1. Add realtime publications only for required tables and events.
2. Validate that chat/game subscriptions do not over-broadcast private rows.
3. Create only required storage buckets:
   - `profile-images`
   - `chat-profile-images`
   - `chat-images`
4. Define explicit storage RLS policies.
5. Avoid public buckets unless URLs must be public.

## Phase 9: Validation

Minimum checks before production use:

- `pnpm --filter web build`
- RLS unauthorized access tests
- RPC direct-call tests
- role separation tests for user/admin/agent
- game result processing tests
- chat realtime tests
- storage upload/read tests
- auth session cookie isolation tests by `NEXT_PUBLIC_APP_INSTANCE`

## Stop Conditions

Stop and request user confirmation if:

- local type contract conflicts with desired target schema.
- any migration requires destructive changes.
- any function needs service-role secrets or auth hook configuration.
- realtime publication scope could leak private chat/game data.
