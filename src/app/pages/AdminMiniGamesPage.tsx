import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Filter, RefreshCw, X } from "lucide-react";
import { DateRangePicker } from "../components/DateRangePicker";
import { CountdownTimer } from "../components/CountdownTimer";
import { AdminMiniGamesSettingsTab } from "./AdminMiniGamesSettingsTab";
import { RoundDetailModal } from "../components/RoundDetailModal";
import { ResultAdjustmentModal } from "../components/ResultAdjustmentModal";
import {
  useAllGameBets,
  useAllGameRounds,
  useReserveResult,
} from "../hooks/useSupabase";
import { formatKST, getDisplayRoundNumber } from "../../lib/dateUtils";
import { supabase } from "../../lib/supabase";

interface BetOption {
  option: string;
  amount: number;
  count: number;
  percentage: number;
}

interface GameRound {
  id: number;
  dbId: string;
  dbGameType: "powerball" | "ladder";
  gameType: string;
  roundNumber: number;
  result: string;
  detailedResult?: string;
  totalBets: number;
  totalAmount: number;
  startTime: string;
  endTime: string;
  countdownEndTime?: string;
  status: "진행중" | "완료" | "대기";
  participants: number;
  date: string;
  betDistribution?: BetOption[];
  reservedResult?: string;
}

export function AdminMiniGamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("all");

  const [activeTab, setActiveTab] = useState<"betting" | "rounds" | "settings">(
    "betting",
  );
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);
  useEffect(() => {
    if (activeTab === "settings") {
      setHasOpenedSettings(true);
    }
  }, [activeTab]);
  const today = formatKST(new Date(), "date");
  const [selectedDate, setSelectedDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedBetType, setSelectedBetType] = useState("all");
  const [selectedBetOption, setSelectedBetOption] = useState<{
    gameType: string;
    roundNumber: number;
    option: string;
  } | null>(null);
  const [selectedRoundDetail, setSelectedRoundDetail] =
    useState<GameRound | null>(null);
  const [isResultAdjustmentOpen, setIsResultAdjustmentOpen] = useState(false);
  const [startTimeFilter, setStartTimeFilter] = useState("");
  const [endTimeFilter, setEndTimeFilter] = useState("");

  const dbGameTypeFilter =
    gameFilter === "사다리"
      ? "ladder"
      : gameFilter === "파워볼"
        ? "powerball"
        : "all";

  const startDateIso = new Date(
    `${selectedDate}T00:00:00.000+09:00`,
  ).toISOString();
  const endDateIso = new Date(`${endDate}T23:59:59.999+09:00`).toISOString();

  const { rounds: dbRounds, refetch: refetchRounds } = useAllGameRounds({
    gameType: dbGameTypeFilter,
    startDate: startDateIso,
    endDate: endDateIso,
  });

  const roundIds = useMemo(
    () => (dbRounds || []).map((r: any) => r.id),
    [dbRounds],
  );

  const { bets: dbBets, refetch: refetchBets } = useAllGameBets({
    roundIds,
    gameType: dbGameTypeFilter,
    startDate: startDateIso,
    endDate: endDateIso,
  });
  const { reserveResult, cancelReservation } = useReserveResult();

  const realtimeRefetchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const scheduleRefetch = () => {
      if (realtimeRefetchTimerRef.current) {
        window.clearTimeout(realtimeRefetchTimerRef.current);
      }
      realtimeRefetchTimerRef.current = window.setTimeout(() => {
        void refetchRounds();
        void refetchBets();
      }, 250);
    };

    const channel = supabase
      .channel("admin-minigames-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rounds" },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_bets" },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (realtimeRefetchTimerRef.current) {
        window.clearTimeout(realtimeRefetchTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [refetchBets, refetchRounds]);

  // 라운드 자동 완료 트리거 - 배팅 마감 시간이 지난 라운드 처리
  useEffect(() => {
    const checkAndProcessRounds = async () => {
      const now = new Date();
      const expiredRounds = (dbRounds || []).filter((r: any) => {
        if (r.status !== "betting") return false;
        if (!r.betting_end_time) return false;
        const endTime = new Date(r.betting_end_time);
        return endTime <= now;
      });

      for (const round of expiredRounds) {
        try {
          await supabase.rpc("game_tick_client", {
            p_game_type: round.game_type,
          });
        } catch (e) {
          console.error("game_tick_client error:", e);
        }
      }

      if (expiredRounds.length > 0) {
        await refetchRounds();
        await refetchBets();
      }
    };

    // 초기 실행 및 5초마다 체크
    checkAndProcessRounds();
    const interval = setInterval(checkAndProcessRounds, 5000);

    return () => clearInterval(interval);
  }, [dbRounds, refetchRounds, refetchBets]);

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "-";
    return formatKST(iso, "datetime") || "-";
  };

  const mapStatus = (status: string): "진행중" | "완료" | "대기" => {
    if (status === "betting" || status === "playing") return "진행중";
    if (status === "completed" || status === "settled") return "완료";
    return "대기";
  };

  const formatReservedResult = (
    gameType: "powerball" | "ladder",
    reserved: any,
  ): string | undefined => {
    if (!reserved) return undefined;

    if (gameType === "powerball") {
      const normalOE = reserved.normalOddEven === "even" ? "짝" : "홀";
      const normalUO = reserved.normalUnderOver === "over" ? "오버" : "언더";
      const powerOE = reserved.powerballOddEven === "even" ? "짝" : "홀";
      const powerUO = reserved.powerballUnderOver === "over" ? "오버" : "언더";
      return `일반볼 ${normalOE}/${normalUO} 파워볼 ${powerOE}/${powerUO}`;
    }

    const start = reserved.startPosition === "right" ? "우출발" : "좌출발";
    const lines = reserved.lineCount === 3 ? "3줄" : "4줄";
    const oe = reserved.oddEven === "even" ? "짝" : "홀";
    return `${start}/${lines}/${oe}`;
  };

  const formatRoundResult = (
    gameType: "powerball" | "ladder",
    result: any,
  ): { result: string; detailedResult?: string } => {
    if (!result) return { result: "-" };

    if (gameType === "powerball") {
      const normalOE = result.normalOddEven === "even" ? "짝" : "홀";
      const normalUO = result.normalUnderOver === "over" ? "오버" : "언더";
      const powerOE = result.powerballOddEven === "even" ? "짝" : "홀";
      const powerUO = result.powerballUnderOver === "over" ? "오버" : "언더";
      return {
        result: normalOE,
        detailedResult: `일반볼-${normalOE}/${normalUO}\n파워볼-${powerOE}/${powerUO}`,
      };
    }

    const start = result.startPosition === "right" ? "우" : "좌";
    const lines = result.lineCount === 3 ? 3 : 4;
    const oe = result.oddEven === "even" ? "짝" : "홀";
    return {
      result: `${start}/${lines}/${oe}`,
      detailedResult: `${start}출발/${lines}줄\n도착-${oe}`,
    };
  };

  const mapBetTypeToOption = (
    gameType: "powerball" | "ladder",
    betType: string,
  ): string => {
    if (gameType === "powerball") {
      const map: Record<string, string> = {
        "normal-odd": "일반볼 홀",
        "normal-even": "일반볼 짝",
        "normal-under": "일반볼 언더",
        "normal-over": "일반볼 오버",
        "powerball-odd": "파워볼 홀",
        "powerball-even": "파워볼 짝",
        "powerball-under": "파워볼 언더",
        "powerball-over": "파워볼 오버",
      };
      return map[betType] || betType;
    }

    const map: Record<string, string> = {
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
    };
    return map[betType] || betType;
  };

  const buildBetDistribution = (
    gameType: "powerball" | "ladder",
    roundId: string,
    bets: any[],
  ): BetOption[] => {
    const roundBets = bets.filter((b) => b.round_id === roundId);
    const sumAmount = (predicate: (b: any) => boolean) =>
      roundBets
        .filter(predicate)
        .reduce((sum, b) => sum + (b.bet_amount || 0), 0);
    const countBets = (predicate: (b: any) => boolean) =>
      roundBets.filter(predicate).length;

    const items =
      gameType === "powerball"
        ? [
            { option: "일반볼 홀", types: ["normal-odd"] },
            { option: "일반볼 짝", types: ["normal-even"] },
            { option: "일반볼 언더", types: ["normal-under"] },
            { option: "일반볼 오버", types: ["normal-over"] },
            { option: "파워볼 홀", types: ["powerball-odd"] },
            { option: "파워볼 짝", types: ["powerball-even"] },
            { option: "파워볼 언더", types: ["powerball-under"] },
            { option: "파워볼 오버", types: ["powerball-over"] },
          ]
        : [
            { option: "좌출발", types: ["leftStart"] },
            { option: "우출발", types: ["rightStart"] },
            { option: "3줄", types: ["line3"] },
            { option: "4줄", types: ["line4"] },
            { option: "홀", types: ["oddEnd"] },
            { option: "짝", types: ["evenEnd"] },
            { option: "좌3짝", types: ["left3Even"] },
            { option: "좌4홀", types: ["left4Odd"] },
            { option: "우3홀", types: ["right3Odd"] },
            { option: "우4짝", types: ["right4Even"] },
          ];

    const raw = items.map((it) => {
      const amount = sumAmount((b) => it.types.includes(b.bet_type));
      const count = countBets((b) => it.types.includes(b.bet_type));
      return { option: it.option, amount, count, percentage: 0 };
    });

    const applyPairPct = (i: number, j: number) => {
      const total = raw[i].amount + raw[j].amount;
      raw[i].percentage =
        total === 0 ? 0 : Math.round((raw[i].amount / total) * 100);
      raw[j].percentage =
        total === 0 ? 0 : Math.round((raw[j].amount / total) * 100);
    };

    if (gameType === "powerball") {
      applyPairPct(0, 1);
      applyPairPct(2, 3);
      applyPairPct(4, 5);
      applyPairPct(6, 7);
      return raw;
    }

    applyPairPct(0, 1);
    applyPairPct(2, 3);
    applyPairPct(4, 5);

    const comboTotal = raw.slice(6, 10).reduce((sum, it) => sum + it.amount, 0);
    raw.slice(6, 10).forEach((it) => {
      it.percentage =
        comboTotal === 0 ? 0 : Math.round((it.amount / comboTotal) * 100);
    });
    return raw;
  };

  const gameRounds: GameRound[] = useMemo(() => {
    return (dbRounds || []).map((r) => {
      const dbGameType: "powerball" | "ladder" =
        r.game_type === "ladder" ? "ladder" : "powerball";
      const status = mapStatus(r.status);
      const resultInfo = formatRoundResult(dbGameType, r.result);

      const betDistribution = buildBetDistribution(
        dbGameType,
        r.id,
        dbBets || [],
      );
      const totalBets = (dbBets || []).filter(
        (b) => b.round_id === r.id,
      ).length;
      const totalAmount = r.total_bet_amount || 0;
      const participants = new Set(
        (dbBets || []).filter((b) => b.round_id === r.id).map((b) => b.user_id),
      ).size;

      const roundNumber = getDisplayRoundNumber(r.round_number);
      const id = (dbGameType === "ladder" ? 2000000 : 1000000) + roundNumber;
      const startTime = formatDateTime(r.start_time);
      const endTime = formatDateTime(r.end_time);
      const countdownEndTime =
        r.betting_end_time || r.end_time || r.start_time || null;

      return {
        id,
        dbId: r.id,
        dbGameType,
        gameType: dbGameType === "ladder" ? "사다리" : "파워볼",
        roundNumber,
        result: resultInfo.result,
        detailedResult: resultInfo.detailedResult,
        totalBets,
        totalAmount,
        startTime,
        endTime,
        countdownEndTime: countdownEndTime ?? undefined,
        status,
        participants,
        date: formatKST(r.start_time || new Date().toISOString()).split(" ")[0],
        betDistribution,
        reservedResult: formatReservedResult(dbGameType, r.reserved_result),
      };
    });
  }, [dbBets, dbRounds]);

  useEffect(() => {
    const isAnyModalOpen =
      selectedBetOption !== null ||
      selectedRoundDetail !== null ||
      isResultAdjustmentOpen;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedBetOption, selectedRoundDetail, isResultAdjustmentOpen]);
  const [, setIsTimeRangeValid] = useState(true);
  const [, setIsDateRangeValid] = useState(true);

  const _validateDateRange = (start: string, end: string) => {
    if (start && end) {
      return new Date(start) <= new Date(end);
    }
    return true;
  };
  void _validateDateRange;

  const validateTimeRange = (
    startTime: string,
    endTime: string,
    startDate: string,
    endDate: string,
  ) => {
    if (!startTime || !endTime) return true;
    if (startDate !== endDate) return true;

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMin) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMin)
    ) {
      return true;
    }

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return startMinutes <= endMinutes;
  };

  const selectedBetUsers = useMemo(() => {
    if (!selectedBetOption) return [];

    const targetRound = gameRounds.find(
      (r) =>
        r.gameType === selectedBetOption.gameType &&
        r.roundNumber === selectedBetOption.roundNumber,
    );
    if (!targetRound) return [];

    return (dbBets || [])
      .filter(
        (b) =>
          b.round_id === targetRound.dbId &&
          mapBetTypeToOption(targetRound.dbGameType, b.bet_type) ===
            selectedBetOption.option,
      )
      .map((b: any) => {
        return {
          id: b.id,
          userName: b.user_profiles?.name || "-",
          userNickname: b.user_profiles?.nickname || "-",
          amount: b.bet_amount || 0,
          timestamp: b.created_at ? formatDateTime(b.created_at) : "-",
          userIp:
            b.user_profiles?.last_login_ip || b.user_profiles?.join_ip || "-",
          userPoints: b.user_profiles?.points || 0,
        };
      });
  }, [dbBets, gameRounds, selectedBetOption]);

  const filteredRounds = gameRounds
    .filter((round) => {
      const matchesSearch =
        round.roundNumber.toString().includes(searchTerm) ||
        round.gameType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGame =
        gameFilter === "전체" || round.gameType === gameFilter;
      const matchesStatus =
        statusFilter === "all" || round.status === statusFilter;

      const matchesDate = round.date >= selectedDate && round.date <= endDate;

      let matchesTime = true;
      if (startTimeFilter || endTimeFilter) {
        const roundStartDateTime = round.startTime;
        const roundEndDateTime = round.endTime;

        if (startTimeFilter) {
          const filterStartDateTime = `${selectedDate} ${startTimeFilter}`;
          if (roundStartDateTime < filterStartDateTime) {
            matchesTime = false;
          }
        }

        if (endTimeFilter) {
          const filterEndDateTime = `${endDate} ${endTimeFilter}`;
          if (roundEndDateTime > filterEndDateTime) {
            matchesTime = false;
          }
        }
      }

      return (
        matchesSearch &&
        matchesGame &&
        matchesStatus &&
        matchesDate &&
        matchesTime
      );
    })
    .sort((a, b) => {
      if (a.status === "진행중" && b.status !== "진행중") return -1;
      if (a.status !== "진행중" && b.status === "진행중") return 1;
      return b.roundNumber - a.roundNumber;
    });

  const filteredHistory = useMemo(() => {
    return (dbBets || [])
      .map((b: any) => {
        const gameTypeLabel =
          b.game_rounds?.game_type === "ladder" ? "사다리" : "파워볼";

        const resultLabel =
          b.status === "won" ? "승리" : b.status === "lost" ? "패배" : "대기";

        return {
          id: b.id,
          userId: b.user_id,
          userName: b.user_profiles?.name || "-",
          gameType: gameTypeLabel,
          roundNumber: getDisplayRoundNumber(b.game_rounds?.round_number),
          betType: mapBetTypeToOption(
            b.game_rounds?.game_type === "ladder" ? "ladder" : "powerball",
            b.bet_type,
          ),
          amount: b.bet_amount || 0,
          odds: b.odds || 1,
          result: resultLabel,
          winAmount: b.win_amount || 0,
          timestamp: b.created_at ? formatDateTime(b.created_at) : "-",
          settled: b.settled_at ? formatDateTime(b.settled_at) : "-",
        };
      })
      .filter((bet: any) => {
        const matchesSearch =
          bet.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bet.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bet.roundNumber.toString().includes(searchTerm);

        const matchesGame =
          gameFilter === "전체" || bet.gameType === gameFilter;
        const matchesBetType =
          selectedBetType === "all" || bet.betType === selectedBetType;

        return matchesSearch && matchesGame && matchesBetType;
      });
  }, [
    dbBets,
    formatDateTime,
    gameFilter,
    mapBetTypeToOption,
    searchTerm,
    selectedBetType,
  ]);

  void filteredHistory;
  void refetchBets;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return "bg-green-500/20 text-green-400";
      case "진행중":
        return "bg-blue-500/20 text-blue-400";
      case "대기":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "승리":
        return "bg-green-500/20 text-green-400";
      case "패배":
        return "bg-red-500/20 text-red-400";
      case "대기":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const calcBetPayout = (b: any) => {
    const winAmount = typeof b?.win_amount === "number" ? b.win_amount : 0;
    if (winAmount > 0) return winAmount;
    if (b?.status === "won") {
      const betAmount = typeof b?.bet_amount === "number" ? b.bet_amount : 0;
      const odds = typeof b?.odds === "number" ? b.odds : 0;
      return Math.floor(betAmount * odds);
    }
    return 0;
  };

  const totalBetsCount = gameRounds.reduce((sum, r) => sum + r.totalBets, 0);
  const totalBetsAmount = gameRounds.reduce((sum, r) => sum + r.totalAmount, 0);
  const activeRounds = gameRounds.filter((r) => r.status === "진행중").length;
  const currentRoundBets = gameRounds.filter((r) => r.status === "진행중");
  const avgParticipants =
    gameRounds.length > 0
      ? Math.round(
          gameRounds.reduce((sum, r) => sum + r.participants, 0) /
            gameRounds.length,
        )
      : 0;

  const totalPayoutAmount = useMemo(() => {
    return (dbBets || []).reduce((sum: number, b: any) => {
      if (!b?.round_id) return sum;
      return sum + calcBetPayout(b);
    }, 0);
  }, [dbBets]);

  const netProfitAmount = totalBetsAmount - totalPayoutAmount;

  void today;

  const generateDetailedResult = (round: GameRound): JSX.Element => {
    if (round.status !== "완료") {
      if (round.status === "진행중" && round.reservedResult) {
        return (
          <span className="text-green-400 flex items-center gap-1 text-xs">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            {round.reservedResult}
          </span>
        );
      }
      return <span className="text-gray-500">결과미정</span>;
    }

    if (round.detailedResult) {
      const lines = round.detailedResult.split("\n");
      if (lines.length > 1) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-purple-400">{lines[0]}</span>
            <span className="text-purple-300">{lines[1]}</span>
          </div>
        );
      } else {
        return <span className="text-blue-400">{lines[0]}</span>;
      }
    }

    if (round.result && round.result !== "-") {
      return <span className="text-purple-400">{round.result}</span>;
    }

    return <span className="text-gray-500">-</span>;
  };

  const getBetColor = (option: string) => {
    switch (option) {
      case "홀":
        return "#6366f1";
      case "짝":
        return "#a855f7";
      default:
        return "#6b7280";
    }
  };

  const handleUpdateReservedResult = (
    roundId: number,
    result: string | null,
  ) => {
    const round = gameRounds.find((r) => r.id === roundId);
    if (!round) {
      return;
    }

    const parseResultForDb = () => {
      if (round.dbGameType === "powerball") {
        const s = result || "";
        const match = s.match(/일반볼\s+(.+?)\s+파워볼\s+(.+)/);
        const normal = match?.[1] || "";
        const power = match?.[2] || "";
        const [normalOE, normalUO] = normal.split("/");
        const [powerOE, powerUO] = power.split("/");

        // "자동"인 경우 랜덤 선택
        const resolveOddEven = (v: string) =>
          v === "자동"
            ? Math.random() < 0.5
              ? "even"
              : "odd"
            : v === "짝"
              ? "even"
              : "odd";
        const resolveOverUnder = (v: string) =>
          v === "자동"
            ? Math.random() < 0.5
              ? "over"
              : "under"
            : v === "오버"
              ? "over"
              : "under";

        const targetNormalOddEven = resolveOddEven(normalOE);
        const targetNormalUnderOver = resolveOverUnder(normalUO);
        const targetPowerballOddEven = resolveOddEven(powerOE);
        const targetPowerballUnderOver = resolveOverUnder(powerUO);

        // 조건에 맞는 일반볼 5개 생성 (합계가 홀/짝, 언더/오버 조건 충족)
        let normalBalls: number[] = [];
        let normalSum = 0;
        for (let attempt = 0; attempt < 1000; attempt++) {
          normalBalls = [];
          while (normalBalls.length < 5) {
            const ball = Math.floor(Math.random() * 28) + 1;
            if (!normalBalls.includes(ball)) normalBalls.push(ball);
          }
          normalSum = normalBalls.reduce((sum, b) => sum + b, 0);
          const sumOddEven = normalSum % 2 === 1 ? "odd" : "even";
          const sumUnderOver = normalSum <= 72 ? "under" : "over";
          if (
            sumOddEven === targetNormalOddEven &&
            sumUnderOver === targetNormalUnderOver
          ) {
            break;
          }
        }
        normalBalls.sort((a, b) => a - b);

        // 조건에 맞는 파워볼 생성
        let powerball = 0;
        for (let attempt = 0; attempt < 100; attempt++) {
          powerball = Math.floor(Math.random() * 10);
          const pbOddEven = powerball % 2 === 1 ? "odd" : "even";
          const pbUnderOver = powerball <= 4 ? "under" : "over";
          if (
            pbOddEven === targetPowerballOddEven &&
            pbUnderOver === targetPowerballUnderOver
          ) {
            break;
          }
        }

        return {
          normalBalls,
          normalSum,
          powerball,
          normalOddEven: targetNormalOddEven,
          normalUnderOver: targetNormalUnderOver,
          powerballOddEven: targetPowerballOddEven,
          powerballUnderOver: targetPowerballUnderOver,
        };
      }

      const s = result || "";
      const parts = s.split("/").map((x) => x.trim());
      const startLabel = parts[0] || "자동";
      const linesLabel = parts[1] || "자동";
      const oeLabel = parts[2] || "자동";

      // "자동"인 경우 랜덤 선택
      const resolvedStart =
        startLabel === "자동"
          ? Math.random() < 0.5
            ? "좌출발"
            : "우출발"
          : startLabel;
      const resolvedLines =
        linesLabel === "자동"
          ? Math.random() < 0.5
            ? "3줄"
            : "4줄"
          : linesLabel;
      const resolvedOE =
        oeLabel === "자동" ? (Math.random() < 0.5 ? "홀" : "짝") : oeLabel;

      return {
        startPosition: resolvedStart.includes("우") ? "right" : "left",
        lineCount: resolvedLines.includes("3") ? 3 : 4,
        oddEven: resolvedOE === "짝" ? "even" : "odd",
        result: resolvedStart.includes("우") ? "right" : "left",
      };
    };

    void (async () => {
      try {
        if (!result) {
          await cancelReservation(round.dbGameType, round.roundNumber);
        } else {
          const parsedResult = parseResultForDb();
          await reserveResult(
            round.dbGameType,
            round.roundNumber,
            parsedResult,
          );
        }
        await refetchRounds();
        await refetchBets();
      } catch (err) {
        console.error("Error updating reserved result:", err);
      }
    })();
  };

  void getBetColor;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with inline stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">미니게임 관리</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-blue-400">
                진행중 게임 {activeRounds}회
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">
                총 배팅 건수 {totalBetsCount}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-yellow-400">
                총 배팅 금액 {(totalBetsAmount / 1000000).toFixed(1)}M
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-pink-400">
                총 지급 {totalPayoutAmount.toLocaleString()}P
              </span>
              <span className="text-gray-500">|</span>
              <span
                className={
                  netProfitAmount >= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                순손익 {netProfitAmount.toLocaleString()}P
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">
                평균 참여자 {avgParticipants}명
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsResultAdjustmentOpen(true)}
              className="bg-purple-500/80 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <RefreshCw size={20} />
              결과조정
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab("betting")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "betting"
                  ? "bg-purple-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              게임 회차 관리
            </button>
            <button
              onClick={() => setActiveTab("rounds")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "rounds"
                  ? "bg-purple-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              배팅 현황
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "settings"
                  ? "bg-purple-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              환경설정
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "betting" ? (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 날짜 범위 선택 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-medium">
                      조회 기간{" "}
                      <span className="text-white font-normal">
                        ({selectedDate} ~ {endDate})
                      </span>
                    </label>
                    <div className="flex flex-col gap-2">
                      <DateRangePicker
                        startDate={selectedDate}
                        endDate={endDate}
                        onStartDateChange={(newStartDate) => {
                          setSelectedDate(newStartDate);
                          setIsDateRangeValid(true);
                          const timeValid = validateTimeRange(
                            startTimeFilter,
                            endTimeFilter,
                            newStartDate,
                            endDate,
                          );
                          setIsTimeRangeValid(timeValid);
                        }}
                        onEndDateChange={(newEndDate) => {
                          setEndDate(newEndDate);
                          setIsDateRangeValid(true);
                          const timeValid = validateTimeRange(
                            startTimeFilter,
                            endTimeFilter,
                            selectedDate,
                            newEndDate,
                          );
                          setIsTimeRangeValid(timeValid);
                        }}
                      />
                    </div>
                  </div>

                  {/* 시간대 필터 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm font-medium">
                      시간대
                      {(startTimeFilter || endTimeFilter) && (
                        <span className="text-white font-normal ml-1">
                          ({startTimeFilter || "00:00"} ~{" "}
                          {endTimeFilter || "23:59"})
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      {/* 시작 시간 */}
                      <div className="flex-1 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                        <select
                          value={startTimeFilter.split(":")[0] || ""}
                          onChange={(e) => {
                            const minute =
                              startTimeFilter.split(":")[1] || "00";
                            const newStartTime = e.target.value
                              ? `${e.target.value}:${minute}`
                              : "";
                            setStartTimeFilter(newStartTime);

                            // 같은 날짜이고 종료 시간이 있을 때, 종료 시간이 시작 시간보다 이전이면 초기화
                            if (
                              selectedDate === endDate &&
                              endTimeFilter &&
                              newStartTime
                            ) {
                              const [startHour, startMin] = newStartTime
                                .split(":")
                                .map(Number);
                              const [endHour, endMin] = endTimeFilter
                                .split(":")
                                .map(Number);
                              const startMinutes = startHour * 60 + startMin;
                              const endMinutes = endHour * 60 + endMin;
                              if (startMinutes > endMinutes) {
                                setEndTimeFilter("");
                              }
                            }
                          }}
                          className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                        >
                          <option value="">시</option>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, "0");
                            // 같은 날짜이고 종료 시간이 설정되어 있으면, 종료 시간 이후는 비활성화
                            let disabled = false;
                            if (selectedDate === endDate && endTimeFilter) {
                              const endHour = parseInt(
                                endTimeFilter.split(":")[0],
                              );
                              disabled = i > endHour;
                            }
                            return (
                              <option
                                key={hour}
                                value={hour}
                                disabled={disabled}
                              >
                                {hour}시
                              </option>
                            );
                          })}
                        </select>
                        <span className="text-gray-500">:</span>
                        <select
                          value={startTimeFilter.split(":")[1] || ""}
                          onChange={(e) => {
                            const hour = startTimeFilter.split(":")[0] || "00";
                            const newStartTime =
                              e.target.value !== ""
                                ? `${hour}:${e.target.value}`
                                : "";
                            setStartTimeFilter(newStartTime);

                            // 같은 날짜이고 종료 시간이 있을 때, 종료 시간이 시작 시간보다 이전이면 초기화
                            if (
                              selectedDate === endDate &&
                              endTimeFilter &&
                              newStartTime
                            ) {
                              const [startHour, startMin] = newStartTime
                                .split(":")
                                .map(Number);
                              const [endHour, endMin] = endTimeFilter
                                .split(":")
                                .map(Number);
                              const startMinutes = startHour * 60 + startMin;
                              const endMinutes = endHour * 60 + endMin;
                              if (startMinutes > endMinutes) {
                                setEndTimeFilter("");
                              }
                            }
                          }}
                          className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                        >
                          <option value="">분</option>
                          {Array.from({ length: 60 }, (_, i) => {
                            const minute = i.toString().padStart(2, "0");
                            // 같은 날짜이고 시작/종료 시간의 시가 같으면, 종료 분 이후는 비활성화
                            let disabled = false;
                            if (
                              selectedDate === endDate &&
                              startTimeFilter &&
                              endTimeFilter
                            ) {
                              const startHour = parseInt(
                                startTimeFilter.split(":")[0],
                              );
                              const endHour = parseInt(
                                endTimeFilter.split(":")[0],
                              );
                              const endMinute = parseInt(
                                endTimeFilter.split(":")[1],
                              );
                              if (startHour === endHour) {
                                disabled = i > endMinute;
                              }
                            }
                            return (
                              <option
                                key={minute}
                                value={minute}
                                disabled={disabled}
                              >
                                {minute}분
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <span className="text-gray-500 flex-shrink-0">~</span>

                      {/* 종료 시간 */}
                      <div className="flex-1 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                        <select
                          value={endTimeFilter.split(":")[0] || ""}
                          onChange={(e) => {
                            const minute = endTimeFilter.split(":")[1] || "00";
                            setEndTimeFilter(
                              e.target.value
                                ? `${e.target.value}:${minute}`
                                : "",
                            );
                          }}
                          className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                        >
                          <option value="">시</option>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, "0");
                            // 같은 날짜이고 시작 시간이 설정되어 있으면, 시작 시간 이전은 비활성화
                            let disabled = false;
                            if (selectedDate === endDate && startTimeFilter) {
                              const startHour = parseInt(
                                startTimeFilter.split(":")[0],
                              );
                              disabled = i < startHour;
                            }
                            return (
                              <option
                                key={hour}
                                value={hour}
                                disabled={disabled}
                              >
                                {hour}시
                              </option>
                            );
                          })}
                        </select>
                        <span className="text-gray-500">:</span>
                        <select
                          value={endTimeFilter.split(":")[1] || ""}
                          onChange={(e) => {
                            const hour = endTimeFilter.split(":")[0] || "00";
                            setEndTimeFilter(
                              e.target.value !== ""
                                ? `${hour}:${e.target.value}`
                                : "",
                            );
                          }}
                          className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                        >
                          <option value="">분</option>
                          {Array.from({ length: 60 }, (_, i) => {
                            const minute = i.toString().padStart(2, "0");
                            // 같은 날짜이고 시작/종료 시간의 시가 같으면, 시작 분 이전은 비활성화
                            let disabled = false;
                            if (
                              selectedDate === endDate &&
                              startTimeFilter &&
                              endTimeFilter
                            ) {
                              const startHour = parseInt(
                                startTimeFilter.split(":")[0],
                              );
                              const endHour = parseInt(
                                endTimeFilter.split(":")[0],
                              );
                              const startMinute = parseInt(
                                startTimeFilter.split(":")[1],
                              );
                              if (startHour === endHour) {
                                disabled = i < startMinute;
                              }
                            }
                            return (
                              <option
                                key={minute}
                                value={minute}
                                disabled={disabled}
                              >
                                {minute}분
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {(startTimeFilter || endTimeFilter) && (
                        <button
                          onClick={() => {
                            setStartTimeFilter("");
                            setEndTimeFilter("");
                          }}
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                          title="시간대 초기화"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="회차 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="전체">전체</option>
                    <option value="파워볼">파워볼</option>
                    <option value="사다리">사다리</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">모든 상태</option>
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                  </select>
                </div>

                {/* 검색 결과 및 초기화 */}
                <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
                  <span className="text-gray-400 text-sm">
                    검색 결과:{" "}
                    <span className="text-indigo-400 font-medium">
                      {filteredRounds.length}건
                    </span>
                  </span>
                  {(statusFilter !== "all" ||
                    statusFilter !== "all" ||
                    searchTerm ||
                    startTimeFilter ||
                    endTimeFilter ||
                    selectedDate !== endDate) && (
                    <button
                      onClick={() => {
                        setGameFilter("전체");
                        setStatusFilter("all");
                        setSearchTerm("");
                        setStartTimeFilter("");
                        setEndTimeFilter("");
                        const today = formatKST(new Date(), "date");
                        setSelectedDate(today);
                        setEndDate(today);
                      }}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      전체 옵션 초기화
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Game Rounds Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="w-full">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        게임
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        회차
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        결과
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅총액 / 건수
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        상태
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        발매시간 / 마감시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredRounds.map((round) => (
                      <tr
                        key={round.id}
                        onClick={() => setSelectedRoundDetail(round)}
                        className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`${
                              round.gameType === "사다리"
                                ? "bg-blue-500/30 text-blue-300"
                                : "bg-purple-500/30 text-purple-300"
                            } px-2 py-1 rounded text-xs font-semibold`}
                          >
                            {round.gameType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          #{round.roundNumber}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs">
                            {generateDetailedResult(round)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col">
                            <span className="text-white">
                              {round.totalAmount.toLocaleString()}P
                            </span>
                            <span className="text-gray-400 text-xs">
                              {round.totalBets}건
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                                round.status,
                              )}`}
                            >
                              {round.status}
                            </span>
                            {round.status === "진행중" && (
                              <div className="text-xs">
                                <CountdownTimer
                                  endTime={round.countdownEndTime}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col text-gray-300 text-xs">
                            <span>{round.startTime}</span>
                            <span className="text-gray-500">
                              {round.endTime}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "rounds" ? (
          <div className="space-y-6">
            {/* Current Round Betting Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentRoundBets.map((round) => (
                <div
                  key={round.id}
                  className={`bg-gray-900 border rounded-lg p-6 ${
                    round.reservedResult
                      ? "border-green-500/50 shadow-lg shadow-green-500/10"
                      : "border-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded text-sm font-semibold">
                          {round.gameType}
                        </span>
                        <span className="text-white text-lg">
                          #{round.roundNumber}
                        </span>
                        {round.reservedResult && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border border-green-500/30">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            예약: {round.reservedResult}
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        진행중 • 총 {round.totalAmount.toLocaleString()}P •{" "}
                        {round.totalBets}건
                      </p>
                    </div>
                    <CountdownTimer endTime={round.countdownEndTime} />
                  </div>

                  {round.betDistribution && (
                    <div className="space-y-4">
                      {(() => {
                        const regularBets = round.betDistribution;
                        const mainBets =
                          round.gameType === "사다리"
                            ? regularBets.slice(0, 6)
                            : regularBets;
                        const comboBets =
                          round.gameType === "사다리"
                            ? regularBets.slice(6, 10)
                            : [];

                        return (
                          <>
                            {mainBets
                              .reduce((pairs: any[], item, index) => {
                                if (index % 2 === 0) {
                                  pairs.push([item, mainBets[index + 1]]);
                                }
                                return pairs;
                              }, [])
                              .map((pair, pairIdx) => {
                                if (!pair[1]) return null;
                                return (
                                  <div key={pairIdx} className="space-y-2">
                                    {/* Bidirectional Bar - Combined view */}
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-white font-semibold">
                                          {pair[0].option}
                                          {pair[0].option.includes("언더") && (
                                            <span className="text-gray-500 text-xs ml-1">
                                              (
                                              {pair[0].option.includes("일반볼")
                                                ? "72.5"
                                                : "4.5"}
                                              )
                                            </span>
                                          )}
                                          {pair[0].option.includes("오버") && (
                                            <span className="text-gray-500 text-xs ml-1">
                                              (
                                              {pair[0].option.includes("일반볼")
                                                ? "72.5"
                                                : "4.5"}
                                              )
                                            </span>
                                          )}
                                        </span>
                                        <span className="text-indigo-400">
                                          {pair[0].percentage}%
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-indigo-400">
                                          {pair[1].percentage}%
                                        </span>
                                        <span className="text-white font-semibold">
                                          {pair[1].option}
                                          {pair[1].option.includes("언더") && (
                                            <span className="text-gray-500 text-xs ml-1">
                                              (
                                              {pair[1].option.includes("일반볼")
                                                ? "72.5"
                                                : "4.5"}
                                              )
                                            </span>
                                          )}
                                          {pair[1].option.includes("오버") && (
                                            <span className="text-gray-500 text-xs ml-1">
                                              (
                                              {pair[1].option.includes("일반볼")
                                                ? "72.5"
                                                : "4.5"}
                                              )
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Bidirectional Progress Bar - Clickable */}
                                    <div className="flex w-full h-8 bg-gray-800 rounded-lg overflow-hidden justify-between">
                                      <div
                                        onClick={() =>
                                          setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: pair[0].option,
                                          })
                                        }
                                        className="bg-gradient-to-r from-indigo-500 to-indigo-400 flex items-center justify-start pl-2 transition-all duration-300 cursor-pointer hover:from-indigo-600 hover:to-indigo-500"
                                        style={{
                                          width: `${pair[0].percentage}%`,
                                        }}
                                      >
                                        <span className="text-white text-xs font-semibold">
                                          {pair[0].percentage}%
                                        </span>
                                      </div>
                                      <div
                                        onClick={() =>
                                          setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: pair[1].option,
                                          })
                                        }
                                        className="bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-end pr-2 transition-all duration-300 cursor-pointer hover:from-purple-600 hover:to-purple-500"
                                        style={{
                                          width: `${pair[1].percentage}%`,
                                        }}
                                      >
                                        <span className="text-white text-xs font-semibold">
                                          {pair[1].percentage}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Detail Info */}
                                    <div className="flex items-center justify-between text-xs pt-1">
                                      <button
                                        onClick={() =>
                                          setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: pair[0].option,
                                          })
                                        }
                                        className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                      >
                                        {pair[0].amount.toLocaleString()}P (
                                        {pair[0].count}건)
                                      </button>
                                      <button
                                        onClick={() =>
                                          setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: pair[1].option,
                                          })
                                        }
                                        className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                      >
                                        {pair[1].amount.toLocaleString()}P (
                                        {pair[1].count}건)
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                            {/* Combination bets */}
                            {round.gameType === "사다리" &&
                              comboBets.length === 4 && (
                                <div className="space-y-2">
                                  <div className="text-gray-400 text-xs mb-2 font-semibold pt-2 border-t border-gray-800">
                                    조합배팅
                                  </div>

                                  {/* Label row with 4 options */}
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <div className="flex items-center gap-1">
                                      <span className="text-white font-semibold">
                                        {comboBets[0].option}
                                      </span>
                                      <span className="text-indigo-400">
                                        {comboBets[0].percentage}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-white font-semibold">
                                        {comboBets[1].option}
                                      </span>
                                      <span className="text-purple-400">
                                        {comboBets[1].percentage}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-white font-semibold">
                                        {comboBets[2].option}
                                      </span>
                                      <span className="text-cyan-400">
                                        {comboBets[2].percentage}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-white font-semibold">
                                        {comboBets[3].option}
                                      </span>
                                      <span className="text-pink-400">
                                        {comboBets[3].percentage}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* 4-section bar */}
                                  <div className="flex w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
                                    {(() => {
                                      const totalPercentage = comboBets.reduce(
                                        (sum, bet) => sum + bet.percentage,
                                        0,
                                      );
                                      const hasNoBets = totalPercentage === 0;

                                      return (
                                        <>
                                          <div
                                            onClick={() =>
                                              setSelectedBetOption({
                                                gameType: round.gameType,
                                                roundNumber: round.roundNumber,
                                                option: comboBets[0].option,
                                              })
                                            }
                                            className="bg-gradient-to-r from-indigo-500 to-indigo-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-indigo-600 hover:to-indigo-500"
                                            style={{
                                              width: hasNoBets
                                                ? "25%"
                                                : `${comboBets[0].percentage}%`,
                                            }}
                                          >
                                            {!hasNoBets &&
                                              comboBets[0].percentage > 0 && (
                                                <span className="text-white text-xs font-semibold">
                                                  {comboBets[0].percentage}%
                                                </span>
                                              )}
                                          </div>
                                          <div
                                            onClick={() =>
                                              setSelectedBetOption({
                                                gameType: round.gameType,
                                                roundNumber: round.roundNumber,
                                                option: comboBets[1].option,
                                              })
                                            }
                                            className="bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-purple-600 hover:to-purple-500 border-l border-gray-900"
                                            style={{
                                              width: hasNoBets
                                                ? "25%"
                                                : `${comboBets[1].percentage}%`,
                                            }}
                                          >
                                            {!hasNoBets &&
                                              comboBets[1].percentage > 0 && (
                                                <span className="text-white text-xs font-semibold">
                                                  {comboBets[1].percentage}%
                                                </span>
                                              )}
                                          </div>
                                          <div
                                            onClick={() =>
                                              setSelectedBetOption({
                                                gameType: round.gameType,
                                                roundNumber: round.roundNumber,
                                                option: comboBets[2].option,
                                              })
                                            }
                                            className="bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-cyan-600 hover:to-cyan-500 border-l border-gray-900"
                                            style={{
                                              width: hasNoBets
                                                ? "25%"
                                                : `${comboBets[2].percentage}%`,
                                            }}
                                          >
                                            {!hasNoBets &&
                                              comboBets[2].percentage > 0 && (
                                                <span className="text-white text-xs font-semibold">
                                                  {comboBets[2].percentage}%
                                                </span>
                                              )}
                                          </div>
                                          <div
                                            onClick={() =>
                                              setSelectedBetOption({
                                                gameType: round.gameType,
                                                roundNumber: round.roundNumber,
                                                option: comboBets[3].option,
                                              })
                                            }
                                            className="bg-gradient-to-r from-pink-500 to-pink-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-pink-600 hover:to-pink-500 border-l border-gray-900"
                                            style={{
                                              width: hasNoBets
                                                ? "25%"
                                                : `${comboBets[3].percentage}%`,
                                            }}
                                          >
                                            {!hasNoBets &&
                                              comboBets[3].percentage > 0 && (
                                                <span className="text-white text-xs font-semibold">
                                                  {comboBets[3].percentage}%
                                                </span>
                                              )}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* Detail info row with 4 options */}
                                  <div className="flex items-center justify-between text-xs pt-1">
                                    <button
                                      onClick={() =>
                                        setSelectedBetOption({
                                          gameType: round.gameType,
                                          roundNumber: round.roundNumber,
                                          option: comboBets[0].option,
                                        })
                                      }
                                      className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                      {comboBets[0].amount.toLocaleString()}P (
                                      {comboBets[0].count}건)
                                    </button>
                                    <button
                                      onClick={() =>
                                        setSelectedBetOption({
                                          gameType: round.gameType,
                                          roundNumber: round.roundNumber,
                                          option: comboBets[1].option,
                                        })
                                      }
                                      className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                      {comboBets[1].amount.toLocaleString()}P (
                                      {comboBets[1].count}건)
                                    </button>
                                    <button
                                      onClick={() =>
                                        setSelectedBetOption({
                                          gameType: round.gameType,
                                          roundNumber: round.roundNumber,
                                          option: comboBets[2].option,
                                        })
                                      }
                                      className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                      {comboBets[2].amount.toLocaleString()}P (
                                      {comboBets[2].count}건)
                                    </button>
                                    <button
                                      onClick={() =>
                                        setSelectedBetOption({
                                          gameType: round.gameType,
                                          roundNumber: round.roundNumber,
                                          option: comboBets[3].option,
                                        })
                                      }
                                      className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                      {comboBets[3].amount.toLocaleString()}P (
                                      {comboBets[3].count}건)
                                    </button>
                                  </div>
                                </div>
                              )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {hasOpenedSettings && (
          <div className={activeTab === "settings" ? "" : "hidden"}>
            <AdminMiniGamesSettingsTab />
          </div>
        )}

        {false && (
          <div className="space-y-6">
            {/* Bet Type Filter for History - OLD CONTENT REMOVED */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="회원명 또는 ID로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400" size={20} />
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="전체">전체</option>
                    <option value="파워볼">파워볼</option>
                    <option value="사다리">사다리</option>
                  </select>

                  <select
                    value={selectedBetType}
                    onChange={(e) => setSelectedBetType(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">전체 종목</option>
                    <option value="홀">홀</option>
                    <option value="짝">짝</option>
                    <option value="좌출발">좌출발</option>
                    <option value="우출발">우출발</option>
                  </select>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg">
              <div className="w-full">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                        회원
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        게임
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        회차
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅 종목
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅 금액
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        당첨 금액
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        결과
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅 시간
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        정산 시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredHistory.map((bet) => (
                      <tr
                        key={bet.id}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white">{bet.userName}</p>
                            <p className="text-gray-400 text-xs">
                              {bet.userId}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                            {bet.gameType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          #{bet.roundNumber}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-indigo-400 font-semibold">
                            {bet.betType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          {bet.amount.toLocaleString()}P
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              bet.winAmount > 0
                                ? "text-green-400"
                                : "text-gray-500"
                            }
                          >
                            {bet.winAmount > 0
                              ? `+${bet.winAmount.toLocaleString()}P`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getResultColor(
                              bet.result,
                            )}`}
                          >
                            {bet.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300 text-sm">
                          {bet.timestamp}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300 text-sm">
                          {bet.settled}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Bet Modal */}
        {selectedBetOption && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h2 className="text-white text-xl">
                    {selectedBetOption.gameType} #
                    {selectedBetOption.roundNumber} - {selectedBetOption.option}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">배팅 유저 목록</p>
                </div>
                <button
                  onClick={() => setSelectedBetOption(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Fixed Header */}
                <div className="bg-gray-800">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[40%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">
                          회원정보
                        </th>
                        <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                          배팅 금액
                        </th>
                        <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                          보유 포인트
                        </th>
                        <th className="px-4 py-2 text-center text-xs text-gray-400 uppercase">
                          배팅 시간
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-auto flex-1">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[40%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <tbody className="divide-y divide-gray-800">
                      {selectedBetUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-2">
                            <div className="overflow-hidden">
                              <p className="text-white text-sm truncate">
                                {user.userNickname}({user.userName})
                              </p>
                              <p className="text-gray-500 text-xs">
                                {user.userIp}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-yellow-400 text-sm">
                            {user.amount.toLocaleString()}P
                          </td>
                          <td className="px-2 py-2 text-center text-gray-300 text-sm">
                            {user.userPoints.toLocaleString()}P
                          </td>
                          <td className="px-4 py-2 text-center text-gray-300 text-xs">
                            {user.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-800">
                <button
                  onClick={() => setSelectedBetOption(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Round Detail Modal */}
        {selectedRoundDetail && (
          <RoundDetailModal
            round={selectedRoundDetail}
            onClose={() => setSelectedRoundDetail(null)}
          />
        )}

        {/* Result Adjustment Modal */}
        <ResultAdjustmentModal
          isOpen={isResultAdjustmentOpen}
          onClose={() => setIsResultAdjustmentOpen(false)}
          gameRounds={gameRounds}
          onUpdateReservedResult={handleUpdateReservedResult}
        />
      </div>
    </AdminLayout>
  );
}
