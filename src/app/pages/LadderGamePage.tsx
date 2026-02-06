import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle, History, X } from "lucide-react";
import { BetHistoryPanel } from "../components/BetHistoryPanel";
import { QuickAmountButtons } from "../components/QuickAmountButtons";
import {
  useCurrentRoundEdge,
  useGameSettings,
  usePlaceBet,
  useGameChat,
  useSendGameChat,
  useMyGameBets,
  useGameHistory,
} from "../hooks/useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { formatKST, getDisplayRoundNumber } from "../../lib/dateUtils";

export function LadderGamePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showAlert } = useAlert();

  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [overlayResult, setOverlayResult] = useState<{
    roundNumber: number;
    start: string;
    end: string;
    lines: number;
  } | null>(null);
  const lastShownRoundRef = useRef<string | null>(null);
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseLadderResult = (result: unknown) => {
    if (
      typeof result !== "object" ||
      result === null ||
      Array.isArray(result)
    ) {
      return undefined;
    }

    const record = result as Record<string, unknown>;

    const start =
      record.startPosition === "left"
        ? "좌"
        : record.startPosition === "right"
          ? "우"
          : "좌";

    const end =
      record.oddEven === "odd" ? "홀" : record.oddEven === "even" ? "짝" : "홀";

    let lines = 4;
    if (record.lineCount === 3 || record.lineCount === 4) {
      lines = record.lineCount;
    }

    return {
      start,
      end,
      lines,
    };
  };

  // Supabase hooks
  const {
    round: currentRoundData,
    completedRound,
    remaining_seconds: timeLeft,
    isLoading: roundLoading,
  } = useCurrentRoundEdge("ladder");
  const { settings: gameSettings } = useGameSettings("ladder", {
    enableRealtime: true,
  });
  const { placeBet } = usePlaceBet();
  const { messages: gameChatMessages, refetch: refetchGameChat } =
    useGameChat("ladder");
  const { sendMessage: sendGameMessage } = useSendGameChat();
  const { bets: myBetsData, refetch: refetchBets } = useMyGameBets(profile?.id);
  const { history: gameHistoryData } = useGameHistory("ladder");

  const [betAmount, setBetAmount] = useState("");
  const [selectedBet, setSelectedBet] = useState<{
    type: string;
    label: string;
    odds: number;
  } | null>(null);

  // 사다리 결과 (출발: 좌/우, 도착: 홀/짝, 줄수: 3 or 4)
  const [ladderResult, setLadderResult] = useState({
    start: "좌", // 좌 or 우
    end: "홀", // 홀 or 짝
    lines: 4, // 3 or 4
  });

  const isRolling = false;
  const [showBetConfirm, setShowBetConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);

  // 현재 라운드 정보
  const currentRound = getDisplayRoundNumber(currentRoundData?.round_number);
  const currentPoints = profile?.points || 0;

  const resolvedSettings = (() => {
    const enabledByBetType: Record<string, boolean> = {};
    const oddsByBetType: Record<string, number> = {};

    const oddsJson: any = gameSettings?.odds;
    if (oddsJson && typeof oddsJson === "object") {
      if (oddsJson.enabled && typeof oddsJson.enabled === "object") {
        Object.entries(oddsJson.enabled).forEach(([k, v]) => {
          if (typeof v === "boolean") enabledByBetType[k] = v;
        });
      }
      if (oddsJson.odds && typeof oddsJson.odds === "object") {
        Object.entries(oddsJson.odds).forEach(([k, v]) => {
          if (typeof v === "number") oddsByBetType[k] = v;
        });
      }
      Object.entries(oddsJson).forEach(([k, v]) => {
        if (typeof v === "number") oddsByBetType[k] = v;
        if (typeof v === "object" && v && typeof (v as any).odds === "number") {
          oddsByBetType[k] = (v as any).odds;
        }
        if (
          typeof v === "object" &&
          v &&
          typeof (v as any).enabled === "boolean"
        ) {
          enabledByBetType[k] = (v as any).enabled;
        }
      });
    }

    return {
      isActive: gameSettings?.is_active ?? true,
      minBet: gameSettings?.min_bet ?? null,
      maxBet: gameSettings?.max_bet ?? null,
      durationSeconds:
        gameSettings?.betting_end_seconds ??
        gameSettings?.round_duration_seconds ??
        300,
      enabledByBetType,
      oddsByBetType,
    };
  })();

  const canBet =
    !!profile &&
    currentRoundData?.status === "betting" &&
    !roundLoading &&
    timeLeft > 0 &&
    resolvedSettings.isActive;

  const roundStatus = currentRoundData?.status;
  const isBettingPhase = roundStatus === "betting" && timeLeft > 0;
  const isPlayingPhase = roundStatus === "playing" && timeLeft > 0;
  const statusLabel = roundLoading
    ? "불러오는 중"
    : isBettingPhase
      ? "배팅 중"
      : isPlayingPhase
        ? "게임 진행중"
        : "결과 처리중";
  const statusClass = roundLoading
    ? "bg-gray-600"
    : isBettingPhase
      ? "bg-green-500"
      : isPlayingPhase
        ? "bg-blue-500"
        : "bg-yellow-500";
  const getDurationSeconds = (
    start?: string | null,
    end?: string | null,
  ): number | null => {
    if (!start || !end) return null;
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
    return Math.max(1, Math.ceil((endMs - startMs) / 1000));
  };
  const progressTotalSeconds =
    (roundStatus === "playing"
      ? getDurationSeconds(
          currentRoundData?.betting_end_time,
          currentRoundData?.end_time,
        )
      : null) ??
    getDurationSeconds(
      currentRoundData?.start_time,
      currentRoundData?.betting_end_time,
    ) ??
    (resolvedSettings.durationSeconds || 300);
  const progressPercent = Math.min(
    100,
    Math.max(0, (timeLeft / progressTotalSeconds) * 100),
  );

  const [chatMessage, setChatMessage] = useState("");

  // Transform Supabase data for display
  const chatMessages = gameChatMessages.map((msg: any) => ({
    id: msg.id,
    user: msg.nickname || "익명",
    message: msg.message,
    time: formatKST(msg.created_at, "time"),
  }));

  // 사다리 및 파워볼 배팅 타입 한글 변환
  const translateLadderBetType = (betType: string): string => {
    const betTypeMap: Record<string, string> = {
      // 사다리 배팅
      leftStart: "좌출발",
      rightStart: "우출발",
      line3: "3줄",
      line4: "4줄",
      oddEnd: "홀",
      evenEnd: "짝",
      left3Even: "좌3짝",
      left4Odd: "좌4홀",
      right3Odd: "우3홀",
      right4Even: "우4짝",
      leftThreeEven: "좌3짝",
      leftFourOdd: "좌4홀",
      rightThreeOdd: "우3홀",
      rightFourEven: "우4짝",
      // 파워볼 배팅 (일반볼)
      "normal-odd": "일반볼-홀",
      "normal-even": "일반볼-짝",
      "normal-under": "일반볼-언더",
      "normal-over": "일반볼-오버",
      // 파워볼 배팅 (파워볼)
      "power-odd": "파워볼-홀",
      "power-even": "파워볼-짝",
      "power-under": "파워볼-언더",
      "power-over": "파워볼-오버",
      "powerball-odd": "파워볼-홀",
      "powerball-even": "파워볼-짝",
      "powerball-under": "파워볼-언더",
      "powerball-over": "파워볼-오버",
    };
    return betTypeMap[betType] || betType;
  };

  const myBets = myBetsData.map((bet: any) => ({
    id: bet.id,
    type: bet.bet_type || "",
    amount: bet.bet_amount,
    result: bet.status === "won" ? "승" : bet.status === "lost" ? "패" : "대기",
    round: getDisplayRoundNumber(bet.game_rounds?.round_number),
    betTime: formatKST(bet.created_at, "datetime"),
    winAmount: bet.win_amount || 0,
    gameType: bet.game_rounds?.game_type || "",
  }));

  const gameResults = gameHistoryData.map((round: any) => {
    const parsed = parseLadderResult(round.result);
    return {
      round: getDisplayRoundNumber(round.round_number),
      start: parsed?.start ?? "좌",
      end: parsed?.end ?? "홀",
      lines: parsed?.lines ?? 4,
    };
  });

  const betOptions = {
    leftStart: { label: "좌출발", odds: 1.95, color: "red" },
    rightStart: { label: "우출발", odds: 1.95, color: "blue" },
    line3: { label: "3줄", odds: 1.95, color: "purple" },
    line4: { label: "4줄", odds: 1.95, color: "orange" },
    oddEnd: { label: "홀", odds: 1.95, color: "red" },
    evenEnd: { label: "짝", odds: 1.95, color: "blue" },
    // 묶음 배팅 (3개 조건 모두 맞추기)
    left3Even: { label: "좌3짝", odds: 3.8, color: "pink" },
    left4Odd: { label: "좌4홀", odds: 3.8, color: "cyan" },
    right3Odd: { label: "우3홀", odds: 3.8, color: "green" },
    right4Even: { label: "우4짝", odds: 3.8, color: "yellow" },
  };

  // 결과가 나오면 사다리 애니메이션 실행 (완료 라운드 기준)
  useEffect(() => {
    if (!completedRound?.result) return;
    const parsed = parseLadderResult(completedRound.result);
    if (parsed) {
      setLadderResult(parsed);
    }
  }, [completedRound?.result]);

  // 페이지 로드 시 이미 완료된 라운드는 팝업 표시하지 않도록 초기화
  const initializedRef = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const resultHashRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    const roundNoRaw = completedRound?.round_number;
    if (roundNoRaw != null) {
      // raw round_number 기준으로 초기값을 저장하여 초기 팝업 노출 방지
      lastShownRoundRef.current = String(roundNoRaw);
      initializedRef.current = true;
    }
  }, [completedRound?.round_number]);

  // 결과 팝업 표시 로직 - round_number와 result 모두 의존
  // 수정: result 변경도 감지하여 새 결과 즉시 표시
  useEffect(() => {
    // 마운트 후 2초 이내에는 팝업 표시 안 함 (초기 로드 시 기존 결과 표시 방지)
    const timeSinceMount = Date.now() - mountTimeRef.current;
    if (timeSinceMount < 2000) return;

    if (!initializedRef.current) return;
    const roundNoRaw = completedRound?.round_number;
    if (roundNoRaw == null) return;
    const roundNoKey = String(roundNoRaw);
    if (!completedRound?.result) return;
    const roundNo = getDisplayRoundNumber(roundNoRaw);

    // 결과 해시 생성 (동일 결과 중복 표시 방지) - roundNoRaw 사용
    const resultHash = `${roundNoKey}-${JSON.stringify(completedRound.result)}`;

    // 이미 표시한 라운드이거나 동일 결과면 스킵
    if (
      lastShownRoundRef.current === roundNoKey &&
      resultHashRef.current === resultHash
    )
      return;

    // 새 라운드 결과인 경우만 표시
    if (lastShownRoundRef.current !== roundNoKey) {
      lastShownRoundRef.current = roundNoKey;
      resultHashRef.current = resultHash;

      const parsed = parseLadderResult(completedRound.result);
      if (!parsed) return;

      setOverlayResult({
        roundNumber: roundNo,
        ...parsed,
      });
      setShowResultOverlay(true);

      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }

      overlayTimeoutRef.current = setTimeout(() => {
        setShowResultOverlay(false);
        overlayTimeoutRef.current = null;
      }, 3500);
    }
  }, [completedRound?.round_number, completedRound?.result]); // result도 의존성에 추가

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const handleBet = (type: keyof typeof betOptions) => {
    if (!profile) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      navigate("/login");
      return;
    }
    if (!canBet) {
      showAlert({
        title: "배팅 불가",
        message: "현재 배팅이 불가능한 상태입니다.",
        type: "warning",
      });
      return;
    }
    if (!betAmount || parseInt(betAmount) <= 0) {
      showAlert({
        title: "입력 오류",
        message: "베팅 금액을 입력해주세요",
        type: "warning",
      });
      return;
    }
    if (parseInt(betAmount) > currentPoints) {
      showAlert({
        title: "잔액 부족",
        message: "포인트가 부족합니다.",
        type: "warning",
      });
      return;
    }

    const amount = parseInt(betAmount);
    if (resolvedSettings.minBet != null && amount < resolvedSettings.minBet) {
      showAlert({
        title: "배팅 금액",
        message: `최소 배팅 금액은 ${resolvedSettings.minBet.toLocaleString()}P 입니다`,
        type: "warning",
      });
      return;
    }
    if (resolvedSettings.maxBet != null && amount > resolvedSettings.maxBet) {
      showAlert({
        title: "배팅 금액",
        message: `최대 배팅 금액은 ${resolvedSettings.maxBet.toLocaleString()}P 입니다`,
        type: "warning",
      });
      return;
    }
    if (resolvedSettings.enabledByBetType[type as string] === false) {
      showAlert({
        title: "배팅 옵션",
        message: "현재 선택한 배팅 옵션은 발매 중지되었습니다",
        type: "warning",
      });
      return;
    }

    const option = betOptions[type];
    const appliedOdds =
      resolvedSettings.oddsByBetType[type as string] ?? option.odds;
    setSelectedBet({ type, label: option.label, odds: appliedOdds });
    setShowBetConfirm(true);
  };

  const confirmBet = async () => {
    if (!profile || !currentRoundData || !selectedBet) return;

    const result = await placeBet(
      profile.id,
      currentRoundData.id,
      selectedBet.type,
      parseInt(betAmount),
      profile.last_login_ip || undefined,
    );

    if (result.success) {
      await refetchBets();
      showAlert({
        title: "배팅 완료",
        message: `${selectedBet.label}에 ${parseInt(
          betAmount,
        ).toLocaleString()}P 배팅이 완료되었습니다!`,
        type: "success",
      });
    } else {
      showAlert({
        title: "오류",
        message: result.error || "배팅에 실패했습니다.",
        type: "error",
      });
    }
    setShowBetConfirm(false);
    setSelectedBet(null);
    setBetAmount("");
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    await sendGameMessage("ladder", chatMessage);
    await refetchGameChat();
    setChatMessage("");
  };

  const expectedWin =
    selectedBet && betAmount
      ? Math.floor(parseInt(betAmount) * selectedBet.odds)
      : 0;

  // 사다리 그리기
  const renderLadder = () => {
    const lines = ladderResult.lines;

    return (
      <div className="relative w-full max-w-lg mx-auto">
        {/* 시작점 */}
        <div className="flex justify-around mb-6">
          <div className="flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                ladderResult.start === "좌" && !isRolling
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              <span className="text-lg">좌</span>
            </div>
            <div className="w-1 h-12 bg-gray-600 mt-2"></div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                ladderResult.start === "우" && !isRolling
                  ? "bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              <span className="text-lg">우</span>
            </div>
            <div className="w-1 h-12 bg-gray-600 mt-2"></div>
          </div>
        </div>

        {/* 사다리 중간 부분 */}
        <div className="bg-gray-800/50 rounded-lg p-8 mb-6">
          <div className="flex justify-center items-center gap-2 text-white text-sm mb-4">
            <span className="text-gray-400">중간 줄수:</span>
            <span
              className={`px-4 py-1 rounded text-lg ${
                lines === 3 ? "bg-purple-500" : "bg-orange-500"
              }`}
            >
              {lines}줄
            </span>
          </div>
          {/* 사다리 시각화 */}
          <div className="relative h-40">
            {/* 세로 라인 */}
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-600"></div>
            <div className="absolute right-1/4 top-0 bottom-0 w-1 bg-gray-600"></div>

            {/* 가로 라인 (줄수만큼) */}
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={`absolute left-1/4 right-1/4 h-1 ${
                  isRolling
                    ? "bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500"
                    : "bg-pink-500"
                }`}
                style={{ top: `${(i + 1) * (100 / (lines + 1))}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* 도착점 */}
        <div className="flex justify-around">
          <div className="flex flex-col items-center">
            <div className="w-1 h-12 bg-gray-600 mb-2"></div>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                ladderResult.end === "홀" && !isRolling
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              <span className="text-lg">홀</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-1 h-12 bg-gray-600 mb-2"></div>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                ladderResult.end === "짝" && !isRolling
                  ? "bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              <span className="text-lg">짝</span>
            </div>
          </div>
        </div>

        {/* 결과 표시 */}
        {!isRolling && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-3">최종 결과</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <span
                className={`px-4 py-2 rounded-lg text-sm ${
                  ladderResult.start === "좌"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {ladderResult.start}출발
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm ${
                  ladderResult.lines === 3
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                }`}
              >
                {ladderResult.lines}줄
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm ${
                  ladderResult.end === "홀"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {ladderResult.end}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 게임이 비활성화된 경우 안내 메시지 표시
  if (resolvedSettings.isActive === false) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/minigame")}
            className="flex items-center gap-2 text-gray-400 hover:text-pink-500 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>돌아가기</span>
          </button>
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-2xl text-white mb-4">게임 일시 중지</h1>
            <p className="text-gray-400 mb-8">
              현재 사다리 게임이 운영 중지 상태입니다.
              <br />
              잠시 후 다시 이용해 주세요.
            </p>
            <button
              onClick={() => navigate("/minigame")}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              다른 게임 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/minigame")}
          className="flex items-center gap-2 text-gray-400 hover:text-pink-500 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>돌아가기</span>
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-2">
            💕 <span className="text-pink-500">사다리 게임 5분</span> 💕
          </h1>
          <p className="text-gray-400 text-sm">
            5분 단위로 진행되는 사다리 게임 (3줄 or 4줄)
          </p>
          <p className="text-gray-500 text-xs mt-1">
            현재 회차: #{currentRound}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4 relative">
            {/* Ladder Display */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-8 border border-purple-500/30 relative overflow-hidden">
              {showResultOverlay && overlayResult && (
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                  <div className="bg-gray-900 border border-pink-500/40 rounded-2xl px-6 py-5 w-[92%] max-w-md shadow-2xl shadow-pink-500/10 animate-pulse">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">사다리 결과</p>
                      <p className="text-white text-sm font-semibold mb-3">
                        {overlayResult.roundNumber}회차 결과
                      </p>
                      <p className="text-white text-2xl font-bold mb-3">
                        {overlayResult.start}출발 / {overlayResult.lines}줄 /{" "}
                        {overlayResult.end}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <h3 className="text-white text-center mb-6 text-xl">
                🎲 사다리 게임
              </h3>
              {renderLadder()}
            </div>

            {/* Timer and Bet */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-sm">
                    {roundLoading
                      ? "불러오는 중"
                      : currentRound > 0
                        ? `${currentRound}회차`
                        : "회차 없음"}
                  </span>
                  <span
                    className={`${statusClass} text-white px-4 py-1 rounded-full text-sm`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-6xl text-white mb-2">
                    {roundLoading ? "--:--" : formatTime(timeLeft || 0)}
                  </p>
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span className="text-white">
                      {roundStatus === "playing"
                        ? "게임 종료까지"
                        : "다음 게임까지"}
                    </span>
                    <span>{formatTime(progressTotalSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Bet Amount */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">💰</span>
                  <span className="text-white">보유 포인트</span>
                  <span className="text-yellow-500 ml-auto">
                    {currentPoints.toLocaleString()}P
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={betAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setBetAmount(value);
                    }}
                    placeholder="배팅 금액 입력"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <QuickAmountButtons
                  onAmountSelect={handleQuickAmount}
                  currentPoints={currentPoints}
                />
              </div>

              {/* 출발방향 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center text-sm">
                  1. 출발지점 맞추기
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet("leftStart")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["leftStart"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 ${resolvedSettings.enabledByBetType["leftStart"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>좌출발</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["leftStart"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => handleBet("rightStart")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["rightStart"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 ${resolvedSettings.enabledByBetType["rightStart"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>우출발</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["rightStart"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>
              </div>

              {/* 중간 줄수 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center text-sm">
                  2. 줄갯수 맞추기
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet("line3")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["line3"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 ${resolvedSettings.enabledByBetType["line3"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>3줄</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["line3"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => handleBet("line4")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["line4"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 ${resolvedSettings.enabledByBetType["line4"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>4줄</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["line4"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>
              </div>

              {/* 홀짝 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center text-sm">
                  3. 홀짝 맞추기 (최종 도착)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet("oddEnd")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["oddEnd"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 ${resolvedSettings.enabledByBetType["oddEnd"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>홀</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["oddEnd"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => handleBet("evenEnd")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["evenEnd"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 ${resolvedSettings.enabledByBetType["evenEnd"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>짝</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["evenEnd"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>
              </div>

              {/* 묶음 배팅 */}
              <div>
                <h3 className="text-white mb-2 text-center text-sm">
                  4. 묶어서 맞추기 (3개 조건 모두)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet("left3Even")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["left3Even"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 ${resolvedSettings.enabledByBetType["left3Even"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>좌3짝</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["left3Even"] ?? 3.8
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => handleBet("left4Odd")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["left4Odd"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 ${resolvedSettings.enabledByBetType["left4Odd"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>좌4홀</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["left4Odd"] ?? 3.8
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => handleBet("right3Odd")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["right3Odd"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 ${resolvedSettings.enabledByBetType["right3Odd"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>우3홀</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["right3Odd"] ?? 3.8
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => handleBet("right4Even")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["right4Even"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 ${resolvedSettings.enabledByBetType["right4Even"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>우4짝</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["right4Even"] ?? 3.8
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel - Game Results Dashboard */}
          <div className="space-y-4">
            {/* Game Results */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">📊</span>
                  <span className="text-white">회차별 결과</span>
                </div>
              </div>
              <div className="p-4 max-h-[700px] overflow-y-auto">
                <div className="space-y-3">
                  {gameResults.map((result) => (
                    <div
                      key={result.round}
                      className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-xs">
                          #{result.round}회
                        </span>
                      </div>

                      {/* 결과 */}
                      <div className="mb-2">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded text-sm ${
                              result.start === "좌"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {result.start}출발
                          </span>
                          <span
                            className={`px-3 py-1 rounded text-sm ${
                              result.lines === 3
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            }`}
                          >
                            {result.lines}줄
                          </span>
                          <span
                            className={`px-3 py-1 rounded text-sm ${
                              result.end === "홀"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {result.end}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Chat Button */}
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 left-6 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-all hover:scale-110 z-40"
        >
          <MessageCircle size={24} />
        </button>

        {/* Floating Bet History Button */}
        <button
          onClick={() => setShowBetHistory(true)}
          className="fixed bottom-6 left-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110 z-40"
        >
          <History size={24} />
        </button>
      </div>

      {/* Bet Confirmation Modal */}
      {showBetConfirm && selectedBet && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-white text-xl mb-4">배팅 확인</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배팅 항목</span>
                <span className="text-white">{selectedBet.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배팅 금액</span>
                <span className="text-white">
                  {parseInt(betAmount).toLocaleString()}P
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배당률</span>
                <span className="text-yellow-500">{selectedBet.odds}배</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">예상 당첨금</span>
                <span className="text-pink-500 text-lg">
                  {expectedWin.toLocaleString()}P
                </span>
              </div>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm text-center">
                ⚠️ 배팅 후 취소가 불가합니다!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBetConfirm(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmBet}
                className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
              >
                배팅하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full">
            <div className="bg-pink-500/20 border-b border-pink-500/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-pink-500">💬</span>
                <span className="text-white">채팅</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="h-[400px] overflow-y-auto mb-3 space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="text-gray-400">{msg.time} </span>
                    <span className="text-pink-400">{msg.user}:</span>
                    <span className="text-white ml-1">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="메시지 입력..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={handleSendChat}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bet History Modal */}
      <BetHistoryPanel
        isOpen={showBetHistory}
        onClose={() => setShowBetHistory(false)}
        bets={myBets}
        title="배팅 기록"
      />
    </div>
  );
}
