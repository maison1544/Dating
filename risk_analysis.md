# Risk Analysis: Dating Supabase Migration

## Summary

The target mcp3 project is currently empty from a business-schema perspective, while the local DatingDesignPrototype code expects a rich Supabase backend with auth-coupled profiles, point ledger, chat, gifts, game modules, RPC functions, realtime, storage, Edge Functions, and role-separated admin/agent access.

The migration should be treated as a staged backend construction project, not a direct crypto schema copy.

## Critical Risks

### 1. mcp2 Reference Drift Risk

**Observation**: mcp2 is accessible after correcting the project ref to `beyzubmbwygxiixuieiy`. It contains a mature dating schema with extensive migrations, RLS policies, SECURITY DEFINER RPCs, triggers, realtime publications, storage buckets, and Edge Functions.

**Risk**: The reference DB is useful but may include historical migrations, duplicate overloaded functions, legacy compatibility logic, and policies that may not perfectly match the current Next.js App Router code.

**Impact**: High.

**Mitigation**:

- Treat mcp2 as the primary dating-specific DB reference.
- Validate every table/RPC/policy/trigger against current local code before copying to mcp3.
- Prefer a clean consolidated mcp3 migration set over replaying the entire historical mcp2 migration chain.
- Pay special attention to duplicate/overloaded SECURITY DEFINER functions and old compatibility artifacts.

### 2. mcp3 Target Is Empty

**Observation**: mcp3 has no public business tables, migrations, Edge Functions, RLS policies, triggers, indexes, storage buckets, or realtime publications.

**Risk**: Any frontend route depending on Supabase will fail until schema/RPC/storage/realtime are built.

**Impact**: High.

**Mitigation**:

- Apply migrations in small dependency-ordered batches.
- Validate after each batch.
- Avoid deploying Edge Functions before dependent tables/RPC exist.

### 3. Crypto Schema Copy Risk

**Observation**: crypto contains futures, staking, wallet, liquidation, and trading-specific architecture.

**Risk**: Copying crypto structures would pollute dating domain and create incompatible logic.

**Impact**: High.

**Mitigation**:

- Reuse only security and operational patterns.
- Do not migrate crypto trading/staking/liquidation tables.
- Redesign point/game/chat flows for dating domain.

### 4. Auth.users Coupling

**Observation**: Dating code expects `auth.users.id` to match rows in `user_profiles`, `admins`, and `agents`.

**Risk**:

- Missing profile rows break login.
- Strict RLS can block client-side profile creation.
- Admin/agent/user sessions can collide if cookie isolation is misconfigured.

**Impact**: High.

**Mitigation**:

- Design explicit profile creation flow.
- Prefer server-side signup/profile creation for required fields.
- Validate `NEXT_PUBLIC_APP_INSTANCE` cookie separation.
- Ensure admin/agent auth flows check role tables server-side.

### 5. `supabaseAdmin` Naming Risk in Browser Client

**Observation**: `apps/web/lib/supabase/client.ts` exports `supabaseAdmin = createClient()`, which is not a service-role admin client.

**Risk**: Developers may assume it bypasses RLS, but it uses anon browser credentials.

**Impact**: High.

**Mitigation**:

- Document clearly.
- Rename later if permitted.
- Use App Router API routes or Edge Functions for service-role actions.

### 6. RLS Recursion Risk

**Observation**: Crypto fixed RLS recursion around admin checks. Dating will need similar role checks across admins, agents, chat, games, payments.

**Risk**: Policies querying tables that themselves have recursive policies can fail or degrade performance.

**Impact**: High.

**Mitigation**:

- Implement role-check helper functions carefully.
- Use SECURITY DEFINER role helpers with restricted grants.
- Use initPlan-friendly `(select auth.uid())` patterns where appropriate.
- Test each table policy with anon, user, admin, and agent.

### 7. SECURITY DEFINER Exposure Risk

**Observation**: Dating requires many RPC functions that mutate points, gifts, games, and chats.

**Risk**: Overbroad EXECUTE grants can allow unauthorized point/game manipulation.

**Impact**: High.

**Mitigation**:

- Revoke default public EXECUTE where needed.
- Grant only to required roles.
- Validate `auth.uid()` inside every mutating RPC.
- Set `search_path` in all SECURITY DEFINER functions.
- Run direct-call penetration checks.

### 8. Game Result Integrity Risk

**Observation**: Dating includes `game_rounds`, `game_bets`, game tick RPC, force result processing, and secure game round views referenced by code.

**Risk**:

- Early result leakage.
- Client-side manipulation of results.
- Race conditions around betting cutoff and settlement.
- Duplicate settlement.

**Impact**: Critical.

**Mitigation**:

- Use transaction-safe RPC for `place_bet` and settlement.
- Enforce betting windows server-side.
- Hide reserved/internal result columns from client views.
- Add idempotency or status constraints for settlement.
- Add indexes on game type/status/time.

### 9. Realtime Privacy Risk

**Observation**: Dating code uses realtime for chat, messages, game rounds, game chats, user bets, and profile updates. mcp2 publishes `agents`, `chat_rooms`, `deposit_requests`, `game_bets`, `game_chats`, `game_rounds`, `ladder_game_chats`, `messages`, `notices`, `powerball_game_chats`, `user_profiles`, and `withdrawal_requests`.

**Risk**: Publications may broadcast rows a user should not see, especially chat messages and game bets.

**Impact**: High.

**Mitigation**:

- Publish only tables required for realtime.
- Rely on RLS-safe realtime with tested policies.
- Prefer filtered subscriptions.
- Avoid publishing sensitive internal tables.
- Test user A cannot receive user B chat/bet payloads.

### 10. Storage Privacy Risk

**Observation**: mcp2 has public `profile-images`, public `chat-profile-images`, and public `chat-images`. The `chat-images` bucket has a 10 MiB file size limit and image MIME type restrictions. mcp3 has no buckets.

**Risk**:

- Public buckets could expose private chat images.
- Missing bucket policies could break uploads.
- Overbroad object policies could allow overwrite/deletion.

**Impact**: Medium to High.

**Mitigation**:

- Decide per-bucket public/private model.
- Add storage RLS policies by owner path convention.
- Restrict MIME types and size limits.
- Avoid public chat image buckets unless product requirement demands it.

### 11. App Router API Route Security Risk

**Observation**: Middleware skips `/api/*`.

**Risk**: API routes are not protected by middleware and must validate auth/session internally.

**Impact**: High.

**Mitigation**:

- Every App Router API route must call server Supabase auth validation.
- Service-role operations must never trust client-supplied user IDs.
- Add rate limiting for auth/payment/game endpoints.

### 12. Documentation Drift Risk

**Observation**: `README.md` and `REFERENCE.md` still describe Vite-era architecture, while current code uses Next.js App Router.

**Risk**: Future migration steps may follow stale instructions.

**Impact**: Medium.

**Mitigation**:

- Update docs after migration plan approval.
- Treat current code as source of truth.

### 13. Edge Function JWT Policy Drift Risk

**Observation**: mcp2 reference Edge Functions are active, but currently report `verify_jwt: false`.

**Risk**: Copying this setting to mcp3 without reviewing function-level authentication could expose admin/account/payment operations.

**Impact**: High.

**Mitigation**:

- Enable JWT verification by default for mcp3 deployments.
- Disable JWT verification only for functions with explicit custom authentication and user approval.
- Prefer App Router API routes for browser-triggered sensitive flows that need server-side service-role access.

## Domain-Specific Migration Risks

### Points and Payments

- Risk of negative balances.
- Risk of duplicate approve/reject processing.
- Risk of direct client point mutation.
- Need ledger integrity: `balance_before`, `balance_after`, `related_type`, `related_id`.

### Gifts

- Risk of inconsistent gift inventory counts.
- Risk of agent/user owner type confusion.
- Risk of duplicated revenue accounting.

### Chat and Matching

- Risk of user joining rooms not assigned to them.
- Risk of agents seeing unassigned chat rooms.
- Risk of unread counts drifting.
- Risk of realtime over-broadcast.

### Game Modules

- Risk of client-side race conditions in countdown.
- Risk of settlement after betting deadline mismatch.
- Risk of incorrect odds/payout logic.
- Risk of hidden result leakage.

## Rollback Strategy

Every migration should include a rollback note. Preferred rollback style:

1. Disable dependent Edge Functions or API routes first.
2. Drop policies before dropping functions/tables.
3. Drop realtime publications before dropping tables.
4. Drop dependent functions before dependent tables.
5. Never drop user data in production without explicit backup and user approval.

## Validation Matrix

| Area | Required Test |
|---|---|
| Auth | user/admin/agent sessions isolated by app instance |
| RLS | anon cannot access private data |
| RLS | user can only access own profile, points, chats, bets |
| RLS | agent can only access assigned members/chats |
| RLS | admin can access operational views but not bypass via client writes |
| RPC | direct unauthorized RPC calls fail |
| RPC | point mutation is atomic and ledgered |
| Games | betting cutoff enforced server-side |
| Games | settlement idempotent |
| Realtime | user receives only authorized chat/game rows |
| Storage | bucket upload/read/delete follows owner policy |
| Build | `pnpm --filter web build` succeeds |

## Current Stop Condition

Do not start schema migration until:

1. mcp2 reference metadata and local App Router dependencies are reconciled into a clean target dependency map; and
2. the user explicitly approves moving from analysis/documentation into mcp3 schema migration.
