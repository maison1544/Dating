import { AdminLayout } from "@/components/layout/AdminLayout";
import { useDebounce } from "@/hooks/useDebounce";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, Filter, RefreshCw, X } from "lucide-react";
import { DateRangePicker } from "@/components/layout/DateRangePicker";
import { AdminPagination } from "@/components/common/AdminPagination";
import { CountdownTimer } from "@/components/layout/CountdownTimer";
import { AdminMiniGamesSettingsTab } from "./AdminMiniGamesSettingsTab";
import { RoundDetailModal } from "@/components/layout/RoundDetailModal";
import { ResultAdjustmentModal } from "@/components/layout/ResultAdjustmentModal";
import { GameResultDisplay } from "@/components/layout/GameResultDisplay";
import {
  useAllGameBets,
  useAllGameRounds,
  useReserveResult,
} from "@/hooks/useSupabase";
import {
  formatDatetime,
  formatKST,
  getDisplayRoundNumber,
  getEndOfDayKST,
  getStartOfDayKST,
} from "@/lib/utils/dateUtils";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

interface BetOption {
  option: string;
  amount: number;
  count: number;
  percentage: number;
}

interface GameRound {
  id: number;
  dbId: string;
  dbRoundNumber: string;
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
  status: "진행중" | "완료" | "완료(예약)" | "대기";
  participants: number;
  wasReserved?: boolean;
  date: string;
  betDistribution?: BetOption[];
  reservedResult?: string;
  isReservationPending?: boolean;
}

export function AdminMiniGamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [gameFilter, setGameFilter] = useState("전체");

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
  const [optimisticReservedResults, setOptimisticReservedResults] = useState<
    Record<number, string | null>
  >({});
  const [reservationPending, setReservationPending] = useState<
    Record<number, boolean>
  >({});
  const [startTimeFilter, setStartTimeFilter] = useState("");
  const [endTimeFilter, setEndTimeFilter] = useState("");
  const [roundsPage, setRoundsPage] = useState(1);
  const roundsPageSize = 20;

  // 서버 시간 오프셋 (ms) - 유저 페이지와 타이머 동기화용
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const lastServerSyncRef = useRef<number>(0);

  const dbGameTypeFilter =
    gameFilter === "사다리"
      ? "ladder"
      : gameFilter === "파워볼"
        ? "powerball"
        : "all";

  const startDateIso = getStartOfDayKST(selectedDate);
  const endDateIso = getEndOfDayKST(endDate);

  const {
    rounds: dbRounds,
    totalCount: roundsTotalCount,
    refetch: refetchRounds,
  } = useAllGameRounds({
    gameType: dbGameTypeFilter,
    startDate: startDateIso,
    endDate: endDateIso,
    startTime: startTimeFilter || undefined,
    endTime: endTimeFilter || undefined,
    page: roundsPage,
    pageSize: roundsPageSize,
  });

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setRoundsPage(1);
  }, [selectedDate, endDate, gameFilter, startTimeFilter, endTimeFilter]);

  const roundsTotalPages = Math.ceil(roundsTotalCount / roundsPageSize);

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
  const { bets: statsBets, refetch: refetchStatsBets } = useAllGameBets({
    gameType: dbGameTypeFilter,
    startDate: startDateIso,
    endDate: endDateIso,
  });
  const { reserveResult, cancelReservation } = useReserveResult();

  const roundsRefetchTimerRef = useRef<number | null>(null);
  const betsRefetchTimerRef = useRef<number | null>(null);

  // 서버 시간 동기화 - 유저 페이지와 타이머 일치시키기
  useEffect(() => {
    const syncServerTime = async () => {
      const clientNow = Date.now();
      if (clientNow - lastServerSyncRef.current < 15000) return; // 15초마다 동기화

      try {
        const { data, error } = await supabase.rpc("get_server_time");
        if (!error && data) {
          const serverNow = new Date(data).getTime();
          if (!Number.isNaN(serverNow)) {
            setServerTimeOffset(serverNow - clientNow);
            lastServerSyncRef.current = clientNow;
          }
        }
      } catch (e) {
        // 서버 시간 가져오기 실패 시 무시
      }
    };

    syncServerTime();
    const interval = setInterval(syncServerTime, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const scheduleRoundsRefetch = () => {
      if (roundsRefetchTimerRef.current) {
        window.clearTimeout(roundsRefetchTimerRef.current);
      }
      roundsRefetchTimerRef.current = window.setTimeout(() => {
        void refetchRounds();
        void refetchBets();
        void refetchStatsBets();
      }, 250);
    };

    const scheduleBetsRefetch = () => {
      if (betsRefetchTimerRef.current) {
        window.clearTimeout(betsRefetchTimerRef.current);
      }
      betsRefetchTimerRef.current = window.setTimeout(() => {
        void refetchBets();
        void refetchStatsBets();
      }, 100);
    };

    const channelSuffix = crypto.randomUUID();
    const channel = supabaseAdmin
      .channel(`admin-minigames-realtime-${channelSuffix}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rounds" },
        scheduleRoundsRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_bets" },
        scheduleBetsRefetch,
      )
      .subscribe();

    return () => {
      if (roundsRefetchTimerRef.current) {
        window.clearTimeout(roundsRefetchTimerRef.current);
      }
      if (betsRefetchTimerRef.current) {
        window.clearTimeout(betsRefetchTimerRef.current);
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [refetchBets, refetchRounds, refetchStatsBets]);

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
        await Promise.all([refetchRounds(), refetchBets(), refetchStatsBets()]);
      }
    };

    // 초기 실행 및 2초마다 체크 (5초에서 단축)
    checkAndProcessRounds();
    const interval = setInterval(checkAndProcessRounds, 2000);

    return () => clearInterval(interval);
  }, [dbRounds, refetchRounds, refetchBets, refetchStatsBets]);

  // 타이머 종료 시 즉시 새 라운드 생성 및 데이터 갱신
  const handleTimerEnd = useCallback(
    async (gameType: string) => {
      const dbGameType = gameType === "사다리" ? "ladder" : "powerball";
      try {
        await supabase.rpc("game_tick_client", { p_game_type: dbGameType });
        // 즉시 refetch (debounce 없이)
        await Promise.all([refetchRounds(), refetchBets(), refetchStatsBets()]);
      } catch (e) {
        console.error("handleTimerEnd error:", e);
      }
    },
    [refetchRounds, refetchBets, refetchStatsBets],
  );

  const formatDateTime = formatDatetime;

  const mapStatus = (
    status: string,
  ): "진행중" | "완료" | "완료(예약)" | "대기" => {
    if (status === "betting" || status === "playing") return "진행중";
    if (status === "completed" || status === "settled") return "완료";
    return "대기";
  };

  const buildRoundDisplayId = useCallback(
    (dbGameType: "powerball" | "ladder", roundNumber: number) => {
      return (dbGameType === "ladder" ? 2000000 : 1000000) + roundNumber;
    },
    [],
  );

  const formatReservedResult = useCallback(
    (gameType: "powerball" | "ladder", reserved: any): string | undefined => {
      if (!reserved) return undefined;

      if (gameType === "powerball") {
        // "auto"를 "자동"으로 표시
        const normalOE =
          reserved.normalOddEven === "auto"
            ? "자동"
            : reserved.normalOddEven === "even"
              ? "짝"
              : "홀";
        const normalUO =
          reserved.normalUnderOver === "auto"
            ? "자동"
            : reserved.normalUnderOver === "over"
              ? "오버"
              : "언더";
        const powerOE =
          reserved.powerballOddEven === "auto"
            ? "자동"
            : reserved.powerballOddEven === "even"
              ? "짝"
              : "홀";
        const powerUO =
          reserved.powerballUnderOver === "auto"
            ? "자동"
            : reserved.powerballUnderOver === "over"
              ? "오버"
              : "언더";
        return `일반볼 ${normalOE}/${normalUO} 파워볼 ${powerOE}/${powerUO}`;
      }

      // "auto"를 "자동"으로 표시
      const start =
        reserved.startPosition === "auto"
          ? "자동"
          : reserved.startPosition === "right"
            ? "우출발"
            : "좌출발";
      const lines =
        reserved.lineCount === "auto"
          ? "자동"
          : reserved.lineCount === 3
            ? "3줄"
            : "4줄";
      const oe =
        reserved.oddEven === "auto"
          ? "자동"
          : reserved.oddEven === "even"
            ? "짝"
            : "홀";
      return `${start}/${lines}/${oe}`;
    },
    [],
  );

  useEffect(() => {
    if (!dbRounds || dbRounds.length === 0) return;

    setOptimisticReservedResults((prev) => {
      let changed = false;
      const next = { ...prev };

      (dbRounds || []).forEach((r: any) => {
        const dbGameType: "powerball" | "ladder" =
          r.game_type === "ladder" ? "ladder" : "powerball";
        const roundNumber = getDisplayRoundNumber(r.round_number);
        const id = buildRoundDisplayId(dbGameType, roundNumber);
        if (!Object.prototype.hasOwnProperty.call(prev, id)) return;

        const serverResult =
          formatReservedResult(dbGameType, r.reserved_result) ?? null;
        if ((prev[id] ?? null) === serverResult) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [dbRounds, buildRoundDisplayId, formatReservedResult]);

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
      const baseStatus = mapStatus(r.status);
      // 예약 결과로 완료된 경우 "완료(예약)"으로 표시
      const wasReserved =
        r.reserved_result !== null && r.reserved_result !== undefined;
      const status: "진행중" | "완료" | "완료(예약)" | "대기" =
        baseStatus === "완료" && wasReserved ? "완료(예약)" : baseStatus;
      const resultInfo = formatRoundResult(dbGameType, r.result);

      const betDistribution = buildBetDistribution(
        dbGameType,
        r.id,
        dbBets || [],
      );
      const roundBets = (dbBets || []).filter((b) => b.round_id === r.id);
      const totalBets = roundBets.length;
      // game_bets에서 직접 배팅금액 합산 (total_bet_amount가 업데이트되지 않는 문제 해결)
      const totalAmount = roundBets.reduce(
        (sum, b) => sum + (b.bet_amount || 0),
        0,
      );
      const participants = new Set(roundBets.map((b) => b.user_id)).size;

      const roundNumber = getDisplayRoundNumber(r.round_number);
      const id = buildRoundDisplayId(dbGameType, roundNumber);
      const startTime = formatDateTime(r.start_time);
      const endTime = formatDateTime(r.end_time);
      const countdownEndTime =
        r.betting_end_time || r.end_time || r.start_time || null;
      const hasOptimistic = Object.prototype.hasOwnProperty.call(
        optimisticReservedResults,
        id,
      );
      const resolvedReservedResult = hasOptimistic
        ? optimisticReservedResults[id]
        : formatReservedResult(dbGameType, r.reserved_result);
      const isReservationPending = !!reservationPending[id];

      return {
        id,
        dbId: r.id,
        dbRoundNumber: String(r.round_number ?? ""),
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
        wasReserved,
        date: formatKST(r.start_time || new Date().toISOString()).split(" ")[0],
        betDistribution,
        reservedResult: resolvedReservedResult ?? undefined,
        isReservationPending,
      };
    });
  }, [
    buildRoundDisplayId,
    dbBets,
    dbRounds,
    formatReservedResult,
    optimisticReservedResults,
    reservationPending,
  ]);

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

  // 서버에서 이미 날짜/시간/게임타입으로 필터링됨 - 검색어만 클라이언트에서 필터링
  // 진행중 게임을 최상단에 표시 (당일 조회 시)
  const filteredRounds = gameRounds
    .filter((round) => {
      const matchesSearch =
        debouncedSearchTerm === "" ||
        round.roundNumber.toString().includes(debouncedSearchTerm) ||
        round.gameType
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      // 진행중 게임 최상단
      if (a.status === "진행중" && b.status !== "진행중") return -1;
      if (a.status !== "진행중" && b.status === "진행중") return 1;
      // 나머지는 시작시간 역순 (게임 종류 상관없이 시간순 정렬)
      return b.startTime.localeCompare(a.startTime);
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
          bet.userName
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          bet.userId
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          bet.roundNumber.toString().includes(debouncedSearchTerm);

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
    debouncedSearchTerm,
    selectedBetType,
  ]);

  void filteredHistory;
  void refetchBets;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return "bg-green-500/20 text-green-400";
      case "완료(예약)":
        return "bg-emerald-500/20 text-emerald-300";
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

  const calcBetPayout = useCallback((b: any) => {
    const winAmount = typeof b?.win_amount === "number" ? b.win_amount : 0;
    if (winAmount > 0) return winAmount;
    if (b?.status === "won") {
      const betAmount = typeof b?.bet_amount === "number" ? b.bet_amount : 0;
      const odds = typeof b?.odds === "number" ? b.odds : 0;
      return Math.floor(betAmount * odds);
    }
    return 0;
  }, []);

  const minigameStats = useMemo(() => {
    return (statsBets || []).reduce(
      (acc, bet: any) => {
        const amount =
          typeof bet?.bet_amount === "number" ? bet.bet_amount : 0;
        const payout = calcBetPayout(bet);
        const gameType = bet?.game_rounds?.game_type;

        acc.totalBetsCount += 1;
        acc.totalBetsAmount += amount;
        acc.totalPayoutAmount += payout;

        if (gameType === "ladder") {
          acc.ladderRollingAmount += amount;
        } else if (gameType === "powerball") {
          acc.powerballRollingAmount += amount;
        }

        return acc;
      },
      {
        totalBetsCount: 0,
        totalBetsAmount: 0,
        totalPayoutAmount: 0,
        ladderRollingAmount: 0,
        powerballRollingAmount: 0,
      },
    );
  }, [calcBetPayout, statsBets]);

  const totalBetsCount = minigameStats.totalBetsCount;
  const totalBetsAmount = minigameStats.totalBetsAmount;
  const totalPayoutAmount = minigameStats.totalPayoutAmount;
  const ladderRollingAmount = minigameStats.ladderRollingAmount;
  const powerballRollingAmount = minigameStats.powerballRollingAmount;
  const totalRollingAmount = totalBetsAmount;
  const activeRounds = gameRounds.filter((r) => r.status === "진행중").length;
  const avgParticipants =
    gameRounds.length > 0
      ? Math.round(
          gameRounds.reduce((sum, r) => sum + r.participants, 0) /
            gameRounds.length,
        )
      : 0;

  const netProfitAmount = totalBetsAmount - totalPayoutAmount;

  void today;

  const generateDetailedResult = (round: GameRound): JSX.Element => {
    return (
      <GameResultDisplay
        status={round.status}
        result={round.result}
        detailedResult={round.detailedResult}
        reservedResult={round.reservedResult}
        variant="table"
      />
    );
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

        // "자동"인 경우 "auto"로 저장, 실제 값 결정은 게임 결과 생성 시 수행
        const resolveOddEven = (v: string) =>
          v === "자동" ? "auto" : v === "짝" ? "even" : "odd";
        const resolveOverUnder = (v: string) =>
          v === "자동" ? "auto" : v === "오버" ? "over" : "under";

        const targetNormalOddEven = resolveOddEven(normalOE);
        const targetNormalUnderOver = resolveOverUnder(normalUO);
        const targetPowerballOddEven = resolveOddEven(powerOE);
        const targetPowerballUnderOver = resolveOverUnder(powerUO);

        // "auto"가 포함된 경우 normalBalls/powerball은 null로 저장
        // 게임 결과 생성 시 auto 값을 랜덤으로 결정하고 숫자 생성
        const hasAuto =
          targetNormalOddEven === "auto" ||
          targetNormalUnderOver === "auto" ||
          targetPowerballOddEven === "auto" ||
          targetPowerballUnderOver === "auto";

        if (hasAuto) {
          // "auto"가 있으면 숫자는 나중에 생성
          return {
            normalBalls: null,
            normalSum: null,
            powerball: null,
            normalOddEven: targetNormalOddEven,
            normalUnderOver: targetNormalUnderOver,
            powerballOddEven: targetPowerballOddEven,
            powerballUnderOver: targetPowerballUnderOver,
          };
        }

        // 모든 값이 확정된 경우에만 숫자 생성
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

      // 사다리
      const s = result || "";
      const parts = s.split("/").map((x) => x.trim());
      const startLabel = parts[0] || "자동";
      const linesLabel = parts[1] || "자동";
      const oeLabel = parts[2] || "자동";

      // "자동"인 경우 "auto"로 저장
      const resolvedStart =
        startLabel === "자동"
          ? "auto"
          : startLabel.includes("우")
            ? "right"
            : "left";
      const resolvedLines =
        linesLabel === "자동" ? "auto" : linesLabel.includes("3") ? 3 : 4;
      const resolvedOE =
        oeLabel === "자동" ? "auto" : oeLabel === "짝" ? "even" : "odd";

      return {
        startPosition: resolvedStart,
        lineCount: resolvedLines,
        oddEven: resolvedOE,
        result: resolvedStart, // result는 startPosition과 동일
      };
    };

    void (async () => {
      try {
        if (!result) {
          const { success, error } = await cancelReservation(
            round.dbGameType,
            round.dbRoundNumber,
          );
          if (!success) throw new Error(error || "예약 취소 실패");
        } else {
          const parsedResult = parseResultForDb();
          const { success, error } = await reserveResult(
            round.dbGameType,
            round.dbRoundNumber,
            parsedResult,
          );
          if (!success) throw new Error(error || "예약 실패");
        }
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
              <span
                className="text-green-400"
                title="선택된 기간 내 모든 배팅 수"
              >
                총 배팅 건수 {totalBetsCount}
              </span>
              <span className="text-gray-500">|</span>
              <span
                className="text-yellow-400"
                title="선택된 기간 내 모든 배팅 금액 합계"
              >
                총 배팅 금액 {totalBetsAmount.toLocaleString()}P
              </span>
              <span className="text-gray-500">|</span>
              <span
                className="text-pink-400"
                title="선택된 기간 내 승리 배팅에 대한 지급 금액 합계"
              >
                총 지급 {totalPayoutAmount.toLocaleString()}P
              </span>
              <span className="text-gray-500">|</span>
              <span
                className={
                  netProfitAmount >= 0 ? "text-emerald-400" : "text-red-400"
                }
                title="총 배팅 금액 - 총 지급"
              >
                순손익 {netProfitAmount.toLocaleString()}P
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm mt-2">
              <span className="text-indigo-400">
                전체 롤링금액: {totalRollingAmount.toLocaleString()}P
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-blue-400">
                사다리 롤링금액: {ladderRollingAmount.toLocaleString()}P
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-purple-400">
                파워볼 롤링금액: {powerballRollingAmount.toLocaleString()}P
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
                </div>

                {/* 검색 결과 및 초기화 */}
                <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
                  <span className="text-gray-400 text-sm">
                    총{" "}
                    <span className="text-indigo-400 font-medium">
                      {roundsTotalCount}건
                    </span>{" "}
                    (현재 페이지: {filteredRounds.length}건)
                  </span>
                  {(gameFilter !== "전체" ||
                    searchTerm ||
                    startTimeFilter ||
                    endTimeFilter ||
                    selectedDate !== endDate) && (
                    <button
                      onClick={() => {
                        setGameFilter("전체");
                        setSearchTerm("");
                        setStartTimeFilter("");
                        setEndTimeFilter("");
                        const today = formatKST(new Date(), "date");
                        setSelectedDate(today);
                        setEndDate(today);
                        setRoundsPage(1);
                      }}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      필터 초기화
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
                                  serverTimeOffset={serverTimeOffset}
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
              {/* 페이지네이션 */}
              <AdminPagination
                currentPage={roundsPage}
                totalPages={roundsTotalPages}
                onPageChange={setRoundsPage}
              />
            </div>
          </div>
        ) : activeTab === "rounds" ? (
          <div className="space-y-6">
            {/* 진행중인 회차만 표시 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRounds
                .filter((round) => round.status === "진행중")
                .map((round) => (
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
                          {round.status} • 총{" "}
                          {round.totalAmount.toLocaleString()}P •{" "}
                          {round.totalBets}건
                        </p>
                      </div>
                      {round.status === "진행중" ? (
                        <CountdownTimer
                          endTime={round.countdownEndTime}
                          serverTimeOffset={serverTimeOffset}
                        />
                      ) : (
                        <GameResultDisplay
                          status={round.status}
                          result={round.result}
                          detailedResult={round.detailedResult}
                          reservedResult={round.reservedResult}
                          variant="header"
                        />
                      )}
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
                                            {pair[0].option.includes(
                                              "언더",
                                            ) && (
                                              <span className="text-gray-500 text-xs ml-1">
                                                (
                                                {pair[0].option.includes(
                                                  "일반볼",
                                                )
                                                  ? "72.5"
                                                  : "4.5"}
                                                )
                                              </span>
                                            )}
                                            {pair[0].option.includes(
                                              "오버",
                                            ) && (
                                              <span className="text-gray-500 text-xs ml-1">
                                                (
                                                {pair[0].option.includes(
                                                  "일반볼",
                                                )
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
                                            {pair[1].option.includes(
                                              "언더",
                                            ) && (
                                              <span className="text-gray-500 text-xs ml-1">
                                                (
                                                {pair[1].option.includes(
                                                  "일반볼",
                                                )
                                                  ? "72.5"
                                                  : "4.5"}
                                                )
                                              </span>
                                            )}
                                            {pair[1].option.includes(
                                              "오버",
                                            ) && (
                                              <span className="text-gray-500 text-xs ml-1">
                                                (
                                                {pair[1].option.includes(
                                                  "일반볼",
                                                )
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
                                        const totalPercentage =
                                          comboBets.reduce(
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
                                                  roundNumber:
                                                    round.roundNumber,
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
                                                  roundNumber:
                                                    round.roundNumber,
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
                                                  roundNumber:
                                                    round.roundNumber,
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
                                                  roundNumber:
                                                    round.roundNumber,
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
                                        {comboBets[0].amount.toLocaleString()}P
                                        ({comboBets[0].count}건)
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
                                        {comboBets[1].amount.toLocaleString()}P
                                        ({comboBets[1].count}건)
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
                                        {comboBets[2].amount.toLocaleString()}P
                                        ({comboBets[2].count}건)
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
                                        {comboBets[3].amount.toLocaleString()}P
                                        ({comboBets[3].count}건)
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
          serverTimeOffset={serverTimeOffset}
          onTimerEnd={handleTimerEnd}
        />
      </div>
    </AdminLayout>
  );
}
