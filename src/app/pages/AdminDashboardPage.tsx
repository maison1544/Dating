import { AdminLayout } from "../components/AdminLayout";
import { AdminPageLoader } from "../components/common/AdminPageLoader";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import { DateRangePicker } from "../components/DateRangePicker";
import { useAdminDashboardData, useDashboardStats } from "../hooks/useSupabase";
import { formatKST } from "../../lib/dateUtils";

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">(
    "today",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (period !== "custom") return;
    if (startDate && endDate) return;

    const now = new Date();
    const fallbackStart = new Date();
    fallbackStart.setMonth(fallbackStart.getMonth() - 1);
    const startKey =
      formatKST(fallbackStart, "date") ||
      fallbackStart.toISOString().slice(0, 10);
    const endKey = formatKST(now, "date") || now.toISOString().slice(0, 10);

    if (!startDate) setStartDate(startKey);
    if (!endDate) setEndDate(endKey);
  }, [endDate, period, startDate]);

  // Supabase에서 통계 데이터 가져오기
  const { stats } = useDashboardStats(period, startDate, endDate);
  const {
    cards,
    revenueTrend,
    gameBetting,
    memberStatus,
    recentActivities,
    isLoading,
    error,
    refetch,
  } = useAdminDashboardData(period, startDate, endDate);

  const periodLabel = useMemo(() => {
    switch (period) {
      case "today":
        return "오늘";
      case "week":
        return "이번 주";
      case "month":
        return "이번 달";
      case "custom":
        return "선택 기간";
      default:
        return "오늘";
    }
  }, [period]);

  const dateDisplay = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return formatKST(now, "date");
      case "week": {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return `${formatKST(weekAgo, "date")} ~ ${formatKST(now, "date")}`;
      }
      case "month": {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return `${formatKST(monthAgo, "date")} ~ ${formatKST(now, "date")}`;
      }
      case "custom":
        return startDate && endDate
          ? `${startDate} ~ ${endDate}`
          : "날짜를 선택하세요";
      default:
        return formatKST(now, "date");
    }
  }, [endDate, period, startDate]);

  const totalRevenue = useMemo(
    () => stats.deposits - stats.withdrawals,
    [stats.deposits, stats.withdrawals],
  );

  const formatMoney = useCallback((value: number) => {
    const sign = value < 0 ? "-" : "";
    return `${sign}${Math.abs(Math.round(value)).toLocaleString()}원`;
  }, []);

  const formatCount = useCallback(
    (value: number) => `${Math.round(value).toLocaleString()}명`,
    [],
  );

  const percentChange = useCallback((value: number, prev: number) => {
    if (prev === 0) {
      if (value === 0) return 0;
      return 100;
    }
    return ((value - prev) / prev) * 100;
  }, []);

  const renderDelta = useCallback(
    (value: number, prev: number) => {
      const delta = value - prev;
      const pct = percentChange(value, prev);
      const isUp = delta >= 0;
      const Icon = isUp ? TrendingUp : TrendingDown;
      return (
        <div
          className={`inline-flex items-center gap-1 text-xs ${
            isUp ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          <Icon size={14} />
          <span>
            {delta >= 0 ? "+" : "-"}
            {Math.abs(Math.round(delta)).toLocaleString()} (
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(1)}%)
          </span>
        </div>
      );
    },
    [percentChange],
  );

  const maxTrend = useMemo(
    () =>
      Math.max(
        1,
        ...revenueTrend.map((d) => Math.max(d.deposits, d.withdrawals)),
      ),
    [revenueTrend],
  );
  const gameTotal = useMemo(
    () => Math.max(1, gameBetting.ladder + gameBetting.powerball),
    [gameBetting.ladder, gameBetting.powerball],
  );
  const memberTotal = useMemo(
    () =>
      Math.max(
        1,
        memberStatus.active +
          memberStatus.pending +
          memberStatus.suspended +
          memberStatus.rejected,
      ),
    [
      memberStatus.active,
      memberStatus.rejected,
      memberStatus.pending,
      memberStatus.suspended,
    ],
  );

  const trendRows = useMemo(
    () =>
      revenueTrend.map((d) => ({
        key: d.date,
        dateLabel: d.date.slice(5),
        depositWidth: `${(d.deposits / maxTrend) * 100}%`,
        withdrawalWidth: `${(d.withdrawals / maxTrend) * 100}%`,
        deposits: Math.round(d.deposits).toLocaleString(),
        withdrawals: Math.round(d.withdrawals).toLocaleString(),
      })),
    [revenueTrend, maxTrend],
  );

  const gameRows = useMemo(
    () =>
      [
        {
          key: "ladder",
          label: "사다리",
          value: gameBetting.ladder,
          barClass: "bg-pink-500/70",
        },
        {
          key: "powerball",
          label: "파워볼",
          value: gameBetting.powerball,
          barClass: "bg-violet-500/70",
        },
      ].map((row) => ({
        ...row,
        width: `${(row.value / gameTotal) * 100}%`,
        display: Math.round(row.value).toLocaleString(),
      })),
    [gameBetting.ladder, gameBetting.powerball, gameTotal],
  );

  const memberRows = useMemo(
    () =>
      [
        { key: "active", label: "활성", barClass: "bg-emerald-500/70" },
        { key: "pending", label: "대기", barClass: "bg-amber-500/70" },
        { key: "suspended", label: "정지", barClass: "bg-rose-500/70" },
        { key: "rejected", label: "승인거절", barClass: "bg-orange-500/70" },
      ].map((row) => {
        const value = memberStatus[row.key as keyof typeof memberStatus];
        return {
          ...row,
          value,
          width: `${(value / memberTotal) * 100}%`,
          display: Math.round(value).toLocaleString(),
        };
      }),
    [memberStatus, memberTotal],
  );

  const activityRows = useMemo(
    () =>
      recentActivities.map((a) => {
        const time = a.created_at ? formatKST(a.created_at, "datetime") : "-";
        const amount =
          typeof a.amount === "number" ? Math.round(a.amount) : null;
        const amountDisplay =
          amount === null
            ? "-"
            : a.type === "withdraw"
              ? `-${Math.abs(amount).toLocaleString()}`
              : a.type === "charge"
                ? `+${Math.abs(amount).toLocaleString()}`
                : amount.toLocaleString();
        return { ...a, time, amountDisplay };
      }),
    [recentActivities],
  );

  const statsRows = useMemo(
    () => [
      { key: "date", label: "날짜", value: dateDisplay },
      {
        key: "newMembers",
        label: "신규 회원",
        value: `${stats.newMembers.toLocaleString()}명 (승인 ${stats.approvedMembers.toLocaleString()}명, 거절 ${stats.rejectedMembers.toLocaleString()}명)`,
      },
      {
        key: "deposits",
        label: "입금액",
        value: `+${stats.deposits.toLocaleString()}원 (${stats.depositCount.toLocaleString()}건)`,
      },
      {
        key: "withdrawals",
        label: "출금액",
        value: `-${stats.withdrawals.toLocaleString()}원 (${stats.withdrawalCount.toLocaleString()}건)`,
      },
      {
        key: "totalRolling",
        label: "미니게임 전체 롤링/매출",
        value: `${stats.totalRolling.toLocaleString()}원 / ${stats.miniGameRevenue >= 0 ? "+" : ""}${stats.miniGameRevenue.toLocaleString()}원`,
      },
      {
        key: "ladderRolling",
        label: "사다리 롤링/매출",
        value: `${stats.ladderRolling.toLocaleString()}원 / ${stats.ladderRevenue >= 0 ? "+" : ""}${stats.ladderRevenue.toLocaleString()}원`,
      },
      {
        key: "powerballRolling",
        label: "파워볼 롤링/매출",
        value: `${stats.powerballRolling.toLocaleString()}원 / ${stats.powerballRevenue >= 0 ? "+" : ""}${stats.powerballRevenue.toLocaleString()}원`,
      },
      {
        key: "itemPurchase",
        label: "아이템 구매 금액",
        value: `${stats.itemPurchase.toLocaleString()}원 (${stats.itemPurchaseCount.toLocaleString()}건)`,
      },
      {
        key: "totalRevenue",
        label: "전체 매출",
        value: `${totalRevenue >= 0 ? "+" : ""}${totalRevenue.toLocaleString()}원`,
      },
    ],
    [dateDisplay, stats, totalRevenue],
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-gray-100 text-3xl">통계</h1>
              <span className="text-gray-400 text-sm">
                매출 전체 현황을 확인하세요
              </span>
            </div>

            {/* Period Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800/40 border border-gray-700/30 rounded-lg p-1.5 w-full sm:w-auto overflow-x-auto">
                <Calendar
                  className="text-gray-400 ml-2 flex-shrink-0"
                  size={16}
                />
                <button
                  onClick={() => setPeriod("today")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    period === "today"
                      ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                  }`}
                >
                  오늘
                </button>
                <button
                  onClick={() => setPeriod("week")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    period === "week"
                      ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                  }`}
                >
                  이번 주
                </button>
                <button
                  onClick={() => setPeriod("month")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    period === "month"
                      ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                  }`}
                >
                  이번 달
                </button>
                <button
                  onClick={() => setPeriod("custom")}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    period === "custom"
                      ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                  }`}
                >
                  기간 설정
                </button>
              </div>

              {/* Custom Date Range */}
              {period === "custom" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-800/40 border border-gray-700/30 rounded-lg p-2 w-full sm:w-auto">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-400 text-xs">신규 회원</div>
                  <div className="text-gray-100 text-2xl mt-1">
                    {formatCount(cards.newMembers.value)}
                  </div>
                  <div className="mt-2">
                    {renderDelta(cards.newMembers.value, cards.newMembers.prev)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center">
                  <Users className="text-indigo-300" size={18} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-400 text-xs">입금</div>
                  <div className="text-gray-100 text-2xl mt-1">
                    {formatMoney(cards.deposits.value)}
                  </div>
                  <div className="mt-2">
                    {renderDelta(cards.deposits.value, cards.deposits.prev)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
                  <Wallet className="text-emerald-300" size={18} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-400 text-xs">출금</div>
                  <div className="text-gray-100 text-2xl mt-1">
                    {formatMoney(cards.withdrawals.value)}
                  </div>
                  <div className="mt-2">
                    {renderDelta(
                      cards.withdrawals.value,
                      cards.withdrawals.prev,
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-400/20 flex items-center justify-center">
                  <TrendingDown className="text-rose-300" size={18} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-400 text-xs">전체 매출</div>
                  <div className="text-gray-100 text-2xl mt-1">
                    {formatMoney(cards.totalRevenue.value)}
                  </div>
                  <div className="mt-2">
                    {renderDelta(
                      cards.totalRevenue.value,
                      cards.totalRevenue.prev,
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-400/20 flex items-center justify-center">
                  <TrendingUp className="text-amber-300" size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Loading/Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-400/20 rounded-lg p-4 text-rose-200 text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity size={16} />
                <span>대시보드 데이터를 불러오지 못했습니다.</span>
              </div>
              <button
                onClick={() => refetch()}
                className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-sm"
              >
                다시 시도
              </button>
            </div>
          )}

          {isLoading && <AdminPageLoader />}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Trend */}
              <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-gray-100">
                      {periodLabel} 입/출금 추이
                    </div>
                    <div className="text-xs text-gray-400">
                      입금(인디고) / 출금(로즈)
                    </div>
                  </div>
                </div>
                {trendRows.length === 0 ? (
                  <div className="text-gray-400 text-sm py-12 text-center">
                    표시할 데이터가 없습니다
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {trendRows.map((d) => (
                      <div key={d.key} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-gray-400">
                          {d.dateLabel}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 bg-gray-900/40 rounded overflow-hidden">
                              <div
                                className="h-2 bg-indigo-500/70"
                                style={{
                                  width: d.depositWidth,
                                }}
                              />
                            </div>
                            <div className="text-xs text-indigo-200 w-24 text-right">
                              +{d.deposits}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 bg-gray-900/40 rounded overflow-hidden">
                              <div
                                className="h-2 bg-rose-500/70"
                                style={{
                                  width: d.withdrawalWidth,
                                }}
                              />
                            </div>
                            <div className="text-xs text-rose-200 w-24 text-right">
                              -{d.withdrawals}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 shadow-xl">
                <div className="text-gray-100">
                  {periodLabel} 게임 베팅 분포
                </div>
                <div className="text-xs text-gray-400">사다리 / 파워볼</div>

                <div className="mt-4 space-y-3">
                  {gameRows.map((row) => (
                    <div key={row.key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{row.label}</span>
                        <span className="text-gray-100">{row.display}원</span>
                      </div>
                      <div className="h-2 bg-gray-900/40 rounded overflow-hidden mt-2">
                        <div
                          className={`h-2 ${row.barClass}`}
                          style={{ width: row.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="text-gray-100">회원 상태</div>
                  <div className="mt-3 space-y-2">
                    {memberRows.map((row) => (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{row.label}</span>
                          <span className="text-gray-100">{row.display}명</span>
                        </div>
                        <div className="h-2 bg-gray-900/40 rounded overflow-hidden mt-2">
                          <div
                            className={`h-2 ${row.barClass}`}
                            style={{ width: row.width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-gray-700/30 bg-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="text-gray-300" size={16} />
                <span className="text-gray-100">최근 활동</span>
                <span className="text-xs text-gray-400">최근 10건</span>
              </div>
              <button
                onClick={() => refetch()}
                className="text-xs text-gray-300 hover:text-gray-100 px-3 py-2 rounded-lg hover:bg-gray-700/30"
              >
                새로고침
              </button>
            </div>
            {isLoading ? (
              <AdminPageLoader />
            ) : recentActivities.length === 0 ? (
              <div className="p-6 text-gray-400 text-sm">
                표시할 최근 활동이 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr className="border-b border-gray-700/30 bg-gray-800/40">
                      <th className="px-4 py-3 text-left text-xs text-gray-400 whitespace-nowrap">
                        시간
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-400 whitespace-nowrap">
                        유형
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-400 whitespace-nowrap">
                        사용자
                      </th>
                      <th className="px-4 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                        금액
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityRows.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                          {a.time}
                        </td>
                        <td className="px-4 py-3 text-gray-100 whitespace-nowrap">
                          {a.meta || a.type}
                        </td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                          {a.userName}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-100 whitespace-nowrap">
                          {a.amountDisplay}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Statistics Table */}
          <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="border-b border-gray-700/30 bg-gray-800/60">
                    <th className="px-4 py-3 text-left text-xs text-gray-400">
                      항목
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400">
                      값
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statsRows.map((row, index) => (
                    <tr
                      key={row.key}
                      className={`border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors ${
                        index === statsRows.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 text-gray-100">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
