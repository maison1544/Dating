// 초기 게임 라운드 생성 스크립트
// 실행: node scripts/init-game-rounds.js

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  console.error("Error: VITE_SUPABASE_URL environment variable is required");
  process.exit(1);
}
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error(
    "Error: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY required",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initGameRounds() {
  console.log("Initializing game rounds...");

  const now = new Date();
  const bettingEndTime = new Date(now.getTime() + 5 * 60 * 1000); // 5분 후

  // 만료된 라운드 처리
  const { data: expiredRounds } = await supabase
    .from("game_rounds")
    .select("*")
    .eq("status", "betting")
    .lt("betting_end_time", now.toISOString());

  for (const round of expiredRounds || []) {
    const result =
      round.game_type === "powerball"
        ? generatePowerballResult()
        : generateLadderResult();

    await supabase
      .from("game_rounds")
      .update({ status: "completed", end_time: now.toISOString(), result })
      .eq("id", round.id);

    console.log(
      `Completed expired round: ${round.game_type} #${round.round_number}`,
    );
  }

  // 파워볼 활성 라운드 확인
  const { data: powerballActive } = await supabase
    .from("game_rounds")
    .select("*")
    .eq("game_type", "powerball")
    .eq("status", "betting")
    .gte("betting_end_time", now.toISOString())
    .limit(1)
    .maybeSingle();

  if (!powerballActive) {
    const { data: lastPowerball } = await supabase
      .from("game_rounds")
      .select("round_number")
      .eq("game_type", "powerball")
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextRound = (lastPowerball?.round_number || 0) + 1;

    await supabase.from("game_rounds").insert({
      game_type: "powerball",
      round_number: nextRound,
      status: "betting",
      start_time: now.toISOString(),
      betting_end_time: bettingEndTime.toISOString(),
      total_bet_amount: 0,
      total_win_amount: 0,
      profit: 0,
    });

    console.log(`Created powerball round #${nextRound}`);
  }

  // 사다리 활성 라운드 확인
  const { data: ladderActive } = await supabase
    .from("game_rounds")
    .select("*")
    .eq("game_type", "ladder")
    .eq("status", "betting")
    .gte("betting_end_time", now.toISOString())
    .limit(1)
    .maybeSingle();

  if (!ladderActive) {
    const { data: lastLadder } = await supabase
      .from("game_rounds")
      .select("round_number")
      .eq("game_type", "ladder")
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextRound = (lastLadder?.round_number || 0) + 1;

    await supabase.from("game_rounds").insert({
      game_type: "ladder",
      round_number: nextRound,
      status: "betting",
      start_time: now.toISOString(),
      betting_end_time: bettingEndTime.toISOString(),
      total_bet_amount: 0,
      total_win_amount: 0,
      profit: 0,
    });

    console.log(`Created ladder round #${nextRound}`);
  }

  console.log("Done!");
}

function generatePowerballResult() {
  const normalBalls = [];
  while (normalBalls.length < 5) {
    const ball = Math.floor(Math.random() * 28) + 1;
    if (!normalBalls.includes(ball)) normalBalls.push(ball);
  }
  normalBalls.sort((a, b) => a - b);
  const powerball = Math.floor(Math.random() * 10);
  const normalSum = normalBalls.reduce((sum, ball) => sum + ball, 0);

  return {
    normalBalls,
    powerball,
    normalSum,
    normalOddEven: normalSum % 2 === 1 ? "odd" : "even",
    normalUnderOver: normalSum <= 72 ? "under" : "over",
    powerballOddEven: powerball % 2 === 1 ? "odd" : "even",
    powerballUnderOver: powerball <= 4 ? "under" : "over",
  };
}

function generateLadderResult() {
  return {
    startPosition: Math.random() < 0.5 ? "left" : "right",
    lineCount: Math.random() < 0.5 ? 3 : 4,
    oddEven: Math.random() < 0.5 ? "odd" : "even",
  };
}

initGameRounds().catch(console.error);
