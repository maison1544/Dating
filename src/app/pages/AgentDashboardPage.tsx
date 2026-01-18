import { AdminLayout } from "../components/AdminLayout";
import { useState } from "react";
import { UserDetailModal } from "../components/UserDetailModal";
import { useAuth } from "../contexts/AuthContext";
import {
  useAgentDashboardStats,
  useAgentChatProfiles,
} from "../hooks/useSupabase";
import { DollarSign, Calendar } from "lucide-react";
import { DateRangePicker } from "../components/DateRangePicker";
import { formatKST } from "../../lib/dateUtils";

interface AssignedProfile {
  id: string;
  name: string;
  age: number;
  image: string | null;
  totalChats: number;
  activeChats: number;
}

interface Member {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  joinedAt: string;
  joined?: string;
  totalSpent: number;
  status: "active" | "suspended";
  phone?: string;
  gender?: string;
  age?: number;
  recentPurchases?: {
    date: string;
    amount: number;
    description: string;
  }[];
  points?: number;
  online?: boolean;
  lastLogin?: string;
  joinIp?: string;
  lastIp?: string;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
}

// 매출 기록 인터페이스
interface RevenueRecord {
  date: string;
  memberName: string;
  memberNickname: string;
  type: "충전" | "출금";
  amount: number;
}

export function AgentDashboardPage() {
  const { adminAccount } = useAuth();
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Supabase hooks for real data
  const {
    stats,
    members: dbMembers,
    revenueRecords: dbRevenueRecords,
    isLoading,
    error,
  } = useAgentDashboardStats(adminAccount?.id);
  const { profiles: assignedDbProfiles } = useAgentChatProfiles(
    adminAccount?.id,
  );

  // 매출 관리용 state 추가
  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<
    "all" | "충전" | "출금"
  >("all");
  const [isRevenueDateRangeValid, setIsRevenueDateRangeValid] = useState(true);

  // 에이전트 정보 from Supabase
  const agentInfo = {
    username: adminAccount?.username || "agent",
    referralCode: stats.referralCode || "N/A",
    totalRevenue: stats.totalRevenue,
    monthlyRevenue: stats.monthlyRevenue,
    weeklyRevenue: stats.weeklyRevenue,
    todayRevenue: stats.todayRevenue,
    totalMembers: stats.totalMembers,
    activeMembers: stats.activeMembers,
    newMembersThisMonth: stats.newMembersThisMonth,
    assignedProfiles: stats.assignedProfiles,
    onlineProfiles: stats.onlineProfiles,
    chatRevenueTotal: stats.chatRevenueTotal,
    chatRevenueMonth: stats.chatRevenueMonth,
  };

  // 배정된 프로필 카드 from Supabase
  const assignedProfiles: AssignedProfile[] = assignedDbProfiles.map(
    (p: any) => ({
      id: p.id,
      name: p.name || "프로필",
      age: p.age || 0,
      image: p.image || null,
      totalChats: Number(p.total_chats ?? 0),
      activeChats: Number(p.active_chats ?? 0),
    }),
  );

  // Transform Supabase members data
  const members: Member[] = dbMembers.map((m: any) => ({
    id: m.id,
    name: m.name || "Unknown",
    nickname: m.nickname || "",
    email: m.email || "",
    joinedAt: m.created_at?.split("T")[0] || "",
    joined: formatKST(m.created_at, "datetime"),
    lastLogin: m.last_login_at ? formatKST(m.last_login_at, "datetime") : "",
    joinIp: m.join_ip || "",
    lastIp: m.last_login_ip || "",
    totalSpent: (m.total_deposited || 0) - (m.total_withdrawn || 0),
    status: m.status === "active" ? "active" : "suspended",
    phone: m.phone || "",
    gender: "",
    age: 0,
    points: m.points || 0,
    online: m.is_online || false,
    bank: m.bank || "",
    accountNumber: m.account_number || "",
    accountHolder: m.account_holder || "",
    recentPurchases: [],
  }));

  // Transform Supabase revenue records
  const revenueRecords: RevenueRecord[] = dbRevenueRecords.map((r: any) => {
    const type = r.type === "charge" ? "충전" : "출금";
    const rawAmount = Number(r.amount || 0);
    return {
      date: formatKST(r.created_at, "datetime"),
      memberName: r.users?.name || "Unknown",
      memberNickname: r.users?.nickname || "",
      type,
      amount: type === "충전" ? rawAmount : -Math.abs(rawAmount),
    };
  });

  // 매출 포맷 함수
  const formatRevenue = (amount: number) => {
    const sign = amount < 0 ? "-" : "+";
    const absAmount = Math.abs(amount);
    return `${sign}${absAmount.toLocaleString()}원`;
  };

  // 날짜 필터링된 매출 계산
  const getFilteredRevenue = () => {
    const filteredRecords = revenueRecords.filter((record) => {
      if (!revenueStartDate && !revenueEndDate) return true;
      const recordDate = record.date.split(" ")[0];
      if (revenueStartDate && recordDate < revenueStartDate) return false;
      if (revenueEndDate && recordDate > revenueEndDate) return false;
      return true;
    });

    const deposit = filteredRecords
      .filter((r) => r.type === "충전")
      .reduce((sum, record) => sum + record.amount, 0);

    const withdrawal = filteredRecords
      .filter((r) => r.type === "출금")
      .reduce((sum, record) => sum + Math.abs(record.amount), 0);

    const total = deposit - withdrawal;

    return { deposit, withdrawal, total };
  };

  // 날짜 및 유형 필터링된 매출 목록
  const getFilteredRevenueRecords = () => {
    return revenueRecords
      .filter((record) => {
        // 날짜 필터
        if (!revenueStartDate && !revenueEndDate) {
          // 날짜 필터 없음
        } else {
          const recordDate = record.date.split(" ")[0];
          if (revenueStartDate && recordDate < revenueStartDate) return false;
          if (revenueEndDate && recordDate > revenueEndDate) return false;
        }

        // 유형 필터
        if (revenueTypeFilter !== "all" && record.type !== revenueTypeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {isLoading && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-300 text-sm">
            로딩 중...
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
            {error.message}
          </div>
        )}
        {/* Header */}
        <div>
          <h1 className="text-white text-2xl mb-2">에이전트 대시보드</h1>
          <p className="text-gray-400 text-sm mb-3">
            안녕하세요,{" "}
            <span className="text-indigo-400 font-semibold">
              {agentInfo.username}
            </span>
            님
          </p>

          {/* 한 줄 통계 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">총 매출</span>
              <span className="font-bold text-green-400">
                ₩{agentInfo.totalRevenue.toLocaleString()}
              </span>
            </div>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">활성 회원</span>
              <span className="font-bold text-indigo-400">
                {agentInfo.totalMembers}명
              </span>
            </div>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">배정 프로필</span>
              <span className="font-bold text-purple-400">
                {assignedProfiles.length}개
              </span>
            </div>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">온라인 프로필</span>
              <span className="font-bold text-emerald-400">
                {agentInfo.onlineProfiles}개
              </span>
            </div>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">추천코드</span>
              <span className="font-bold text-indigo-400">
                {agentInfo.referralCode}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Summary - 관리자 페이지 스타일로 변경 */}
        <div className="space-y-4">
          {/* 매출 기간 선택 및 요약 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-white text-lg flex items-center gap-2">
                <Calendar size={16} />
                매출 현황
              </h2>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 text-sm">
                <DateRangePicker
                  startDate={revenueStartDate}
                  endDate={revenueEndDate}
                  onStartDateChange={(newStart) => {
                    setRevenueStartDate(newStart);
                    setIsRevenueDateRangeValid(true);
                  }}
                  onEndDateChange={(newEnd) => {
                    setRevenueEndDate(newEnd);
                    setIsRevenueDateRangeValid(true);
                  }}
                />
                {(revenueStartDate || revenueEndDate) && (
                  <button
                    onClick={() => {
                      setRevenueStartDate("");
                      setRevenueEndDate("");
                      setIsRevenueDateRangeValid(true);
                    }}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors whitespace-nowrap"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>

            {/* 총 매출 표시 */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">총 매출</p>
                  <p
                    className={`font-bold text-sm sm:text-xl ${
                      getFilteredRevenue().total < 0
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {getFilteredRevenue().total < 0 ? "-" : "+"}
                    {Math.abs(getFilteredRevenue().total).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">입금액</p>
                  <p className="text-green-400 font-bold text-sm sm:text-lg">
                    +{getFilteredRevenue().deposit.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">출금액</p>
                  <p className="text-red-400 font-bold text-sm sm:text-lg">
                    -{getFilteredRevenue().withdrawal.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-gray-700 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">전체 회원</span>
                  <span className="font-semibold text-indigo-400">
                    {agentInfo.totalMembers}명
                  </span>
                </div>
                <span className="text-gray-600 hidden sm:inline">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">배정 프로필</span>
                  <span className="font-semibold text-purple-400">
                    {assignedProfiles.length}개
                  </span>
                </div>
                <span className="text-gray-600 hidden sm:inline">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">추천코드</span>
                  <span className="font-semibold text-indigo-400">
                    {agentInfo.referralCode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 매출 목록 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white flex items-center gap-2">
                <DollarSign size={18} />
                매출 목록
              </h3>
              {/* 유형 필터 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRevenueTypeFilter("all")}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    revenueTypeFilter === "all"
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setRevenueTypeFilter("충전")}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    revenueTypeFilter === "충전"
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  입금
                </button>
                <button
                  onClick={() => setRevenueTypeFilter("출금")}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    revenueTypeFilter === "출금"
                      ? "bg-red-500 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  출금
                </button>
              </div>
            </div>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="text-left text-gray-400 text-xs sm:text-sm font-medium px-3 sm:px-4 py-3 whitespace-nowrap">
                        일시
                      </th>
                      <th className="text-left text-gray-400 text-xs sm:text-sm font-medium px-3 sm:px-4 py-3 whitespace-nowrap">
                        회원명
                      </th>
                      <th className="text-left text-gray-400 text-xs sm:text-sm font-medium px-3 sm:px-4 py-3 whitespace-nowrap">
                        유형
                      </th>
                      <th className="text-right text-gray-400 text-xs sm:text-sm font-medium px-3 sm:px-4 py-3 whitespace-nowrap">
                        금액
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {getFilteredRevenueRecords().length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-gray-500 py-8"
                        >
                          조건에 맞는 매출 기록이 없습니다
                        </td>
                      </tr>
                    ) : (
                      getFilteredRevenueRecords().map((record, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="text-gray-300 text-xs sm:text-sm px-3 sm:px-4 py-3 whitespace-nowrap">
                            {record.date}
                          </td>
                          <td className="text-white text-xs sm:text-sm px-3 sm:px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const member = members.find(
                                  (m) => m.name === record.memberName,
                                );
                                if (member) {
                                  setSelectedMember(member);
                                  setShowMemberModal(true);
                                }
                              }}
                              className="hover:text-indigo-400 transition-colors cursor-pointer underline"
                            >
                              {record.memberNickname} ({record.memberName})
                            </button>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                record.type === "충전"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {record.type}
                            </span>
                          </td>
                          <td
                            className={`text-right text-xs sm:text-sm font-semibold px-3 sm:px-4 py-3 whitespace-nowrap ${
                              record.amount < 0
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                          >
                            {formatRevenue(record.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <UserDetailModal
          user={{
            ...selectedMember,
            status:
              selectedMember.status === "active"
                ? "활성"
                : selectedMember.status === "suspended"
                  ? "정지"
                  : selectedMember.status,
          }}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
          isReadOnly={true}
        />
      )}
    </AdminLayout>
  );
}
