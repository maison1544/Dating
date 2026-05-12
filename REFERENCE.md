# 프로젝트 구현 레퍼런스

> 이 문서는 이전 프로젝트의 아키텍처, DB 스키마 설계, 프론트엔드/백엔드 구현 방식, SQL 양식, 보안 패턴을 정리한 참조 문서입니다.
> 도메인에 종속되지 않는 범용 패턴을 중심으로 작성되었습니다.

---

## 목차

1. [모노레포 아키텍처](#1-모노레포-아키텍처)
2. [프론트엔드 구현 패턴](#2-프론트엔드-구현-패턴)
3. [백엔드 구현 패턴 (Supabase)](#3-백엔드-구현-패턴-supabase)
4. [DB 스키마 설계 패턴](#4-db-스키마-설계-패턴)
5. [SQL / RPC / 마이그레이션 양식](#5-sql--rpc--마이그레이션-양식)
6. [Edge Functions 구현 패턴](#6-edge-functions-구현-패턴)
7. [인증 및 세션 관리](#7-인증-및-세션-관리)
8. [보안 패턴](#8-보안-패턴)
9. [유틸리티 패턴](#9-유틸리티-패턴)

---

## 1. 모노레포 아키텍처

### 1.1 디렉토리 구조

```
project-root/
├── apps/
│   ├── user/          # 일반 사용자 앱 (포트: 5173)
│   ├── admin/         # 관리자 앱 (포트: 5174)
│   └── agent/         # 에이전트 앱 (포트: 5175)
├── packages/
│   └── shared/        # 공통 코드 (컴포넌트, 훅, 컨텍스트, 유틸)
│       └── src/
│           ├── app/
│           │   ├── components/   # 공통 UI 컴포넌트
│           │   ├── contexts/     # React Context (인증, 알림 등)
│           │   ├── hooks/        # 커스텀 훅 (데이터 페칭, 비즈니스 로직)
│           │   └── pages/        # 페이지 컴포넌트
│           ├── imports/          # 정적 리소스 (로고 등)
│           └── lib/              # 라이브러리 설정 (Supabase 클라이언트, 타입, 유틸)
├── scripts/           # 초기화/마이그레이션 스크립트
├── supabase/
│   └── functions/     # Edge Functions (Deno 런타임)
├── .env               # 환경변수 (git 제외)
├── .env.example       # 환경변수 템플릿
├── package.json       # npm workspaces 루트
└── tsconfig.json      # TypeScript references
```

### 1.2 npm workspaces 설정

**루트 `package.json`:**
```json
{
  "name": "project-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:user": "npm run dev --workspace=@project/user",
    "dev:admin": "npm run dev --workspace=@project/admin",
    "dev:agent": "npm run dev --workspace=@project/agent",
    "build:user": "npm run build --workspace=@project/user",
    "build:admin": "npm run build --workspace=@project/admin",
    "build:agent": "npm run build --workspace=@project/agent",
    "build": "npm run build:user && npm run build:admin && npm run build:agent"
  }
}
```

**앱 `package.json` 의존성 참조:**
```json
{
  "name": "@project/user",
  "dependencies": {
    "@project/shared": "*"
  }
}
```

> **주의**: npm workspace에서 `workspace:*` 프로토콜은 사용 불가. `"*"` 사용.

### 1.3 Vite 설정 (각 앱)

```ts
// apps/user/vite.config.ts
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  envDir: '../../',        // 루트 .env 참조 (핵심!)
  server: { port: 5173 },
})
```

### 1.4 TailwindCSS (각 앱 styles.css)

```css
@import "tailwindcss";
/* shared 패키지의 컴포넌트도 Tailwind 스캔 대상에 포함 */
@source '../../../packages/shared/src/**/*.{js,ts,jsx,tsx}';
```

### 1.5 루트 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  },
  "references": [
    { "path": "./apps/user" },
    { "path": "./apps/admin" },
    { "path": "./apps/agent" },
    { "path": "./packages/shared" }
  ]
}
```

---

## 2. 프론트엔드 구현 패턴

### 2.1 기술 스택

| 카테고리 | 라이브러리 |
|---------|-----------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 라우팅 | react-router-dom v7 |
| 스타일링 | TailwindCSS v4 |
| UI 컴포넌트 | Radix UI + shadcn/ui |
| 아이콘 | Lucide React |
| 차트 | Recharts |
| 토스트 | Sonner |
| 애니메이션 | Motion (Framer Motion) |
| 백엔드 클라이언트 | @supabase/supabase-js |

### 2.2 앱 진입점 패턴 (App.tsx)

```tsx
// 중첩 Provider 패턴: 외부 → 내부 순서로 의존성 주입
export default function App() {
  return (
    <AlertProvider>              {/* 전역 알림 */}
      <NotificationProvider>     {/* 실시간 알림 */}
        <AuthProvider>           {/* 인증 상태 */}
          <SessionTimeoutManager /> {/* 세션 타임아웃 (UI 없음) */}
          <ProfileProvider>      {/* 프로필 데이터 */}
            <BrowserRouter>
              <Toaster />
              <ScrollToTop />
              <div className="min-h-screen bg-black">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/protected" element={
                      <RequireAuth><ProtectedPage /></RequireAuth>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </ProfileProvider>
        </AuthProvider>
      </NotificationProvider>
    </AlertProvider>
  );
}
```

### 2.3 인증 가드 컴포넌트

```tsx
function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, isLoading, isAdmin, isAgent } = useAuth();

  if (isLoading) return null;              // 로딩 중 깜빡임 방지
  if (isAdmin || isAgent) return <Navigate to="/" replace />; // 역할 분리
  if (!user) return <Navigate to="/login" replace />;         // 미인증

  return children;
}
```

### 2.4 Context 패턴

```tsx
// 1. 타입 정의
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// 2. Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Provider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화: onAuthStateChange 리스너
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. 커스텀 훅 (안전한 사용)
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

### 2.5 커스텀 Alert Context (window.alert 대체)

```tsx
// window.alert를 가로채서 커스텀 UI로 대체
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertPayload & { isOpen: boolean } | null>(null);

  const showAlert = useCallback((payload: AlertPayload) => {
    setAlert({ ...payload, isOpen: true });
  }, []);

  // window.alert 오버라이드
  useEffect(() => {
    const prevAlert = window.alert;
    window.alert = (message?: any) => {
      showAlert({ title: "알림", message: String(message ?? ""), type: "info" });
    };
    return () => { window.alert = prevAlert; };
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlert isOpen={!!alert?.isOpen} onClose={onClose} {...alert} />
    </AlertContext.Provider>
  );
}
```

### 2.6 데이터 페칭 훅 패턴

```tsx
// 표준 CRUD 훅 패턴
export function useItems() {
  const [items, setItems] = useState<Tables<"items">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error);
    else setItems(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createItem = async (item: TablesInsert<"items">) => {
    const { data, error } = await supabase.from("items").insert(item).select().single();
    if (!error) fetchItems(); // 성공 시 자동 리프레시
    return { data, error };
  };

  const updateItem = async (id: string, updates: Partial<Tables<"items">>) => {
    const { error } = await supabase
      .from("items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) fetchItems();
    return { error };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (!error) fetchItems();
    return { error };
  };

  return { items, isLoading, error, refetch: fetchItems, createItem, updateItem, deleteItem };
}
```

### 2.7 조건부 페칭 (userId 의존)

```tsx
export function useUserData(userId: string | undefined) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) { setData([]); setIsLoading(false); return; }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_data")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setData(data || []);
    setIsLoading(false);
  }, [userId]); // userId 변경 시 자동 재페칭

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, refetch: fetchData };
}
```

---

## 3. 백엔드 구현 패턴 (Supabase)

### 3.1 Supabase 클라이언트 설정

```ts
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// 일반 사용자용 클라이언트 (기본)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "sb-user-auth-token",     // 고유 키로 세션 분리
  },
});

// 관리자/에이전트용 클라이언트 (별도 세션)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,            // URL 세션 감지 비활성화
    storageKey: "sb-admin-auth-token",    // 별도 스토리지 키
  },
});
```

> **핵심**: 동일 anon key를 사용하되, `storageKey`를 분리하여 유저/관리자 세션이 충돌하지 않도록 함.

### 3.2 환경변수 관리

```env
# .env.example (루트)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- `VITE_` 접두사: Vite가 클라이언트 번들에 포함 (anon key만 허용)
- `SUPABASE_SERVICE_ROLE_KEY`: **절대 클라이언트에 노출 금지** (Edge Functions에서만 `Deno.env.get()` 사용)
- `.env`는 `.gitignore`에 포함, `.env.example`만 커밋

### 3.3 데이터 접근 패턴 비교

| 작업 유형 | 구현 방식 | 이유 |
|----------|----------|------|
| 단순 CRUD (읽기/쓰기) | `supabase.from("table").select/insert/update/delete()` | RLS가 보호, 직접 호출이 가장 빠름 |
| 트랜잭션 필요 (포인트 차감 + 기록 생성) | `supabase.rpc("function_name")` | PostgreSQL RPC로 원자적 처리 |
| 서버 전용 로직 (Auth Admin API 필요) | Edge Function + `service_role_key` | 클라이언트에 service_role 노출 불가 |
| IP 추적/외부 API 호출 | Edge Function | 서버에서만 IP 헤더 접근 가능 |

### 3.4 Edge Function 호출 패턴

```tsx
// 패턴 1: supabase.functions.invoke() (간단한 호출)
const { data, error } = await supabase.functions.invoke("function-name", {
  body: { key: "value" },
});

// 패턴 2: fetch() 직접 호출 (세밀한 제어 필요 시)
const token = session.access_token;
const response = await fetch(`${supabaseUrl}/functions/v1/function-name`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: anonKey,                    // 필수
    Authorization: `Bearer ${token}`,   // 사용자 JWT
  },
  body: JSON.stringify({ key: "value" }),
});

// 패턴 3: 관리자 전용 Edge Function 호출 (별도 토큰 관리)
const invokeBackofficeFunction = async <T>(
  functionName: string,
  accessToken: string,
  body: unknown,
): Promise<T> => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!resp.ok) {
    const parsed = await resp.json().catch(() => ({}));
    throw new Error(parsed.error || "요청 처리 중 오류가 발생했습니다.");
  }

  return (await resp.json()) as T;
};
```

### 3.5 관리자 토큰 갱신 패턴

```tsx
const getValidAccessToken = useCallback(async (): Promise<string> => {
  // 1. 토큰 갱신 시도
  const { data: refreshed, error: refreshError } = await supabaseAdmin.auth.refreshSession();
  if (!refreshError && refreshed?.session?.access_token) {
    return refreshed.session.access_token;
  }

  // 2. 갱신 실패 시 기존 세션 확인
  const { data: { session } } = await supabaseAdmin.auth.getSession();
  if (!session?.access_token) {
    throw new Error("로그인이 필요합니다.");
  }

  // 3. 만료 여부 확인
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    throw new Error("세션이 만료되었습니다.");
  }

  return session.access_token;
}, []);
```

---

## 4. DB 스키마 설계 패턴

### 4.1 공통 컬럼 패턴

모든 테이블에 일관되게 적용하는 컬럼:

```sql
-- PK: UUID (auth.users.id와 연동 또는 자동 생성)
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

-- 타임스탬프 (UTC, timestamptz 사용)
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),

-- 소프트 삭제 (필요 시)
deleted_at TIMESTAMPTZ NULL
```

### 4.2 사용자 프로필 테이블 패턴

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),  -- auth.users와 1:1
  email VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  nickname VARCHAR NOT NULL,
  phone VARCHAR,
  profile_image VARCHAR,

  -- 포인트/잔액 (bigint 사용, 정수 연산)
  points BIGINT DEFAULT 0,
  total_deposited BIGINT DEFAULT 0,
  total_withdrawn BIGINT DEFAULT 0,

  -- 상태 관리 (CHECK 제약조건)
  status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'deleted', 'rejected')),

  -- 온라인 상태
  is_online BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ DEFAULT now(),

  -- 로그인 추적
  join_ip VARCHAR,
  last_login_ip VARCHAR,
  last_login_at TIMESTAMPTZ,

  -- 은행 정보 (출금용)
  bank VARCHAR,
  account_number VARCHAR,
  account_holder VARCHAR,

  -- 관계
  agent_id UUID REFERENCES agents(id),
  agent_assigned_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### 4.3 관리자/에이전트 분리 테이블 패턴

```sql
-- 관리자 테이블 (역할 기반)
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'admin'
    CHECK (role IN ('super_admin', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 에이전트 테이블 (추천 코드 기반)
CREATE TABLE agents (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  referral_code VARCHAR UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- 에이전트 전용 집계 컬럼
  assigned_profile_ids UUID[] DEFAULT '{}',
  total_revenue BIGINT DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

> **백오피스 로그인 방식**: `username@backoffice.local` 형식의 이메일을 내부적으로 생성하여 `auth.signInWithPassword()`에 사용. 클라이언트에서는 username만 입력받고, `${username}@backoffice.local`로 변환하여 로그인.

### 4.4 포인트 트랜잭션 패턴 (잔액 추적)

```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  type VARCHAR NOT NULL
    CHECK (type IN (
      'deposit', 'charge', 'withdrawal', 'withdraw_pending',
      'withdraw_refund', 'withdraw_rollback',
      'bet', 'win', 'lose',
      'gift_send', 'gift_receive', 'gift_buy', 'gift_sell',
      'admin_adjust', 'bonus'
    )),
  amount BIGINT NOT NULL,              -- 양수: 증가, 음수: 감소
  balance_before BIGINT NOT NULL,      -- 변경 전 잔액
  balance_after BIGINT NOT NULL,       -- 변경 후 잔액
  description VARCHAR,
  related_type VARCHAR,                -- 관련 테이블명
  related_id UUID,                     -- 관련 레코드 ID
  admin_id UUID REFERENCES admins(id), -- 관리자 처리 시
  created_at TIMESTAMPTZ DEFAULT now()
);
```

> **핵심**: `balance_before`/`balance_after`를 모든 트랜잭션에 기록하여 잔액 추적 가능. RPC 내에서 SELECT FOR UPDATE로 동시성 제어.

### 4.5 요청/승인 워크플로우 패턴

```sql
-- 출금 요청 (pending → approved/rejected)
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  amount BIGINT NOT NULL,
  bank VARCHAR NOT NULL,
  account_number VARCHAR NOT NULL,
  account_holder VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  processed_by UUID REFERENCES admins(id),
  processed_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.6 시스템 설정 테이블 패턴

```sql
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 사용 예
INSERT INTO system_settings (key, value, description) VALUES
  ('session_timeout_user', '30', '사용자 세션 타임아웃(분)'),
  ('session_timeout_admin', '60', '관리자 세션 타임아웃(분)'),
  ('maintenance_mode', 'false', '점검 모드');
```

### 4.7 감사 로그 패턴

```sql
CREATE TABLE admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id),
  action VARCHAR NOT NULL,           -- 'approve_user', 'reject_withdrawal' 등
  target_type VARCHAR,               -- 'user_profiles', 'withdrawal_requests' 등
  target_id UUID,
  changes JSONB,                     -- { before: {...}, after: {...} }
  ip_address VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.8 로그인 로그 패턴

```sql
CREATE TABLE login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_type VARCHAR CHECK (user_type IN ('user', 'admin', 'agent')),
  ip_address VARCHAR NOT NULL,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  login_status VARCHAR DEFAULT 'success'
    CHECK (login_status IN ('success', 'failed', 'blocked')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. SQL / RPC / 마이그레이션 양식

### 5.1 RPC 함수 기본 양식

```sql
CREATE OR REPLACE FUNCTION public.my_function(
  p_user_id UUID,
  p_amount BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER                         -- service_role 권한 실행
SET search_path = public, auth, extensions  -- search_path 명시 (보안)
AS $$
DECLARE
  v_current_points BIGINT;
  v_result JSONB;
BEGIN
  -- 1. 잔액 조회 (동시성 제어)
  SELECT points INTO v_current_points
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;                            -- 행 잠금

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_points < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- 2. 잔액 차감
  UPDATE user_profiles
  SET points = points - p_amount,
      updated_at = now()
  WHERE id = p_user_id;

  -- 3. 트랜잭션 기록
  INSERT INTO point_transactions (user_id, type, amount, balance_before, balance_after, description)
  VALUES (p_user_id, 'withdrawal', -p_amount, v_current_points, v_current_points - p_amount, '출금 신청');

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'previous_balance', v_current_points,
      'new_balance', v_current_points - p_amount
    )
  );
END;
$$;
```

### 5.2 세션 관리 RPC

```sql
-- heartbeat_session: 활동 기록 + 유효성 반환
CREATE OR REPLACE FUNCTION public.heartbeat_session()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_last_active TIMESTAMPTZ;
  v_timeout_minutes INT;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_authenticated');
  END IF;

  -- 역할 판별 및 last_active_at 갱신
  IF EXISTS (SELECT 1 FROM admins WHERE id = v_user_id) THEN
    v_role := 'admin';
    UPDATE admins SET last_active_at = now() WHERE id = v_user_id
    RETURNING last_active_at INTO v_last_active;
  ELSIF EXISTS (SELECT 1 FROM agents WHERE id = v_user_id) THEN
    v_role := 'agent';
    UPDATE agents SET last_active_at = now() WHERE id = v_user_id
    RETURNING last_active_at INTO v_last_active;
  ELSE
    v_role := 'user';
    UPDATE user_profiles SET last_active_at = now(), is_online = true WHERE id = v_user_id
    RETURNING last_active_at INTO v_last_active;
  END IF;

  -- 타임아웃 설정 조회
  SELECT COALESCE(value::INT, 30) INTO v_timeout_minutes
  FROM system_settings
  WHERE key = 'session_timeout_' || v_role;

  RETURN jsonb_build_object(
    'valid', true,
    'timeout_minutes', v_timeout_minutes
  );
END;
$$;

-- check_session_valid: 세션 유효성 확인 (타임아웃 체크)
CREATE OR REPLACE FUNCTION public.check_session_valid()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_last_active TIMESTAMPTZ;
  v_timeout_minutes INT := 30;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_authenticated');
  END IF;

  -- 역할별 last_active_at 조회
  SELECT last_active_at INTO v_last_active FROM admins WHERE id = v_user_id;
  IF FOUND THEN v_role := 'admin';
  ELSE
    SELECT last_active_at INTO v_last_active FROM agents WHERE id = v_user_id;
    IF FOUND THEN v_role := 'agent';
    ELSE
      SELECT last_active_at INTO v_last_active FROM user_profiles WHERE id = v_user_id;
      v_role := 'user';
    END IF;
  END IF;

  -- 타임아웃 설정 조회
  SELECT COALESCE(value::INT, 30) INTO v_timeout_minutes
  FROM system_settings
  WHERE key = 'session_timeout_' || v_role;

  -- 타임아웃 체크
  IF v_last_active IS NOT NULL AND
     v_last_active < now() - (v_timeout_minutes || ' minutes')::INTERVAL THEN
    -- 사용자인 경우 오프라인 처리
    IF v_role = 'user' THEN
      UPDATE user_profiles SET is_online = false WHERE id = v_user_id;
    END IF;
    RETURN jsonb_build_object('valid', false, 'reason', 'session_expired');
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;
```

### 5.3 트랜잭션 안전한 출금 RPC (race condition 방지)

```sql
CREATE OR REPLACE FUNCTION public.request_withdrawal_v2(
  p_user_id UUID,
  p_amount BIGINT,
  p_bank TEXT,
  p_account_number TEXT,
  p_account_holder TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points BIGINT;
  v_new_balance BIGINT;
  v_withdrawal_id UUID;
BEGIN
  -- SELECT FOR UPDATE로 동시 접근 방지
  SELECT points INTO v_current_points
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_points < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', '잔액이 부족합니다.');
  END IF;

  v_new_balance := v_current_points - p_amount;

  -- 1. 포인트 즉시 차감
  UPDATE user_profiles
  SET points = v_new_balance, updated_at = now()
  WHERE id = p_user_id;

  -- 2. 출금 요청 생성
  INSERT INTO withdrawal_requests (user_id, amount, bank, account_number, account_holder, status)
  VALUES (p_user_id, p_amount, p_bank, p_account_number, p_account_holder, 'pending')
  RETURNING id INTO v_withdrawal_id;

  -- 3. 트랜잭션 기록
  INSERT INTO point_transactions (
    user_id, type, amount, balance_before, balance_after,
    description, related_type, related_id
  ) VALUES (
    p_user_id, 'withdraw_pending', -p_amount, v_current_points, v_new_balance,
    '출금 신청', 'withdrawal_requests', v_withdrawal_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'withdrawal_id', v_withdrawal_id,
      'previous_balance', v_current_points,
      'new_balance', v_new_balance
    ),
    'message', '출금 신청이 완료되었습니다.'
  );
END;
$$;
```

### 5.4 RLS (Row Level Security) 정책 양식

```sql
-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자: 자기 데이터만 조회
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 사용자: 자기 데이터만 수정
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 관리자: 모든 데이터 조회 (is_admin RPC 사용)
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 관리자: 모든 데이터 수정
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- 에이전트: 담당 사용자만 조회
CREATE POLICY "Agents can read assigned users"
  ON user_profiles FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );
```

### 5.5 마이그레이션 적용 방식 (Supabase MCP)

```typescript
// Supabase MCP의 apply_migration 도구 사용
await mcp6_apply_migration({
  project_id: "your-project-id",
  name: "add_session_timeout_settings",
  query: `
    INSERT INTO system_settings (key, value, description)
    VALUES ('session_timeout_user', '30', '사용자 세션 타임아웃(분)')
    ON CONFLICT (key) DO NOTHING;
  `
});
```

---

## 6. Edge Functions 구현 패턴

### 6.1 기본 구조

```ts
// supabase/functions/my-function/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS 헤더 (배포 시 origin을 실제 도메인으로 제한)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// JSON 응답 헬퍼
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Bearer 토큰 추출
function getBearer(req: Request): string | null {
  const auth = req.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // 환경변수
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing env" }, 500);
  }

  // JWT 검증
  const jwt = getBearer(req);
  if (!jwt) return jsonResponse({ error: "Missing auth token" }, 401);

  // 서비스 롤 클라이언트 (관리자 작업용)
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // 사용자 검증
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(jwt);
  if (authError || !authData?.user) {
    return jsonResponse({ error: "Invalid auth token" }, 401);
  }

  const userId = authData.user.id;

  try {
    // 비즈니스 로직 ...
    return jsonResponse({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
```

### 6.2 관리자 권한 검증 패턴

```ts
// JWT에서 사용자 확인 후, admins 테이블에서 관리자 여부 검증
const requesterId = authData.user.id;

const { data: adminRow, error: adminError } = await supabaseAdmin
  .from("admins")
  .select("id, role")
  .eq("id", requesterId)
  .maybeSingle();

if (adminError || !adminRow) {
  return jsonResponse({ error: "Admin privileges required" }, 403);
}
```

### 6.3 클라이언트 IP 추출 패턴

```ts
function getClientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
```

### 6.4 Auth Admin API 사용 패턴

```ts
// 사용자 생성 (service_role 필요)
const { data: createdAuth, error: authCreateErr } =
  await supabaseAdmin.auth.admin.createUser({
    email: "username@backoffice.local",
    password: "password",
    email_confirm: true,    // 이메일 확인 건너뜀
  });

// 비밀번호 변경
await supabaseAdmin.auth.admin.updateUserById(userId, {
  password: newPassword,
});

// 사용자 삭제
await supabaseAdmin.auth.admin.deleteUser(userId);

// 세션 강제 만료 (Global logout)
await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}/logout?scope=global`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  },
});
```

### 6.5 트랜잭션 보상 패턴 (생성 실패 시 롤백)

```ts
// 1. Auth 사용자 생성
const { data: createdAuth, error: authErr } =
  await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
if (authErr) return jsonResponse({ error: authErr.message }, 400);

// 2. 프로필 레코드 삽입
const { error: insertErr } = await supabaseAdmin
  .from("profiles")
  .insert({ id: createdAuth.user.id, username, name });

// 3. 실패 시 Auth 사용자도 삭제 (롤백)
if (insertErr) {
  await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
  return jsonResponse({ error: insertErr.message }, 400);
}
```

---

## 7. 인증 및 세션 관리

### 7.1 인증 방식 비교

| 역할 | 로그인 방식 | Supabase 클라이언트 | storageKey |
|------|-----------|-------------------|------------|
| 일반 사용자 | 이메일 + 비밀번호 | `supabase` | `sb-user-auth-token` |
| 관리자/에이전트 | username → `@backoffice.local` 변환 | `supabaseAdmin` | `sb-admin-auth-token` |

### 7.2 서버 기반 세션 타임아웃

```
[클라이언트] DOM 이벤트 감지 (mousemove, keydown, scroll, touchstart)
     ↓ (throttle: 2분 간격)
[클라이언트] → supabase.rpc("heartbeat_session")
     ↓
[서버] last_active_at 갱신 + 유효성 반환
     ↓
[클라이언트] 1분마다 → supabase.rpc("check_session_valid")
     ↓ (valid: false, reason: "session_expired")
[클라이언트] showAlert() + signOut()
```

### 7.3 역할 기반 접근 제어

```tsx
// AuthContext에서 역할 판별
const isAdmin = !!(adminAccount && "role" in adminAccount &&
  (adminAccount.role === "admin" || adminAccount.role === "super_admin"));
const isAgent = !!(adminAccount && "referral_code" in adminAccount);

// 로그인 시 역할 검증 (에이전트가 관리자 페이지에 로그인 시도 차단)
if (expectedRole === "admin" && !isAdminAccount) {
  await supabaseAdmin.auth.signOut();
  return { error: new Error("에이전트 계정은 에이전트 로그인 페이지를 이용해주세요.") };
}
```

### 7.4 계정 상태 검증

```tsx
// 로그인 시 계정 상태 확인
if (userProfile.status !== "active") {
  await supabase.auth.signOut();
  const message =
    userProfile.status === "pending"   ? "관리자 승인 대기 중입니다." :
    userProfile.status === "suspended" ? "정지된 계정입니다." :
    "로그인할 수 없는 계정 상태입니다.";
  return { error: new Error(message) };
}
```

---

## 8. 보안 패턴

### 8.1 체크리스트

| 항목 | 구현 |
|------|------|
| RLS 활성화 | 모든 public 테이블에 `ENABLE ROW LEVEL SECURITY` |
| 클라이언트 키 | `anon key`만 사용 (`service_role key`는 Edge Functions에서만) |
| JWT 검증 | Edge Functions에서 수동 검증 (`verify_jwt: false` + 코드 내 검증) |
| SECURITY DEFINER | RPC 함수에 `SET search_path = public` 필수 지정 |
| 동시성 제어 | 포인트 차감 시 `SELECT ... FOR UPDATE` |
| 입력 검증 | Edge Functions에서 모든 입력값 검증 후 처리 |
| CORS | 프로덕션 배포 시 `Access-Control-Allow-Origin`을 실제 도메인으로 제한 |
| 환경변수 | `.env` 파일 git 미커밋, `.env.example`만 커밋 |
| 세션 분리 | 유저/관리자 클라이언트별 `storageKey` 분리 |
| 강제 로그아웃 | Auth Admin API + Realtime 채널 브로드캐스트 |

### 8.2 Edge Function JWT 수동 검증 이유

`verify_jwt: false`로 설정하고 코드 내에서 수동 검증하는 이유:
- OPTIONS preflight 요청이 JWT 없이 오므로 자동 검증 시 CORS 에러 발생
- 수동 검증으로 더 세밀한 에러 메시지 제공 가능
- 관리자 권한 체크를 JWT 검증과 함께 수행

### 8.3 RLS 정책 성능 팁

```sql
-- ❌ 느림: RPC 호출을 매 행마다 실행
USING (is_admin(auth.uid()))

-- ✅ 빠름: EXISTS 서브쿼리 (인덱스 활용)
USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()))
```

---

## 9. 유틸리티 패턴

### 9.1 KST 날짜 유틸리티

```ts
// UTC → KST 포맷 (Intl.DateTimeFormat 사용)
export function formatKST(
  date: Date | string | null,
  format: "full" | "date" | "time" | "datetime" = "datetime"
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;

  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    second: format === "full" ? "2-digit" : undefined,
    hour12: false,
  });

  const parts = fmt.formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";

  if (format === "date") return `${get("year")}-${get("month")}-${get("day")}`;
  if (format === "time") return `${get("hour")}:${get("minute")}`;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

// KST 기준 하루의 시작/끝 (UTC ISO string 반환, DB 쿼리용)
export function getStartOfDayKST(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0)).toISOString();
}

export function getEndOfDayKST(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999)).toISOString();
}

// 상대적 시간 표시
export function relativeTime(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return formatKST(d, "date");
}
```

### 9.2 Supabase 타입 생성

```bash
# 자동 타입 생성 (Supabase CLI)
npx supabase gen types typescript --project-id <project-id> > packages/shared/src/lib/database.types.ts
```

```ts
// 타입 활용
import type { Tables, TablesInsert } from "../../lib/database.types";

type UserProfile = Tables<"user_profiles">;
type NewUser = TablesInsert<"user_profiles">;
```

### 9.3 Realtime 구독 패턴

```tsx
useEffect(() => {
  const channel = supabase
    .channel("my-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "my_table", filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setItems(prev => [payload.new as Item, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as Item : i));
        } else if (payload.eventType === "DELETE") {
          setItems(prev => prev.filter(i => i.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [userId]);
```

### 9.4 페이지네이션 패턴

```tsx
const PAGE_SIZE = 20;

const fetchPage = async (page: number) => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("items")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return { data: data || [], totalCount: count || 0 };
};
```

### 9.5 대량 데이터 조회 패턴

```tsx
// Supabase는 기본 1000행 제한 → 페이지 분할 조회
const fetchAll = async () => {
  const pageSize = 1000;
  const maxRows = 20000;
  const allData = [];

  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < pageSize) break; // 마지막 페이지
  }

  return allData;
};
```

---

## 부록: 주요 의존성 버전

| 패키지 | 버전 |
|--------|------|
| React | 18.3.1 |
| TypeScript | ^5.6.3 |
| Vite | 6.3.5 |
| TailwindCSS | 4.1.12 |
| @supabase/supabase-js | ^2.47.10 |
| react-router-dom | ^7.10.1 |
| Lucide React | 0.487.0 |
| Recharts | 2.15.2 |
| Radix UI | 각 컴포넌트별 최신 |
| Sonner | 2.0.3 |
| date-fns | 3.6.0 |
| Motion | 12.23.24 |
