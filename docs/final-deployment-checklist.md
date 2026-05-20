# 최종 배포 전 점검 가이드

이 문서는 `DatingDesignPrototype` unified Next.js web app을 운영 배포하기 전 확인해야 할 항목을 정리합니다.

현재 앱은 하나의 Next.js 코드베이스 안에서 다음 3개 scope를 분리합니다.

- **User/App scope**: `user` 또는 `app`
- **Admin scope**: `admin`
- **Agent scope**: `agent`

로컬 검증 예시는 다음과 같습니다.

- **User/App**: `app.localhost` 또는 `/`
- **Admin**: `admin.localhost` 또는 `/admin`
- **Agent**: `agent.localhost` 또는 `/agent`

프로덕션 목표 예시는 다음과 같습니다.

- **User/App**: `https://app.example.com`
- **Admin**: `https://admin.example.com`
- **Agent**: `https://agent.example.com`

## 핵심 주의사항

- **실제 배포 금지**: 이 문서는 점검용이며, Vercel 배포나 Supabase migration/function deploy를 수행하지 않는다.
- **민감정보 금지**: 문서, Git, client bundle에 실제 secret 값을 넣지 않는다.
- **Service Role Key 보호**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` prefix를 붙이지 않는다.
- **OOM 주의**: 이전에 전체 lint/build 실행 중 Windows/IDE OOM이 있었으므로, 평소에는 targeted check를 우선한다.
- **세션 격리 유지**: host 기반 scope 판별, scope별 Supabase auth cookie/storage key 구조를 변경하지 않는다.

## 기능 점검 항목

### User/App 영역

- [ ] **홈 접속**: `https://app.example.com/` 접속이 정상인지 확인한다.
- [ ] **로그인 페이지**: `https://app.example.com/login` 접속이 정상인지 확인한다.
- [ ] **회원가입 페이지**: `https://app.example.com/signup` 접속이 정상인지 확인한다.
- [ ] **공개 페이지**: 공지, 실시간 매칭, 미니게임, 사다리, 파워볼, 랭킹 페이지가 비로그인 상태에서도 의도한 범위로 열리는지 확인한다.
- [ ] **보호 페이지**: 마이페이지, 포인트, 결제내역, 채팅 상세 등 로그인 필요 페이지가 비로그인 상태에서 user login으로 redirect되는지 확인한다.
- [ ] **로그인 유지**: user 계정 로그인 후 새로고침해도 세션이 유지되는지 확인한다.
- [ ] **로그아웃 격리**: user 로그아웃이 admin/agent 세션에 영향을 주지 않는지 확인한다.

### Admin 영역

- [ ] **Admin 로그인**: `https://admin.example.com/login`에서 admin 계정 로그인 가능 여부를 확인한다.
- [ ] **Admin 로그아웃**: 로그아웃 후 `admin` scope만 로그아웃되는지 확인한다.
- [ ] **Admin 보호 라우트**: `https://admin.example.com/` 접근 시 비로그인 상태는 `/login`으로 redirect되는지 확인한다.
- [ ] **주요 페이지**: 대시보드, 회원관리, 포인트/입출금, 미니게임 관리, 채팅, 공지, 선물, 계정 관리 페이지를 확인한다.
- [ ] **권한 분리**: 일반 user 또는 agent 계정으로 admin 영역에 로그인되지 않는지 확인한다.

### Agent 영역

- [ ] **Agent 로그인**: `https://agent.example.com/login`에서 agent 계정 로그인 가능 여부를 확인한다.
- [ ] **Agent 로그아웃**: 로그아웃 후 `agent` scope만 로그아웃되는지 확인한다.
- [ ] **Agent 보호 라우트**: `https://agent.example.com/` 접근 시 비로그인 상태는 `/login`으로 redirect되는지 확인한다.
- [ ] **주요 페이지**: 대시보드, 회원, 채팅, 선물 페이지를 확인한다.
- [ ] **권한 분리**: 일반 user 또는 admin 계정으로 agent 영역에 로그인되지 않는지 확인한다.

### 세션 격리 점검

- [ ] **동시 로그인**: 한 브라우저에서 `app`, `admin`, `agent`를 각각 다른 계정으로 로그인한다.
- [ ] **세션 혼합 방지**: 각 subdomain에서 현재 로그인 계정이 해당 scope 계정인지 확인한다.
- [ ] **새로고침 유지**: 세 subdomain을 모두 새로고침해도 각 세션이 유지되는지 확인한다.
- [ ] **scope별 로그아웃**: admin에서 로그아웃해도 app/agent가 유지되는지 확인한다.
- [ ] **storage key 확인**: browser storage에 scope별 key가 분리되어 있는지 확인한다.
  - `sb-dating-user-auth-token`
  - `sb-dating-admin-auth-token`
  - `sb-dating-agent-auth-token`
- [ ] **cookie 확인**: auth cookie가 host-only이고 scope별 이름으로 분리되는지 확인한다.
- [ ] **cross-scope path 차단**: `admin.example.com/agent`, `agent.example.com/admin` 같은 교차 path가 허용되지 않는지 확인한다.

### 핵심 기능 smoke test

- [ ] **채팅**: user와 agent/admin 관련 채팅 목록, 상세 진입, 메시지 송수신, 새로고침 후 유지 여부를 확인한다.
- [ ] **알림**: user/agent/admin 알림 toast가 표시되고 action click이 올바른 페이지로 이동하는지 확인한다.
- [ ] **미니게임**: 사다리/파워볼 진입, 비로그인 read-only, 로그인 배팅 UI, 배팅 내역, 관리자 미니게임 집계를 확인한다.
- [ ] **입금 신청**: user 입금 신청, admin pending 목록 표시, 승인/거절 흐름을 확인한다.
- [ ] **출금 신청**: user 출금 신청, Edge Function `request-withdrawal`, admin pending 목록 표시를 확인한다.
- [ ] **회원관리**: admin 회원 상세, 미니게임 배팅 내역, 채팅 내역, 포인트 내역을 확인한다.
- [ ] **에이전트 회원관리**: agent 회원 목록, 정산/입출금 집계, 회원 상세 modal을 확인한다.
- [ ] **공지/선물/프로필 이미지**: Storage public URL, 이미지 표시, 업로드 정책을 확인한다.

## Supabase 점검 항목

### Database/Migration

- [ ] **Migration 적용 상태**: `supabase/migrations`의 migration이 remote project에 순서대로 적용되었는지 확인한다.
- [ ] **Seed 필요 여부**: `supabase/seed.sql` 적용 여부를 운영 정책에 맞게 결정한다.
- [ ] **Schema drift**: local migration과 remote schema 간 drift가 없는지 확인한다.
- [ ] **백업**: 운영 DB에 migration 적용 전 Supabase backup/export를 확보한다.

### RLS/권한

- [ ] **RLS 활성화**: public 주요 테이블의 RLS가 켜져 있는지 확인한다.
- [ ] **anon 권한**: 공개 read가 필요한 테이블/RPC만 anon 접근이 가능한지 확인한다.
- [ ] **authenticated 권한**: 로그인 사용자 write가 필요한 테이블/RPC만 authenticated 접근이 가능한지 확인한다.
- [ ] **service role 권한**: service role은 서버/Edge Function에서만 사용하고 client에 노출하지 않는다.
- [ ] **public read/authenticated write**: 공개 페이지와 인증 write boundary가 의도대로 동작하는지 확인한다.
- [ ] **RPC grant**: 민감 RPC가 anon에게 열려 있지 않은지 확인한다.

### Edge Functions

현재 repository의 `supabase/functions`에는 다음 함수가 있다.

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

점검 항목:

- [ ] **함수 배포 여부**: 위 함수가 대상 Supabase project에 배포되어 있는지 확인한다.
- [ ] **함수 secrets**: Supabase Edge Function 환경에 필요한 secret이 설정되어 있는지 확인한다.
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **JWT verification**: 일반 앱 호출 함수는 JWT 검증을 켜고, webhook 성격 함수가 생기면 별도 인증 방식을 검토한다.
- [ ] **client 호출 확인**: 앱에서 `/functions/v1/user-record-login`, `/functions/v1/backoffice-record-login` 호출이 성공하는지 확인한다.
- [ ] **관리 함수 보호**: backoffice 계정 생성/수정/삭제/강제 로그아웃 함수가 admin 권한 검증을 수행하는지 확인한다.

### Storage

Migration 기준 필요한 bucket:

- `profile-images`
- `chat-profile-images`
- `chat-images`

점검 항목:

- [ ] **Bucket 존재**: 세 bucket이 존재하는지 확인한다.
- [ ] **Public 여부**: 현재 migration 기준 세 bucket은 public read로 구성된다.
- [ ] **파일 제한**: mime type과 size limit이 migration과 일치하는지 확인한다.
- [ ] **Storage policy**: public read, authenticated insert/update/delete 정책이 의도대로 적용되었는지 확인한다.
- [ ] **이미지 URL**: `apps/web/lib/utils/storage.ts`의 public URL 생성이 정상인지 확인한다.

### Realtime

Migration 기준 publication에 포함되어야 하는 주요 테이블:

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
- `game_settings`
- `gift_inventory`
- `gift_transactions`
- `gifts`
- `messages`
- `notices`
- `point_transactions`
- `user_profiles`
- `withdrawal_requests`
- `ladder_game_chats`
- `powerball_game_chats`

점검 항목:

- [ ] **Publication 포함**: 필요한 테이블이 `supabase_realtime` publication에 포함되어 있는지 확인한다.
- [ ] **RLS 충돌 확인**: Realtime payload 수신이 RLS 정책 때문에 막히지 않는지 확인한다.
- [ ] **브라우저 확인**: user/admin/agent 화면에서 realtime 관련 console error가 없는지 확인한다.

### Auth 설정

Supabase Dashboard에서 확인한다.

- [ ] **Site URL**: `https://app.example.com`으로 설정한다.
- [ ] **Additional Redirect URLs**:
  - `https://app.example.com/**`
  - `https://admin.example.com/**`
  - `https://agent.example.com/**`
  - `http://localhost:3000/**`
  - 필요 시 `http://app.localhost:3000/**`, `http://admin.localhost:3000/**`, `http://agent.localhost:3000/**`
- [ ] **Email auth**: email/password signup/login 허용 여부를 운영 정책에 맞춘다.
- [ ] **Email confirmation**: 확인 메일 사용 여부와 template URL을 확인한다.
- [ ] **OAuth**: OAuth를 쓰는 경우 provider callback URL에 각 subdomain callback을 등록한다.
- [ ] **OTP/template URL**: email template 내 URL이 user/admin/agent scope를 깨지 않는지 확인한다.

## Vercel 점검 항목

- [ ] **Repository 연결**: 올바른 GitHub repository와 branch가 연결되어 있는지 확인한다.
- [ ] **Framework Preset**: Next.js로 설정한다.
- [ ] **Root Directory**: `apps/web`을 사용한다.
- [ ] **Install Command**: 비워두고 Vercel 자동 감지를 사용한다.
- [ ] **Build Command**: 비움 또는 `pnpm build`.
- [ ] **Output Directory**: Next.js 기본값을 사용하며 별도 지정하지 않는다.
- [ ] **Node.js version**: Next.js 16과 호환되는 LTS 버전을 사용한다.
- [ ] **Production env**: Production 환경변수가 모두 설정되어 있는지 확인한다.
- [ ] **Preview env**: Preview 배포를 사용할 경우 별도 Supabase project 또는 redirect URL 정책을 정한다.
- [ ] **Domains**: `app.example.com`, `admin.example.com`, `agent.example.com`이 연결되어 있는지 확인한다.
- [ ] **HTTPS 인증서**: 세 subdomain 모두 Vercel에서 인증서 발급이 완료되었는지 확인한다.
- [ ] **server-only env**: Vercel serverless runtime에 필요한 server-only env가 있다면 `NEXT_PUBLIC_` 없이 등록한다.

## 권장 검증 명령

### 가벼운 확인

일상 점검 또는 문서/소규모 수정 후 우선 사용한다.

```powershell
git diff --check
```

```powershell
git status --short
```

관련 파일만 대상으로 한 ESLint 예시:

```powershell
pnpm --filter web exec eslint components/pages/AdminMiniGamesPage.tsx hooks/useSupabase.ts
```

환경변수 참조 검색:

```powershell
git grep -n "process.env\|NEXT_PUBLIC_\|Deno.env" -- apps/web supabase/functions
```

Supabase SQL/MCP로 특정 항목 확인 예시:

```sql
select * from supabase_migrations.schema_migrations order by version desc limit 20;
select schemaname, tablename, rowsecurity from pg_tables where schemaname = 'public';
select * from pg_publication_tables where pubname = 'supabase_realtime';
select id, name, public from storage.buckets order by id;
```

브라우저 smoke test:

- [ ] **Console**: user/admin/agent에서 console error가 없는지 확인한다.
- [ ] **Network**: Supabase REST/RPC/Function call이 401/403/500 없이 예상대로 응답하는지 확인한다.
- [ ] **Realtime**: Supabase channel 중복/권한 오류가 없는지 확인한다.

### 최종 배포 직전, 사용자가 명시적으로 허락한 경우에만 권장

OOM 이력이 있으므로 아래 명령은 배포 직전 승인 후 실행한다.

```powershell
pnpm --filter web lint
```

```powershell
pnpm --filter web exec next build --webpack
```

```powershell
pnpm --filter web build
```

Windows PowerShell에서 Node 메모리 한도를 올려 실행해야 하는 경우:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm --filter web build
Remove-Item Env:NODE_OPTIONS
```

또는 현재 shell 세션에서만 유지하려면 명령 실행 후 반드시 `NODE_OPTIONS`를 해제한다.

## 배포 직전 최종 확인

- [ ] **Git working tree**: 의도한 변경만 남아 있는지 확인한다.
- [ ] **문서와 실제 설정 일치**: Vercel/Supabase Dashboard 설정이 문서와 일치하는지 확인한다.
- [ ] **secret 노출 점검**: `.env.local`, service role key, DB password가 Git에 포함되지 않았는지 확인한다.
- [ ] **운영 백업**: 운영 Supabase DB와 Storage 백업을 확보한다.
- [ ] **Rollback 계획**: Vercel 이전 deployment rollback, Supabase backup restore 절차를 준비한다.
