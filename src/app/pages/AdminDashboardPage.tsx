import { AdminLayout } from "../components/AdminLayout";
import { useState } from "react";
import { Calendar } from "lucide-react";

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<
    "today" | "week" | "month" | "custom"
  >("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 기간별 데이터
  const statsData = {
    today: {
      date: "2025-12-15",
      newMembers: 45,
      approvedMembers: 45,
      rejectedMembers: 4,
      deposits: 520000,
      depositCount: 28,
      withdrawals: 50000,
      withdrawalCount: 5,
      totalRolling: 85000,
      ladderRolling: 45000,
      powerballRolling: 40000,
      ladderRevenue: 180000,
      powerballRevenue: 150000,
      itemPurchase: 120000,
      itemPurchaseCount: 15,
      itemRevenue: 120000,
      miniGameRevenue: 330000,
    },
    week: {
      date: "2025-12-09 ~ 2025-12-15",
      newMembers: 312,
      approvedMembers: 298,
      rejectedMembers: 28,
      deposits: 3640000,
      depositCount: 196,
      withdrawals: 350000,
      withdrawalCount: 35,
      totalRolling: 595000,
      ladderRolling: 315000,
      powerballRolling: 280000,
      ladderRevenue: 1260000,
      powerballRevenue: 1050000,
      itemPurchase: 840000,
      itemPurchaseCount: 105,
      itemRevenue: 840000,
      miniGameRevenue: 2310000,
    },
    month: {
      date: "2025-11-15 ~ 2025-12-15",
      newMembers: 1156,
      approvedMembers: 1102,
      rejectedMembers: 104,
      deposits: 15600000,
      depositCount: 840,
      withdrawals: 1500000,
      withdrawalCount: 150,
      totalRolling: 2340000,
      ladderRolling: 1404000,
      powerballRolling: 936000,
      ladderRevenue: 5400000,
      powerballRevenue: 4500000,
      itemPurchase: 3600000,
      itemPurchaseCount: 450,
      itemRevenue: 3600000,
      miniGameRevenue: 9900000,
    },
    custom: {
      date:
        startDate && endDate
          ? `${startDate} ~ ${endDate}`
          : "날짜를 선택하세요",
      newMembers: 78,
      approvedMembers: 74,
      rejectedMembers: 8,
      deposits: 890000,
      depositCount: 48,
      withdrawals: 120000,
      withdrawalCount: 12,
      totalRolling: 156000,
      ladderRolling: 93600,
      powerballRolling: 62400,
      ladderRevenue: 390000,
      powerballRevenue: 325000,
      itemPurchase: 240000,
      itemPurchaseCount: 30,
      itemRevenue: 240000,
      miniGameRevenue: 715000,
    },
  };

  const currentStats = statsData[period];
  
  // 전체 매출 = 입금액 - 출금액
  const totalRevenue = currentStats.deposits - currentStats.withdrawals;

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
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                    className="bg-gray-800/60 border border-gray-600/30 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 w-full sm:w-auto"
                  />
                  <span className="text-gray-400 hidden sm:inline">
                    ~
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-gray-800/60 border border-gray-600/30 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 w-full sm:w-auto"
                  />
                </div>
              )}
            </div>
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
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      날짜
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {currentStats.date}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      신규 회원
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {currentStats.newMembers.toLocaleString()}
                      명 (승인{" "}
                      {currentStats.approvedMembers.toLocaleString()}
                      명, 거절{" "}
                      {currentStats.rejectedMembers.toLocaleString()}
                      명)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      입금액
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      +{currentStats.deposits.toLocaleString()}
                      원 (
                      {currentStats.depositCount.toLocaleString()}
                      건)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      출금액
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      -
                      {currentStats.withdrawals.toLocaleString()}
                      원 (
                      {currentStats.withdrawalCount.toLocaleString()}
                      건)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      미니게임 전체 롤링/매출
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {currentStats.totalRolling.toLocaleString()}
                      원 /{" "}
                      {currentStats.miniGameRevenue >= 0 ? '+' : ''}
                      {currentStats.miniGameRevenue.toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      사다리 롤링/매출
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {currentStats.ladderRolling.toLocaleString()}
                      원 /{" "}
                      {currentStats.ladderRevenue >= 0 ? '+' : ''}
                      {currentStats.ladderRevenue.toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      파워볼 롤링/매출
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {currentStats.powerballRolling.toLocaleString()}
                      원 /{" "}
                      {currentStats.powerballRevenue >= 0 ? '+' : ''}
                      {currentStats.powerballRevenue.toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/20 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      아이템 구매 금액
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {currentStats.itemPurchase.toLocaleString()}
                      원 (
                      {currentStats.itemPurchaseCount.toLocaleString()}
                      건)
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      전체 매출
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {totalRevenue >= 0 ? '+' : ''}
                      {totalRevenue.toLocaleString()}
                      원
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}