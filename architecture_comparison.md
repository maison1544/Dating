# Architecture Comparison: Crypto Supabase vs Dating Supabase

## Purpose

This document compares the existing crypto production Supabase architecture, the current DatingDesignPrototype codebase, the dating reference MCP, and the empty mcp3 target project. The goal is to identify which crypto patterns are useful references and which must not be copied into the dating domain.

## Environments

| Environment | Purpose | Write Permission | Observed State |
|---|---:|---:|---|
| mcp1 crypto production | Reference baseline | No | Active production schema, RLS, RPC, Edge Functions, indexes, realtime publication |
| mcp2 dating reference | Comparison/reference | No | Active dating schema, RLS, RPC, triggers, indexes, Edge Functions, storage buckets, realtime publication |
| mcp3 dating target | Future implementation target | Yes, later only | Empty target: no public tables, no migrations, no Edge Functions |
| Local repo | Next.js DatingDesignPrototype source | Yes for docs/code | Cloned at `0433d53` App Router merge commit |

## Repository Architecture

### Before App Router Migration

Some docs still describe the old Vite monorepo:

- `apps/user`
- `apps/admin`
- `apps/agent`
- shared package-driven React SPA routing
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Current App Router Architecture

The actual current code after commit `0433d53` is:

- `apps/web` is the Next.js 16 App Router application.
- Route groups and directories:
  - `apps/web/app/(user)`
  - `apps/web/app/admin`
  - `apps/web/app/agent`
  - `apps/web/app/api`
- Supabase SSR integration:
  - browser client: `apps/web/lib/supabase/client.ts`
  - server client: `apps/web/lib/supabase/server.ts`
  - middleware/proxy session update: `apps/web/lib/supabase/proxy.ts`
  - app instance cookie naming: `apps/web/lib/supabase/config.ts`
- Auth middleware:
  - `apps/web/middleware.ts`
  - skips `/api/*`
  - redirects user/admin/agent routes based on auth state
- Current environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_INSTANCE`

## Domain Model Comparison

### Crypto Domain Model

mcp1 contains crypto-specific tables:

- futures trading:
  - `futures_positions`
  - `futures_orders`
  - `mark_prices`
  - `liquidation_logs`
- staking:
  - `staking_products`
  - `staking_positions`
- wallet flows:
  - `deposits`
  - `withdrawals`
  - `wallet_transactions`
- partner/commission:
  - `agents`
  - `agent_commissions`
- support/content/auth hardening:
  - `support_tickets`
  - `support_messages`
  - `notices`
  - `popups`
  - `site_settings`
  - `login_logs`
  - rate-limit tables

### Dating Domain Model

The current dating type contract requires:

- identity/roles:
  - `admins`
  - `agents`
  - `user_profiles`
  - `login_logs`
  - `admin_action_logs`
- payments/points:
  - `charging_cards`
  - `deposit_requests`
  - `withdrawal_requests`
  - `point_transactions`
- chat/matching:
  - `chat_profiles`
  - `chat_rooms`
  - `messages`
- gifts:
  - `gifts`
  - `gift_inventory`
  - `gift_transactions`
- games:
  - `game_settings`
  - `game_rounds`
  - `game_bets`
  - `game_chats`
- content/settings:
  - `notices`
  - `system_settings`

### mcp2 Dating Reference Additions

mcp2 confirms the same dating-domain foundation and additionally includes:

- split minigame chat tables:
  - `ladder_game_chats`
  - `powerball_game_chats`
- chat room audit:
  - `chat_room_history`
- seeded `gifts` rows
- seeded `system_settings`
- two existing `game_rounds` rows

## What Can Be Reused from Crypto

Use as patterns only:

- RLS-first deployment sequencing.
- SECURITY DEFINER RPC hardening:
  - restricted grants
  - explicit `search_path`
  - server-side validation
- Backoffice role separation:
  - admins
  - agents
  - super admin/admin privilege boundaries
- Login/rate-limit table patterns.
- Edge Function operational patterns:
  - service-role only server-side
  - CORS handling
  - JWT verification by default
- FK indexes and RLS advisor-driven optimization.
- Realtime publication minimization.

## What Must Not Be Copied from Crypto

Do not migrate crypto-specific logic:

- futures trading tables and settlement logic
- liquidation engine
- staking product/settlement logic
- mark price workers
- futures balance separation
- crypto partner commission calculation if it assumes trading PnL
- wallet terminology that conflicts with dating points
- public market data assumptions

## Supabase Schema Comparison

| Area | Crypto mcp1 | Dating local contract | Dating mcp3 target |
|---|---|---|---|
| Core users | `user_profiles`, `admins`, `agents` | same concept but different columns and statuses | absent |
| Wallet/points | crypto wallet/futures/staking balances | single points ledger with deposits/withdrawals/gifts/games | absent |
| Trading | extensive | none | absent |
| Games | none | game rounds/bets/chats/settings | absent |
| Chat/matching | support messages only | chat profiles/rooms/messages/realtime matching | absent |
| Gifts | none | gifts/inventory/transactions | absent |
| Settings | `site_settings` | `system_settings` | absent |
| Storage | no buckets observed | profile/chat image buckets expected | absent |

### mcp2 Reference Schema

mcp2 contains active RLS-enabled public tables for:

- identity: `user_profiles`, `admins`, `agents`
- chat/matching: `chat_profiles`, `chat_rooms`, `messages`, `chat_room_history`
- minigame chat: `game_chats`, `ladder_game_chats`, `powerball_game_chats`
- games: `game_settings`, `game_rounds`, `game_bets`
- gifts: `gifts`, `gift_transactions`, `gift_inventory`
- points/payments: `charging_cards`, `deposit_requests`, `withdrawal_requests`, `point_transactions`
- content/audit/settings: `notices`, `admin_action_logs`, `login_logs`, `system_settings`

## RLS Policy Comparison

### Crypto mcp1

mcp1 has RLS enabled on business tables with policies based on:

- `auth.uid()` ownership
- `is_admin(auth.uid())`
- agent visibility through assigned users
- no-client-access policies for rate-limit/idempotency tables

### Dating Required Direction

Dating should not blindly copy crypto policies. It needs policies for:

- user-only profile visibility and controlled updates
- admin/agent segmentation
- chat room/message visibility by participant/assigned agent/admin
- game bet visibility by user and admin
- game result visibility that hides reserved/internal results before settlement
- gift inventory visibility by owner type and owner id
- point transaction visibility by owner/admin

### mcp2 Reference RLS Pattern

mcp2 includes many dating-specific RLS policies:

- user ownership policies for profiles, chat rooms, messages, bets, deposits, withdrawals, and point transactions
- admin management policies across operational tables
- agent visibility for assigned/referred profiles, chats, financials, and game bets
- helper-function policies such as `is_admin()`, `is_super_admin()`, `agent_owns_chat_profile()`, and `agent_owns_chat_room()`
- public read policies for active gifts, active chat profiles, published notices, and system settings

These should be treated as the primary dating reference, but must still be reviewed for recursion, overbroad public reads, and App Router API-route compatibility before migration to mcp3.

## RPC Comparison

### Crypto mcp1

Observed SECURITY DEFINER functions include:

- balance adjustment
- futures balance adjustment
- deposit/withdraw processing
- staking lifecycle
- limit order fill
- dashboard stats
- login/signup rate limit

### Dating Required RPC

Dating requires functions for:

- points:
  - `add_points`
  - request/approve/reject payment flows
- games:
  - `place_bet`
  - `admin_game_tick`
  - `game_tick_client`
  - `admin_force_process_round`
  - `get_server_time`
- game chats:
  - powerball/ladder/game chat list/send/get functions
- gifts:
  - `gift_buy`
  - `gift_sell`
  - admin grant/revoke/reclaim
- chat:
  - `create_or_get_chat_room`
  - `chat_send_message`
  - `chat_send_gift_user`
  - `chat_send_gift_profile`
  - `chat_mark_read`
- auth/admin:
  - phone duplicate check
  - session timeout
  - admin last active

### mcp2 Reference RPC

mcp2 contains extensive SECURITY DEFINER RPCs for:

- points and withdrawals: `add_points`, `request_withdrawal_v2`
- games: `place_bet`, `game_tick`, `game_tick_client`, `admin_game_tick`, `admin_force_process_round`, result generation/resolution helpers, `get_server_time`
- game chat: generic and split powerball/ladder chat list/get/send/admin-list functions
- gifts: `gift_buy`, `gift_sell`, admin grant/revoke/reclaim, gift transaction stats triggers
- chat: room creation, message send/read, gift send, counter updates, chat room/user helper functions
- auth/session/admin: `check_phone_duplicate`, `check_session_valid`, `get_session_timeout`, `update_admin_last_active`, `is_admin`, `is_super_admin`, `check_admin_account`

## Edge Function Comparison

### Crypto mcp1 Deployed Edge Functions

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `validate-referral-code`
- `user-signup`
- `user-record-login`
- `backoffice-record-login`

### Dating Local Edge Functions

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

### Dating mcp3

No Edge Functions currently deployed.

### mcp2 Reference Edge Functions

mcp2 has these active Edge Functions:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

All currently report `verify_jwt: false`, which must be reviewed before copying behavior to mcp3. Prefer enabling JWT verification unless the function implements its own authentication checks and needs public access.

## Trigger Comparison

### Crypto mcp1

No public table triggers were observed through `information_schema.triggers`.

### Dating Required Direction

Dating may require triggers for:

- `updated_at` maintenance
- point balance audit enforcement
- game round state transitions only if not handled exclusively by RPC
- stats denormalization for gifts/chat profiles/rooms

Trigger use should be minimized until hidden dependencies are documented.

### mcp2 Reference Triggers

mcp2 has triggers for:

- `charging_cards` created-by defaulting
- `chat_profiles` active/online enforcement
- `chat_profiles` image object id derivation
- `chat_rooms` profile counter updates
- `chat_room_history` audit insertion
- `gift_transactions` aggregate/stat updates
- `messages` profile counter updates
- `user_profiles` agent assignment timestamp
- `user_profiles` duplicate phone prevention

These trigger dependencies must be migrated together with their functions and tested for recursion/performance.

## Realtime Architecture Comparison

### Crypto mcp1

Observed realtime publication includes:

- `public.agent_commissions`
- `public.withdrawals`
- internal realtime message partitions

### Dating Code Requirements

Dating code subscribes to many realtime streams:

- chat room changes
- message inserts
- user profile changes
- gift inventory changes
- game rounds
- game history
- game chats
- user bets

### mcp2 Reference Publication

mcp2 publishes:

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

### Target Direction

mcp3 must enable publications intentionally. Avoid publishing broad sensitive tables without RLS-safe payload assumptions.

## Storage Comparison

### Crypto mcp1

No buckets found in queried storage bucket list.

### Dating Expected Buckets

README expects:

- `profile-images`
- `chat-profile-images`
- `chat-images`

mcp3 currently has no buckets.

### mcp2 Reference Buckets

mcp2 contains:

- `profile-images`, public
- `chat-profile-images`, public
- `chat-images`, public, 10 MiB file size limit, allowed MIME types `image/jpeg`, `image/png`, `image/gif`, `image/webp`

## Auth Structure Comparison

### Crypto

Backoffice/admin and agent identities are Supabase Auth users coupled to `admins`/`agents` rows.

### Dating

Dating currently also couples:

- `auth.users.id` to `user_profiles.id`
- `auth.users.id` to `admins.id`
- `auth.users.id` to `agents.id`

AuthContext attempts to create missing user profiles client-side. This needs careful migration because RLS may block profile creation if policies are too strict.

## Next.js Compatibility Notes

- Sensitive write flows should prefer App Router API routes or Edge Functions using service-role server-side.
- Browser clients must not receive service-role keys.
- `supabaseAdmin` in `apps/web/lib/supabase/client.ts` is currently only a second browser client, not a real service-role admin client.
- Middleware skips `/api/*`; API routes must validate auth independently.
- Cookie isolation depends on `NEXT_PUBLIC_APP_INSTANCE` and custom cookie/storage names.

## mcp2 Status

mcp2 is now accessible after correcting its project ref to `beyzubmbwygxiixuieiy`. It should be used as the primary dating-specific Supabase reference, with crypto mcp1 limited to security/operational pattern comparison only.
