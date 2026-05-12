import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAllGameBets } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase/client";
import { UserDetailModal } from "./UserDetailModal";
import { formatKST } from "@/lib/utils/dateUtils";
import { GameResultDisplay } from "./GameResultDisplay";

interface GameRound {
  id: number;
  dbId?: string;
  gameType: string;
  dbGameType?: "powerball" | "ladder";
  roundNumber: number;
  result: string;
  detailedResult?: string;
  reservedResult?: string;
  totalBets: number;
  totalAmount: number;

  startTime: string;
  endTime: string;
  status: "진행중" | "완료" | "완료(예약)" | "대기";
  participants: number;
  date: string;
  betDistribution?: {
    option: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

interface BetUser {
  id: number;
  userId: string;
  userEmail: string;
  userNickname: string;
  userName: string;
  betType: string;
  amount: number;
  result: "대기" | "승리" | "패배";
  timestamp: string;
  winAmount: number;
  userIp: string;
}

interface RoundDetailModalProps {
  round: GameRound | null;
  onClose: () => void;
}

export function RoundDetailModal({ round, onClose }: RoundDetailModalProps) {
  const [selectedBetOption, setSelectedBetOption] = useState<{
    gameType: string;
    roundNumber: number;
    option: string;
  } | null>(null);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);

  if (!round) return null;

  const { bets: dbBets, refetch: refetchBets } = useAllGameBets(
    round.dbId ? { roundId: round.dbId } : undefined,
  );

  const realtimeRefetchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!round.dbId) return;

    const scheduleRefetch = () => {
      if (realtimeRefetchTimerRef.current) {
        window.clearTimeout(realtimeRefetchTimerRef.current);
      }
      realtimeRefetchTimerRef.current = window.setTimeout(() => {
        void refetchBets();
      }, 150);
    };

    const channel = supabase
      .channel(`round-detail-${round.dbId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_bets",
          filter: `round_id=eq.${round.dbId}`,
        },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rounds",
          filter: `id=eq.${round.dbId}`,
        },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (realtimeRefetchTimerRef.current) {
        window.clearTimeout(realtimeRefetchTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [refetchBets, round.dbId]);

  const totalPayout = useMemo(() => {
    return (dbBets || []).reduce((sum: number, b: any) => {
      const winAmount = typeof b?.win_amount === "number" ? b.win_amount : 0;
      if (winAmount > 0) return sum + winAmount;

      if (b?.status === "won") {
        const betAmount = typeof b?.bet_amount === "number" ? b.bet_amount : 0;
        const odds = typeof b?.odds === "number" ? b.odds : 0;
        return sum + Math.floor(betAmount * odds);
      }

      return sum;
    }, 0);
  }, [dbBets]);

  const siteProfitLoss = round.totalAmount - totalPayout;

  const mapBetTypeToOption = useMemo(() => {
    const mapPowerball: Record<string, string> = {
      "normal-odd": "일반볼 홀",
      "normal-even": "일반볼 짝",
      "normal-under": "일반볼 언더",
      "normal-over": "일반볼 오버",
      "powerball-odd": "파워볼 홀",
      "powerball-even": "파워볼 짝",
      "powerball-under": "파워볼 언더",
      "powerball-over": "파워볼 오버",
    };

    const mapLadder: Record<string, string> = {
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

      left: "좌출발",
      right: "우출발",
      odd: "홀",
      even: "짝",
      "left-3": "좌3",
      "left-4": "좌4",
      "right-3": "우3",
      "right-4": "우4",
    };

    return (gameType: "powerball" | "ladder", betType: string) => {
      if (gameType === "powerball") return mapPowerball[betType] || betType;
      return mapLadder[betType] || betType;
    };
  }, []);

  const modalDbGameType: "powerball" | "ladder" =
    round.dbGameType || (round.gameType === "사다리" ? "ladder" : "powerball");

  const betUsers: BetUser[] = useMemo(() => {
    return (dbBets || []).map((b: any, idx: number) => {
      const betType = mapBetTypeToOption(modalDbGameType, b.bet_type);
      const result: BetUser["result"] =
        b.status === "won" ? "승리" : b.status === "lost" ? "패배" : "대기";

      const timestamp = b.created_at
        ? formatKST(b.created_at, "datetime")
        : "-";

      return {
        id: idx,
        userId: b.user_id,
        userEmail: b.user_profiles?.email || "-",
        userNickname: b.user_profiles?.nickname || "-",
        userName: b.user_profiles?.name || "-",
        betType,
        amount: b.bet_amount || 0,
        result,
        timestamp,
        winAmount: b.win_amount || 0,
        userIp:
          b.user_profiles?.last_login_ip || b.user_profiles?.join_ip || "-",
      };
    });
  }, [dbBets, mapBetTypeToOption, modalDbGameType]);

  const mapUserStatusLabel = (status: string | null | undefined) => {
    if (status === "active") return "활성";
    if (status === "suspended") return "정지";
    if (status === "pending") return "대기";
    if (status === "rejected") return "승인거절";
    return status || "-";
  };

  const openUserDetail = async (userId: string) => {
    if (!userId) return;
    setIsUserLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "id, name, nickname, email, phone, created_at, last_login_at, join_ip, last_login_ip, status, points, bank, account_number, account_holder, profile_image",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      setIsUserLoading(false);
      return;
    }

    setSelectedUser({
      id: data.id,
      name: data.name,
      nickname: data.nickname,
      email: data.email,
      phone: data.phone,
      joined: data.created_at || undefined,
      lastLogin: data.last_login_at || undefined,
      joinIp: data.join_ip,
      lastIp: data.last_login_ip,
      status: mapUserStatusLabel(data.status),
      points: data.points,
      bank: data.bank,
      accountNumber: data.account_number,
      accountHolder: data.account_holder,
      profileImage: data.profile_image,
    });
    setIsUserLoading(false);
  };

  const selectedOptionUsers = selectedBetOption
    ? betUsers.filter((user) => user.betType === selectedBetOption.option)
    : [];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span
                  className={`${
                    round.gameType === "파워볼"
                      ? "bg-purple-500/30 text-purple-300"
                      : "bg-blue-500/30 text-blue-300"
                  } px-3 py-1 rounded text-sm font-semibold`}
                >
                  {round.gameType}
                </span>
                <h2 className="text-white text-2xl font-semibold">
                  #{round.roundNumber} 회차 상세
                </h2>
                {(round.status === "완료" || round.status === "완료(예약)") &&
                  (round.detailedResult || round.result) && (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-gray-500">|</span>
                      <GameResultDisplay
                        status={round.status}
                        result={round.result}
                        detailedResult={round.detailedResult}
                        reservedResult={round.reservedResult}
                        variant="header"
                      />
                    </div>
                  )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* 통계 정보를 텍스트로 표시 */}
            <div className="flex items-center gap-3 text-sm mb-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">사이트 손익</span>
                <span
                  className={`font-semibold ${
                    siteProfitLoss >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {siteProfitLoss >= 0
                    ? `+${siteProfitLoss.toLocaleString()}P`
                    : `${siteProfitLoss.toLocaleString()}P`}
                </span>
              </div>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">배팅금액</span>
                <span className="text-yellow-400 font-semibold">
                  {round.totalAmount.toLocaleString()}P ({round.totalBets}건)
                </span>
              </div>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">상태</span>
                <span
                  className={`font-semibold ${
                    round.status === "완료"
                      ? "text-green-400"
                      : round.status === "진행중"
                        ? "text-blue-400"
                        : "text-gray-400"
                  }`}
                >
                  {round.status}
                </span>
              </div>
            </div>

            <p className="text-gray-400 text-sm">
              {round.startTime} ~ {round.endTime}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* 배팅 분포도 */}
            <div className="flex justify-center">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 max-w-2xl w-full">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  배팅 분포도
                </h3>
                {round.betDistribution && (
                  <div className="space-y-3">
                    {(() => {
                      const regularBets =
                        round.gameType === "파워볼"
                          ? round.betDistribution
                          : round.betDistribution.filter((bet) =>
                              [
                                "좌출발",
                                "우출발",
                                "3줄",
                                "4줄",
                                "홀",
                                "짝",
                              ].includes(bet.option),
                            );

                      const combinationBets =
                        round.gameType === "파워볼"
                          ? []
                          : round.betDistribution.filter((bet) =>
                              ["좌3짝", "좌4홀", "우3홀", "우4짝"].includes(
                                bet.option,
                              ),
                            );

                      return (
                        <>
                          {/* Regular bets - pairs */}
                          {regularBets
                            .reduce((pairs: any[], item, index) => {
                              if (index % 2 === 0) {
                                pairs.push([item, regularBets[index + 1]]);
                              }
                              return pairs;
                            }, [])
                            .map((pair, pairIdx) => {
                              if (!pair[1]) return null;
                              return (
                                <div key={pairIdx} className="space-y-2">
                                  {/* Labels */}
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

                                  {/* Bidirectional Bar */}
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
                                      className="text-gray-400 hover:text-white transition-colors"
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
                                      className="text-gray-400 hover:text-white transition-colors"
                                    >
                                      {pair[1].amount.toLocaleString()}P (
                                      {pair[1].count}건)
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                          {/* Combination bets - 4 sections in one bar (only for 사다리) */}
                          {round.gameType === "사다리" &&
                            combinationBets.length === 4 && (
                              <div className="space-y-2">
                                <div className="text-gray-400 text-xs mb-2 font-semibold pt-2 border-t border-gray-800">
                                  조합배팅
                                </div>

                                {/* Label row with 4 options */}
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">
                                      {combinationBets[0].option}
                                    </span>
                                    <span className="text-indigo-400">
                                      {combinationBets[0].percentage}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">
                                      {combinationBets[1].option}
                                    </span>
                                    <span className="text-purple-400">
                                      {combinationBets[1].percentage}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">
                                      {combinationBets[2].option}
                                    </span>
                                    <span className="text-cyan-400">
                                      {combinationBets[2].percentage}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">
                                      {combinationBets[3].option}
                                    </span>
                                    <span className="text-pink-400">
                                      {combinationBets[3].percentage}%
                                    </span>
                                  </div>
                                </div>

                                {/* 4-section bar */}
                                <div className="flex w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
                                  {(() => {
                                    const hasNoCombinationBets =
                                      combinationBets.every(
                                        (bet) => bet.percentage === 0,
                                      );
                                    return (
                                      <>
                                        <div
                                          onClick={() =>
                                            setSelectedBetOption({
                                              gameType: round.gameType,
                                              roundNumber: round.roundNumber,
                                              option: combinationBets[0].option,
                                            })
                                          }
                                          className="bg-gradient-to-r from-indigo-500 to-indigo-400 flex items-center justify-center transition-all duration-300 cursor-pointer hover:from-indigo-600 hover:to-indigo-500"
                                          style={{
                                            width: hasNoCombinationBets
                                              ? "25%"
                                              : `${combinationBets[0].percentage}%`,
                                          }}
                                        >
                                          {!hasNoCombinationBets &&
                                            combinationBets[0].percentage >
                                              0 && (
                                              <span className="text-white text-xs font-semibold">
                                                {combinationBets[0].percentage}%
                                              </span>
                                            )}
                                        </div>
                                        <div
                                          onClick={() =>
                                            setSelectedBetOption({
                                              gameType: round.gameType,
                                              roundNumber: round.roundNumber,
                                              option: combinationBets[1].option,
                                            })
                                          }
                                          className="bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center transition-all duration-300 cursor-pointer hover:from-purple-600 hover:to-purple-500 border-l border-gray-900"
                                          style={{
                                            width: hasNoCombinationBets
                                              ? "25%"
                                              : `${combinationBets[1].percentage}%`,
                                          }}
                                        >
                                          {!hasNoCombinationBets &&
                                            combinationBets[1].percentage >
                                              0 && (
                                              <span className="text-white text-xs font-semibold">
                                                {combinationBets[1].percentage}%
                                              </span>
                                            )}
                                        </div>
                                        <div
                                          onClick={() =>
                                            setSelectedBetOption({
                                              gameType: round.gameType,
                                              roundNumber: round.roundNumber,
                                              option: combinationBets[2].option,
                                            })
                                          }
                                          className="bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center transition-all duration-300 cursor-pointer hover:from-cyan-600 hover:to-cyan-500 border-l border-gray-900"
                                          style={{
                                            width: hasNoCombinationBets
                                              ? "25%"
                                              : `${combinationBets[2].percentage}%`,
                                          }}
                                        >
                                          {!hasNoCombinationBets &&
                                            combinationBets[2].percentage >
                                              0 && (
                                              <span className="text-white text-xs font-semibold">
                                                {combinationBets[2].percentage}%
                                              </span>
                                            )}
                                        </div>
                                        <div
                                          onClick={() =>
                                            setSelectedBetOption({
                                              gameType: round.gameType,
                                              roundNumber: round.roundNumber,
                                              option: combinationBets[3].option,
                                            })
                                          }
                                          className="bg-gradient-to-r from-pink-500 to-pink-400 flex items-center justify-center transition-all duration-300 cursor-pointer hover:from-pink-600 hover:to-pink-500 border-l border-gray-900"
                                          style={{
                                            width: hasNoCombinationBets
                                              ? "25%"
                                              : `${combinationBets[3].percentage}%`,
                                          }}
                                        >
                                          {!hasNoCombinationBets &&
                                            combinationBets[3].percentage >
                                              0 && (
                                              <span className="text-white text-xs font-semibold">
                                                {combinationBets[3].percentage}%
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
                                        option: combinationBets[0].option,
                                      })
                                    }
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    {combinationBets[0].amount.toLocaleString()}
                                    P ({combinationBets[0].count}건)
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedBetOption({
                                        gameType: round.gameType,
                                        roundNumber: round.roundNumber,
                                        option: combinationBets[1].option,
                                      })
                                    }
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    {combinationBets[1].amount.toLocaleString()}
                                    P ({combinationBets[1].count}건)
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedBetOption({
                                        gameType: round.gameType,
                                        roundNumber: round.roundNumber,
                                        option: combinationBets[2].option,
                                      })
                                    }
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    {combinationBets[2].amount.toLocaleString()}
                                    P ({combinationBets[2].count}건)
                                  </button>
                                  <button
                                    onClick={() =>
                                      setSelectedBetOption({
                                        gameType: round.gameType,
                                        roundNumber: round.roundNumber,
                                        option: combinationBets[3].option,
                                      })
                                    }
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    {combinationBets[3].amount.toLocaleString()}
                                    P ({combinationBets[3].count}건)
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
            </div>

            {/* 배팅 유저 목록 */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">
                배팅 유저 목록
                {selectedBetOption && (
                  <span className="ml-2 text-indigo-400 text-base">
                    ({selectedBetOption.option})
                  </span>
                )}
              </h3>
              {isUserLoading && (
                <div className="text-gray-400 text-sm mb-2">
                  회원정보 불러오는 중...
                </div>
              )}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                          이메일
                        </th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                          이름
                        </th>
                        <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                          배팅 옵션
                        </th>
                        <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">
                          배팅 금액
                        </th>
                        <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                          결과
                        </th>
                        <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">
                          당첨금
                        </th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                          배팅 시간
                        </th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                          배팅 IP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {(selectedBetOption ? selectedOptionUsers : betUsers).map(
                        (user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                            onClick={() => {
                              if (isUserLoading) return;
                              void openUserDetail(user.userId);
                            }}
                          >
                            <td className="px-4 py-3 text-gray-300 text-sm">
                              {user.userEmail}
                            </td>
                            <td className="px-4 py-3 text-white text-sm">
                              {user.userNickname}({user.userName})
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs">
                                {user.betType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-white text-sm">
                              {user.amount.toLocaleString()}P
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  user.result === "승리"
                                    ? "bg-green-500/20 text-green-300"
                                    : user.result === "패배"
                                      ? "bg-red-500/20 text-red-300"
                                      : "bg-gray-600 text-gray-300"
                                }`}
                              >
                                {user.result}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <span
                                className={
                                  user.winAmount > 0
                                    ? "text-yellow-400"
                                    : "text-gray-400"
                                }
                              >
                                {user.winAmount > 0
                                  ? `+${user.winAmount.toLocaleString()}P`
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {user.timestamp}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {user.userIp}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedBetOption && (
                <button
                  onClick={() => setSelectedBetOption(null)}
                  className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  전체 유저 보기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
