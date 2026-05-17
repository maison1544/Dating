---
description: Safe phased Supabase migration for DatingDesignPrototype
---

# Supabase Dating Migration Workflow

Use this workflow whenever working on the DatingDesignPrototype Supabase migration.

## Environment Rules

1. Treat `supabase-mcp-server` / mcp1 as the crypto production reference project.
   - Read only.
   - Never apply migrations.
   - Never deploy Edge Functions.
   - Never mutate data.

2. Treat `supabase-mcp-server-2` / mcp2 as the dating reference project.
   - Read only.
   - Never apply migrations.
   - Never deploy Edge Functions.
   - Never mutate data.
   - Current project ref is `beyzubmbwygxiixuieiy`.
   - Use its metadata as the primary dating Supabase reference.
   - Validate every reference object against the current App Router code before applying anything to mcp3.

3. Treat `supabase-mcp-server-3` / mcp3 as the only writable target project.
   - Schema migrations, Edge Functions, RPC, RLS, triggers, realtime, storage, auth, and security patches may only be applied here after explicit implementation approval.

## Required Pre-Implementation Checks

Before any schema or function change:

1. Confirm repository is cloned from `https://github.com/ttaa1235/DatingDesignPrototype.git`.
2. Confirm current architecture includes commit `0433d53 Merge: Next.js App Router architecture migration`.
3. Read and update if necessary:
   - `migration_plan.md`
   - `architecture_comparison.md`
   - `risk_analysis.md`
4. Map dependencies:
   - tables
   - RLS policies
   - RPC functions
   - Edge Functions
   - triggers
   - auth.users coupling
   - storage buckets
   - realtime publications
   - Next.js API routes
   - frontend hooks and route dependencies
5. Check for hidden dependencies:
   - RPC-to-table
   - trigger-to-function
   - Edge Function-to-RPC
   - realtime-to-RLS
   - storage bucket-to-frontend URL generation
6. Review risks:
   - RLS recursion
   - SECURITY DEFINER grants
   - auth session separation
   - game result leakage
   - point balance race conditions
   - chat realtime over-broadcast

## Migration Sequence

1. Analysis and documentation only.
2. Core identity schema.
3. Point/payment ledger schema and RPC.
4. Chat/matching schema and RPC.
5. Gift schema and RPC.
6. Game schema and RPC.
7. RLS hardening.
8. Realtime publication setup.
9. Storage bucket and policies.
10. Edge Function deployment.
11. App Router API integration review.
12. Validation and advisor checks.

## Validation Commands

Use read-only or local commands first:

```powershell
pnpm --filter web lint
pnpm --filter web build
```

For Supabase validation, use advisors and read-only metadata before applying any new migration.

## Stop Conditions

Stop and ask the user if:

- a migration is destructive.
- a service-role secret is required.
- an Edge Function changes auth behavior.
- realtime publication might expose private chat, bet, or profile rows.
- schema design conflicts with current App Router code.
