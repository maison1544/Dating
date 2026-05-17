import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Ban,
  Calendar,
  ChevronDown,
  DollarSign,
  Key,
  Loader2,
  MessageCircle,
  MoreVertical,
  Package,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { DateRangePicker } from "@/components/layout/DateRangePicker";
import { GiftHistoryTable } from "@/components/layout/GiftHistoryTable";
import { GiftInventoryManager } from "@/components/layout/GiftInventoryManager";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminPageLoader } from "@/components/common/AdminPageLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { formatDatetime, formatKST, getTodayKST } from "@/lib/utils/dateUtils";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";
import { CsvDownloadButton } from "@/components/layout/CsvDownloadButton";
import { UserDetailModal } from "@/components/layout/UserDetailModal";
import { AdminPagination } from "@/components/common/AdminPagination";
import { SuspendConfirmModal } from "@/components/layout/SuspendConfirmModal";
import {
  useAdminAccounts,
  useAgentGiftTransactions,
  useAgentDashboardStats,
  useAgents,
  useBackofficeAccountActions,
  useAdminChatProfiles,
} from "@/hooks/useSupabase";

// Component to display correct total revenue for an agent using the same logic as detail modal
function AgentTotalRevenue({
  agentId,
  formatRevenue,
}: {
  agentId: string;
  formatRevenue: (value: number | undefined | null) => string;
}) {
  const { revenueRecords, isLoading } = useAgentDashboardStats(agentId);

  if (isLoading) {
    return <span className="text-gray-400">...</span>;
  }

  // Calculate netSum using the same logic as detail modal
  const normalizedRecords = (revenueRecords || []).map((r: any) => {
    const typeLabel = r.type === "charge" ? "충전" : "출금";
    return { ...r, typeLabel };
  });

  const depositSum = normalizedRecords
    .filter((r: any) => r.typeLabel === "충전")
    .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);

  const withdrawSum = normalizedRecords
    .filter((r: any) => r.typeLabel === "출금")
    .reduce((sum: number, r: any) => sum + Math.abs(Number(r.amount || 0)), 0);

  const netSum = depositSum - withdrawSum;

  return (
    <p
      className={`font-semibold ${
        netSum < 0 ? "text-red-400" : "text-yellow-400"
      }`}
    >
      {formatRevenue(netSum)}
    </p>
  );
}

export function AdminAccountsPage() {
  const { adminAccount, isAdmin } = useAuth();
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "agent">(
    "all",
  );
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const {
    accounts: adminAccounts,
    isLoading: isAdminsLoading,
    error: adminsError,
    refetch: refetchAdmins,
    updateAccount: updateAdminAccount,
  } = useAdminAccounts();

  const {
    agents,
    isLoading: isAgentsLoading,
    error: agentsError,
    refetch: refetchAgents,
    updateAgent,
  } = useAgents();

  const {
    createBackofficeAccount,
    deleteBackofficeAccount,
    updateBackofficePassword,
    assignChatProfilesToAgent,
    isLoading: isActionLoading,
  } = useBackofficeAccountActions(adminAccount?.id);

  const {
    profiles: allChatProfiles,
    isLoading: isChatProfilesLoading,
    refetch: refetchChatProfiles,
  } = useAdminChatProfiles();

  const [assignTarget, setAssignTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  const [detailTarget, setDetailTarget] = useState<{
    id: string;
    label: string;
    username: string;
    referralCode?: string;
  } | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<
    "revenue" | "members" | "profiles" | "gifts"
  >("revenue");
  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<
    "all" | "충전" | "출금"
  >("all");
  const [, setIsRevenueDateRangeValid] = useState(true);
  const [memberSortFilter, setMemberSortFilter] = useState<"date" | "revenue">(
    "date",
  );
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const {
    stats: agentStats,
    members: agentMembers,
    revenueRecords: agentRevenueRecords,
    isLoading: isAgentStatsLoading,
  } = useAgentDashboardStats(detailTarget?.id);

  const {
    transactions: agentGiftTransactions,
    isLoading: isAgentGiftHistoryLoading,
    error: agentGiftHistoryError,
  } = useAgentGiftTransactions(detailTarget?.id);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"admin" | "agent">("admin");
  const [createUsername, setCreateUsername] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole] = useState<"admin">("admin");
  const [createReferralCode, setCreateReferralCode] = useState("");

  const [passwordTarget, setPasswordTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    accountType: "admin" | "agent";
    id: string;
    label: string;
  } | null>(null);
  const [deleteMemberHandling, setDeleteMemberHandling] = useState<
    "detach" | "deactivate"
  >("detach");

  const [suspendTarget, setSuspendTarget] = useState<{
    id: string;
    label: string;
    isActive: boolean;
    accountType: "admin" | "agent";
  } | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);

  const _validateDateRange = (start: string, end: string) => {
    if (start && end) return start <= end;
    return true;
  };
  void _validateDateRange;

  const formatDate = formatDatetime;

  const agentGiftHistoryRows = useMemo(() => {
    if (!detailTarget?.id) return [];

    return (agentGiftTransactions || []).map((item: any) => {
      const userLabel = item.users?.nickname || item.users?.name || "회원";
      const profileLabel = item.profileName || "프로필";
      const isProfileSender = item.sender_type === "profile";
      const isProfileReceiver = item.receiver_type === "profile";
      const amount = Math.abs(Number(item.points_amount || 0));

      let description = "기프트 거래";
      if (isProfileSender) {
        description = `${profileLabel} → ${userLabel}에게 보냄`;
      } else if (isProfileReceiver) {
        description = `${userLabel} → ${profileLabel}에게서 받음`;
      }

      const signedAmount = isProfileReceiver
        ? amount
        : isProfileSender
          ? -amount
          : amount;

      return {
        id: item.id,
        createdAt: item.created_at,
        giftName: item.gifts?.name || "선물",
        giftEmoji: item.gifts?.emoji || "🎁",
        quantity: Number(item.quantity ?? 1),
        description,
        pointsAmount: signedAmount,
      };
    });
  }, [agentGiftTransactions, detailTarget?.id]);

  const filteredAdmins = useMemo(() => {
    const q = debouncedSearchTerm.trim().toLowerCase();
    return adminAccounts
      .filter(() => roleFilter === "all" || roleFilter === "admin")
      .filter((a) => {
        if (!q) return true;
        return (
          a.username.toLowerCase().includes(q) ||
          (a.name || "").toLowerCase().includes(q)
        );
      });
  }, [adminAccounts, debouncedSearchTerm, roleFilter]);

  const filteredAgents = useMemo(() => {
    const q = debouncedSearchTerm.trim().toLowerCase();
    return agents
      .filter(() => roleFilter === "all" || roleFilter === "agent")
      .filter((a) => {
        if (!q) return true;
        return (
          a.username.toLowerCase().includes(q) ||
          (a.name || "").toLowerCase().includes(q) ||
          (a.referral_code || "").toLowerCase().includes(q)
        );
      });
  }, [agents, debouncedSearchTerm, roleFilter]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const combinedAccounts = useMemo(() => {
    const adminRows = filteredAdmins.map((a) => ({
      kind: "admin" as const,
      id: a.id,
      username: a.username,
      name: a.name,
      role: a.role,
      created_at: a.created_at,
      last_login_at: a.last_login_at,
      is_active: a.is_active ?? true,
    }));

    const agentRows = filteredAgents.map((a) => ({
      kind: "agent" as const,
      id: a.id,
      username: a.username,
      name: a.name,
      referral_code: a.referral_code,
      created_at: a.created_at,
      last_login_at: a.last_login_at,
      is_active: a.is_active ?? true,
      assigned_profiles_count: a.assigned_profiles_count,
      referred_members_count: a.referred_members_count,
      total_revenue: a.total_revenue ?? 0,
    }));

    return [...adminRows, ...agentRows].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredAdmins, filteredAgents]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(combinedAccounts.length / itemsPerPage);
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return combinedAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [combinedAccounts, currentPage, itemsPerPage]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, roleFilter]);

  const totalCount = adminAccounts.length + agents.length;
  const adminCount = adminAccounts.length;
  const agentCount = agents.length;

  const getRoleBadge = (account: any) => {
    if (account.kind === "agent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30">
          <User size={12} />
          에이전트
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
        <Shield size={12} />
        관리자
      </span>
    );
  };

  const formatRevenue = (amount: number | null | undefined) => {
    const normalizedAmount = amount || 0;
    const sign = normalizedAmount >= 0 ? "+" : "";
    return `${sign}${normalizedAmount.toLocaleString()}P`;
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    if (openDropdownId !== null) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdownId]);

  const isLoading = isAdminsLoading || isAgentsLoading;
  const error = adminsError || agentsError;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">관리자 계정 관리</h1>
            <p className="text-gray-400">
              전체{" "}
              <span className="text-white font-semibold">{totalCount}</span>개 •
              관리자{" "}
              <span className="text-purple-400 font-semibold">
                {adminCount}
              </span>
              개 • 에이전트{" "}
              <span className="text-indigo-400 font-semibold">
                {agentCount}
              </span>
              개
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CsvDownloadButton
              data={combinedAccounts.map((a) => ({
                id: a.id,
                type: a.kind === "admin" ? "관리자" : "에이전트",
                username: a.username,
                name: a.name,
                createdAt: a.created_at
                  ? formatKST(a.created_at, "datetime")
                  : "-",
                lastLogin: a.last_login_at
                  ? formatKST(a.last_login_at, "datetime")
                  : "-",
                status: a.is_active ? "활성" : "비활성",
                referralCode:
                  a.kind === "agent" ? a.referral_code || "-" : "-",
              }))}
              columns={[
                { key: "id", label: "ID" },
                { key: "type", label: "유형" },
                { key: "username", label: "계정명" },
                { key: "name", label: "이름" },
                { key: "createdAt", label: "생성일" },
                { key: "lastLogin", label: "최근로그인" },
                { key: "status", label: "상태" },
                { key: "referralCode", label: "추천코드" },
              ]}
              filename={`관리자계정_${getTodayKST()}.csv`}
            />
            <button
              onClick={() => {
                setCreateType(roleFilter === "agent" ? "agent" : "admin");
                setShowCreateModal(true);
              }}
              className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
            >
              <UserPlus size={20} />새 계정 생성
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 flex-1">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="계정명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "all" | "admin" | "agent")
              }
              className="w-full sm:w-auto bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">전체 ({totalCount})</option>
              <option value="admin">관리자 ({adminCount})</option>
              <option value="agent">에이전트 ({agentCount})</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error.message}
          </div>
        )}

        {isLoading ? (
          <AdminPageLoader />
        ) : (
          <div className="space-y-3">
            {combinedAccounts.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center text-gray-400">
                계정이 없습니다.
              </div>
            ) : (
              paginatedAccounts.map((account: any) => (
                <div
                  key={`${account.kind}-${account.id}`}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white text-lg font-medium">
                          {account.username}
                        </h3>
                        {getRoleBadge(account)}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            account.is_active
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {account.is_active ? "활성" : "정지"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">생성일</p>
                          <p className="text-gray-300">
                            {formatDate(account.created_at)}
                          </p>
                        </div>
                        {account.kind === "agent" && (
                          <>
                            <div>
                              <p className="text-gray-500 text-xs">추천코드</p>
                              <p className="text-indigo-400">
                                {account.referral_code}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">전체 회원</p>
                              <p className="text-green-400 font-semibold">
                                {account.referred_members_count}명
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">총 매출</p>
                              <AgentTotalRevenue
                                agentId={account.id}
                                formatRevenue={formatRevenue}
                              />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">
                                마지막 로그인
                              </p>
                              <p className="text-gray-300">
                                {formatDate(account.last_login_at)}
                              </p>
                            </div>
                          </>
                        )}

                        {account.kind === "admin" && (
                          <>
                            <div>
                              <p className="text-gray-500 text-xs">이름</p>
                              <p className="text-gray-300">
                                {account.name || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">
                                마지막 로그인
                              </p>
                              <p className="text-gray-300">
                                {formatDate(account.last_login_at)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(
                            openDropdownId === `${account.kind}-${account.id}`
                              ? null
                              : `${account.kind}-${account.id}`,
                          );
                        }}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-700"
                      >
                        <MoreVertical size={16} />
                        <span className="text-sm">작업</span>
                      </button>

                      {openDropdownId === `${account.kind}-${account.id}` && (
                        <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[160px] overflow-hidden">
                          {account.kind === "agent" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailTarget({
                                    id: account.id,
                                    username: account.username,
                                    label: `${account.username} (${account.name})`,
                                    referralCode: account.referral_code,
                                  });
                                  setDetailActiveTab("revenue");
                                  setRevenueStartDate("");
                                  setRevenueEndDate("");
                                  setRevenueTypeFilter("all");
                                  setIsRevenueDateRangeValid(true);
                                  setMemberSortFilter("date");
                                  setSelectedMember(null);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm border-b border-gray-700"
                              >
                                <TrendingUp
                                  size={14}
                                  className="text-green-400"
                                />
                                상세보기
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentlyAssigned = allChatProfiles
                                    .filter(
                                      (p: any) =>
                                        p.assigned_agent_id === account.id,
                                    )
                                    .map((p: any) => p.id);
                                  setAssignTarget({
                                    id: account.id,
                                    label: `${account.username} (${account.name})`,
                                  });
                                  setSelectedProfileIds(currentlyAssigned);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm border-b border-gray-700"
                              >
                                <Users size={14} className="text-purple-400" />
                                프로필 할당
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSuspendTarget({
                                    id: account.id,
                                    label: `${account.username} (${account.name})`,
                                    isActive: account.is_active ?? true,
                                    accountType: "agent",
                                  });
                                  setOpenDropdownId(null);
                                }}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm border-b border-gray-700"
                              >
                                <Ban size={14} className="text-red-400" />
                                {account.is_active ? "정지" : "활성화"}
                              </button>
                            </>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPasswordTarget({
                                id: account.id,
                                label: `${account.username} (${
                                  account.name || ""
                                })`,
                              });
                              setOpenDropdownId(null);
                            }}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm border-b border-gray-700"
                          >
                            <Key size={14} className="text-yellow-400" />
                            비밀번호 변경
                          </button>

                          {account.kind === "admin" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSuspendTarget({
                                  id: account.id,
                                  label: `${account.username} (${
                                    account.name || ""
                                  })`,
                                  isActive: account.is_active,
                                  accountType: "admin",
                                });
                                setOpenDropdownId(null);
                              }}
                              className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm"
                              disabled={account.id === adminAccount?.id}
                            >
                              <Ban size={14} className="text-red-400" />
                              {account.is_active ? "정지" : "활성화"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* 페이지네이션 */}
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-400" />
                계정 추가
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateType("admin")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    createType === "admin"
                      ? "bg-indigo-500/80 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  관리자
                </button>
                <button
                  onClick={() => setCreateType("agent")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    createType === "agent"
                      ? "bg-indigo-500/80 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  에이전트
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    USERNAME
                  </label>
                  <input
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    이름
                  </label>
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {createType === "admin" ? (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    역할
                  </label>
                  <div className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                    관리자
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    추천코드(선택)
                  </label>
                  <input
                    value={createReferralCode}
                    onChange={(e) => setCreateReferralCode(e.target.value)}
                    placeholder="비워두면 자동 생성"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  disabled={!isAdmin || isActionLoading}
                  onClick={() => {
                    void (async () => {
                      try {
                        if (!isAdmin) {
                          showAlert({
                            title: "권한 오류",
                            message: "관리자 권한이 필요합니다.",
                            type: "warning",
                          });
                          return;
                        }
                        if (!createUsername || !createName || !createPassword) {
                          return;
                        }

                        if (createType === "admin") {
                          await createBackofficeAccount({
                            accountType: "admin",
                            username: createUsername.trim(),
                            name: createName.trim(),
                            password: createPassword,
                            role: createRole,
                          });
                          await refetchAdmins();
                        } else {
                          await createBackofficeAccount({
                            accountType: "agent",
                            username: createUsername.trim(),
                            name: createName.trim(),
                            password: createPassword,
                            referralCode:
                              createReferralCode.trim() || undefined,
                          });
                          await refetchAgents();
                        }

                        setShowCreateModal(false);
                        setCreateUsername("");
                        setCreateName("");
                        setCreatePassword("");
                        setCreateReferralCode("");
                      } catch (e) {
                        const msg =
                          e instanceof Error
                            ? e.message
                            : "계정 생성에 실패했습니다";
                        showAlert({
                          title: "오류",
                          message: msg,
                          type: "error",
                        });
                      }
                    })();
                  }}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <Key size={18} className="text-indigo-400" />
                비밀번호 변경
              </h3>
              <button
                onClick={() => {
                  setPasswordTarget(null);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                <p className="text-gray-400 text-sm">대상</p>
                <p className="text-white">{passwordTarget.label}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  새 비밀번호 (6자리 이상)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  재확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <div className="text-red-400 text-sm">
                    비밀번호가 일치하지 않습니다.
                  </div>
                )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setPasswordTarget(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  disabled={
                    !isAdmin ||
                    isActionLoading ||
                    !newPassword ||
                    newPassword !== confirmPassword
                  }
                  onClick={() => {
                    void (async () => {
                      try {
                        if (!isAdmin) {
                          showAlert({
                            title: "권한 오류",
                            message: "관리자 권한이 필요합니다.",
                            type: "warning",
                          });
                          return;
                        }
                        await updateBackofficePassword({
                          userId: passwordTarget.id,
                          newPassword,
                        });
                        showAlert({
                          title: "처리 완료",
                          message: "비밀번호가 변경되었습니다.",
                          type: "success",
                        });
                        setPasswordTarget(null);
                        setNewPassword("");
                        setConfirmPassword("");
                      } catch (e) {
                        const msg =
                          e instanceof Error
                            ? e.message
                            : "비밀번호 변경에 실패했습니다";
                        showAlert({
                          title: "오류",
                          message: msg,
                          type: "error",
                        });
                      }
                    })();
                  }}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  변경
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <Trash2 size={18} className="text-red-400" />
                계정 삭제
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                <span className="text-white font-semibold">
                  {deleteTarget.label}
                </span>{" "}
                계정을 삭제하시겠습니까?
              </p>
              {deleteTarget.accountType === "agent" && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2">
                  <p className="text-gray-300 text-sm">
                    에이전트 삭제 시 추천회원 처리
                  </p>
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="radio"
                      name="memberHandling"
                      value="detach"
                      checked={deleteMemberHandling === "detach"}
                      onChange={() => setDeleteMemberHandling("detach")}
                    />
                    회원 유지 (추천인 없음으로 변경)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="radio"
                      name="memberHandling"
                      value="deactivate"
                      checked={deleteMemberHandling === "deactivate"}
                      onChange={() => setDeleteMemberHandling("deactivate")}
                    />
                    회원도 함께 비활성화(정지)
                  </label>
                </div>
              )}
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
                삭제 시 해당 계정은 로그인할 수 없습니다.
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  disabled={!isAdmin || isActionLoading}
                  onClick={() => {
                    void (async () => {
                      try {
                        if (!isAdmin) {
                          showAlert({
                            title: "권한 오류",
                            message: "관리자 권한이 필요합니다.",
                            type: "warning",
                          });
                          return;
                        }
                        await deleteBackofficeAccount({
                          accountType: deleteTarget.accountType,
                          userId: deleteTarget.id,
                          memberHandling:
                            deleteTarget.accountType === "agent"
                              ? deleteMemberHandling
                              : undefined,
                        });
                        if (deleteTarget.accountType === "admin") {
                          await refetchAdmins();
                        } else {
                          await refetchAgents();
                        }
                        setDeleteTarget(null);
                      } catch (e) {
                        const msg =
                          e instanceof Error
                            ? e.message
                            : "삭제에 실패했습니다";
                        showAlert({
                          title: "오류",
                          message: msg,
                          type: "error",
                        });
                      }
                    })();
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Suspend Confirm */}
      <SuspendConfirmModal
        isOpen={!!suspendTarget}
        title={suspendTarget?.isActive ? "계정 정지" : "계정 활성화"}
        message={
          <p className="text-gray-300">
            <span className="text-white font-semibold">
              {suspendTarget?.label}
            </span>{" "}
            계정을 {suspendTarget?.isActive ? "정지" : "활성화"}하시겠습니까?
          </p>
        }
        isSuspending={suspendTarget?.isActive ?? false}
        hideReasonInput={true}
        confirmLabel={
          isSuspending
            ? "처리중..."
            : suspendTarget?.isActive
              ? "정지"
              : "활성화"
        }
        confirmClassName={
          suspendTarget?.isActive
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }
        zIndexClassName="z-[60]"
        onCancel={() => setSuspendTarget(null)}
        onConfirm={() => {
          if (isSuspending || !suspendTarget) return;
          void (async () => {
            setIsSuspending(true);
            try {
              if (!isAdmin) {
                showAlert({
                  title: "권한 오류",
                  message: "관리자 권한이 필요합니다.",
                  type: "warning",
                });
                return;
              }
              const nextIsActive = !suspendTarget.isActive;

              if (suspendTarget.accountType === "admin") {
                const { error: updateErr } = await updateAdminAccount(
                  suspendTarget.id,
                  { is_active: nextIsActive },
                );
                if (updateErr) {
                  throw new Error(
                    updateErr.message || "상태 변경에 실패했습니다",
                  );
                }
              } else {
                await updateAgent(suspendTarget.id, {
                  is_active: nextIsActive,
                });
              }

              if (!nextIsActive) {
                await supabaseAdmin.functions.invoke("admin-force-logout", {
                  body: {
                    userId: suspendTarget.id,
                    reason:
                      suspendTarget.accountType === "admin"
                        ? "admin_suspended"
                        : "agent_suspended",
                  },
                });
              }

              if (suspendTarget.accountType === "admin") {
                await refetchAdmins();
              } else {
                await refetchAgents();
              }
              setSuspendTarget(null);
              showAlert({
                title: "완료",
                message: `계정이 ${nextIsActive ? "활성화" : "정지"}되었습니다.`,
                type: "success",
              });
            } catch (e) {
              const msg =
                e instanceof Error ? e.message : "상태 변경에 실패했습니다";
              showAlert({
                title: "오류",
                message: msg,
                type: "error",
              });
            } finally {
              setIsSuspending(false);
            }
          })();
        }}
      />

      {/* Assign Profiles Modal */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-white text-lg">프로필 할당</h3>
              <button
                onClick={() => {
                  setAssignTarget(null);
                  setSelectedProfileIds([]);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                <p className="text-gray-400 text-sm">대상 에이전트</p>
                <p className="text-white">{assignTarget.label}</p>
              </div>

              {isChatProfilesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              ) : (
                (() => {
                  // Show profiles that are either unassigned OR assigned to this agent
                  const available = allChatProfiles.filter(
                    (p) =>
                      !p.assigned_agent_id ||
                      p.assigned_agent_id === assignTarget.id,
                  );
                  const assignedCount = available.filter(
                    (p) => p.assigned_agent_id === assignTarget.id,
                  ).length;

                  return (
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 text-gray-300 text-sm">
                        프로필 목록 ({assignedCount}개 할당됨 /{" "}
                        {available.length}개)
                      </div>
                      <div className="max-h-[360px] overflow-y-auto">
                        {available.length === 0 ? (
                          <div className="px-4 py-10 text-center text-gray-400">
                            할당 가능한 프로필이 없습니다.
                          </div>
                        ) : (
                          <table className="w-full">
                            <thead className="bg-gray-900">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs text-gray-400">
                                  선택
                                </th>
                                <th className="px-4 py-2 text-left text-xs text-gray-400">
                                  이름
                                </th>
                                <th className="px-4 py-2 text-left text-xs text-gray-400">
                                  나이
                                </th>
                                <th className="px-4 py-2 text-left text-xs text-gray-400">
                                  생성일
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {available.map((p) => {
                                const checked = selectedProfileIds.includes(
                                  p.id,
                                );
                                return (
                                  <tr
                                    key={p.id}
                                    className="hover:bg-gray-700/30 transition-colors"
                                  >
                                    <td className="px-4 py-2">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedProfileIds((prev) =>
                                              prev.includes(p.id)
                                                ? prev
                                                : [...prev, p.id],
                                            );
                                          } else {
                                            setSelectedProfileIds((prev) =>
                                              prev.filter((id) => id !== p.id),
                                            );
                                          }
                                        }}
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-white text-sm">
                                      {p.name}
                                    </td>
                                    <td className="px-4 py-2 text-gray-300 text-sm">
                                      {p.age}
                                    </td>
                                    <td className="px-4 py-2 text-gray-400 text-xs">
                                      {formatDate(p.created_at)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setAssignTarget(null);
                    setSelectedProfileIds([]);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  disabled={
                    !isAdmin ||
                    isActionLoading ||
                    selectedProfileIds.length === 0
                  }
                  onClick={() => {
                    void (async () => {
                      try {
                        if (!isAdmin) {
                          showAlert({
                            title: "권한 오류",
                            message: "관리자 권한이 필요합니다.",
                            type: "warning",
                          });
                          return;
                        }

                        await assignChatProfilesToAgent({
                          agentId: assignTarget.id,
                          profileIds: selectedProfileIds,
                        });
                        await refetchAgents();
                        await refetchChatProfiles();
                        setAssignTarget(null);
                        setSelectedProfileIds([]);
                        showAlert({
                          title: "처리 완료",
                          message: "프로필이 할당되었습니다.",
                          type: "success",
                        });
                      } catch (e) {
                        const msg =
                          e instanceof Error
                            ? e.message
                            : "프로필 할당에 실패했습니다";
                        showAlert({
                          title: "오류",
                          message: msg,
                          type: "error",
                        });
                      }
                    })();
                  }}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  할당
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Detail Modal */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-white text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-green-500" />
                {detailTarget.username} 상세 정보
              </h2>
              <button
                onClick={() => {
                  setDetailTarget(null);
                  setDetailActiveTab("revenue");
                  setRevenueStartDate("");
                  setRevenueEndDate("");
                  setRevenueTypeFilter("all");
                  setIsRevenueDateRangeValid(true);
                  setMemberSortFilter("date");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-gray-700 bg-gray-900">
              <div className="flex gap-1 px-4">
                <button
                  onClick={() => setDetailActiveTab("revenue")}
                  className={`px-4 py-3 text-sm transition-colors relative ${
                    detailActiveTab === "revenue"
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>매출 관리</span>
                  </div>
                  {detailActiveTab === "revenue" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </button>
                <button
                  onClick={() => setDetailActiveTab("members")}
                  className={`px-4 py-3 text-sm transition-colors relative ${
                    detailActiveTab === "members"
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>회원 목록</span>
                  </div>
                  {detailActiveTab === "members" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </button>
                <button
                  onClick={() => setDetailActiveTab("profiles")}
                  className={`px-4 py-3 text-sm transition-colors relative ${
                    detailActiveTab === "profiles"
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span>프로필 관리</span>
                  </div>
                  {detailActiveTab === "profiles" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </button>
                <button
                  onClick={() => setDetailActiveTab("gifts")}
                  className={`px-4 py-3 text-sm transition-colors relative ${
                    detailActiveTab === "gifts"
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package size={16} />
                    <span>선물 관리</span>
                  </div>
                  {detailActiveTab === "gifts" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              {isAgentStatsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : (
                <>
                  {detailActiveTab === "revenue" &&
                    (() => {
                      const normalizedRecords = (agentRevenueRecords || []).map(
                        (r: any) => {
                          const typeLabel =
                            r.type === "withdraw" ? "출금" : "충전";
                          const rawAmount = Number(r.amount || 0);
                          const signedAmount =
                            typeLabel === "출금"
                              ? -Math.abs(rawAmount)
                              : rawAmount;
                          const day = (r.created_at || "").split("T")[0] || "";
                          return {
                            ...r,
                            typeLabel,
                            signedAmount,
                            day,
                          };
                        },
                      );

                      const filteredByDate = normalizedRecords.filter(
                        (r: any) => {
                          if (!revenueStartDate && !revenueEndDate) return true;
                          if (!r.day) return true;
                          if (revenueStartDate && r.day < revenueStartDate)
                            return false;
                          if (revenueEndDate && r.day > revenueEndDate)
                            return false;
                          return true;
                        },
                      );

                      const filtered = filteredByDate.filter((r: any) => {
                        if (revenueTypeFilter === "all") return true;
                        return r.typeLabel === revenueTypeFilter;
                      });

                      const depositSum = filteredByDate
                        .filter((r: any) => r.typeLabel === "충전")
                        .reduce(
                          (sum: number, r: any) => sum + Number(r.amount || 0),
                          0,
                        );
                      const withdrawSum = filteredByDate
                        .filter((r: any) => r.typeLabel === "출금")
                        .reduce(
                          (sum: number, r: any) =>
                            sum + Math.abs(Number(r.amount || 0)),
                          0,
                        );
                      const netSum = depositSum - withdrawSum;

                      const assignedProfiles = allChatProfiles.filter(
                        (p: any) => p.assigned_agent_id === detailTarget.id,
                      );

                      return (
                        <div className="space-y-6">
                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <h3 className="text-white flex items-center gap-2">
                                <Calendar size={18} />
                                매출 기간 선택
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <DateRangePicker
                                  startDate={revenueStartDate}
                                  endDate={revenueEndDate}
                                  onStartDateChange={(next) => {
                                    setRevenueStartDate(next);
                                    setIsRevenueDateRangeValid(true);
                                  }}
                                  onEndDateChange={(next) => {
                                    setRevenueEndDate(next);
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
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                  >
                                    초기화
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div className="text-center">
                                  <p className="text-gray-500 text-xs mb-1">
                                    총 매출
                                  </p>
                                  <p
                                    className={`font-bold text-xl ${
                                      netSum < 0
                                        ? "text-red-400"
                                        : "text-yellow-400"
                                    }`}
                                  >
                                    {formatRevenue(netSum)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-500 text-xs mb-1">
                                    입금액
                                  </p>
                                  <p className="text-green-400 font-bold text-lg">
                                    +{depositSum.toLocaleString()}P
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-500 text-xs mb-1">
                                    출금액
                                  </p>
                                  <p className="text-red-400 font-bold text-lg">
                                    -{withdrawSum.toLocaleString()}P
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
                                <span>
                                  전체 회원:{" "}
                                  <span className="font-semibold text-indigo-400">
                                    {agentStats.currentMembers}명
                                  </span>
                                </span>
                                <span className="text-gray-600">|</span>
                                <span>
                                  배정 프로필:{" "}
                                  <span className="font-semibold text-purple-400">
                                    {agentStats.assignedProfiles}개
                                  </span>
                                </span>
                                <span className="text-gray-600">|</span>
                                <span>
                                  추천코드:{" "}
                                  <span className="font-semibold text-indigo-400 text-xs">
                                    {detailTarget.referralCode || "-"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-white flex items-center gap-2">
                                <DollarSign size={18} />
                                매출 목록
                              </h3>
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
                              <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-800 sticky top-0">
                                    <tr>
                                      <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                                        일시
                                      </th>
                                      <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                                        회원
                                      </th>
                                      <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                                        유형
                                      </th>
                                      <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">
                                        금액
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700">
                                    {filtered.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={4}
                                          className="text-center text-gray-500 py-8"
                                        >
                                          조건에 맞는 매출 기록이 없습니다
                                        </td>
                                      </tr>
                                    ) : (
                                      filtered.map((r: any) => {
                                        const name = r.users?.name || "-";
                                        const nickname =
                                          r.users?.nickname || "-";
                                        const label = `${nickname} (${name})`;

                                        return (
                                          <tr
                                            key={r.id}
                                            className="hover:bg-gray-800/50 transition-colors"
                                          >
                                            <td className="text-gray-300 text-sm px-4 py-3 whitespace-nowrap">
                                              {r.created_at
                                                ? formatKST(
                                                    r.created_at,
                                                    "datetime",
                                                  )
                                                : "-"}
                                            </td>
                                            <td className="text-white text-sm px-4 py-3">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const member =
                                                    agentMembers.find(
                                                      (m: any) =>
                                                        m.id === r.user_id,
                                                    );
                                                  if (member) {
                                                    setSelectedMember(member);
                                                  }
                                                }}
                                                className="hover:text-indigo-400 transition-colors cursor-pointer underline decoration-dotted"
                                              >
                                                {label}
                                              </button>
                                            </td>
                                            <td className="px-4 py-3">
                                              <span
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                  r.typeLabel === "충전"
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                                }`}
                                              >
                                                {r.typeLabel}
                                              </span>
                                            </td>
                                            <td
                                              className={`text-right text-sm font-semibold px-4 py-3 ${
                                                r.signedAmount < 0
                                                  ? "text-red-400"
                                                  : "text-green-400"
                                              }`}
                                            >
                                              {formatRevenue(r.signedAmount)}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  {detailActiveTab === "members" &&
                    (() => {
                      // Filter to only show currently assigned members (matching agent_id)
                      // agentMembers includes historical members for revenue calculation
                      const currentMembers = (agentMembers || []).filter(
                        (m: any) => m.agent_id === detailTarget?.id,
                      );
                      const members = currentMembers;
                      const total = members.length;
                      const active = members.filter(
                        (m: any) => m.status === "active",
                      ).length;
                      const suspended = members.filter(
                        (m: any) => m.status === "suspended",
                      ).length;

                      const revenueByUserId = new Map<string, number>();
                      (agentRevenueRecords || []).forEach((r: any) => {
                        const uid = r.user_id;
                        if (!uid) return;
                        const typeLabel =
                          r.type === "withdraw" ? "출금" : "충전";
                        const rawAmount = Number(r.amount || 0);
                        const signed =
                          typeLabel === "출금"
                            ? -Math.abs(rawAmount)
                            : rawAmount;
                        revenueByUserId.set(
                          uid,
                          (revenueByUserId.get(uid) || 0) + signed,
                        );
                      });

                      const sorted = [...members].sort((a: any, b: any) => {
                        if (memberSortFilter === "date") {
                          const at = a.created_at
                            ? new Date(a.created_at).getTime()
                            : 0;
                          const bt = b.created_at
                            ? new Date(b.created_at).getTime()
                            : 0;
                          return bt - at;
                        }
                        const ar = revenueByUserId.get(a.id) || 0;
                        const br = revenueByUserId.get(b.id) || 0;
                        return br - ar;
                      });

                      const mapStatus = (status: string) => {
                        if (status === "active") return "활성";
                        if (status === "suspended") return "정지";
                        return status || "-";
                      };

                      return (
                        <div className="max-w-3xl mx-auto">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-white flex items-center gap-2 mb-2">
                                <Users size={18} />
                                가입 회원 목록
                              </h3>
                              <p className="text-gray-400 text-sm">
                                <span className="text-gray-300">
                                  전체 {total}명
                                </span>
                                <span className="text-gray-600 mx-2">|</span>
                                <span className="text-green-400">
                                  활성 {active}명
                                </span>
                                <span className="text-gray-600 mx-2">|</span>
                                <span className="text-red-400">
                                  정지 {suspended}명
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setMemberSortFilter("date")}
                                className={`px-3 py-1 rounded text-xs transition-colors ${
                                  memberSortFilter === "date"
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                }`}
                              >
                                <Calendar size={12} className="inline mr-1" />
                                가입일순
                              </button>
                              <button
                                onClick={() => setMemberSortFilter("revenue")}
                                className={`px-3 py-1 rounded text-xs transition-colors ${
                                  memberSortFilter === "revenue"
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                }`}
                              >
                                <DollarSign size={12} className="inline mr-1" />
                                매출액순
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {sorted.map((m: any) => {
                              const revenue = revenueByUserId.get(m.id) || 0;
                              return (
                                <div
                                  key={m.id}
                                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-indigo-500/50 transition-all"
                                  onClick={() => setSelectedMember(m)}
                                >
                                  <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className="text-white font-medium text-base">
                                          {m.nickname || "-"} ({m.name || "-"})
                                        </p>
                                        {!!m.is_online && (
                                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        )}
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full ${
                                            mapStatus(m.status) === "활성"
                                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                                          }`}
                                        >
                                          {mapStatus(m.status)}
                                        </span>
                                      </div>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2 text-white">
                                          <span className="text-gray-400">
                                            이메일
                                          </span>
                                          <span>{m.email || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white">
                                          <span className="text-gray-400">
                                            전화번호
                                          </span>
                                          <span>{m.phone || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white">
                                          <span className="text-gray-400">
                                            가입
                                          </span>
                                          <span>
                                            {formatDate(m.created_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-white text-xs mb-1">
                                        보유 포인트
                                      </p>
                                      <p className="text-indigo-400 font-semibold text-sm mb-2">
                                        {Number(m.points || 0).toLocaleString()}
                                        P
                                      </p>
                                      <p className="text-white text-xs mb-1">
                                        기여 매출
                                      </p>
                                      <p
                                        className={`font-bold text-base ${
                                          revenue < 0
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                        }`}
                                      >
                                        {formatRevenue(revenue)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                  {detailActiveTab === "profiles" &&
                    (() => {
                      // Filter by assigned_agent_id AND is_active to match agent dashboard
                      const assigned = allChatProfiles.filter(
                        (p: any) =>
                          p.assigned_agent_id === detailTarget.id &&
                          p.is_active === true,
                      );

                      return (
                        <div className="max-w-2xl mx-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white flex items-center gap-2">
                              <MessageCircle size={18} />
                              배정된 프로필 카드
                            </h3>
                            <button
                              onClick={() => {
                                const currentlyAssigned = allChatProfiles
                                  .filter(
                                    (p: any) =>
                                      p.assigned_agent_id === detailTarget.id,
                                  )
                                  .map((p: any) => p.id);
                                setAssignTarget({
                                  id: detailTarget.id,
                                  label: detailTarget.label,
                                });
                                setSelectedProfileIds(currentlyAssigned);
                              }}
                              className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 border border-indigo-500/30"
                            >
                              <UserPlus size={14} />
                              관리
                            </button>
                          </div>

                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            {assigned.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {assigned.map((p: any) => (
                                  <div
                                    key={p.id}
                                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm flex items-center gap-2"
                                  >
                                    <span>{p.name}</span>
                                    <span className="text-gray-500">
                                      ({p.age}세)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm text-center">
                                배정된 프로필이 없습니다
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  {detailActiveTab === "gifts" &&
                    (() => {
                      return (
                        <div className="space-y-6">
                          {/* Agent's own gift inventory */}
                          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            <GiftInventoryManager
                              ownerId={detailTarget?.id}
                              ownerType="agent"
                              enabled={detailActiveTab === "gifts"}
                              title="에이전트 보유 선물"
                            />
                          </div>

                          {agentGiftHistoryError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
                              {agentGiftHistoryError.message}
                            </div>
                          )}

                          <GiftHistoryTable
                            title="프로필별 선물 내역"
                            rows={agentGiftHistoryRows}
                            isLoading={isAgentGiftHistoryLoading}
                            emptyMessage="선물 내역이 없습니다."
                          />
                        </div>
                      );
                    })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedMember && (
        <UserDetailModal
          user={{
            id: selectedMember.id,
            name: selectedMember.name || "-",
            nickname: selectedMember.nickname || "-",
            email: selectedMember.email || "-",
            phone: selectedMember.phone || "",
            joined: selectedMember.created_at
              ? formatKST(selectedMember.created_at, "datetime")
              : "-",
            lastLogin: selectedMember.last_login_at
              ? formatKST(selectedMember.last_login_at, "datetime")
              : "-",
            joinIp: selectedMember.join_ip || "",
            lastIp: selectedMember.last_login_ip || "",
            status:
              selectedMember.status === "active"
                ? "활성"
                : selectedMember.status === "suspended"
                  ? "정지"
                  : selectedMember.status || "-",
            points: Number(selectedMember.points || 0),
            online: !!selectedMember.is_online,
            bank: selectedMember.bank || "",
            accountNumber: selectedMember.account_number || "",
            accountHolder: selectedMember.account_holder || "",
            referralCode: selectedMember.referral_code || "",
            profileImage: selectedMember.profile_image || null,
          }}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </AdminLayout>
  );
}
