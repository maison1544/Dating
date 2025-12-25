import { AdminLayout } from "../components/AdminLayout";
import { useState } from "react";
import { UserDetailModal } from "../components/UserDetailModal";
import {
  TrendingUp,
  Users,
  MessageCircle,
  DollarSign,
  Calendar,
  Eye,
  X,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  Info,
} from "lucide-react";

interface AssignedProfile {
  id: number;
  name: string;
  age: number;
  image: string;
  totalChats: number;
  activeChats: number;
}

interface Member {
  id: number;
  name: string;
  nickname?: string;
  email: string;
  joinedAt: string;
  joined?: string;
  totalSpent: number;
  status: "active" | "suspended";
  phone?: string;
  location?: string;
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

interface ChatRequest {
  id: number;
  userName: string;
  profileName: string;
  time: string;
  message: string;
  unread: boolean;
}

// 매출 기록 인터페이스 추가
interface RevenueRecord {
  date: string;
  memberName: string;
  memberNickname: string;
  type: "충전" | "출금";
  amount: number;
}

export function AgentDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChat, setSelectedChat] =
    useState<ChatRequest | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<Member | null>(null);

  // 매출 관리용 state 추가
  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<
    "all" | "충전" | "출금"
  >("all");
  const [isRevenueDateRangeValid, setIsRevenueDateRangeValid] =
    useState(true);
  const [memberSortFilter, setMemberSortFilter] = useState<
    "date" | "revenue"
  >("date");

  // 에이전트 정보 (실제로는 로그인 정보에서 가져옴)
  const agentInfo = {
    username: "agent_kim",
    referralCode: "AGENT_KIM2024",
    totalRevenue: 5480000,
    monthlyRevenue: 1250000,
    weeklyRevenue: 320000,
    todayRevenue: 45000,
    totalMembers: 24,
    activeMembers: 18,
    newMembersThisMonth: 5,
  };

  // 배정된 프로필 카드
  const [assignedProfiles] = useState<AssignedProfile[]>([
    {
      id: 1,
      name: "지수",
      age: 25,
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
      totalChats: 156,
      activeChats: 8,
    },
    {
      id: 2,
      name: "수지",
      age: 23,
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      totalChats: 203,
      activeChats: 12,
    },
    {
      id: 3,
      name: "예린",
      age: 26,
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
      totalChats: 134,
      activeChats: 5,
    },
  ]);

  // 가입 회원 목록 (실제 데이터 구조에 맞게 확장)
  const [members] = useState<Member[]>([
    {
      id: 1,
      name: "김철수",
      nickname: "철수맨",
      email: "kim@example.com",
      joinedAt: "2024-03-15",
      joined: "2024-03-15 09:30",
      lastLogin: "2024-12-17 14:25",
      joinIp: "192.168.1.100",
      lastIp: "192.168.1.105",
      totalSpent: 150000,
      status: "active",
      phone: "010-1234-5678",
      location: "서울시 강남구",
      gender: "남성",
      age: 28,
      points: 15000,
      online: true,
      bank: "국민은행",
      accountNumber: "123456789012",
      accountHolder: "김철수",
      recentPurchases: [
        {
          date: "2024-12-15",
          amount: 50000,
          description: "포인트 충전",
        },
        {
          date: "2024-12-10",
          amount: 100000,
          description: "프리미엄 패키지",
        },
      ],
    },
    {
      id: 2,
      name: "이영희",
      nickname: "영희공주",
      email: "lee@example.com",
      joinedAt: "2024-03-20",
      joined: "2024-03-20 15:40",
      lastLogin: "2024-12-16 18:30",
      joinIp: "192.168.1.110",
      lastIp: "192.168.1.115",
      totalSpent: 230000,
      status: "active",
      phone: "010-2345-6789",
      location: "서울시 서초구",
      gender: "여성",
      age: 26,
      points: 28000,
      online: false,
      bank: "신한은행",
      accountNumber: "987654321098",
      accountHolder: "이영희",
      recentPurchases: [
        {
          date: "2024-12-14",
          amount: 80000,
          description: "채팅 패키지",
        },
        {
          date: "2024-12-01",
          amount: 150000,
          description: "VIP 멤버십",
        },
      ],
    },
    {
      id: 3,
      name: "박민수",
      nickname: "민수킹",
      email: "park@example.com",
      joinedAt: "2024-04-01",
      joined: "2024-04-01 11:20",
      lastLogin: "2024-12-15 20:15",
      joinIp: "192.168.1.120",
      lastIp: "192.168.1.125",
      totalSpent: 89000,
      status: "active",
      phone: "010-3456-7890",
      location: "경기도 수원시",
      gender: "남성",
      age: 32,
      points: 8500,
      online: false,
      bank: "우리은행",
      accountNumber: "456789012345",
      accountHolder: "박민수",
      recentPurchases: [
        {
          date: "2024-12-12",
          amount: 39000,
          description: "베이직 패키지",
        },
        {
          date: "2024-11-28",
          amount: 50000,
          description: "포인트 충전",
        },
      ],
    },
    {
      id: 4,
      name: "최지우",
      nickname: "지우별",
      email: "choi@example.com",
      joinedAt: "2024-04-10",
      joined: "2024-04-10 16:50",
      lastLogin: "2024-12-17 10:40",
      joinIp: "192.168.1.130",
      lastIp: "192.168.1.135",
      totalSpent: 320000,
      status: "active",
      phone: "010-4567-8901",
      location: "서울시 송파구",
      gender: "여성",
      age: 29,
      points: 42000,
      online: true,
      bank: "하나은행",
      accountNumber: "321098765432",
      accountHolder: "최지우",
      recentPurchases: [
        {
          date: "2024-12-16",
          amount: 120000,
          description: "프리미엄 플러스",
        },
        {
          date: "2024-12-05",
          amount: 200000,
          description: "연간 멤버십",
        },
      ],
    },
  ]);

  // 매출 기록 데이터
  const [revenueRecords] = useState<RevenueRecord[]>([
    {
      date: "2024-12-17 14:30",
      memberName: "김철수",
      memberNickname: "철수",
      type: "충전",
      amount: 50000,
    },
    {
      date: "2024-12-16 11:20",
      memberName: "이영희",
      memberNickname: "영희",
      type: "충전",
      amount: 80000,
    },
    {
      date: "2024-12-15 09:15",
      memberName: "박민수",
      memberNickname: "민수",
      type: "출금",
      amount: -30000,
    },
    {
      date: "2024-12-14 16:45",
      memberName: "최지우",
      memberNickname: "지우",
      type: "충전",
      amount: 120000,
    },
    {
      date: "2024-12-12 13:20",
      memberName: "김철수",
      memberNickname: "철수",
      type: "충전",
      amount: 100000,
    },
    {
      date: "2024-12-10 10:30",
      memberName: "이영희",
      memberNickname: "영희",
      type: "충전",
      amount: 150000,
    },
  ]);

  // 채팅 요청
  const [chatRequests] = useState<ChatRequest[]>([
    {
      id: 1,
      userName: "김철수",
      profileName: "지수",
      time: "2025-12-17 14:30",
      message: "안녕하세요! 프로필 보고 연락드립니다.",
      unread: true,
    },
    {
      id: 2,
      userName: "이영희",
      profileName: "수지",
      time: "2025-12-17 13:15",
      message: "커피 한잔 어떠세요?",
      unread: true,
    },
    {
      id: 3,
      userName: "박민수",
      profileName: "지수",
      time: "2025-12-17 11:20",
      message: "반갑습니다",
      unread: false,
    },
  ]);

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
      if (revenueStartDate && recordDate < revenueStartDate)
        return false;
      if (revenueEndDate && recordDate > revenueEndDate)
        return false;
      return true;
    });

    const deposit = filteredRecords
      .filter((r) => r.type === "충전")
      .reduce((sum, record) => sum + record.amount, 0);

    const withdrawal = filteredRecords
      .filter((r) => r.type === "출금")
      .reduce(
        (sum, record) => sum + Math.abs(record.amount),
        0,
      );

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
          if (revenueStartDate && recordDate < revenueStartDate)
            return false;
          if (revenueEndDate && recordDate > revenueEndDate)
            return false;
        }

        // 유형 필터
        if (
          revenueTypeFilter !== "all" &&
          record.type !== revenueTypeFilter
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      );
  };

  const getRevenueByPeriod = () => {
    switch (selectedPeriod) {
      case "today":
        return agentInfo.todayRevenue;
      case "week":
        return agentInfo.weeklyRevenue;
      case "month":
        return agentInfo.monthlyRevenue;
      case "total":
        return agentInfo.totalRevenue;
      default:
        return agentInfo.monthlyRevenue;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "today":
        return "오늘";
      case "week":
        return "이번 주";
      case "month":
        return "이번 달";
      case "total":
        return "전체";
      default:
        return "이번 달";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-white text-2xl mb-2">
            에이전트 대시보드
          </h1>
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
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 whitespace-nowrap text-xs sm:text-sm">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={revenueStartDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setRevenueStartDate(newStart);
                      if (revenueEndDate) {
                        setIsRevenueDateRangeValid(
                          newStart <= revenueEndDate,
                        );
                      }
                    }}
                    className={`date-picker-indigo bg-gray-800 border rounded px-2 sm:px-3 py-1.5 text-white text-xs sm:text-sm focus:outline-none transition-all flex-1 ${
                      !isRevenueDateRangeValid
                        ? "border-red-500"
                        : "border-gray-700"
                    }`}
                  />
                </div>
                <span className="text-gray-600 hidden sm:inline">~</span>
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 whitespace-nowrap text-xs sm:text-sm">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={revenueEndDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setRevenueEndDate(newEnd);
                      if (revenueStartDate) {
                        setIsRevenueDateRangeValid(
                          revenueStartDate <= newEnd,
                        );
                      }
                    }}
                    className={`date-picker-indigo bg-gray-800 border rounded px-2 sm:px-3 py-1.5 text-white text-xs sm:text-sm focus:outline-none transition-all flex-1 ${
                      !isRevenueDateRangeValid
                        ? "border-red-500"
                        : "border-gray-700"
                    }`}
                  />
                </div>
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
            {!isRevenueDateRangeValid && (
              <p className="text-red-400 text-xs">
                종료일은 시작일보다 이전일 수 없습니다.
              </p>
            )}

            {/* 총 매출 표시 */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">
                    총 매출
                  </p>
                  <p
                    className={`font-bold text-sm sm:text-xl ${getFilteredRevenue().total < 0 ? "text-red-400" : "text-yellow-400"}`}
                  >
                    {getFilteredRevenue().total < 0 ? "-" : "+"}
                    {Math.abs(getFilteredRevenue().total).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">
                    입금액
                  </p>
                  <p className="text-green-400 font-bold text-sm sm:text-lg">
                    +
                    {getFilteredRevenue().deposit.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">
                    출금액
                  </p>
                  <p className="text-red-400 font-bold text-sm sm:text-lg">
                    -
                    {getFilteredRevenue().withdrawal.toLocaleString()}
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
                    {getFilteredRevenueRecords().length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-gray-500 py-8"
                        >
                          조건에 맞는 매출 기록이 없습니다
                        </td>
                      </tr>
                    ) : (
                      getFilteredRevenueRecords().map(
                        (record, idx) => (
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
                                    (m) =>
                                      m.name ===
                                      record.memberName,
                                  );
                                  if (member) {
                                    setSelectedMember(member);
                                    setShowMemberModal(true);
                                  }
                                }}
                                className="hover:text-indigo-400 transition-colors cursor-pointer underline"
                              >
                                {record.memberNickname} (
                                {record.memberName})
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
                        ),
                      )
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