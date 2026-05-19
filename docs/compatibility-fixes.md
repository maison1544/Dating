# Compatibility Fixes

## Runtime/UI Compatibility

| Area | Problem cause | Fix | Impact | Test result |
| --- | --- | --- | --- | --- |
| Admin/Agent layout | Next App Router layouts and migrated page components both rendered `AdminLayout`. | Changed `apps/web/app/admin/layout.tsx` and `apps/web/app/agent/layout.tsx` to pass-through fragments. | Removes duplicate sidebar/header and restores single shell hierarchy. | Pending lint/build/browser smoke. |
| npm local workflow | Root scripts were pnpm-specific and there was no npm workspace declaration for the active app. | Added npm workspace for `apps/web`; changed root scripts to `npm run ... --workspace=web`. | Supports requested `npm install` and `npm run dev` flow. | Pending npm verification. |
| Next/Supabase env | Previous Vite env names existed, current Next app requires `NEXT_PUBLIC_*`. | Updated `.env.example` to document both Next and legacy Vite variables. | Reduces local setup mismatch and deployment env confusion. | Pending local setup verification. |

## Supabase Compatibility

| Area | Problem cause | Fix | Impact | Test result |
| --- | --- | --- | --- | --- |
| Local Supabase config | `supabase/config.toml` was missing. | Added local Supabase CLI config with API, DB, auth, storage, realtime, and seed settings. | Enables `supabase start` / `supabase db reset` target configuration. | Pending CLI verification. |
| Seed data | `seed.sql` was missing and then needed alignment with restored `game_settings`/`gifts` columns. | Added idempotent seed inserts for `system_settings`, `game_settings`, and `gifts`, using restored schema columns. | Mini-game settings and gift UI have baseline data after reset. | Static schema compatibility verified; full DB reset pending CLI/Docker verification. |
| Storage buckets | Bucket creation was manual in previous README and absent from current migrations. | Added storage bucket/policy migration for `profile-images`, `chat-profile-images`, and `chat-images`. | Fixes profile image upload, chat profile image upload, and chat image upload after reset. | Pending upload smoke. |
| Mini-game schema/RPCs | Current Supabase lacked previous mini-game tables, policies, realtime entries, and RPCs. | Added/applied `20260518060000_restore_minigames_foundation.sql` plus hardening migrations. | Restores powerball/ladder rounds, betting, chat, settlement, admin tick, and realtime updates. | Remote MCP validation passed for tables, RLS, RPC signatures, realtime entries, and initial active rounds. |
| Mini-game round typing | Frontend utility expects `YYYYMMDD_N`, but generated types still had numeric `round_number`. | Updated `apps/web/lib/types/database.types.ts` to type `game_rounds.round_number` as `string | null`. | Preserves `getDisplayRoundNumber` parsing and prevents type drift. | Static type definition verified. |
| Edge Functions | Current Supabase had no deployed Edge Functions. | Deployed all eight legacy functions to current project with `verify_jwt=false`. | Restores login audit, referral validation, withdrawal, and backoffice account/admin actions. | `mcp7_list_edge_functions` reports all eight functions active. |

## Compatibility Rules

- No fake/mock implementation is introduced.
- No feature is intentionally bypassed.
- Bucket/policy/seed changes are idempotent.
- Existing Next.js compatibility fixes are preserved unless direct legacy parity requires a targeted change.
