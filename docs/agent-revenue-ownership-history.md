# Agent Revenue Ownership History

## 1. Problem

Agent revenue and settlement data was being aggregated through the current `user_profiles.agent_id` relationship. When a user's referral code or assigned agent changed, historical transactions could move to the new agent or disappear from the old agent's view.

This is unsafe for settlement because ownership must be fixed at the time of each financial event, not recalculated from the user's current profile.

## 2. Root Cause

The previous implementation had three weak points:

- **Dynamic ownership join:** `get_agent_member_transactions` joined `point_transactions` to `user_profiles` and authorized agent access with `up.agent_id = auth.uid()`.
- **Frontend assignment-window filtering:** `useAgentDashboardStats` reconstructed historical membership windows from `admin_action_logs` in the browser/client hook.
- **No transaction-time ownership columns:** `point_transactions`, `deposit_requests`, `withdrawal_requests`, and `game_bets` did not store the agent owner at transaction time.

Because of this, a later `user_profiles.agent_id` change could affect past revenue totals.

## 3. Implemented Server-Side Model

The fix introduces a server-side immutable ownership model:

- **Ownership history table:** `public.user_agent_ownership_history`
  - `user_id`
  - `agent_id`
  - `agent_code`
  - `referral_owner_id`
  - `valid_from`
  - `valid_to`
  - `changed_by`
  - `source`
- **Transaction snapshot columns:** added to:
  - `point_transactions`
  - `deposit_requests`
  - `withdrawal_requests`
  - `game_bets`
- **Snapshot columns:**
  - `agent_id_snapshot`
  - `agent_code_snapshot`
  - `referral_owner_id_snapshot`
- **Server resolver:** `private.resolve_user_agent_ownership(p_user_id, p_at)` resolves the owner using immutable history ranges.
- **Server aggregation RPC:** `public.get_agent_revenue_transactions(...)` returns agent revenue transactions using snapshot columns first, then ownership history fallback for older rows.

## 4. Migration Files

Applied and added locally:

- `supabase/migrations/20260520051000_agent_revenue_ownership_history.sql`
- `supabase/migrations/20260520052000_harden_agent_revenue_ownership_history.sql`

The first migration creates the ownership history model, transaction snapshot columns, triggers, and revenue RPCs.

The second migration hardens performance and semantics by:

- Adding FK-covering indexes for new snapshot/history foreign keys.
- Updating RLS policies to avoid per-row auth initplan warnings.
- Ensuring deposit snapshot ownership is resolved at approval time when a pending deposit becomes approved.

## 5. Backfill Strategy

Existing transaction rows were not rewritten.

Backfill was limited to ownership history reconstruction:

- Existing `admin_action_logs` rows with `action = 'change_user_referral_code'` were replayed into `user_agent_ownership_history`.
- Current `user_profiles.agent_id` rows were inserted as open-ended ownership ranges when missing.
- Existing `point_transactions`, `deposit_requests`, `withdrawal_requests`, and `game_bets` snapshot columns remain nullable.

For older transactions, aggregation uses:

1. `*_snapshot` columns when present.
2. `user_agent_ownership_history` range lookup when snapshots are null.
3. Current profile fallback only inside `private.resolve_user_agent_ownership` when no history exists and the profile assignment was already effective at the queried timestamp.

## 6. Runtime Write Path

New rows are protected server-side:

- `user_profiles` agent changes maintain `user_agent_ownership_history` through `sync_user_agent_ownership_history`.
- `admin_action_logs` referral-code change inserts maintain history through `sync_agent_history_from_admin_log`.
- `deposit_requests` resolves snapshot on insert and re-resolves at approval transition.
- `withdrawal_requests` resolves snapshot on request creation.
- `game_bets` resolves snapshot on bet creation.
- `point_transactions` copies snapshot from related deposit/withdrawal/game rows when possible, otherwise resolves by timestamp.

This means frontend ordering is no longer the source of truth for ownership.

## 7. Query and UI Changes

Updated `apps/web/hooks/useSupabase.ts`:

- `useAgents` now computes total agent revenue through `get_agent_revenue_transactions` instead of reconstructing history in the hook.
- `useAgentMembers` uses `get_agent_revenue_transactions` for member totals, filtered to currently assigned members for that page.
- `useAgentDashboardStats` uses `user_agent_ownership_history` for historical member inclusion and `get_agent_revenue_transactions` for revenue records/totals.
- Removed reliance on frontend `isWithinAssignmentWindow` logic for settlement totals.

Existing session isolation, realtime/chat/notification systems, and public-read/authenticated-write boundaries were not changed.

## 8. Validation Results

Targeted DB validation was performed without full lint/build.

- **Snapshot columns exist:** verified on `point_transactions`, `deposit_requests`, `withdrawal_requests`, and `game_bets`.
- **Ownership history backfill:** verified `testuser` has two `TESTAGENT` ranges:
  - assigned from `2026-05-17T22:51:33.586Z` to `2026-05-19T19:56:35.358555Z`
  - reassigned from `2026-05-19T19:57:47.724Z` onward
- **Server-side effective aggregation:** internal range-join query returned:
  - `TESTAGENT` charge: `70,000`
  - `TESTAGENT` withdraw: `-10,000`
- **Existing row preservation:** existing transaction snapshot columns remain null; historical rows are attributed through ownership history rather than row mutation.
- **Triggers installed:** verified triggers for user profile ownership changes, admin action log changes, deposit snapshots, withdrawal snapshots, game bet snapshots, and point transaction snapshots.
- **RPCs installed:** verified private/public `get_agent_revenue_transactions`, private/public `get_agent_member_transactions`, and `private.resolve_user_agent_ownership` exist.
- **Security advisor:** only existing Supabase Auth leaked-password-protection warning remains.
- **Performance advisor:** new FK missing-index and RLS initplan warnings from the ownership migration were resolved; new indexes appear as unused immediately after creation, which is expected on a fresh index.
- **Local syntax check:** `pnpm --filter web exec eslint hooks/useSupabase.ts` passed.

## 9. Regression Risks and Notes

- **Existing pre-assignment transactions:** transactions before any recorded ownership range remain unattributed, which is safer than assigning them to the current agent retroactively.
- **Deposit timing:** deposit revenue is snapshotted at approval transition, matching the point credit transaction time.
- **Withdrawal timing:** withdrawal ownership is snapshotted at request time because points are deducted when the request is created.
- **Game bets:** new bets store snapshots at bet creation. Existing bets are resolved from ownership history without rewriting rows.
- **Gift/chat revenue:** `gift_transactions` already contains row-level `agent_id`/`agent_revenue` fields and was not rewritten in this migration. The agent dashboard chat revenue path remains based on assigned profiles, outside the user referral-code settlement bug.
- **Direct SQL validation of RPC:** direct `execute_sql` calls to `private.get_agent_revenue_transactions` without an app JWT correctly raise `Not authenticated`; this confirms the RPC authorization guard is active.
- **No full lint/build:** intentionally skipped to avoid known OOM risk. Only targeted single-file lint was run.
