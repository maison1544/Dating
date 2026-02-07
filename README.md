# Dating Platform - Monorepo

프리미엄 매칭 서비스 플랫폼. 유저/관리자/에이전트 3개 앱으로 분리된 모노레포 구조.

## 구조

```
DatingDesignPrototype/
├── apps/
│   ├── user/        # 유저 앱 (port 5173)
│   ├── admin/       # 관리자 앱 (port 5174)
│   └── agent/       # 에이전트 앱 (port 5175)
├── packages/
│   └── shared/      # 공통 코드 (컴포넌트, 컨텍스트, hooks, lib, 타입)
├── supabase/        # Edge Functions, 마이그레이션
├── scripts/         # 유틸리티 스크립트
└── docs/            # 문서
```

## 기술 스택

- **Frontend**: React 18, TypeScript, Vite 6
- **UI**: Tailwind CSS 4, shadcn/ui, Radix UI, MUI, Lucide Icons
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions, Storage, Realtime)
- **Monorepo**: npm workspaces

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

루트에 `.env` 파일 생성 (`.env.example` 참고):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 개발 서버 실행

```bash
# 각 앱 개별 실행
npm run dev:user     # http://localhost:5173
npm run dev:admin    # http://localhost:5174
npm run dev:agent    # http://localhost:5175
```

### 4. 빌드

```bash
npm run build:user
npm run build:admin
npm run build:agent
npm run build        # 전체 빌드
```

## Vercel 배포

각 앱을 별도 Vercel 프로젝트로 생성합니다.

| 앱 | Root Directory | 도메인 예시 |
|---|---|---|
| user | `apps/user` | couplemission.com |
| admin | `apps/admin` | backoffice-dashboard.com |
| agent | `apps/agent` | partner-portal.com |

각 프로젝트의 Environment Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정합니다.

## Supabase 초기 설정

1. Supabase 프로젝트 생성
2. `supabase/functions/` 하위 Edge Functions 배포
3. Storage 버킷 생성: `profile-images`, `chat-profile-images`, `chat-images` (public)
4. 관리자 계정은 Edge Function `admin-create-backoffice-account`로 생성

## 주요 기능

- **유저**: 회원가입/로그인, 프로필 관리, 실시간 채팅, 포인트 충전/출금, 선물, 미니게임 (사다리/파워볼), 랭킹
- **관리자**: 대시보드(통계), 회원 관리, 관리자 계정 관리, 입출금 관리, 공지사항, 채팅 프로필 관리, 기프트 관리, 미니게임 관리
- **에이전트**: 에이전트 대시보드, 배정 회원 관리, 채팅 관리, 선물 관리
