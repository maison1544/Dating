# Vercel 서브도메인 배포 가이드

이 문서는 `DatingDesignPrototype` unified Next.js web app을 Vercel에 배포할 때 `app`, `admin`, `agent` subdomain 세션 분리를 유지하는 방법을 정리합니다.

## 현재 코드 구조 요약

이 프로젝트는 하나의 Next.js app 안에서 host/path 기반으로 app scope를 판별한다.

관련 코드:

- **Scope resolver**: `apps/web/lib/supabase/config.ts`
- **Browser Supabase client**: `apps/web/lib/supabase/client.ts`
- **Server Supabase client**: `apps/web/lib/supabase/server.ts`
- **Middleware session/rewrite**: `apps/web/middleware.ts`
- **Scope provider**: `apps/web/contexts/AppScopeContext.tsx`

현재 scope 판별 우선순위:

1. **Host first**: `app.example.com`, `admin.example.com`, `agent.example.com`의 첫 label을 확인한다.
2. **Path second**: localhost 또는 host scope가 없을 때 `/admin`, `/agent` path를 확인한다.
3. **Env fallback**: `NEXT_PUBLIC_APP_INSTANCE`가 있으면 fallback으로 사용한다.
4. **Default**: `user`.

Scope별 Supabase auth cookie/storage key:

- **User/App**: `sb-dating-user-auth-token`
- **Admin**: `sb-dating-admin-auth-token`
- **Agent**: `sb-dating-agent-auth-token`

따라서 같은 deployment를 사용해도 host가 다르면 scope별 auth storage/cookie name이 분리된다.

## 배포 방식 비교

### 권장안 A: 하나의 Vercel Project에 여러 도메인 연결

예시:

- `app.example.com`
- `admin.example.com`
- `agent.example.com`

하나의 Vercel Project에 같은 Next.js app을 한 번 배포하고, 세 subdomain을 모두 Domains에 추가한다.

#### 동작 방식

- **같은 배포본**: 세 subdomain이 같은 Vercel deployment를 바라본다.
- **Host 기반 scope**: middleware와 resolver가 `Host` header를 보고 `user`, `admin`, `agent`를 구분한다.
- **내부 route 재사용**:
  - `admin.example.com/login` → 내부적으로 `/admin/login`
  - `agent.example.com/login` → 내부적으로 `/agent/login`
  - `app.example.com/login` → `/login`
- **세션 분리**: scope별 Supabase cookie/storage key가 달라 세션이 섞이지 않는다.
- **관리 단순성**: build/deploy/env/domain 관리가 하나의 Vercel Project에 집중된다.

#### 장점

- **현재 코드 구조에 가장 적합**: host first resolver와 middleware rewrite가 이미 이 구조를 지원한다.
- **배포 관리 단순**: 같은 코드베이스를 한 번만 build/deploy한다.
- **환경변수 일관성**: 동일 Supabase project를 사용하는 경우 env를 한 번만 설정한다.
- **세션 격리 유지**: host-only cookie와 scope별 key로 독립 세션 유지가 가능하다.

#### 단점/주의사항

- **세 subdomain 모두 같은 Vercel Project Domains에 추가해야 함**.
- **`NEXT_PUBLIC_APP_INSTANCE`로 scope를 강제하지 않는 것이 권장됨**.
- **Supabase Auth redirect URL에 세 subdomain을 모두 등록해야 함**.
- **Vercel Preview domain은 host label이 `app/admin/agent`가 아니므로 path 기반 또는 별도 env 전략을 확인해야 함**.

### 대안 B: 세 개의 Vercel Project로 분리 배포

예시:

- `dating-user-app` → `app.example.com`
- `dating-admin-app` → `admin.example.com`
- `dating-agent-app` → `agent.example.com`

각 Vercel Project에 같은 repository를 연결하고 scope를 env로 고정하는 방식이다.

#### 가능한 설정 예시

- **User Project**: `NEXT_PUBLIC_APP_INSTANCE=user`
- **Admin Project**: `NEXT_PUBLIC_APP_INSTANCE=admin`
- **Agent Project**: `NEXT_PUBLIC_APP_INSTANCE=agent`

#### 장점

- **도메인/배포 완전 분리**: 각 영역을 독립적으로 rollback/deploy할 수 있다.
- **환경변수 분리**: 영역별 Supabase project 또는 secret 정책을 다르게 둘 수 있다.
- **운영 권한 분리**: Vercel Project 접근권한을 역할별로 나눌 수 있다.

#### 단점/주의사항

- **관리 복잡도 증가**: 같은 코드가 3번 build/deploy된다.
- **route 검증 필요**: admin/agent project에서 `/` 접근이 의도대로 `/admin`, `/agent`로 연결되는지 확인해야 한다.
- **host 기반 resolver와 env fallback 간 우선순위 확인 필요**: 현재 코드는 host를 먼저 보고, host로 scope를 판별할 수 없을 때 env/path fallback을 사용한다.
- **Supabase redirect URL과 cookie 정책을 project별로 따로 검증해야 함**.

## 추천

현재 코드가 host 기반 scope 판별과 middleware rewrite를 이미 지원하므로 **권장안 A: 하나의 Vercel Project에 여러 도메인 연결**을 우선 추천한다.

B 방식은 다음 경우에만 검토한다.

- 운영 조직상 user/admin/agent 배포 권한을 완전히 분리해야 하는 경우
- 서로 다른 Supabase project를 scope별로 사용해야 하는 경우
- admin/agent만 별도 release cadence가 필요한 경우

## Vercel Project 설정

### Repository 연결

- **Repository**: 현재 GitHub repository를 연결한다.
- **Branch**: 운영 배포 branch를 지정한다.
- **Framework Preset**: `Next.js`.

### Root Directory

현재 repository는 monorepo 구조다.

- root package: `package.json`
- workspace: `apps/web`
- lockfile: `pnpm-lock.yaml`

권장 설정:

- **Root Directory**: repository root
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm --filter web build`
- **Output Directory**: 비워둔다. Next.js 기본값을 사용한다.

repository root의 `vercel.ts`도 Framework Preset과 install/build command를 고정한다. Vercel UI가 `apps/admin`, `apps/agent`, `apps/user`를 자동 선택하면 잘못된 설정이다. 운영 Next.js app은 `apps/web`이고, monorepo lockfile/workspace를 안정적으로 사용하려면 repository root 배포를 우선한다.

root 배포에서 Vercel Project의 Framework가 `Other`/`null`로 남으면 build가 성공해도 Vercel이 static output인 `public`을 찾을 수 있다. 이 경우 `vercel.ts`의 `framework: "nextjs"` 설정을 사용하고, Dashboard에서도 Framework Preset을 Next.js로 맞춘다. `apps/web/.next`를 Output Directory로 지정하면 READY가 되더라도 Next.js routing이 `NOT_FOUND`를 반환할 수 있으므로 최종 설정으로 사용하지 않는다.

대안 설정:

- **Root Directory**: `apps/web`
- **Install Command**: monorepo lockfile 인식과 workspace dependency 처리 방식을 별도 검증해야 한다.
- **Build Command**: `pnpm build` 또는 `next build`
- **Output Directory**: 비워둔다. Next.js 기본값을 사용한다.

현재 구조에서는 root에 `pnpm-lock.yaml`과 `pnpm-workspace.yaml`이 있으므로 **repository root를 Root Directory로 두는 방식을 권장**한다.

### Node.js version

- Next.js `16.1.6`, React `19.1.0`을 사용한다.
- Vercel Project Settings에서 Next.js 16과 호환되는 Node.js LTS를 선택한다.
- local/CI와 version drift가 생기지 않도록 `.nvmrc` 또는 Vercel Node version 고정을 검토할 수 있다.

### Package manager

- 현재 tracked lockfile은 `pnpm-lock.yaml`이다.
- Vercel install command는 `pnpm install --frozen-lockfile`을 권장한다.
- `package-lock.json`이 다시 생성되지 않도록 주의한다.

## Vercel Environment Variables

### 권장안 A: 하나의 Project에 세 도메인 연결

Production env:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
```

선택 env:

```text
NEXT_PUBLIC_APP_INSTANCE=
```

권장안 A에서는 `NEXT_PUBLIC_APP_INSTANCE`를 비워두거나 설정하지 않는 것을 권장한다. host 기반 resolver가 `app`, `admin`, `agent` subdomain을 자동 감지해야 한다.

Preview env:

- Preview deployment를 실제 Supabase project에 연결할지, staging Supabase project에 연결할지 결정한다.
- Preview domain은 `app/admin/agent` subdomain이 아니므로, path 기반 테스트(`/admin`, `/agent`) 또는 별도 Preview domain을 사용한다.
- Supabase Auth redirect URL에 Preview URL을 등록하거나 wildcard 허용 여부를 검토한다.

### 대안 B: 세 개 Project로 분리

User project:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
NEXT_PUBLIC_APP_INSTANCE=user
```

Admin project:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
NEXT_PUBLIC_APP_INSTANCE=admin
```

Agent project:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
NEXT_PUBLIC_APP_INSTANCE=agent
```

주의:

- `NEXT_PUBLIC_APP_INSTANCE`는 client에 노출된다. secret이 아니며 scope fallback 용도다.
- `SUPABASE_SERVICE_ROLE_KEY`는 현재 Next.js app source에서 직접 사용하지 않는다.
- service role key가 필요하더라도 Vercel client-side env에 넣지 않는다.
- `SUPABASE_SERVICE_ROLE_KEY`는 Supabase Edge Functions secret 또는 server-only 코드에서만 사용한다.

## DNS 설정

예시 도메인: `example.com`

### Subdomain만 사용하는 경우

Vercel Project에 다음 Domains를 추가한다.

- `app.example.com`
- `admin.example.com`
- `agent.example.com`

DNS provider에서 Vercel 안내에 따라 각 subdomain을 연결한다.

일반적인 CNAME 예시:

```text
app.example.com    CNAME    cname.vercel-dns.com
admin.example.com  CNAME    cname.vercel-dns.com
agent.example.com  CNAME    cname.vercel-dns.com
```

Vercel이 project별 또는 team별 target을 다르게 안내할 수 있으므로, Vercel Domains 화면의 지시를 우선한다.

### Apex domain도 사용하는 경우

Apex domain 예시:

- `example.com`

Apex domain은 보통 A record 또는 Vercel nameserver 방식이 필요하다.

예시:

```text
example.com        A        76.76.21.21
www.example.com    CNAME    cname.vercel-dns.com
```

주의:

- 현재 앱의 production scope 목표는 `app/admin/agent` subdomain이다.
- apex domain을 마케팅 사이트로 따로 쓸지, app으로 redirect할지 운영 정책을 정한다.
- apex를 app으로 쓸 경우 host first resolver는 첫 label이 `app`이 아니므로 `user` fallback이 된다.

## Supabase Auth URL 설정

Supabase Dashboard에서 Auth URL을 반드시 설정한다.

권장 Site URL:

```text
https://app.example.com
```

Additional Redirect URLs:

```text
https://app.example.com/**
https://admin.example.com/**
https://agent.example.com/**
http://localhost:3000/**
```

필요 시 host 기반 로컬 테스트 URL도 추가한다.

```text
http://app.localhost:3000/**
http://admin.localhost:3000/**
http://agent.localhost:3000/**
```

OAuth를 사용할 경우 provider dashboard에도 callback URL을 추가한다.

```text
https://app.example.com/auth/callback
https://admin.example.com/auth/callback
https://agent.example.com/auth/callback
```

Admin/Agent OAuth는 권장하지 않는다. 필요하면 state에 scope를 포함하고 callback handler가 해당 scope의 Supabase client를 사용하도록 별도 검증한다.

## Cookie domain 정책

현재 코드의 `getSupabaseCookieOptions`는 cookie name만 지정하고 parent domain을 지정하지 않는다.

결과:

- **host-only cookie**가 기본이다.
- `app.example.com`, `admin.example.com`, `agent.example.com` 간 cookie가 공유되지 않는다.
- scope별 cookie/storage key가 추가로 분리된다.

권장:

- `.example.com` 같은 parent cookie domain을 설정하지 않는다.
- cross-subdomain SSO가 필요해지기 전까지 host-only cookie를 유지한다.
- parent domain cookie를 도입하면 세션 격리 구조가 깨질 수 있으므로 별도 보안 설계가 필요하다.

## Middleware rewrite 동작

Host scope가 있을 때 middleware는 clean path를 내부 route로 rewrite한다.

예시:

- `https://admin.example.com/` → 내부 `/admin`
- `https://admin.example.com/login` → 내부 `/admin/login`
- `https://admin.example.com/users` → 내부 `/admin/users`
- `https://agent.example.com/` → 내부 `/agent`
- `https://agent.example.com/login` → 내부 `/agent/login`
- `https://agent.example.com/members` → 내부 `/agent/members`

Cross-scope path는 redirect된다.

예시:

- `https://admin.example.com/agent` → `/`
- `https://agent.example.com/admin` → `/`

## Production smoke test

도메인 연결 후 다음을 확인한다.

### App

- [ ] `https://app.example.com/`
- [ ] `https://app.example.com/login`
- [ ] `https://app.example.com/signup`
- [ ] `https://app.example.com/realtime-matching`
- [ ] `https://app.example.com/minigame`
- [ ] `https://app.example.com/ladder-game`
- [ ] `https://app.example.com/powerball`

### Admin

- [ ] `https://admin.example.com/`
- [ ] `https://admin.example.com/login`
- [ ] `https://admin.example.com/users`
- [ ] `https://admin.example.com/points`
- [ ] `https://admin.example.com/minigames`
- [ ] `https://admin.example.com/chats`

### Agent

- [ ] `https://agent.example.com/`
- [ ] `https://agent.example.com/login`
- [ ] `https://agent.example.com/members`
- [ ] `https://agent.example.com/chats`
- [ ] `https://agent.example.com/gifts`

### Session isolation

- [ ] 같은 브라우저에서 세 subdomain을 각각 다른 계정으로 로그인한다.
- [ ] 새로고침 후 세션이 유지되는지 확인한다.
- [ ] admin logout이 app/agent 세션을 제거하지 않는지 확인한다.
- [ ] browser storage/cookie key가 scope별로 분리되어 있는지 확인한다.

## 권장 Vercel 설정 요약

| 항목 | 권장값 |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | repository root |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter web build` |
| Output Directory | 비움, Next.js 기본값 |
| Production Domains | `app.example.com`, `admin.example.com`, `agent.example.com` |
| Required env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Optional env | `NEXT_PUBLIC_APP_INSTANCE` |
| Recommended deployment model | 하나의 Vercel Project + 세 Domains |

## 배포 전 금지사항

- **실제 secret 값을 Git에 commit하지 않는다.**
- **`SUPABASE_SERVICE_ROLE_KEY`를 `NEXT_PUBLIC_` env로 등록하지 않는다.**
- **세션 격리를 위해 cookie domain을 `.example.com`으로 공유하지 않는다.**
- **권장안 A에서 `NEXT_PUBLIC_APP_INSTANCE=admin`처럼 scope를 하나로 강제하지 않는다.**
- **Supabase Auth redirect URL 등록 전 production login을 오픈하지 않는다.**
