import { AdminLayout } from "@/components/layout/AdminLayout";
import { useDebounce } from "@/hooks/useDebounce";
import { UserDetailModal } from "@/components/layout/UserDetailModal";
import { DateRangePicker } from "@/components/layout/DateRangePicker";
import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { useAgentMembers } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicUrlForPath } from "@/lib/utils/storage";
import { formatKST } from "@/lib/utils/dateUtils";
import { AdminPagination } from "@/components/common/AdminPagination";

interface Member {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  gender: string;
  age: number;
  joined: string;
  joinedAt?: string;
  totalDeposited: number;
  totalWithdrawn: number;
  netRevenue: number;
  status: "활성" | "정지";
  lastLogin: string;
  points: number;
  online: boolean;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
  recentPurchases?: {
    date: string;
    amount: number;
    description: string;
  }[];
  joinIp?: string;
  lastIp?: string;
  profileImage?: string;
  referralCode?: string;
}

export function AgentMembersPage() {
  const { adminAccount } = useAuth();
  const agentAccount =
    adminAccount && "referral_code" in adminAccount ? adminAccount : null;
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState("");
  const [selectedProfileName, setSelectedProfileName] = useState("");
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);

  // 가입 기간 필터 state 추가
  const [joinStartDate, setJoinStartDate] = useState("");
  const [joinEndDate, setJoinEndDate] = useState("");
  const [_isJoinDateRangeValid] = useState(true);
  void _isJoinDateRangeValid;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Supabase hooks
  const {
    members: dbMembers,
    isLoading: isMembersLoading,
    error: membersError,
  } = useAgentMembers(agentAccount?.id);

  // 에이전트 정보
  const agentInfo = {
    username: adminAccount?.username || "agent",
    referralCode: agentAccount?.referral_code || "",
  };

  // Transform Supabase data to Member format
  const members: Member[] = dbMembers.map((m: any) => ({
    id: m.id,
    name: m.name || "Unknown",
    nickname: m.nickname || "",
    email: m.email || "",
    phone: m.phone || "",
    gender: "",
    age: 0,
    joined: formatKST(m.created_at, "datetime"),
    joinedAt: m.created_at?.split("T")[0] || "",
    totalDeposited: Number(m.total_deposited || 0),
    totalWithdrawn: Number(m.total_withdrawn || 0),
    netRevenue: Number(m.total_deposited || 0) - Number(m.total_withdrawn || 0),
    status: m.status === "active" ? "활성" : "정지",
    lastLogin: m.last_login_at ? formatKST(m.last_login_at, "datetime") : "",
    points: m.points || 0,
    online: m.is_online || false,
    bank: m.bank || "",
    accountNumber: m.account_number || "",
    accountHolder: m.account_holder || "",
    joinIp: m.join_ip || "",
    lastIp: m.last_login_ip || "",
    profileImage: getPublicUrlForPath("profile-images", m.profile_image) || "",
    recentPurchases: [],
    referralCode: m.agents?.referral_code || m.referral_code || "",
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "활성":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "정지":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        member.nickname
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        member.email
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        (member.joinIp && member.joinIp.includes(debouncedSearchTerm)) ||
        (member.lastIp && member.lastIp.includes(debouncedSearchTerm));

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      // 가입 날짜 필터링
      let matchesJoinDateRange = true;
      if (joinStartDate || joinEndDate) {
        const memberJoinDate = (member.joinedAt || member.joined).split(" ")[0];

        if (joinStartDate && memberJoinDate < joinStartDate) {
          matchesJoinDateRange = false;
        }
        if (joinEndDate && memberJoinDate > joinEndDate) {
          matchesJoinDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesJoinDateRange;
    });
  }, [members, debouncedSearchTerm, statusFilter, joinStartDate, joinEndDate]);

  // Paginated members
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMembers, currentPage]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {isMembersLoading && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-300 text-sm">
            로딩 중...
          </div>
        )}
        {membersError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
            {membersError.message}
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">회원 관리</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-300">
                전체 {filteredMembers.length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">
                활성 {members.filter((u) => u.status === "활성").length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-red-400">
                정지 {members.filter((u) => u.status === "정지").length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-blue-400">
                현재접속 {members.filter((u) => u.online).length}명
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
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
                placeholder="회원 이름, 닉네임, 이메일, IP로 검색"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">전체 상태</option>
                <option value="활성">활성</option>
                <option value="정지">정지</option>
              </select>
            </div>

            {/* Join Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <DateRangePicker
                startDate={joinStartDate}
                endDate={joinEndDate}
                onStartDateChange={setJoinStartDate}
                onEndDateChange={setJoinEndDate}
              />
              {(joinStartDate || joinEndDate) && (
                <button
                  onClick={() => {
                    setJoinStartDate("");
                    setJoinEndDate("");
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors whitespace-nowrap"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] admin-users-table">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    회원 정보
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    가입일 / 마지막 로그인
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    가입 IP / 마지막 IP
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    입금 / 출금 / 순매출
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    상태
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    포인트
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-2 text-center h-16">
                      <div className="flex items-center justify-center gap-3 h-full">
                        <div className="relative flex-shrink-0">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProfileImage(
                                  member.profileImage || "",
                                );
                                setSelectedProfileName(member.name);
                                setShowProfileImageModal(true);
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                          )}
                          {member.online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                          )}
                        </div>
                        <div
                          className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDetailsModal(true);
                          }}
                        >
                          <p className="text-white text-sm leading-tight hover:text-indigo-400 transition-colors">
                            {member.nickname}{" "}
                            <span className="text-white text-sm hover:text-indigo-400">
                              ({member.name})
                            </span>
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{member.joined}</p>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {member.lastLogin}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{member.joinIp}</p>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {member.lastIp}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-sm h-full flex flex-col items-center justify-center">
                        <div className="text-green-400">
                          +{member.totalDeposited.toLocaleString()}원
                        </div>
                        <div className="text-red-400">
                          -{member.totalWithdrawn.toLocaleString()}원
                        </div>
                        <div
                          className={
                            member.netRevenue >= 0
                              ? "text-yellow-400"
                              : "text-red-300"
                          }
                        >
                          {member.netRevenue >= 0 ? "+" : "-"}
                          {Math.abs(member.netRevenue).toLocaleString()}원
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="h-full flex items-center justify-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                            member.status,
                          )}`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16 text-white text-sm">
                      <div className="h-full flex flex-col items-center justify-center">
                        <span className="text-indigo-400 font-semibold">
                          {member.points.toLocaleString()} P
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Profile Image Modal */}
      {showProfileImageModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileImageModal(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setShowProfileImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedProfileImage}
              alt={selectedProfileName}
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <p className="text-white text-center mt-4">{selectedProfileName}</p>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showDetailsModal && selectedMember && (
        <UserDetailModal
          user={{
            ...selectedMember,
            status: selectedMember.status,
            referralCode: selectedMember.referralCode || agentInfo.referralCode,
          }}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMember(null);
          }}
          isReadOnly={true}
        />
      )}
    </AdminLayout>
  );
}
