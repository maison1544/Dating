import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, MessageCircle, History, X } from "lucide-react";
import { BetHistoryPanel } from "@/components/layout/BetHistoryPanel";
import { QuickAmountButtons } from "@/components/layout/QuickAmountButtons";
import {
  useCurrentRoundEdge,
  useGameSettings,
  usePlaceBet,
  useGameChat,
  useSendGameChat,
  useMyGameBets,
  useGameHistory,
} from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { formatKST, getDisplayRoundNumber } from "@/lib/utils/dateUtils";

export function PowerballGamePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { showAlert } = useAlert();

  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [overlayResult, setOverlayResult] = useState<{
    roundNumber: number;
    normalBalls: number[];
    powerball: number;
    normalOddEven: "odd" | "even" | null;
    normalUnderOver: "under" | "over" | null;
    powerballOddEven: "odd" | "even" | null;
    powerballUnderOver: "under" | "over" | null;
  } | null>(null);
  const lastShownRoundRef = useRef<string | null>(null);
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsePowerballResult = (result: unknown) => {
    if (
      typeof result !== "object" ||
      result === null ||
      Array.isArray(result)
    ) {
      return undefined;
    }

    const record = result as Record<string, unknown>;

    const normalBalls =
      Array.isArray(record.normalBalls) &&
      record.normalBalls.every((v) => typeof v === "number")
        ? (record.normalBalls as number[])
        : null;

    const powerball =
      typeof record.powerball === "number"
        ? record.powerball
        : typeof record.powerBall === "number"
          ? record.powerBall
          : null;

    const normalSum =
      typeof record.normalSum === "number" ? record.normalSum : null;

    const normalOddEven =
      record.normalOddEven === "odd" || record.normalOddEven === "even"
        ? (record.normalOddEven as "odd" | "even")
        : null;

    const normalUnderOver =
      record.normalUnderOver === "under" || record.normalUnderOver === "over"
        ? (record.normalUnderOver as "under" | "over")
        : null;

    const powerballOddEven =
      record.powerballOddEven === "odd" || record.powerballOddEven === "even"
        ? (record.powerballOddEven as "odd" | "even")
        : null;

    const powerballUnderOver =
      record.powerballUnderOver === "under" ||
      record.powerballUnderOver === "over"
        ? (record.powerballUnderOver as "under" | "over")
        : null;

    return {
      normalBalls,
      powerball,
      normalSum,
      normalOddEven,
      normalUnderOver,
      powerballOddEven,
      powerballUnderOver,
    };
  };

  // Supabase hooks
  const {
    round: currentRoundData,
    completedRound,
    remaining_seconds: timeLeft,
    isLoading: roundLoading,
  } = useCurrentRoundEdge("powerball");
  const { settings: gameSettings } = useGameSettings("powerball", {
    enableRealtime: true,
  });
  const { placeBet } = usePlaceBet();
  const { messages: gameChatMessages, refetch: refetchGameChat } =
    useGameChat("powerball");
  const { sendMessage: sendGameMessage } = useSendGameChat();
  const { bets: myBetsData, refetch: refetchBets } = useMyGameBets(profile?.id);
  const { history: gameHistoryData } = useGameHistory("powerball");

  const [betAmount, setBetAmount] = useState("");
  const [selectedBets, setSelectedBets] = useState<
    { type: string; label: string; odds: number }[]
  >([]);

  // 일반볼 5개 (0-130)
  const [normalBalls, setNormalBalls] = useState([27, 1, 3, 22, 24]);
  // 파워볼 1개 (0-9)
  const [powerBall, setPowerBall] = useState(8);

  const isRolling = false;
  const [showBetConfirm, setShowBetConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);

  // 현재 라운드 정보 (Supabase에서)
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

  const betOptions: Record<
    string,
    { label: string; defaultOdds: number; color: string }
  > = {
    "normal-odd": { label: "일반볼-홀", defaultOdds: 1.95, color: "red" },
    "normal-even": { label: "일반볼-짝", defaultOdds: 1.95, color: "blue" },
    "normal-under": {
      label: "일반볼-언더",
      defaultOdds: 1.95,
      color: "purple",
    },
    "normal-over": { label: "일반볼-오버", defaultOdds: 1.95, color: "orange" },
    "powerball-odd": { label: "파워볼-홀", defaultOdds: 1.95, color: "red" },
    "powerball-even": { label: "파워볼-짝", defaultOdds: 1.95, color: "blue" },
    "powerball-under": {
      label: "파워볼-언더",
      defaultOdds: 1.95,
      color: "purple",
    },
    "powerball-over": {
      label: "파워볼-오버",
      defaultOdds: 1.95,
      color: "orange",
    },
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
    const parsed = parsePowerballResult(round.result);
    return {
      round: getDisplayRoundNumber(round.round_number),
      normalBalls: parsed?.normalBalls ?? [0, 0, 0, 0, 0],
      normalSum: parsed?.normalSum ?? 0,
      powerBall: parsed?.powerball ?? 0,
      normalOddEven: parsed?.normalOddEven === "odd" ? "홀" : "짝",
      normalUnderOver: parsed?.normalUnderOver === "under" ? "언더" : "오버",
      powerOddEven: parsed?.powerballOddEven === "odd" ? "홀" : "짝",
      powerUnderOver: parsed?.powerballUnderOver === "under" ? "언더" : "오버",
    };
  });

  // 결과가 나오면 공 애니메이션 실행 (완료 라운드 기준)
  useEffect(() => {
    if (!completedRound?.result) return;
    const parsed = parsePowerballResult(completedRound.result);
    if (parsed?.normalBalls) {
      setNormalBalls(parsed.normalBalls);
    }
    if (typeof parsed?.powerball === "number") {
      setPowerBall(parsed.powerball);
    }
  }, [completedRound?.result]);

  // 페이지 로드 시 이미 완료된 라운드는 팝업 표시하지 않도록 초기화
  const initializedRef = useRef(false);
  const mountTimeRef = useRef(Date.now());

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
  const shownOverlayRef = useRef(false);
  const resultHashRef = useRef<string | null>(null);

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

    // 결과 해시 생성 (동일 결과 중복 표시 방지)
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
      shownOverlayRef.current = true;

      const parsed = parsePowerballResult(completedRound.result);
      if (!parsed?.normalBalls || typeof parsed.powerball !== "number") return;

      setOverlayResult({
        roundNumber: roundNo,
        normalBalls: parsed.normalBalls,
        powerball: parsed.powerball,
        normalOddEven: parsed.normalOddEven,
        normalUnderOver: parsed.normalUnderOver,
        powerballOddEven: parsed.powerballOddEven,
        powerballUnderOver: parsed.powerballUnderOver,
      });
      setShowResultOverlay(true);

      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }

      overlayTimeoutRef.current = setTimeout(() => {
        setShowResultOverlay(false);
        shownOverlayRef.current = false;
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

  const toggleBet = (type: keyof typeof betOptions) => {
    if (!profile) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      router.push("/login");
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
      resolvedSettings.oddsByBetType[type as string] ?? option.defaultOdds;
    const next = {
      type: type as string,
      label: option.label,
      odds: appliedOdds,
    };

    // 한 번에 1개 항목만 선택 가능하도록 수정
    setSelectedBets((prev) => {
      const isAlready = prev.some((b) => b.type === next.type);
      if (isAlready) {
        // 이미 선택된 항목을 다시 클릭하면 선택 해제
        return [];
      }
      // 새로운 항목 선택 시 기존 선택 모두 제거하고 새 항목만 선택
      return [next];
    });
  };

  const openBetConfirm = () => {
    if (!profile) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      router.push("/login");
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
        message: "배팅 금액을 입력해주세요",
        type: "warning",
      });
      return;
    }
    if (selectedBets.length === 0) {
      showAlert({
        title: "입력 오류",
        message: "배팅 항목을 선택해주세요",
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

    const totalCost = amount * selectedBets.length;
    if (totalCost > currentPoints) {
      showAlert({
        title: "잔액 부족",
        message: "포인트가 부족합니다.",
        type: "warning",
      });
      return;
    }

    setShowBetConfirm(true);
  };

  const confirmBet = async () => {
    if (!profile || !currentRoundData) return;
    if (!betAmount || parseInt(betAmount) <= 0) return;
    if (selectedBets.length === 0) return;

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

    const totalCost = amount * selectedBets.length;
    if (totalCost > currentPoints) {
      showAlert({
        title: "잔액 부족",
        message: "포인트가 부족합니다.",
        type: "warning",
      });
      return;
    }

    for (const bet of selectedBets) {
      const result = await placeBet(
        profile.id,
        currentRoundData.id,
        bet.type,
        amount,
        profile.last_login_ip || undefined,
      );
      if (!result.success) {
        showAlert({
          title: "오류",
          message: result.error || "배팅에 실패했습니다.",
          type: "error",
        });
        setShowBetConfirm(false);
        return;
      }
    }

    await Promise.all([refetchBets(), refreshProfile()]);
    showAlert({
      title: "배팅 완료",
      message: `${selectedBets
        .map((b) => b.label)
        .join(", ")}에 ${amount.toLocaleString()}P 배팅이 완료되었습니다!`,
      type: "success",
    });
    setShowBetConfirm(false);
    setSelectedBets([]);
    setBetAmount("");
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    await sendGameMessage("powerball", chatMessage);
    await refetchGameChat();
    setChatMessage("");
  };

  const normalSum = normalBalls.reduce((a, b) => a + b, 0);
  const expectedWin = useMemo(() => {
    if (!betAmount || parseInt(betAmount) <= 0) return 0;
    const amount = parseInt(betAmount);
    return selectedBets.reduce(
      (sum, b) => sum + Math.floor(amount * Number(b.odds || 0)),
      0,
    );
  }, [betAmount, selectedBets]);

  const totalBetAmount = useMemo(() => {
    if (!betAmount || parseInt(betAmount) <= 0) return 0;
    return parseInt(betAmount) * selectedBets.length;
  }, [betAmount, selectedBets.length]);

  const expectedWinByBet = useMemo(() => {
    if (!betAmount || parseInt(betAmount) <= 0) return [] as number[];
    const amount = parseInt(betAmount);
    return selectedBets.map((b) => Math.floor(amount * Number(b.odds || 0)));
  }, [betAmount, selectedBets]);

  // 게임이 비활성화된 경우 안내 메시지 표시
  if (resolvedSettings.isActive === false) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/minigame")}
            className="flex items-center gap-2 text-gray-400 hover:text-pink-500 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>돌아가기</span>
          </button>
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-2xl text-white mb-4">게임 일시 중지</h1>
            <p className="text-gray-400 mb-8">
              현재 파워볼 게임이 운영 중지 상태입니다.
              <br />
              잠시 후 다시 이용해 주세요.
            </p>
            <button
              onClick={() => router.push("/minigame")}
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
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/minigame")}
          className="flex items-center gap-2 text-gray-400 hover:text-pink-500 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>돌아가기</span>
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-2">
            💕 <span className="text-pink-500">동행복권 파워볼 5분</span> 💕
          </h1>
          <p className="text-gray-400 text-sm">
            5분 단위로 추첨, 총 288회차 진행
          </p>
          <p className="text-gray-500 text-xs mt-1">
            현재 회차: #{currentRound}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4 relative">
            {/* Ball Display */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-8 border border-blue-500/30 relative overflow-hidden">
              {showResultOverlay && overlayResult && (
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                  <div className="bg-gray-900 border border-pink-500/40 rounded-2xl px-6 py-5 w-[92%] max-w-md shadow-2xl shadow-pink-500/10 animate-pulse">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">파워볼 결과</p>
                      <p className="text-white text-sm font-semibold mb-3">
                        {overlayResult.roundNumber}회차 결과
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {overlayResult.normalBalls.map((b, idx) => (
                          <div
                            key={`${b}-${idx}`}
                            className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold"
                          >
                            {b}
                          </div>
                        ))}
                        <div className="w-9 h-9 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 font-bold">
                          {overlayResult.powerball}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-gray-400">일반볼</span>
                          <span className="text-white font-semibold">
                            {overlayResult.normalOddEven === "even"
                              ? "짝"
                              : overlayResult.normalOddEven === "odd"
                                ? "홀"
                                : "-"}
                            /
                            {overlayResult.normalUnderOver === "over"
                              ? "오버"
                              : overlayResult.normalUnderOver === "under"
                                ? "언더"
                                : "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-gray-400">파워볼</span>
                          <span className="text-white font-semibold">
                            {overlayResult.powerballOddEven === "even"
                              ? "짝"
                              : overlayResult.powerballOddEven === "odd"
                                ? "홀"
                                : "-"}
                            /
                            {overlayResult.powerballUnderOver === "over"
                              ? "오버"
                              : overlayResult.powerballUnderOver === "under"
                                ? "언더"
                                : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <h3 className="text-white text-center mb-4">일반볼 (0~130)</h3>
              <div className="flex items-center justify-center gap-4 mb-6">
                {normalBalls.map((ball, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg ${
                        isRolling ? "animate-bounce" : ""
                      }`}
                    >
                      <span className="text-white text-2xl">{ball}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mb-6">
                <span className="text-gray-400">합계: </span>
                <span className="text-white text-2xl">{normalSum}</span>
              </div>

              <h3 className="text-white text-center mb-4">파워볼 (0~9)</h3>
              <div className="flex items-center justify-center">
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl ${
                    isRolling ? "animate-spin" : ""
                  }`}
                >
                  <span className="text-white text-3xl">{powerBall}</span>
                </div>
              </div>
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
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span className="text-white">
                      {roundStatus === "playing"
                        ? "게임 종료까지"
                        : "다음 추첨까지"}
                    </span>
                    <span>{formatTime(progressTotalSeconds)}</span>
                  </div>
                </div>
              </div>

              {user && (
                <>
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

              {/* 일반볼 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center">
                  일반볼 배팅 (5개 합계 기준)
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    onClick={() => toggleBet("normal-odd")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["normal-odd"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 ${
                      selectedBets.some((b) => b.type === "normal-odd")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["normal-odd"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>홀</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["normal-odd"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => toggleBet("normal-even")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["normal-even"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 ${
                      selectedBets.some((b) => b.type === "normal-even")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["normal-even"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>짝</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["normal-even"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleBet("normal-under")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["normal-under"] ===
                        false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 ${
                      selectedBets.some((b) => b.type === "normal-under")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["normal-under"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>언더 (기준 72.5)</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["normal-under"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => toggleBet("normal-over")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["normal-over"] === false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 ${
                      selectedBets.some((b) => b.type === "normal-over")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["normal-over"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>오버 (기준 72.5)</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["normal-over"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>
              </div>

              {/* 파워볼 배팅 */}
              <div>
                <h3 className="text-white mb-2 text-center">
                  파워볼 배팅 (파워볼 숫자 기준)
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    onClick={() => toggleBet("powerball-odd")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["powerball-odd"] ===
                        false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 ${
                      selectedBets.some((b) => b.type === "powerball-odd")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["powerball-odd"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>홀</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["powerball-odd"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => toggleBet("powerball-even")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["powerball-even"] ===
                        false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 ${
                      selectedBets.some((b) => b.type === "powerball-even")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["powerball-even"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>짝</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["powerball-even"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleBet("powerball-under")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["powerball-under"] ===
                        false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 ${
                      selectedBets.some((b) => b.type === "powerball-under")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["powerball-under"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>언더 (기준 4.5)</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["powerball-under"] ??
                        1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                  <button
                    onClick={() => toggleBet("powerball-over")}
                    disabled={
                      !canBet ||
                      resolvedSettings.enabledByBetType["powerball-over"] ===
                        false
                    }
                    className={`py-3 rounded-lg text-white transition-all bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 ${
                      selectedBets.some((b) => b.type === "powerball-over")
                        ? "ring-2 ring-white"
                        : ""
                    } ${resolvedSettings.enabledByBetType["powerball-over"] === false ? "opacity-40 cursor-not-allowed" : !canBet ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>오버 (기준 4.5)</div>
                    <div className="text-xs mt-1">
                      (
                      {(
                        resolvedSettings.oddsByBetType["powerball-over"] ?? 1.95
                      ).toFixed(2)}
                      배)
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">선택 항목</span>
                    <span className="text-white">
                      {selectedBets.length > 0
                        ? selectedBets.map((b) => b.label).join(", ")
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-400">총 배팅 금액</span>
                    <span className="text-pink-500 font-bold">
                      {totalBetAmount.toLocaleString()}P
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openBetConfirm}
                  disabled={!canBet || selectedBets.length === 0}
                  className={`w-full py-3 rounded-lg transition-colors ${
                    canBet && selectedBets.length > 0
                      ? "bg-pink-500 text-white hover:bg-pink-600"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  배팅하기
                </button>
              </div>
                </>
              )}
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

                      {/* 일반볼 5개 + 파워볼 */}
                      <div className="mb-3">
                        <div className="flex gap-1 mb-2 items-center">
                          {result.normalBalls.map((ball, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"
                            >
                              <span className="text-white text-xs">{ball}</span>
                            </div>
                          ))}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center ml-2">
                            <span className="text-white text-sm">
                              {result.powerBall}
                            </span>
                          </div>
                        </div>

                        {/* 일반볼 결과 */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs">
                              일반볼 합: {result.normalSum}
                            </span>
                            <div className="flex gap-1">
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  result.normalOddEven === "홀"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {result.normalOddEven}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  result.normalUnderOver === "오버"
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                    : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                }`}
                              >
                                {result.normalUnderOver}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 파워볼 결과 */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs">
                              파워볼: {result.powerBall}
                            </span>
                            <div className="flex gap-1">
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  result.powerOddEven === "홀"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {result.powerOddEven}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  result.powerUnderOver === "오버"
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                    : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                }`}
                              >
                                {result.powerUnderOver}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {user && (
          <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-24 left-6 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-all hover:scale-110 z-40"
          >
            <MessageCircle size={24} />
          </button>
        )}

        {/* Floating Bet History Button */}
        {user && (
          <button
            onClick={() => setShowBetHistory(true)}
            className="fixed bottom-6 left-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110 z-40"
          >
            <History size={24} />
          </button>
        )}
      </div>

      {/* Bet Confirmation Modal */}
      {showBetConfirm && selectedBets.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-white text-xl mb-4">배팅 확인</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배팅 항목</span>
                <span className="text-white">
                  {selectedBets.map((b) => b.label).join(", ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배팅 금액</span>
                <span className="text-white">
                  {parseInt(betAmount).toLocaleString()}P x{" "}
                  {selectedBets.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">총 배팅 금액</span>
                <span className="text-yellow-500">
                  {totalBetAmount.toLocaleString()}P
                </span>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-2">옵션별 배당</div>
                <div className="space-y-2">
                  {selectedBets.map((b, idx) => (
                    <div key={b.type} className="flex justify-between text-sm">
                      <span className="text-white">{b.label}</span>
                      <span className="text-gray-300">
                        {Number(b.odds).toFixed(2)}배 · 예상{" "}
                        {(expectedWinByBet[idx] ?? 0).toLocaleString()}P
                      </span>
                    </div>
                  ))}
                </div>
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
