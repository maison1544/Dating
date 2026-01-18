# 커플미션 게임 API 개발 개요

## 1. 개요

커플미션의 파워볼과 사다리 게임 API를 Supabase 백엔드와 통합하여 개발합니다.

### 기술 스택

- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Frontend**: React + TypeScript
- **Deployment**: Vercel + Cloudflare DNS
- **Real-time**: Supabase Realtime Subscriptions

---

## 2. 데이터베이스 스키마

### 2.1 게임 라운드 테이블

```sql
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('powerball', 'ladder')),
  round_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'betting', 'playing', 'completed')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  result JSONB, -- 게임 결과 저장
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_type, round_number)
);

-- 파워볼 결과 예시: {"normal_balls": [27,1,3,22,24], "power_ball": 8, "normal_sum": 77}
-- 사다리 결과 예시: {"start": "left", "end": "odd", "lines": 4}
```

### 2.2 베팅 테이블

```sql
CREATE TABLE game_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  round_id UUID REFERENCES game_rounds(id) NOT NULL,
  bet_type VARCHAR(50) NOT NULL,
  bet_amount INTEGER NOT NULL CHECK (bet_amount > 0),
  odds DECIMAL(4,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  win_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bets_user ON game_bets(user_id);
CREATE INDEX idx_bets_round ON game_bets(round_id);
```

### 2.3 사용자 포인트 테이블

```sql
CREATE TABLE user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('charge', 'bet', 'win', 'refund', 'gift')),
  reference_id UUID, -- 관련 베팅/충전 ID
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API 엔드포인트 설계

### 3.1 게임 라운드 API

#### GET /api/games/:gameType/current

현재 진행 중인 라운드 조회

```typescript
interface CurrentRoundResponse {
  round_id: string;
  round_number: number;
  status: "betting" | "playing";
  time_remaining: number; // seconds
  bet_distribution?: BetDistribution[];
}
```

#### GET /api/games/:gameType/history

과거 게임 결과 조회

```typescript
interface GameHistoryResponse {
  rounds: GameRound[];
  total: number;
  page: number;
}
```

### 3.2 베팅 API

#### POST /api/bets

베팅 생성

```typescript
interface CreateBetRequest {
  round_id: string;
  bet_type: string;
  amount: number;
}

interface CreateBetResponse {
  bet_id: string;
  status: "success" | "error";
  new_balance: number;
}
```

#### GET /api/bets/my-history

내 베팅 내역 조회

### 3.3 포인트 API

#### GET /api/points/balance

잔액 조회

#### POST /api/points/charge

포인트 충전 (결제 연동)

---

## 4. Supabase Edge Functions

### 4.1 게임 라운드 관리 (Cron Job)

```typescript
// supabase/functions/game-scheduler/index.ts
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 5분마다 새 라운드 생성
  const gameTypes = ["powerball", "ladder"];

  for (const gameType of gameTypes) {
    // 현재 라운드 종료 처리
    await processCurrentRound(supabase, gameType);

    // 새 라운드 생성
    await createNewRound(supabase, gameType);
  }

  return new Response(JSON.stringify({ success: true }));
});
```

### 4.2 결과 생성 로직

#### 파워볼 결과 생성

```typescript
function generatePowerballResult() {
  const normalBalls = Array.from(
    { length: 5 },
    () => Math.floor(Math.random() * 131) // 0-130
  );
  const powerBall = Math.floor(Math.random() * 10); // 0-9
  const normalSum = normalBalls.reduce((a, b) => a + b, 0);

  return {
    normal_balls: normalBalls,
    power_ball: powerBall,
    normal_sum: normalSum,
    normal_odd_even: normalSum % 2 === 1 ? "odd" : "even",
    normal_under_over: normalSum <= 72 ? "under" : "over",
    power_odd_even: powerBall % 2 === 1 ? "odd" : "even",
    power_under_over: powerBall <= 4 ? "under" : "over",
  };
}
```

#### 사다리 결과 생성

```typescript
function generateLadderResult() {
  return {
    start: Math.random() > 0.5 ? "left" : "right",
    end: Math.random() > 0.5 ? "odd" : "even",
    lines: Math.random() > 0.5 ? 3 : 4,
  };
}
```

### 4.3 베팅 정산 로직

```typescript
async function settleBets(
  supabase: SupabaseClient,
  roundId: string,
  result: GameResult
) {
  // 해당 라운드의 모든 베팅 조회
  const { data: bets } = await supabase
    .from("game_bets")
    .select("*")
    .eq("round_id", roundId)
    .eq("status", "pending");

  for (const bet of bets) {
    const isWinner = checkWinCondition(bet.bet_type, result);
    const winAmount = isWinner ? Math.floor(bet.bet_amount * bet.odds) : 0;

    // 베팅 상태 업데이트
    await supabase
      .from("game_bets")
      .update({
        status: isWinner ? "won" : "lost",
        win_amount: winAmount,
      })
      .eq("id", bet.id);

    // 승리 시 포인트 지급
    if (isWinner) {
      await supabase.rpc("add_points", {
        p_user_id: bet.user_id,
        p_amount: winAmount,
        p_type: "win",
        p_reference_id: bet.id,
      });
    }
  }
}
```

---

## 5. 실시간 기능 (Supabase Realtime)

### 5.1 게임 상태 구독

```typescript
// Frontend: 게임 라운드 실시간 구독
const channel = supabase
  .channel("game-updates")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "game_rounds",
      filter: `game_type=eq.${gameType}`,
    },
    (payload) => {
      // 라운드 상태 업데이트 처리
      handleRoundUpdate(payload.new);
    }
  )
  .subscribe();
```

### 5.2 채팅 기능

```typescript
// 게임 채팅 채널
const chatChannel = supabase
  .channel(`game-chat-${gameType}`)
  .on("broadcast", { event: "message" }, (payload) => {
    addChatMessage(payload.payload);
  })
  .subscribe();

// 메시지 전송
chatChannel.send({
  type: "broadcast",
  event: "message",
  payload: { user: username, message: text, time: new Date() },
});
```

---

## 6. 보안 설정

### 6.1 RLS (Row Level Security) 정책

```sql
-- 베팅: 본인 것만 조회/생성 가능
ALTER TABLE game_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bets" ON game_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bets" ON game_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 포인트: 본인 것만 조회 가능
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- 게임 라운드: 모두 조회 가능
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rounds" ON game_rounds
  FOR SELECT USING (true);
```

### 6.2 베팅 검증

```sql
-- 포인트 차감 및 베팅 생성 트랜잭션
CREATE OR REPLACE FUNCTION place_bet(
  p_round_id UUID,
  p_bet_type VARCHAR,
  p_amount INTEGER,
  p_odds DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_bet_id UUID;
  v_user_id UUID := auth.uid();
  v_balance INTEGER;
  v_round_status VARCHAR;
BEGIN
  -- 라운드 상태 확인
  SELECT status INTO v_round_status
  FROM game_rounds WHERE id = p_round_id;

  IF v_round_status != 'betting' THEN
    RAISE EXCEPTION 'Betting is closed for this round';
  END IF;

  -- 잔액 확인
  SELECT balance INTO v_balance
  FROM user_points WHERE user_id = v_user_id FOR UPDATE;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 포인트 차감
  UPDATE user_points
  SET balance = balance - p_amount,
      total_spent = total_spent + p_amount
  WHERE user_id = v_user_id;

  -- 베팅 생성
  INSERT INTO game_bets (user_id, round_id, bet_type, bet_amount, odds)
  VALUES (v_user_id, p_round_id, p_bet_type, p_amount, p_odds)
  RETURNING id INTO v_bet_id;

  -- 트랜잭션 기록
  INSERT INTO point_transactions (user_id, amount, type, reference_id, description)
  VALUES (v_user_id, -p_amount, 'bet', v_bet_id, 'Game bet placed');

  RETURN v_bet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. 프론트엔드 통합

### 7.1 게임 훅 (Custom Hook)

```typescript
// hooks/useGame.ts
export function useGame(gameType: "powerball" | "ladder") {
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 현재 라운드 조회
    fetchCurrentRound();

    // 실시간 구독
    const channel = subscribeToRound(gameType, handleRoundUpdate);

    // 타이머
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(timer);
    };
  }, [gameType]);

  const placeBet = async (betType: string, amount: number) => {
    const { data, error } = await supabase.rpc("place_bet", {
      p_round_id: currentRound?.id,
      p_bet_type: betType,
      p_amount: amount,
      p_odds: BET_ODDS[betType],
    });

    if (error) throw error;
    return data;
  };

  return { currentRound, timeLeft, isLoading, placeBet };
}
```

### 7.2 기존 페이지 마이그레이션

현재 하드코딩된 `DiceGamePage.tsx`와 `LadderGamePage.tsx`를 위 훅을 사용하도록 수정:

1. 더미 데이터를 Supabase 쿼리로 대체
2. `useState` 상태를 실시간 구독으로 대체
3. 베팅 로직을 `place_bet` RPC 호출로 대체

---

## 8. 배포 체크리스트

### 8.1 Supabase 설정

- [ ] 데이터베이스 마이그레이션 적용
- [ ] RLS 정책 활성화
- [ ] Edge Functions 배포
- [ ] Cron Job 설정 (게임 스케줄러)
- [ ] Realtime 활성화

### 8.2 Vercel 설정

- [ ] 환경 변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] 도메인 연결

### 8.3 Cloudflare 설정

- [ ] DNS 레코드 설정
- [ ] SSL/TLS 설정
- [ ] 보안 규칙 설정

---

## 9. 향후 확장 계획

1. **관리자 기능**: 결과 조작 방지 및 감사 로그
2. **통계 대시보드**: 게임별 수익률, 사용자 통계
3. **이벤트 시스템**: 특별 배당, 보너스 라운드
4. **모바일 최적화**: 반응형 UI 개선
