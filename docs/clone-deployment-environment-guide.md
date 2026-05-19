# 클론 배포 환경 설정 가이드

이 문서는 이 repository를 clone한 뒤 새 Supabase project와 새 Vercel project에 배포하기 위한 절차를 정리한다.

실제 secret 값은 절대 문서에 기록하지 않는다. 모든 예시는 placeholder만 사용한다.

## 전체 순서

1. **GitHub repo clone**
2. **pnpm 설치 및 의존성 설치**
3. **Supabase 새 프로젝트 생성**
4. **Supabase database migrations 적용**
5. **Supabase storage bucket 생성/정책 적용**
6. **Supabase Edge Functions 배포**
7. **Supabase Edge Function secrets 설정**
8. **Supabase Auth 설정**
9. **Supabase Realtime 설정 확인**
10. **로컬 `.env.local` 생성**
11. **로컬 smoke test**
12. **Vercel 프로젝트 생성**
13. **Vercel 환경변수 등록**
14. **Vercel 도메인 연결**
15. **Supabase Auth redirect URL에 Vercel 도메인 등록**
16. **최종 smoke test**

## 1. Repository clone

```powershell
git clone <repository-url> Dating
Set-Location Dating
```

현재 monorepo 구조:

```text
.
├─ apps/web
├─ docs
├─ supabase
├─ package.json
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml
```

## 2. pnpm 설치 및 의존성 설치

권장:

```powershell
pnpm install --frozen-lockfile
```

주의:

- 현재 tracked lockfile은 `pnpm-lock.yaml`이다.
- `package-lock.json`을 새로 생성하지 않는다.
- Vercel도 `pnpm install --frozen-lockfile`을 사용하도록 맞춘다.

## 3. Supabase 새 프로젝트 생성

Supabase Dashboard에서 새 project를 생성한다.

필수로 기록해야 할 값:

- **Project URL**: `https://<project-ref>.supabase.co`
- **anon/public key 또는 publishable key**
- **service role key**
- **database password**
- **project ref**: `<project-ref>`
- **region**

보안 주의:

- `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 browser bundle에 노출된다.
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 browser/client-side bundle에 포함되면 안 된다.
- `SUPABASE_SERVICE_ROLE_KEY`에는 절대 `NEXT_PUBLIC_` prefix를 붙이지 않는다.
- service role key는 Supabase Edge Functions, server-only code, one-off admin script에서만 사용한다.

## 4. Supabase migrations 적용

Migration 파일 위치:

```text
supabase/migrations
```

로컬 Supabase CLI를 사용할 경우 일반 절차:

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

운영 또는 기존 데이터가 있는 remote DB에 적용 전:

- [ ] **DB backup/export 확보**
- [ ] **migration 순서 확인**
- [ ] **staging project에서 먼저 검증**
- [ ] **seed 적용 여부 결정**
- [ ] **schema drift 여부 확인**

Seed 파일:

```text
supabase/seed.sql
```

빈 DB로 시작하는 경우 seed 적용이 필요할 수 있다. 운영 데이터가 이미 있는 DB에는 seed가 중복/충돌을 만들 수 있으므로 적용 전 내용을 확인한다.

## 5. Storage bucket 생성/정책 적용

현재 migration 기준 필요한 bucket:

| Bucket | Public | 용도 |
| --- | --- | --- |
| `profile-images` | true | user profile image |
| `chat-profile-images` | true | chat profile image |
| `chat-images` | true | chat image/attachment |

정책 요약:

- public read 허용
- authenticated insert/update/delete 허용
- owner, owner_id, foldername 기반 조건 포함

확인 SQL 예시:

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
```

Storage object 이관이 필요한 경우:

- 기존 Supabase Storage에서 object export/download
- 새 project bucket 생성
- 같은 path 구조로 upload
- public URL이 새 project URL로 바뀌므로 DB에 저장된 URL/path 형식을 확인

## 6. Supabase Edge Functions 배포

함수 위치:

```text
supabase/functions
```

현재 함수 목록:

- `admin-create-backoffice-account`
- `admin-delete-backoffice-account`
- `admin-force-logout`
- `admin-update-user-password`
- `backoffice-record-login`
- `request-withdrawal`
- `user-record-login`
- `validate-referral-code`

배포 예시:

```powershell
supabase functions deploy admin-create-backoffice-account
supabase functions deploy admin-delete-backoffice-account
supabase functions deploy admin-force-logout
supabase functions deploy admin-update-user-password
supabase functions deploy backoffice-record-login
supabase functions deploy request-withdrawal
supabase functions deploy user-record-login
supabase functions deploy validate-referral-code
```

JWT verification:

- 일반 앱에서 인증된 사용자 token으로 호출하는 함수는 JWT verification을 켜는 것을 기본으로 한다.
- webhook 성격의 함수가 추가되면 JWT 대신 webhook signature/API secret 등 별도 인증 방식을 구현한다.
- 함수 body가 자체 권한 검증을 수행하는지 확인한다.

## 7. Edge Function secrets 설정

현재 Edge Functions가 참조하는 Supabase runtime env:

| Secret | 사용 함수 | 설명 |
| --- | --- | --- |
| `SUPABASE_URL` | 대부분 함수 | Supabase project URL |
| `SUPABASE_ANON_KEY` | `request-withdrawal` | user JWT 기반 client 생성용 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | admin/login/referral 관련 함수 | server-side privileged 작업용 |

설정 예시:

```powershell
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_ANON_KEY=<anon-or-publishable-key>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

주의:

- 실제 값을 shell history나 문서에 남기지 않도록 주의한다.
- service role key는 Supabase project 재생성/rotation 시 함께 갱신한다.
- Vercel client env에는 service role key를 넣지 않는다.

## 8. Supabase Auth 설정

Supabase Dashboard > Authentication > URL Configuration에서 설정한다.

### Site URL

권장:

```text
https://app.example.com
```

### Additional Redirect URLs

권장:

```text
https://app.example.com/**
https://admin.example.com/**
https://agent.example.com/**
http://localhost:3000/**
```

로컬 host 기반 subdomain 테스트를 쓸 경우:

```text
http://app.localhost:3000/**
http://admin.localhost:3000/**
http://agent.localhost:3000/**
```

특정 callback path를 명시해야 하는 정책이면 다음을 추가한다.

```text
https://app.example.com/auth/callback
https://admin.example.com/auth/callback
https://agent.example.com/auth/callback
```

Preview deployment를 사용할 경우:

- Vercel preview URL을 명시적으로 추가하거나
- Supabase가 허용하는 wildcard 정책을 검토하거나
- preview 전용 Supabase project를 사용한다.

### Email auth

- [ ] Email/password signup 사용 여부 확인
- [ ] Email confirmation 사용 여부 확인
- [ ] OTP/email template URL 확인
- [ ] 운영 sender/domain 설정 확인

### OAuth

OAuth provider를 사용하는 경우:

- provider dashboard에 production callback URL 등록
- Supabase provider 설정 확인
- app/admin/agent 중 어떤 scope에서 OAuth를 허용할지 결정
- admin/agent OAuth는 권장하지 않으며, 필요 시 scope state 검증이 필요하다.

## 9. Supabase Realtime 설정 확인

현재 앱에서 realtime subscription을 사용하는 주요 테이블:

- `chat_rooms`
- `messages`
- `chat_profiles`
- `user_profiles`
- `deposit_requests`
- `withdrawal_requests`
- `game_bets`
- `game_rounds`
- `game_chats`
- `ladder_game_chats`
- `powerball_game_chats`
- `gift_inventory`
- `gift_transactions`
- `notices`

Migration에는 다음 publication 복구가 포함되어 있다.

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
- `point_transactions`
- `user_profiles`
- `withdrawal_requests`

확인 SQL 예시:

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;
```

주의:

- publication에 포함되어도 RLS가 payload 접근을 막으면 client가 필요한 데이터를 받지 못할 수 있다.
- user/admin/agent 각각 브라우저 console에서 realtime auth/channel error가 없는지 확인한다.

## 10. 로컬 `.env.local` 생성

현재 Next.js app의 env 파일 위치:

```text
apps/web/.env.local
```

예시:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
# Optional. 하나의 dev server에서 host/path 자동 판별을 쓸 경우 비워두거나 생략한다.
NEXT_PUBLIC_APP_INSTANCE=
```

주의:

- `.env.local`은 Git에 commit하지 않는다.
- 실제 secret 값을 문서나 commit에 포함하지 않는다.
- `SUPABASE_SERVICE_ROLE_KEY`는 browser app용 `.env.local`에 넣지 않는다.

## 11. 로컬 smoke test

개발 서버 예시:

```powershell
pnpm --filter web dev -- -p 3000
```

확인:

- [ ] `http://localhost:3000/`
- [ ] `http://localhost:3000/login`
- [ ] `http://localhost:3000/admin/login`
- [ ] `http://localhost:3000/agent/login`
- [ ] `http://localhost:3000/minigame`
- [ ] `http://localhost:3000/ladder-game`
- [ ] `http://localhost:3000/powerball`

Host 기반 로컬 테스트를 하는 경우 hosts/DNS 또는 browser 환경에서 다음을 확인한다.

- [ ] `http://app.localhost:3000/`
- [ ] `http://admin.localhost:3000/login`
- [ ] `http://agent.localhost:3000/login`

브라우저 확인:

- [ ] console error 없음
- [ ] Supabase REST/RPC/Function call 401/403/500 없음 또는 의도된 권한 응답
- [ ] user/admin/agent 세션 격리
- [ ] 새로고침 후 세션 유지
- [ ] scope별 로그아웃 격리

## 12. Vercel 프로젝트 생성

권장 방식은 하나의 Vercel Project에 세 subdomain을 연결하는 방식이다.

Vercel 설정:

| 항목 | 권장값 |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | repository root |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter web build` |
| Output Directory | 비움 |

## 13. Vercel 환경변수 등록

### 실제 코드 기준 env 사용 목록

`git grep` 기준 현재 source에서 사용하는 app env는 다음이다.

| 변수명 | 필수 여부 | 사용 위치 | 예시 값 | client 노출 가능 여부 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | browser/server Next.js, `next.config.ts`, Supabase clients, Edge Function fetch URL | `https://xxxx.supabase.co` | 가능 | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 | browser/server Next.js, Supabase clients, Edge Function fetch apikey | `ey...` | 가능 | Supabase anon/public/publishable key |
| `NEXT_PUBLIC_APP_INSTANCE` | 선택 | `apps/web/lib/supabase/config.ts` fallback | `user`, `admin`, `agent` | 가능 | host/path로 scope를 판별하지 못할 때 fallback scope |
| `NEXT_DEV_DIST_DIR` | 로컬/개발 선택 | `apps/web/next.config.ts` | `.next-dev-user` | 가능하지만 보통 불필요 | dev build output dir override |
| `NODE_ENV` | 자동 | React/Next runtime, dev UI 조건 | `production` | 시스템 값 | Vercel/Next가 자동 설정 |

### 후보였지만 현재 코드에서 미사용

다음 변수명은 요청 후보였지만 현재 source 검색 기준 직접 사용되지 않는다.

| 변수명 | 현재 상태 | 비고 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 미사용 | 필요 시 새 기능에서 도입 가능 |
| `NEXT_PUBLIC_APP_URL` | 미사용 | 현재 host 기반 resolver 사용 |
| `NEXT_PUBLIC_ADMIN_URL` | 미사용 | 현재 host 기반 resolver 사용 |
| `NEXT_PUBLIC_AGENT_URL` | 미사용 | 현재 host 기반 resolver 사용 |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js app source에서는 미사용 | Supabase Edge Functions secret으로 사용 |
| payment 관련 secret | 미사용 | 결제 provider 연동 시 별도 추가 |
| webhook 관련 secret | 미사용 | webhook 함수 추가 시 별도 추가 |
| notification provider secret | 미사용 | 외부 push provider 연동 시 별도 추가 |

### Supabase Edge Function env

| 변수명 | 필수 여부 | 사용 위치 | 예시 값 | client 노출 가능 여부 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `SUPABASE_URL` | 필수 | Supabase Edge Functions | `https://xxxx.supabase.co` | server/runtime only | Function 내부 Supabase URL |
| `SUPABASE_ANON_KEY` | 조건부 필수 | `request-withdrawal` | `ey...` | server/runtime only | Function 내부 anon client용 |
| `SUPABASE_SERVICE_ROLE_KEY` | 조건부 필수 | admin/login/referral Edge Functions | `ey...` | 절대 불가 | privileged server 작업용 |

## 14. 서브도메인별 환경 설정

### 하나의 Vercel Project에 세 도메인 연결 시

권장:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

- `NEXT_PUBLIC_APP_INSTANCE`는 비워두거나 설정하지 않는다.
- `app.example.com`, `admin.example.com`, `agent.example.com` 모두 같은 env를 사용한다.
- host resolver가 production domain의 첫 label을 보고 scope를 판별한다.
- Supabase auth cookie/storage key는 scope별로 분리된다.

### 세 개 Vercel Project로 분리 시

User project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
NEXT_PUBLIC_APP_INSTANCE=user
```

Admin project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
NEXT_PUBLIC_APP_INSTANCE=admin
```

Agent project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
NEXT_PUBLIC_APP_INSTANCE=agent
```

선택지:

- 세 Project 모두 같은 Supabase project를 사용한다.
- 또는 scope별 Supabase project를 나눈다. 단, 이 경우 DB/RPC/Auth/Storage/Realtime 구조도 scope별로 검증해야 한다.

## 15. Vercel 도메인 연결

권장안 A 기준 Vercel Project Domains에 추가:

```text
app.example.com
admin.example.com
agent.example.com
```

DNS provider 설정 예시:

```text
app.example.com    CNAME    cname.vercel-dns.com
admin.example.com  CNAME    cname.vercel-dns.com
agent.example.com  CNAME    cname.vercel-dns.com
```

Vercel Domains 화면이 안내하는 target을 우선한다.

## 16. Supabase Auth redirect URL에 Vercel 도메인 등록

Vercel domain이 확정된 뒤 Supabase Dashboard에 다시 등록한다.

```text
https://app.example.com/**
https://admin.example.com/**
https://agent.example.com/**
```

Preview를 운영 smoke test에 쓴다면 Preview URL도 등록한다.

## 17. 최종 smoke test

- [ ] `app.example.com` user 로그인/로그아웃
- [ ] `admin.example.com` admin 로그인/로그아웃
- [ ] `agent.example.com` agent 로그인/로그아웃
- [ ] 세 scope 동시 로그인 및 새로고침 유지
- [ ] scope별 로그아웃 격리
- [ ] 채팅/알림/미니게임/입출금/회원관리 smoke test
- [ ] browser console error 없음
- [ ] Supabase Function 호출 성공
- [ ] Storage image URL 표시
- [ ] Realtime subscription 오류 없음

## 빈 DB로 시작하는 경우

1. **Migrations 적용**
2. **Storage bucket/policy 확인**
3. **Edge Functions 배포**
4. **Function secrets 설정**
5. **Seed 적용 여부 결정**
6. **최초 admin 계정 생성**
7. **agent 계정 생성**
8. **기본 game settings/rounds 생성 확인**
9. **공지/선물/프로필 seed 필요 여부 확인**

최초 admin/agent 생성은 현재 프로젝트의 backoffice 계정 관리 함수 또는 Supabase Dashboard/Auth를 이용할 수 있다. 실제 운영 절차는 권한자가 별도로 수행한다.

## 기존 데이터 이관하는 경우

### Database

- [ ] 기존 Supabase backup/export 확보
- [ ] 새 DB에 schema/migration 적용
- [ ] data import 순서 확인
- [ ] foreign key dependency 순서 확인
- [ ] `auth.users` 이관 정책 확인
- [ ] sequence/default/trigger 정상 여부 확인

### Auth users

주의:

- `auth.users`는 Supabase Auth 내부 테이블이므로 단순 table copy로 끝나지 않는다.
- password hash, provider identity, email confirmation 상태, MFA 등 Auth metadata 이관을 별도로 검토한다.
- 가능하면 Supabase 공식 backup/restore 또는 migration guide를 따른다.

### Storage objects

- [ ] bucket 생성
- [ ] object download/export
- [ ] 같은 path로 upload/import
- [ ] DB에 full public URL이 저장되어 있다면 새 project URL로 변환 필요 여부 확인
- [ ] DB에 path만 저장되어 있다면 `getPublicUrl`이 새 project에서 정상 생성되는지 확인

### Service role key 사용 주의

- data import script에서 service role key를 사용할 수 있다.
- script는 local secure 환경 또는 CI secret에서만 실행한다.
- import script와 log에 secret이 출력되지 않게 한다.
- 운영 DB 직접 수정은 피하고, 수정 전 백업을 필수로 확보한다.

## 배포 전 권장 검증 명령

가벼운 확인:

```powershell
git diff --check
```

```powershell
git grep -n "process.env\|NEXT_PUBLIC_\|Deno.env" -- apps/web supabase/functions
```

대상 파일 ESLint 예시:

```powershell
pnpm --filter web exec eslint <target-file-1> <target-file-2>
```

최종 배포 직전, 사용자가 명시적으로 허락한 경우에만:

```powershell
pnpm --filter web lint
```

```powershell
pnpm --filter web exec next build --webpack
```

```powershell
pnpm --filter web build
```

Windows PowerShell에서 메모리 한도를 올려야 하는 경우:

```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm --filter web build
Remove-Item Env:NODE_OPTIONS
```

## 보안 체크리스트

- [ ] 실제 secret 값을 문서에 쓰지 않는다.
- [ ] `.env.local`을 Git에 commit하지 않는다.
- [ ] `SUPABASE_SERVICE_ROLE_KEY`를 `NEXT_PUBLIC_` env로 등록하지 않는다.
- [ ] Vercel client env에 service role key를 넣지 않는다.
- [ ] Supabase Edge Function secret과 Vercel env를 구분한다.
- [ ] 운영 DB migration 전 백업한다.
- [ ] Storage object import 전 bucket policy를 확인한다.
- [ ] Auth redirect URL에 production domain이 모두 포함되어 있는지 확인한다.
