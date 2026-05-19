# Missing Features Checklist

## GitHub structural diff

- [x] Identify previous functional baseline commit (`9998f6b2f7789a680fc13fc002926cae0c1e5356`).
- [x] Identify current migrated baseline commit (`6eca58f`).
- [ ] Complete route/page/component parity matrix.
- [ ] Complete CSS/font/theme parity matrix.
- [ ] Complete Zustand/Context/API response shape parity matrix.

## Supabase schema/migration/RLS/storage

- [x] Confirm previous Supabase project contains storage buckets `profile-images`, `chat-profile-images`, `chat-images`.
- [x] Confirm previous storage object policies include public read and authenticated write semantics.
- [x] Add current local migration for required buckets and storage policies.
- [x] Add local Supabase config and seed file.
- [ ] Verify current local reset applies all migrations without error.
- [ ] Verify storage upload succeeds for profile image edit.
- [ ] Verify chat profile image upload succeeds.
- [ ] Verify chat message image upload succeeds.
- [x] Compare all previous mini-game migrations/RPCs against current consolidated migrations.
- [x] Verify RLS policies for mini-game tables.

## Edge Functions

- [x] Confirm previous Edge Function set: `admin-create-backoffice-account`, `admin-delete-backoffice-account`, `admin-force-logout`, `admin-update-user-password`, `backoffice-record-login`, `request-withdrawal`, `user-record-login`, `validate-referral-code`.
- [x] Confirm current local functions directory contains the same set.
- [x] Deploy all previous Edge Functions to current Supabase project.
- [ ] Verify deployed/current CORS behavior for login record functions.
- [ ] Verify function response shapes against current frontend callers with real authenticated sessions.

## App runtime and UX/UI

- [x] Fix duplicate admin/agent sidebar by removing route-level duplicate `AdminLayout` wrapping.
- [ ] Verify admin layout visually matches previous project after smoke.
- [ ] Verify fonts match previous `packages/shared/src/styles/*` behavior.
- [ ] Verify theme tokens and dark/light behavior.
- [ ] Verify responsive mobile admin/user/agent layouts.
- [ ] Verify all routes render without hydration errors.
- [ ] Verify profile image edit flow.
- [ ] Verify My Page profile image flow.
- [ ] Verify mini-game sales, betting, chat, settlement, result reservation, and admin adjustment flows in browser.
- [ ] Verify console has no runtime errors in primary user/admin/agent flows.

## Local test workflow

- [ ] `npm install`
- [ ] `supabase start`
- [ ] `supabase db reset`
- [ ] `npm run dev`
- [ ] `npm run lint`
- [ ] `npm run build`
