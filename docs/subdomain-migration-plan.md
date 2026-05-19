---
title: Subdomain Migration Plan
---

# Subdomain Migration Plan

## Target domains

- **User app**: `app.example.com`
- **Admin app**: `admin.example.com`
- **Agent app**: `agent.example.com`

The local development structure remains path-based:

- **User**: `/`
- **Admin**: `/admin`
- **Agent**: `/agent`

The application now resolves app scope through host first and pathname second, so production can move to subdomains without rewriting auth logic.

## Scope model

Each app area has its own scope:

- **App scope**: `user`, `admin`, or `agent`
- **Auth scope**: same as app scope
- **Session scope**: same as app scope
- **Storage namespace**: app-scoped Supabase storage key and app-scoped local storage keys
- **Cookie namespace**: app-scoped Supabase auth cookie name

Current cookie and auth storage keys follow this format:

- **User**: `sb-dating-user-auth-token`
- **Admin**: `sb-dating-admin-auth-token`
- **Agent**: `sb-dating-agent-auth-token`

## DNS setup

Create DNS records for each subdomain:

- **`app.example.com`**: CNAME to the Vercel project target
- **`admin.example.com`**: CNAME to the Vercel project target
- **`agent.example.com`**: CNAME to the Vercel project target

If using an apex domain, keep the apex domain separate from these app subdomains unless a marketing site is intentionally hosted there.

## Vercel domain connection

Use one Vercel project for the current single Next.js app.

Add all production domains to the same Vercel project:

- **`app.example.com`**
- **`admin.example.com`**
- **`agent.example.com`**

Keep the same build command used by the monorepo web deployment:

```bash
pnpm --filter web build
```

Required environment variables:

- **`NEXT_PUBLIC_SUPABASE_URL`**
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**

`NEXT_PUBLIC_APP_INSTANCE` should not be used to force a single production scope when serving all three subdomains from the same deployment. Host-based resolution should decide the scope.

## Middleware rewrite structure

Production subdomains should expose clean paths while internally reusing the existing route tree:

- **`app.example.com/login`** → `/login`
- **`admin.example.com/login`** → internally rewritten to `/admin/login`
- **`admin.example.com/chats`** → internally rewritten to `/admin/chats`
- **`agent.example.com/login`** → internally rewritten to `/agent/login`
- **`agent.example.com/chats`** → internally rewritten to `/agent/chats`

The middleware should continue to:

- **Resolve host scope first** for production subdomains
- **Resolve pathname scope second** for localhost path-based development
- **Validate sessions with the scope-specific cookie namespace**
- **Redirect unauthenticated users to the scoped login route**
- **Reject cross-scope paths on scoped subdomains**

## Supabase redirect URL settings

Configure Supabase Auth URL settings to allow all app callback and login targets.

Recommended Site URL:

- **`https://app.example.com`**

Recommended additional redirect URLs:

- **`https://app.example.com/**`**
- **`https://admin.example.com/**`**
- **`https://agent.example.com/**`**
- **`http://localhost:3000/**`**

If OAuth is enabled later, add provider callback URLs for each domain according to the provider requirements.

## Cookie domain strategy

Keep auth cookies host-only by default.

Do not set a shared parent cookie domain like `.example.com` for Supabase auth cookies unless cross-subdomain SSO is intentionally introduced later. Host-only cookies preserve full session isolation:

- **User cookie** only applies to `app.example.com`
- **Admin cookie** only applies to `admin.example.com`
- **Agent cookie** only applies to `agent.example.com`

For localhost development, path scope and cookie names provide isolation even though all areas share `localhost:3000`.

## OAuth callback strategy

If OAuth is added later, route callbacks through the correct app scope:

- **User OAuth**: `https://app.example.com/auth/callback`
- **Admin OAuth**: avoid OAuth unless explicitly required
- **Agent OAuth**: avoid OAuth unless explicitly required

If admin or agent OAuth becomes necessary, provider state must include the app scope and the callback handler must instantiate the matching scoped Supabase client before exchanging the code.

## Validation checklist

Before production cutover, verify:

- **Cross-role session leakage**: logging into one subdomain does not authenticate another subdomain
- **Multi-tab behavior**: user, admin, and agent tabs can stay logged in independently
- **Hydration/session collision**: no role flicker or incorrect session after refresh
- **Logout isolation**: logging out of admin does not log out user or agent
- **Refresh persistence**: each subdomain keeps its own session after reload
- **Middleware redirect**: unauthenticated requests route to the correct login page
- **SSR/CSR consistency**: middleware session and client auth context agree on the active scope
