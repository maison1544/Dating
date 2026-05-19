# Public Read / Authenticated Write Boundaries

## Summary

This document records the restored public read and authenticated write policy for DatingDesignPrototype after the migration auth-gating regression.

The intended policy is:

- **Anonymous users can read public content**: home, active chat profile cards, realtime matching profile list, notices, rankings, and couple mission minigame screens.
- **Only authenticated users can write or mutate user-owned state**: chat room creation, chat messages, game chat messages, betting, point deduction, payments, profile/user-specific data, and admin/agent management.

## Public browser routes

These user routes are public in `apps/web/middleware.ts`:

- `/`
- `/login`
- `/signup`
- `/notice`
- `/realtime-matching`
- `/minigame`
- `/ladder-game`
- `/powerball`
- `/ranking`

Admin and agent public routes remain limited to login pages:

- `/admin/login`
- `/agent/login`
- `/login` on scoped admin/agent subdomains

## Middleware protection scope

`apps/web/middleware.ts` now treats only the user public read pages above as anonymous-accessible.

Protected user-specific pages still redirect unauthenticated users to login, including:

- `/mypage`
- `/point`
- `/payment-history`
- `/profile-edit`
- `/chat/*`
- Any non-public user route

Admin and agent application pages remain protected by scoped session validation and cross-scope host/path checks.

## Public Supabase reads

Anonymous reads allowed by RLS/RPC:

- `chat_profiles` SELECT for active, non-deleted profiles.
- `game_rounds` / secure round read RPCs for minigame display data.
- `game_settings` SELECT for public game UI.
- `game_chats` SELECT and `game_chat_list` RPC for public chat display.
- `get_server_time` and `game_tick_client` RPCs for public minigame timing/round progression.

Client-side profile reads use the public user Supabase client, not a backoffice scoped client:

- `contexts/ProfileContext.tsx`
- `contexts/ChatProfileContext.tsx`

## Authenticated writes

Anonymous execution is revoked for these write RPCs:

- `create_or_get_chat_room(uuid)`
- `chat_send_message(...)`
- `game_chat_send(text, text)`
- `place_bet(uuid, uuid, text, numeric, numeric, text)`

The legacy 5-argument public `place_bet(uuid, uuid, text, integer, numeric)` overload was dropped so direct anon REST calls return `401` instead of PostgREST overload ambiguity.

RLS continues to enforce authenticated ownership checks for write tables:

- `chat_rooms` INSERT/UPDATE requires the authenticated user or authorized admin/agent path.
- `messages` INSERT requires the authenticated user room or authorized agent profile room.
- `game_bets` INSERT requires `auth.uid() = user_id`.
- `game_chats` INSERT requires `auth.uid() = user_id`.
- `point_transactions` are user-visible only for own rows and admin-managed for mutations.

## Client UI gates

Anonymous public pages still render read-only content, but mutation controls are hidden:

- Profile detail modal hides `채팅 시작하기` when there is no authenticated user.
- Ladder game hides bet amount input, bet option buttons, bet history button, and game chat button for anonymous users.
- Powerball hides bet amount input, bet option buttons, bet submit button, bet history button, and game chat button for anonymous users.
- Realtime matching allows the public realtime profile list but shows the private chat list only after login.

## Verification results

Validated against the current app Supabase project `https://diwrjedpfyndhggbgdls.supabase.co`:

- `GET /rest/v1/chat_profiles?...` with anon publishable key: `200`.
- `POST /rest/v1/rpc/create_or_get_chat_room` with anon publishable key: `401`.
- `POST /rest/v1/rpc/game_chat_send` with anon publishable key: `401`.
- `POST /rest/v1/rpc/place_bet` with anon publishable key: `401`.
- Browser `/` as anonymous: active profile card visible, no chat-start button.
- Browser `/realtime-matching` as anonymous: active profile card visible, no chat-start button.
- Browser `/minigame` as anonymous: page accessible, game entry buttons visible.
- Browser `/ladder-game` as anonymous: game display accessible, betting/chat mutation UI hidden.
- Browser `/powerball` as anonymous: game display accessible, betting/chat mutation UI hidden.
- Browser console warnings/errors during latest checks: no warnings/errors.
- `pnpm --filter web lint`: 0 errors, one pre-existing warning in `apps/web/app/error.tsx`.
- `pnpm --filter web exec next build --webpack`: successful.
