# Dependency Map: App Router Code vs mcp2 Dating Supabase

## Purpose

This document maps the current Next.js App Router codebase to the mcp2 dating reference Supabase project. It is the baseline for building a clean, minimal, safe mcp3 migration rather than replaying the entire historical mcp2 migration chain.

## Source Baselines

- Local repo: `DatingDesignPrototype`, HEAD `0433d53`.
- App: `apps/web`, Next.js 16 App Router.
- mcp2 reference: `beyzubmbwygxiixuieiy` / `https://beyzubmbwygxiixuieiy.supabase.co`.
- mcp3 target: empty business schema; future writable target only after explicit approval.

## Frontend Supabase Table Dependencies

Current code directly references these tables/views:

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
- `game_rounds_secure`
- `game_settings`
- `gift_inventory`
- `gift_transactions`
- `gifts`
- `messages`
- `notices`
- `point_transactions`
- `user_profiles`
- `withdrawal_requests`

mcp2 also contains tables used as backend/reference dependencies:

- `chat_room_history`
- `ladder_game_chats`
- `powerball_game_chats`
- `login_logs`
- `system_settings`

## Frontend RPC Dependencies

Current code directly calls these RPC functions:

- `add_points`
- `admin_game_tick`
- `admin_gift_grant`
- `admin_gift_revoke`
- `chat_mark_read`
- `chat_send_gift_user`
- `chat_send_message`
- `check_session_valid`
- `game_chat_list`
- `game_chat_send`
- `game_tick_client`
- `get_server_time`
- `get_session_timeout`
- `gift_buy`
- `gift_sell`
- `heartbeat_session`
- `increment_notice_view`
- `ladder_game_chat_list_admin`
- `place_bet`
- `powerball_game_chat_list_admin`

mcp2 also provides backend-required helper RPCs/triggers used by policies or table events:

- `is_admin`
- `is_super_admin`
- `check_admin_account`
- `agent_owns_chat_profile`
- `agent_owns_chat_room`
- `check_phone_duplicate`
- `request_withdrawal_v2`
- `create_or_get_chat_room`
- `chat_send_gift_profile`
- `game_tick`
- `admin_force_process_round`
- game result generation/resolution functions
- gift/chat/stat trigger functions
- `update_admin_last_active`
- `update_agent_assigned_at`
- `user_profiles_prevent_duplicate_phone`

## Edge Function Dependencies

Current code invokes or fetches these Edge Functions:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

mcp2 has the same 8 functions deployed. They currently report `verify_jwt: false`; however, most local function bodies perform explicit bearer token verification internally. This must still be reviewed function-by-function before mcp3 deployment.

## Storage Dependencies

Current code references these buckets:

- `profile-images`
- `chat-images`

mcp2 also has:

- `chat-profile-images`

mcp2 bucket observations:

- `profile-images`: public
- `chat-profile-images`: public
- `chat-images`: public, 10 MiB limit, image MIME types only

## Realtime Dependencies

Current code creates channels for:

- admin accounts, agents, users, chat profiles, chat rooms, game rounds, game bets, gifts, charging cards
- user chat notifications
- agent chat notifications
- force logout broadcasts
- current round/game history/game chat/user bets
- point/gift/chat history in detail modals

mcp2 publication includes:

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

Migration implication:

- Do not publish every table by default.
- Publish only tables required by current subscriptions.
- Verify row-level visibility for messages, bets, payment requests, and user profiles.

## App Router and Environment Dependencies

Current Supabase client code expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_INSTANCE`

Known compatibility issue:

- `apps/web/hooks/useSupabase.ts` still contains `import.meta.env.VITE_SUPABASE_URL` in the `request-withdrawal` Edge Function fetch path. This is Vite syntax and must be replaced before reliable Next.js deployment.

Known configuration issue:

- `apps/web/next.config.ts` hardcodes image remote hostname `beyzubmbwygxiixuieiy.supabase.co`. This works for mcp2 but will break mcp3 images unless made environment-driven or updated during migration.

## High-Risk Code Coupling

### Browser `supabaseAdmin`

`apps/web/lib/supabase/client.ts` exports:

- `supabase = createClient()`
- `supabaseAdmin = createClient()`

Both are browser anon clients. `supabaseAdmin` is not a service-role client and does not bypass RLS.

Code comments and usage still imply admin/bypass behavior in multiple hooks. This is a major compatibility and security audit item.

### API Routes

Only one App Router API route currently exists:

- `apps/web/app/api/auth/login/route.ts`

It signs in with email/password and returns user/session. Middleware skips `/api/*`, so all future API routes must validate auth internally.

### Package Manager Drift

Current root scripts use `pnpm`, and `pnpm-workspace.yaml` exists. But the repo still has `package-lock.json` from npm/Vite-era workspace state and no `pnpm-lock.yaml` was found.

Before deployment, package manager strategy must be normalized.

## Clean mcp3 Migration Dependency Order

1. Extensions and helper infrastructure.
2. Core identity tables:
   - `admins`
   - `agents`
   - `user_profiles`
   - `system_settings`
   - `login_logs`
   - `admin_action_logs`
3. Role helper RPCs:
   - `is_admin`
   - `is_super_admin`
   - `check_admin_account`
4. User/session helper RPCs:
   - `get_session_timeout`
   - `check_session_valid`
   - `heartbeat_session`
   - `update_admin_last_active`
5. Chat/matching schema and helper functions.
6. Gift schema, inventory, transactions, triggers, and RPCs.
7. Points/payment schema and RPCs.
8. Game schema, secure view, result functions, betting/settlement RPCs.
9. RLS policies and grants.
10. Realtime publications.
11. Storage buckets and object policies.
12. Edge Function deployment.
13. App Router compatibility fixes.
14. Build/lint and end-to-end flow testing.

## Objects That Should Not Be Copied Blindly

- Entire mcp2 historical migration chain.
- Duplicate overloaded functions without checking active code call signatures.
- Edge Function `verify_jwt: false` settings without explicit justification.
- Public storage bucket settings without product/privacy review.
- Any crypto trading/staking/liquidation schema from mcp1.
