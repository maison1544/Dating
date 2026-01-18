import { AdminLayout } from "../components/AdminLayout";
import { UserDetailModal } from "../components/UserDetailModal";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  UserCheck,
  ChevronDown,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  X,
} from "lucide-react";
import {
  useAdminUserActions,
  useApprovalLogs,
  useUsers,
} from "../hooks/useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { formatKST } from "../../lib/dateUtils";
import { getPublicUrlForPath } from "../../lib/storage";

export function AdminUsersPage() {
  const { adminAccount, isAdmin } = useAuth();
  const { showAlert } = useAlert();
  const {
    users: dbUsers,
    isLoading: usersLoading,
    updateUser,
    refetch: refetchUsers,
  } = useUsers();
  const {
    logs: approvalLogs,
    isLoading: logsLoading,
    createLog,
  } = useApprovalLogs();

  const { adjustUserPoints, setUserStatus } = useAdminUserActions(
    adminAccount?.id,
  );

  void logsLoading;
  void usersLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  type SortKey =
    | "name"
    | "joined"
    | "lastLogin"
    | "joinIp"
    | "lastIp"
    | "status"
    | "points";
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const approvalLogsFormatted = approvalLogs.map((log: any) => {
    const changes = log.changes;
    const record: Record<string, unknown> =
      typeof changes === "object" && changes !== null && !Array.isArray(changes)
        ? (changes as Record<string, unknown>)
        : {};

    const nickname =
      typeof record.nickname === "string"
        ? record.nickname
        : typeof record.user_nickname === "string"
          ? record.user_nickname
          : "";
    const name =
      typeof record.name === "string"
        ? record.name
        : typeof record.user_name === "string"
          ? record.user_name
          : "";
    const email =
      typeof record.email === "string"
        ? record.email
        : typeof record.user_email === "string"
          ? record.user_email
          : "";
    const phone =
      typeof record.phone === "string"
        ? record.phone
        : typeof record.user_phone === "string"
          ? record.user_phone
          : "";
    const bank =
      typeof record.bank === "string"
        ? record.bank
        : typeof record.user_bank === "string"
          ? record.user_bank
          : "";

    const accountNumber =
      typeof record.account_number === "string"
        ? record.account_number
        : typeof record.accountNumber === "string"
          ? record.accountNumber
          : typeof record.user_account_number === "string"
            ? record.user_account_number
            : "";
    const accountHolder =
      typeof record.account_holder === "string"
        ? record.account_holder
        : typeof record.accountHolder === "string"
          ? record.accountHolder
          : typeof record.user_account_holder === "string"
            ? record.user_account_holder
            : "";

    const action =
      log.action === "approve_user"
        ? "승인"
        : log.action === "reject_user"
          ? "거절"
          : log.action === "suspend_user"
            ? "정지"
            : log.action;

    const actionDate = log.created_at
      ? formatKST(log.created_at, "datetime")
      : "";

    const actionBy =
      typeof (log as any)?.admins?.name === "string"
        ? ((log as any).admins.name as string)
        : log.admin_id;

    return {
      id: log.id,
      nickname,
      name,
      email,
      phone,
      bank,
      accountNumber,
      accountHolder,
      action,
      actionDate,
      actionBy,
    };
  });

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    return formatKST(value, "datetime") || "-";
  };

  // 가입 승인 대기 사용자 (status가 pending인 사용자)
  const pendingApprovals = dbUsers
    .filter((u: any) => u.status === "pending")
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      nickname: u.nickname || "",
      email: u.email,
      phone: u.phone || "",
      joined: formatDate(u.created_at),
      joinIp: u.join_ip ?? (u as any).signup_ip ?? "",
      bank: u.bank || "",
      accountNumber: u.account_number || "",
      accountHolder: u.account_holder || "",
      referralCode: u.referral_code || "",
    }));

  // 활성 사용자 목록
  const users = dbUsers
    .filter((u: any) => u.status !== "pending")
    .map((u: any) => ({
      id: u.id,
      name: u.name,
      nickname: u.nickname || "",
      email: u.email,
      phone: u.phone || "",
      createdAt: u.created_at || null,
      lastLoginAt: u.last_login_at || null,
      joined: formatDate(u.created_at),
      lastLogin: formatDate(u.last_login_at),
      joinIp: u.join_ip ?? (u as any).signup_ip ?? "",
      lastIp: u.last_login_ip ?? "",
      status:
        u.status === "active"
          ? "활성"
          : u.status === "suspended"
            ? "정지"
            : u.status || "",
      points: u.points || 0,
      online: u.is_online || false,
      bank: u.bank || "",
      accountNumber: u.account_number || "",
      accountHolder: u.account_holder || "",
      revenue: u.total_spent || 0,
      referralCode: u.referral_code || "",
      profileImage:
        getPublicUrlForPath("profile-images", u.profile_image) || null,
    }));

  const toggleSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir(key === "name" ? "asc" : "desc");
      return key;
    });
  };

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 프로필 이미지 팝업 state
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string>("");
  const [selectedProfileName, setSelectedProfileName] = useState<string>("");
  const [quickPointUserId, setQuickPointUserId] = useState<string | null>(null);
  const [quickPointType, setQuickPointType] = useState<"add" | "subtract">(
    "add",
  );
  const [quickPointAmount, setQuickPointAmount] = useState("");
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeUser, setStatusChangeUser] = useState<
    (typeof users)[0] | null
  >(null);
  const [statusChangeAction, setStatusChangeAction] = useState<"ban" | "unban">(
    "ban",
  );

  // 회원 가입 승인/거절 팝업 상태
  const [showApprovalConfirmModal, setShowApprovalConfirmModal] =
    useState(false);
  const [approvalConfirmAction, setApprovalConfirmAction] = useState<{
    action: "approve" | "reject";
    applicant: (typeof pendingApprovals)[0];
  } | null>(null);
  const [isApprovalProcessing, setIsApprovalProcessing] = useState(false);

  const handleApprovalConfirm = async () => {
    if (isApprovalProcessing || !approvalConfirmAction) return;

    if (!isAdmin || !adminAccount?.id) {
      showAlert({
        title: "권한 오류",
        message: "관리자 권한이 필요합니다.",
        type: "warning",
      });
      return;
    }

    setIsApprovalProcessing(true);

    try {
      const { action, applicant } = approvalConfirmAction;

      const updateResult =
        action === "approve"
          ? await updateUser(applicant.id, {
              status: "active",
              deleted_at: null,
            })
          : await updateUser(applicant.id, {
              status: "deleted",
              deleted_at: new Date().toISOString(),
            });

      if (updateResult.error) {
        throw updateResult.error;
      }

      const { error: logError } = await createLog({
        action: action === "approve" ? "approve_user" : "reject_user",
        admin_id: adminAccount.id,
        ip_address: null,
        target_id: applicant.id,
        target_type: "user_profiles",
        changes: {
          id: applicant.id,
          name: applicant.name,
          nickname: applicant.nickname,
          email: applicant.email,
          phone: applicant.phone,
          bank: applicant.bank,
          account_number: applicant.accountNumber,
          account_holder: applicant.accountHolder,
        },
      });

      const baseMessage = `${applicant.name} 회원의 가입이 ${
        action === "approve" ? "승인" : "거절"
      }되었습니다.`;

      showAlert({
        title: logError ? "처리 완료(경고)" : "처리 완료",
        message: logError
          ? `${baseMessage}\n(로그 기록 실패: ${logError.message})`
          : baseMessage,
        type: logError ? "warning" : "success",
      });

      setShowApprovalConfirmModal(false);
      setApprovalConfirmAction(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.";
      showAlert({ title: "오류", message, type: "error" });
    } finally {
      setIsApprovalProcessing(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.nickname.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      String(user.joinIp || "")
        .toLowerCase()
        .includes(q) ||
      String(user.lastIp || "")
        .toLowerCase()
        .includes(q);
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;

    const safeString = (v: unknown) => String(v ?? "").toLowerCase();
    const dateValue = (v: string | null) => (v ? new Date(v).getTime() : 0);
    const statusRank = (s: string) =>
      s === "활성" ? 0 : s === "정지" ? 1 : s === "대기" ? 2 : 3;

    let cmp = 0;
    switch (sortKey) {
      case "name":
        cmp = safeString(a.nickname || a.name).localeCompare(
          safeString(b.nickname || b.name),
        );
        break;
      case "joined":
        cmp = dateValue(a.createdAt) - dateValue(b.createdAt);
        break;
      case "lastLogin":
        cmp = dateValue(a.lastLoginAt) - dateValue(b.lastLoginAt);
        break;
      case "joinIp":
        cmp = safeString(a.joinIp).localeCompare(safeString(b.joinIp));
        break;
      case "lastIp":
        cmp = safeString(a.lastIp).localeCompare(safeString(b.lastIp));
        break;
      case "status":
        cmp = statusRank(a.status) - statusRank(b.status);
        break;
      case "points":
        cmp = Number(a.points || 0) - Number(b.points || 0);
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return cmp * dir;
    return safeString(a.id).localeCompare(safeString(b.id));
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    const active = sortKey === column;
    return (
      <ChevronDown
        size={14}
        className={`transition-transform ${
          active ? "text-gray-200" : "text-gray-500"
        } ${active && sortDir === "asc" ? "rotate-180" : ""}`}
      />
    );
  };

  // 엔터키로 정지/정지 해제 확인
  useEffect(() => {
    if (!showStatusChangeModal || !statusChangeUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void (async () => {
          try {
            if (!isAdmin || !adminAccount?.id) {
              showAlert({
                title: "권한 오류",
                message: "관리자 권한이 필요합니다.",
                type: "warning",
              });
              return;
            }

            const nextStatus =
              statusChangeAction === "ban" ? "suspended" : "active";
            await setUserStatus({
              userId: statusChangeUser.id,
              status: nextStatus,
              reason: undefined,
            });
            await refetchUsers();
            showAlert({
              title: "처리 완료",
              message:
                statusChangeAction === "ban"
                  ? `${statusChangeUser.name} 회원이 정지되었습니다.`
                  : `${statusChangeUser.name} 회원의 정지가 해제되었습니다.`,
              type: "success",
            });
            setShowStatusChangeModal(false);
            setStatusChangeUser(null);
          } catch (err) {
            const msg =
              err instanceof Error
                ? err.message
                : "처리 중 오류가 발생했습니다";
            showAlert({ title: "오류", message: msg, type: "error" });
          }
        })();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStatusChangeModal, statusChangeUser, statusChangeAction]);

  // 엔터키로 회원 가입 승인/거절 확인
  useEffect(() => {
    if (!showApprovalConfirmModal || !approvalConfirmAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleApprovalConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showApprovalConfirmModal, approvalConfirmAction]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "활성":
        return "bg-green-500/20 text-green-500";
      case "정지":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">회원 관리</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-300">전체 {sortedUsers.length}명</span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">
                활성 {users.filter((u) => u.status === "활성").length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-red-400">
                정지 {users.filter((u) => u.status === "정지").length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-blue-400">
                현재접속 {users.filter((u) => u.online).length}명
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowApprovalModal(true)}
            className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
          >
            <UserCheck size={20} />
            회원 승인 대기 ({pendingApprovals.length})
          </button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">전체 상태</option>
                <option value="활성">활성</option>
                <option value="정지">정지</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="w-full">
            <table className="w-full table-fixed admin-users-table">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="w-full flex items-center justify-center gap-1"
                    >
                      회원 정보
                      <SortIcon column="name" />
                    </button>
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort("joined")}
                      className="w-full flex items-center justify-center gap-1"
                    >
                      가입일
                      <SortIcon column="joined" />
                    </button>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      마지막 로그인
                    </div>
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort("joinIp")}
                      className="w-full flex items-center justify-center gap-1"
                    >
                      가입 IP
                      <SortIcon column="joinIp" />
                    </button>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      마지막 IP
                    </div>
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className="w-full flex items-center justify-center gap-1"
                    >
                      상태
                      <SortIcon column="status" />
                    </button>
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort("points")}
                      className="w-full flex items-center justify-center gap-1"
                    >
                      포인트
                      <SortIcon column="points" />
                    </button>
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-2 text-center h-16">
                      <div className="flex items-center justify-center gap-3 h-full">
                        <div className="relative flex-shrink-0">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProfileImage(
                                  user.profileImage || "",
                                );
                                setSelectedProfileName(user.name);
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
                          {user.online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm leading-tight">
                            {user.nickname}{" "}
                            <span className="text-white text-sm">
                              ({user.name})
                            </span>
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{user.joined}</p>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {user.lastLogin}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{user.joinIp}</p>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {user.lastIp}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="h-full flex items-center justify-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                            user.status,
                          )}`}
                        >
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16 text-white text-sm">
                      <div className="h-full flex flex-col items-center justify-center gap-1">
                        <span className="text-indigo-400 font-semibold">
                          {user.points.toLocaleString()} P
                        </span>
                        <button
                          onClick={() => {
                            setQuickPointUserId(user.id);
                            setQuickPointType("add");
                            setQuickPointAmount("");
                          }}
                          className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1"
                          title="포인트 조정"
                        >
                          <DollarSign size={12} />
                          조정
                        </button>
                      </div>
                    </td>
                    <td className="px-2 h-16">
                      <div className="flex items-center justify-center gap-1">
                        {user.status === "활성" ? (
                          <button
                            onClick={() => {
                              setStatusChangeUser(user);
                              setStatusChangeAction("ban");
                              setShowStatusChangeModal(true);
                            }}
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-500"
                            title="정지"
                          >
                            <Ban size={16} />
                          </button>
                        ) : user.status === "정지" ? (
                          <button
                            onClick={() => {
                              setStatusChangeUser(user);
                              setStatusChangeAction("unban");
                              setShowStatusChangeModal(true);
                            }}
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-green-500"
                            title="정지 해제"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : user.status === "대기" ? (
                          <button
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-green-500"
                            title="승인"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                          title="더보기"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Quick Point Adjustment Modal */}
      {quickPointUserId !== null &&
        (() => {
          const targetUser = users.find((u) => u.id === quickPointUserId);
          if (!targetUser) return null;

          return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
                <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                  <h2 className="text-white text-lg flex items-center gap-2">
                    <DollarSign size={20} />
                    포인트 조정
                  </h2>
                  <button
                    onClick={() => {
                      setQuickPointUserId(null);
                      setQuickPointAmount("");
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* User Info */}
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                        {targetUser.name[0]}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {targetUser.nickname}{" "}
                          <span className="text-gray-400">
                            ({targetUser.name})
                          </span>
                        </p>
                        <p className="text-gray-400 text-sm">
                          {targetUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <span className="text-gray-400 text-sm">현재 포인트</span>
                      <span className="text-indigo-400 font-semibold text-lg">
                        {targetUser.points.toLocaleString()} P
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      조정 타입
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setQuickPointType("add")}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          quickPointType === "add"
                            ? "bg-green-500 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        지급 (+)
                      </button>
                      <button
                        onClick={() => setQuickPointType("subtract")}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          quickPointType === "subtract"
                            ? "bg-red-500 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        차감 (-)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      포인트 금액
                    </label>
                    <input
                      type="number"
                      value={quickPointAmount}
                      onChange={(e) => setQuickPointAmount(e.target.value)}
                      placeholder="금액 입력"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const raw = parseInt(quickPointAmount, 10);
                        if (!Number.isFinite(raw) || raw <= 0) return;

                        if (!isAdmin || !adminAccount?.id) {
                          showAlert({
                            title: "권한 오류",
                            message: "관리자 권한이 필요합니다.",
                            type: "warning",
                          });
                          return;
                        }

                        const signedAmount =
                          quickPointType === "add" ? raw : -raw;

                        void (async () => {
                          try {
                            await adjustUserPoints({
                              userId: targetUser.id,
                              amount: signedAmount,
                              description:
                                quickPointType === "add"
                                  ? "관리자 포인트 지급"
                                  : "관리자 포인트 차감",
                            });
                            await refetchUsers();
                            showAlert({
                              title: "처리 완료",
                              message: `${
                                quickPointType === "add" ? "+" : "-"
                              }${raw.toLocaleString()}P ${
                                quickPointType === "add" ? "지급" : "차감"
                              }되었습니다`,
                              type: "success",
                            });
                            setQuickPointUserId(null);
                            setQuickPointAmount("");
                          } catch (err) {
                            const msg =
                              err instanceof Error
                                ? err.message
                                : "처리 중 오류가 발생했습니다";
                            showAlert({
                              title: "오류",
                              message: msg,
                              type: "error",
                            });
                          }
                        })();
                      }}
                      disabled={
                        !quickPointAmount || parseInt(quickPointAmount) <= 0
                      }
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      확인
                    </button>
                    <button
                      onClick={() => {
                        setQuickPointUserId(null);
                        setQuickPointAmount("");
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Status Change Modal - 정지/정지 해제 확인 팝업 */}
      {showStatusChangeModal && statusChangeUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg flex items-center gap-2">
                {statusChangeAction === "ban" ? (
                  <>
                    <Ban size={20} className="text-red-500" />
                    회원 정지
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} className="text-green-500" />
                    정지 해제
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowStatusChangeModal(false);
                  setStatusChangeUser(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                  {statusChangeUser.name[0]}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {statusChangeUser.nickname} ({statusChangeUser.name})
                  </p>
                  <p className="text-gray-400 text-sm">
                    {statusChangeUser.email}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                {statusChangeAction === "ban" ? (
                  <>
                    <p className="text-white text-center mb-2">
                      정말 이 회원을{" "}
                      <span className="text-red-500 font-bold">정지</span>
                      하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      정지된 회원은 로그인 및 모든 서비스 이용이 제한됩니다.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white text-center mb-2">
                      이 회원의 정지를{" "}
                      <span className="text-green-500 font-bold">해제</span>
                      하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      정지 해제 시 모든 서비스를 정상적으로 이용할 수 있습니다.
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowStatusChangeModal(false);
                    setStatusChangeUser(null);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    void (async () => {
                      try {
                        if (!isAdmin || !adminAccount?.id) {
                          showAlert({
                            title: "권한 오류",
                            message: "관리자 권한이 필요합니다.",
                            type: "warning",
                          });
                          return;
                        }

                        const nextStatus =
                          statusChangeAction === "ban" ? "suspended" : "active";

                        await setUserStatus({
                          userId: statusChangeUser.id,
                          status: nextStatus,
                          reason: undefined,
                        });

                        await refetchUsers();

                        showAlert({
                          title: "처리 완료",
                          message:
                            statusChangeAction === "ban"
                              ? `${statusChangeUser.name} 회원이 정지되었습니다.`
                              : `${statusChangeUser.name} 회원의 정지가 해제되었습니다.`,
                          type: "success",
                        });
                        setShowStatusChangeModal(false);
                        setStatusChangeUser(null);
                      } catch (err) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "처리 중 오류가 발생했습니다";
                        showAlert({
                          title: "오류",
                          message: msg,
                          type: "error",
                        });
                      }
                    })();
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-white ${
                    statusChangeAction === "ban"
                      ? "bg-red-500/80 hover:bg-red-500"
                      : "bg-green-500/80 hover:bg-green-500"
                  }`}
                >
                  {statusChangeAction === "ban" ? "정지하기" : "해제하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl flex items-center gap-2">
                <UserCheck size={24} />
                회원 가입 승인 관리
              </h2>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Pending Approvals */}
              <div>
                <h3 className="text-white text-lg mb-4 flex items-center gap-2">
                  <Clock size={18} />
                  승인 대기 중 ({pendingApprovals.length}명)
                </h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            닉네임(이름)
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            이메일
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            전화번호
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            추천코드
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            은행
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            계좌번호
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            예금주
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            가입 신청일
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            가입 IP
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {pendingApprovals.map((applicant) => (
                          <tr
                            key={applicant.id}
                            className="hover:bg-gray-700/50"
                          >
                            <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
                              <div className="text-white">
                                {applicant.nickname}
                              </div>
                              <div className="text-gray-400 text-[10px]">
                                ({applicant.name})
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.email}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.phone}
                            </td>
                            <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
                              {applicant.referralCode ? (
                                <span className="text-indigo-400 font-mono text-[10px]">
                                  {applicant.referralCode}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.bank}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.accountNumber}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.accountHolder}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.joined}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.joinIp}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setApprovalConfirmAction({
                                      action: "approve",
                                      applicant,
                                    });
                                    setShowApprovalConfirmModal(true);
                                  }}
                                  className="px-2 py-1 bg-green-500/80 hover:bg-green-500 text-white rounded text-xs transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle size={12} />
                                  승인
                                </button>
                                <button
                                  onClick={() => {
                                    setApprovalConfirmAction({
                                      action: "reject",
                                      applicant,
                                    });
                                    setShowApprovalConfirmModal(true);
                                  }}
                                  className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded text-xs transition-colors flex items-center gap-1"
                                >
                                  <X size={12} />
                                  거절
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Approval Logs */}
              <div>
                <h3 className="text-white text-lg mb-4 flex items-center gap-2">
                  <Eye size={18} />
                  승인/거절 로그 ({approvalLogsFormatted.length}건)
                </h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            닉네임(이름)
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            이메일
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            전화번호
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            은행
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            계좌번호
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            예금주
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            결과
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            처리일시
                          </th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                            처리자
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {approvalLogsFormatted.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="text-white">{log.nickname}</div>
                              <div className="text-gray-400 text-xs">
                                ({log.name})
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.email}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.phone}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.bank}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.accountNumber}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.accountHolder}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  log.action === "승인"
                                    ? "bg-green-500/20 text-green-500"
                                    : "bg-red-500/20 text-red-500"
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.actionDate}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.actionBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirm Modal */}
      {showApprovalConfirmModal && approvalConfirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg flex items-center gap-2">
                {approvalConfirmAction.action === "approve" ? (
                  <>
                    <CheckCircle size={20} className="text-green-500" />
                    회원 가입 승인
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-red-500" />
                    회원 가입 거절
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowApprovalConfirmModal(false);
                  setApprovalConfirmAction(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                  {approvalConfirmAction.applicant.name[0]}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {approvalConfirmAction.applicant.nickname} (
                    {approvalConfirmAction.applicant.name})
                  </p>
                  <p className="text-gray-400 text-sm">
                    {approvalConfirmAction.applicant.email}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                {approvalConfirmAction.action === "approve" ? (
                  <>
                    <p className="text-white text-center mb-2">
                      이 회원의 가입을{" "}
                      <span className="text-green-500 font-bold">승인</span>
                      하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      승인 시 회원은 모든 서비스를 이용할 수 있습니다.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white text-center mb-2">
                      이 회원의 가입을{" "}
                      <span className="text-red-500 font-bold">거절</span>
                      하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      거절된 회원은 서비스를 이용할 수 없습니다.
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowApprovalConfirmModal(false);
                    setApprovalConfirmAction(null);
                  }}
                  disabled={isApprovalProcessing}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => void handleApprovalConfirm()}
                  disabled={isApprovalProcessing}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    approvalConfirmAction.action === "approve"
                      ? "bg-green-500/80 hover:bg-green-500"
                      : "bg-red-500/80 hover:bg-red-500"
                  }`}
                >
                  {approvalConfirmAction.action === "approve"
                    ? "승인하기"
                    : "거절하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Modal */}
      {showProfileImageModal && selectedProfileImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowProfileImageModal(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowProfileImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-gray-800/50 hover:bg-gray-700/50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <img
              src={selectedProfileImage}
              alt={selectedProfileName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
