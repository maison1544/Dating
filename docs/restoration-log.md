# Restoration Log

## Baseline

- Previous functional baseline: GitHub `ttaa1235/DatingDesignPrototype` commit `9998f6b2f7789a680fc13fc002926cae0c1e5356` (`complete solution with checking securiti issues`).
- Current Next.js migration baseline before this restoration pass: commit `6eca58f` (`Prepare Supabase migration and deployment readiness`).
- Supabase MCP comparison:
  - `mcp6` is bound to legacy project `https://beyzubmbwygxiixuieiy.supabase.co` and exposes the historical migration list, Edge Functions, storage buckets, and policies.
  - `mcp7` is bound to current project `https://diwrjedpfyndhggbgdls.supabase.co`.
  - `mcp5` management endpoint for `diwrjedpfyndhggbgdls` returned a platform access-control error, so structural checks must use the bound project MCP tools and SQL where available.

## 2026-05-18 Restoration Pass 1

### Admin/Agent duplicate sidebar

- Problem cause: App Router route layouts (`apps/web/app/admin/layout.tsx`, `apps/web/app/agent/layout.tsx`) wrapped children in `AdminLayout`, while migrated page components still wrapped themselves in `AdminLayout` from the previous SPA architecture.
- Fix: Route layouts were changed to pass-through fragments so the existing page-level `AdminLayout` remains the single source of admin/agent shell UI.
- Impact scope: All `/admin/*` and `/agent/*` pages. Expected to remove duplicate sidebar/header and restore previous page layout proportions.
- Test result: Pending after lint/build/runtime smoke.

### Local npm workflow compatibility

- Problem cause: Root scripts used `pnpm --filter web`, but the requested local workflow is `npm install` then `npm run dev`. Root `package.json` also did not declare npm workspaces.
- Fix: Root `package.json` now declares `apps/web` as an npm workspace and maps `npm run dev`, `build`, `start`, and `lint` to the current Next.js web app.
- Impact scope: Local developer workflow. `npm run dev` should start the web app on port 3000 without additional package-manager knowledge.
- Test result: Pending after npm install / npm run lint / npm run build checks.

### Supabase local configuration

- Problem cause: The repo lacked `supabase/config.toml` and `supabase/seed.sql`, preventing `supabase start` and `supabase db reset` from being self-contained.
- Fix: Added `supabase/config.toml` and `supabase/seed.sql` with local ports, auth settings, seed system settings, default mini-game settings, and sample gifts.
- Impact scope: Local Supabase reset flow.
- Test result: Pending; requires Supabase CLI/Docker availability.

### Storage buckets and policies

- Problem cause: Previous project required public buckets `profile-images`, `chat-profile-images`, and `chat-images`. Current local migrations did not include bucket creation/policies, causing profile image and chat image upload bucket errors after local reset.
- Fix: Added migration `20260518050000_restore_storage_buckets_and_policies.sql` creating/updating all three buckets and storage object policies for public read plus authenticated upload/update/delete.
- Impact scope: Profile image edit, My Page image upload, admin chat profile image upload, chat image messages, public image rendering.
- Test result: Pending after local `supabase db reset` and browser upload smoke.

### Mini-game database foundation

- Problem cause: The current Supabase project was missing the previous mini-game database foundation: `game_rounds`, `game_bets`, `game_settings`, game chat tables, RLS policies, realtime publication entries, and mini-game RPCs.
- Fix: Added and applied migration `20260518060000_restore_minigames_foundation.sql`, restoring mini-game tables, indexes, RLS policies, realtime publication entries, `game_rounds_secure`, settings seed data, initial `powerball`/`ladder` rounds, and RPCs including `place_bet`, `game_tick`, `game_tick_client`, `admin_game_tick`, game chat RPCs, and result generators.
- Impact scope: User mini-game pages, mini-game chat, bet placement, automatic settlement, admin mini-game tick, round result visibility, and realtime round/bet/chat updates.
- Test result: Remote `mcp7` validation passed: all six mini-game tables exist with RLS enabled; `game_rounds.round_number` is `text`; `powerball` and `ladder` each have one active betting round; mini-game realtime publication entries exist; expected RPC signatures are present.

### Mini-game hardening and type compatibility

- Problem cause: `game_rounds_secure` triggered Supabase `security_definer_view`, default function privileges exposed internal mini-game helpers too broadly, and generated TypeScript types still treated `game_rounds.round_number` as `number`.
- Fix: Added and applied `20260518061000_harden_minigames_foundation.sql` and `20260518062000_harden_get_server_time.sql`. `game_rounds_secure` now uses `security_invoker`, internal helper RPC execution is revoked from client roles, `get_server_time` is `security invoker`, and `apps/web/lib/types/database.types.ts` now types `round_number` as `string | null`.
- Impact scope: Supabase advisor noise, API exposure, frontend round display, and type correctness for `YYYYMMDD_N` round numbers.
- Test result: Remote `security_definer_view` warning is resolved; `get_server_time` is no longer `SECURITY DEFINER`; remaining `SECURITY DEFINER` warnings are for authenticated mini-game RPCs that intentionally perform server-side checks or RLS-safe mutations.

### Edge Functions

- Problem cause: The current Supabase project had no deployed Edge Functions, while the previous project had eight active functions used by auth/login/admin/payment flows.
- Fix: Deployed all eight Edge Functions to current `mcp7` with `verify_jwt=false`, matching the legacy deployment setting: `admin-create-backoffice-account`, `admin-delete-backoffice-account`, `admin-force-logout`, `admin-update-user-password`, `backoffice-record-login`, `request-withdrawal`, `user-record-login`, and `validate-referral-code`.
- Impact scope: User login audit updates, admin/agent login audit updates, referral validation, withdrawal requests, backoffice account creation/deletion, password reset, and forced logout.
- Test result: Remote `mcp7_list_edge_functions` now reports all eight functions as `ACTIVE` with `verify_jwt=false`.

### Local reset seed compatibility

- Problem cause: `supabase/seed.sql` used older column names for `game_settings` and `gifts`, which would fail or seed incorrect data after a local reset.
- Fix: Updated `seed.sql` to match the restored schema: `game_settings` uses `min_bet`, `max_bet`, `round_duration_seconds`, and `betting_end_seconds`; `gifts` uses `emoji`, `buy_price`, `sell_price`, and `display_order`.
- Impact scope: `supabase db reset` local startup data and immediate mini-game/gift UI testing.
- Test result: Static schema compatibility confirmed against remote current table columns. Full local `supabase db reset` remains pending because it requires the local Supabase CLI/Docker workflow.

## Known Open Items

- Compare current font/theme CSS against previous `packages/shared/src/styles/*` files and port any missing rules.
- Browser-smoke mini-game sales, betting, chat, settlement, result reservation, and admin adjustment flows against the restored current project.
- Verify Edge Function response shape/CORS against current browser calls with real authenticated users.
- Verify route/page/component parity after App Router migration.
- Run hydration/runtime smoke on user/admin/agent pages after rebuilding.
