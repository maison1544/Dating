import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  useAdminPaymentRequests,
  useAdminPointPackages,
} from "../hooks/useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import { DateRangePicker } from "../components/DateRangePicker";
import { formatKST } from "../../lib/dateUtils";

interface WithdrawalRequest {
  id: string;
  user: string;
  nickname: string;
  email: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  requestDate: string;
  createdAt: string;
  status: "대기" | "승인" | "거절";
  rejectReason?: string;
}

interface DepositRequest {
  id: string;
  user: string;
  nickname: string;
  email: string;
  amount: number;
  depositName: string;
  requestDate: string;
  createdAt: string;
  status: "대기" | "승인" | "거절";
  rejectReason?: string;
}

interface ChargeCard {
  id: string;
  amount: number;
  bonus: number;
  totalAmount: number;
  isActive: boolean;
  salesCount: number;
}

export function AdminPointsPage() {
  const { adminAccount } = useAuth();
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "deposit" | "withdrawal"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"requests" | "cards">("requests");
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ChargeCard | null>(null);
  const [cardFormData, setCardFormData] = useState({
    amount: 10000,
    bonus: 0,
    isActive: true,
  });

  const [deleteCardConfirm, setDeleteCardConfirm] = useState<null | {
    id: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>(null);

  const [selectedDepositIds, setSelectedDepositIds] = useState<string[]>([]);
  const [selectedWithdrawalIds, setSelectedWithdrawalIds] = useState<string[]>(
    [],
  );
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // 승인/거절 확인 팝업 상태
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "deposit" | "withdrawal";
    action: "approve" | "reject";
    ids: string[];
  } | null>(null);

  // Debouncing ref for preventing rapid clicks
  const isProcessingRef = useRef(false);

  // Supabase hooks
  const {
    deposits: dbDeposits,
    withdrawals: dbWithdrawals,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
  } = useAdminPaymentRequests(adminAccount?.id);
  const {
    packages: dbPackages,
    createPackage,
    updatePackage,
    deletePackage,
  } = useAdminPointPackages(adminAccount?.id);

  // Transform Supabase data to UI format
  const withdrawalRequests: WithdrawalRequest[] = dbWithdrawals.map(
    (w: any) => ({
      id: w.id,
      user: w.users?.name || "Unknown",
      nickname: w.users?.nickname || "",
      email: w.users?.email || "",
      amount: w.amount,
      bankName: w.bank || "",
      accountNumber: w.account_number || "",
      accountHolder: w.account_holder || "",
      requestDate: formatKST(w.created_at, "datetime"),
      createdAt: w.created_at,
      status:
        w.status === "pending"
          ? "대기"
          : w.status === "approved"
            ? "승인"
            : "거절",
      rejectReason: w.reject_reason || undefined,
    }),
  );

  const depositRequests: DepositRequest[] = dbDeposits.map((d: any) => ({
    id: d.id,
    user: d.users?.name || "Unknown",
    nickname: d.users?.nickname || "",
    email: d.users?.email || "",
    amount: d.amount,
    depositName: d.depositor_name || d.users?.name || "",
    requestDate: formatKST(d.created_at, "datetime"),
    createdAt: d.created_at,
    status:
      d.status === "pending"
        ? "대기"
        : d.status === "approved"
          ? "승인"
          : "거절",
    rejectReason: d.reject_reason || undefined,
  }));

  const salesCountMap = useMemo(() => {
    const map = new Map<string, number>();
    (dbDeposits || []).forEach((d: any) => {
      if (d.status !== "approved") return;
      const key = `${Number(d.amount || 0)}:${Number(d.bonus_amount || 0)}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [dbDeposits]);

  const chargeCards: ChargeCard[] = dbPackages.map((p: any) => ({
    id: p.id,
    amount: p.amount,
    bonus: p.bonus_amount ?? 0,
    totalAmount: p.total_amount ?? p.amount + (p.bonus_amount ?? 0),
    isActive: p.is_active ?? false,
    salesCount:
      salesCountMap.get(
        `${Number(p.amount || 0)}:${Number(p.bonus_amount || 0)}`,
      ) || 0,
  }));

  // 필터링된 입출금 신청
  const filteredRequests = () => {
    const q = searchTerm.trim().toLowerCase();

    const matchesQuery = (req: {
      user: string;
      nickname: string;
      email: string;
      id: string;
    }) => {
      if (!q) return true;
      return (
        req.user.toLowerCase().includes(q) ||
        req.nickname.toLowerCase().includes(q) ||
        req.email.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q)
      );
    };

    const matchesStatus = (status: "대기" | "승인" | "거절") => {
      if (statusFilter === "all") return true;
      if (statusFilter === "pending") return status === "대기";
      if (statusFilter === "approved") return status === "승인";
      return status === "거절";
    };

    const matchesDate = (createdAt: string) => {
      const t = new Date(createdAt).getTime();
      if (Number.isNaN(t)) return true;
      if (startDate) {
        const s = new Date(`${startDate}T00:00:00`).getTime();
        if (!Number.isNaN(s) && t < s) return false;
      }
      if (endDate) {
        const e = new Date(`${endDate}T23:59:59`).getTime();
        if (!Number.isNaN(e) && t > e) return false;
      }
      return true;
    };

    const deposits = depositRequests.filter(
      (req) =>
        matchesStatus(req.status) &&
        matchesDate(req.createdAt) &&
        matchesQuery(req),
    );

    const withdrawals = withdrawalRequests.filter(
      (req) =>
        matchesStatus(req.status) &&
        matchesDate(req.createdAt) &&
        matchesQuery(req),
    );

    if (typeFilter === "deposit") return { deposits, withdrawals: [] };
    if (typeFilter === "withdrawal") return { deposits: [], withdrawals };
    return { deposits, withdrawals };
  };

  const handleApproveDeposit = (id: string) => {
    setRejectReasonInput("");
    setConfirmAction({ type: "deposit", action: "approve", ids: [id] });
    setShowConfirmModal(true);
  };

  const handleRejectDeposit = (id: string) => {
    setRejectReasonInput("");
    setConfirmAction({ type: "deposit", action: "reject", ids: [id] });
    setShowConfirmModal(true);
  };

  const handleApproveWithdrawal = (id: string) => {
    setRejectReasonInput("");
    setConfirmAction({ type: "withdrawal", action: "approve", ids: [id] });
    setShowConfirmModal(true);
  };

  const handleRejectWithdrawal = (id: string) => {
    setRejectReasonInput("");
    setConfirmAction({ type: "withdrawal", action: "reject", ids: [id] });
    setShowConfirmModal(true);
  };

  // 실제 승인/거절 처리 (with debouncing)
  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (isProcessingRef.current) return;

    const { type, action, ids } = confirmAction;

    // reject_reason is optional - no validation required

    isProcessingRef.current = true;
    try {
      for (const id of ids) {
        let result: any;
        if (type === "deposit") {
          result =
            action === "approve"
              ? await approveDeposit(id)
              : await rejectDeposit(id, rejectReasonInput.trim());
        } else {
          result =
            action === "approve"
              ? await approveWithdrawal(id)
              : await rejectWithdrawal(id, rejectReasonInput.trim());
        }

        if (result?.error) {
          showAlert({
            title: "오류",
            message: "처리에 실패했습니다.",
            type: "error",
          });
          return;
        }
      }

      showAlert({
        title: "처리 완료",
        message: `${type === "deposit" ? "입금" : "출금"} 신청이 ${
          action === "approve" ? "승인" : "거절"
        }되었습니다.`,
        type: "success",
      });
      setShowConfirmModal(false);
      setConfirmAction(null);
      setRejectReasonInput("");
      setSelectedDepositIds([]);
      setSelectedWithdrawalIds([]);
    } finally {
      isProcessingRef.current = false;
    }
  };

  // 엔터키로 승인/거절 확인
  useEffect(() => {
    if (!showConfirmModal || !confirmAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmModal, confirmAction, rejectReasonInput]);

  const handleOpenCardModal = (card?: ChargeCard) => {
    if (card) {
      setEditingCard(card);
      setCardFormData({
        amount: card.amount,
        bonus: card.bonus,
        isActive: card.isActive,
      });
    } else {
      setEditingCard(null);
      setCardFormData({
        amount: 10000,
        bonus: 0,
        isActive: true,
      });
    }
    setIsCardModalOpen(true);
  };

  const handleCloseCardModal = () => {
    setIsCardModalOpen(false);
    setEditingCard(null);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    try {
      if (editingCard) {
        await updatePackage(editingCard.id, {
          name: `${cardFormData.amount.toLocaleString()}원 패키지`,
          amount: cardFormData.amount,
          bonus_amount: cardFormData.bonus,
          is_active: cardFormData.isActive,
        });
      } else {
        await createPackage({
          name: `${cardFormData.amount.toLocaleString()}원 패키지`,
          amount: cardFormData.amount,
          bonus_amount: cardFormData.bonus,
          is_active: cardFormData.isActive,
        });
      }
      handleCloseCardModal();
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (isProcessingRef.current) return;
    const card = chargeCards.find((c) => c.id === id);
    if (!card) return;

    if (card.salesCount > 0) {
      setDeleteCardConfirm({
        id,
        message:
          "구매 내역이 있는 충전권은 삭제할 수 없습니다. 비활성화 하시겠습니까?",
        onConfirm: async () => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          try {
            await updatePackage(id, { is_active: false });
          } finally {
            isProcessingRef.current = false;
          }
        },
      });
      return;
    }

    setDeleteCardConfirm({
      id,
      message: "정말 삭제하시겠습니까?",
      onConfirm: async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        try {
          await deletePackage(id);
        } finally {
          isProcessingRef.current = false;
        }
      },
    });
  };

  const handleBulkApprove = (type: "deposit" | "withdrawal") => {
    const ids = type === "deposit" ? selectedDepositIds : selectedWithdrawalIds;
    if (ids.length === 0) {
      showAlert({
        title: "안내",
        message: "선택된 항목이 없습니다.",
        type: "info",
      });
      return;
    }
    setRejectReasonInput("");
    setConfirmAction({ type, action: "approve", ids });
    setShowConfirmModal(true);
  };

  const handleBulkReject = (type: "deposit" | "withdrawal") => {
    const ids = type === "deposit" ? selectedDepositIds : selectedWithdrawalIds;
    if (ids.length === 0) {
      showAlert({
        title: "안내",
        message: "선택된 항목이 없습니다.",
        type: "info",
      });
      return;
    }
    setRejectReasonInput("");
    setConfirmAction({ type, action: "reject", ids });
    setShowConfirmModal(true);
  };

  const downloadCsv = (rows: Record<string, unknown>[], filename: string) => {
    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>()),
    );

    const escape = (v: unknown) => {
      const s = String(v ?? "");
      const escaped = s.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const lines = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    );
    const bom = "\uFEFF";
    const blob = new Blob([bom + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const { deposits, withdrawals } = filteredRequests();
  const pendingDeposits = depositRequests.filter(
    (r) => r.status === "대기",
  ).length;
  const pendingWithdrawals = withdrawalRequests.filter(
    (r) => r.status === "대기",
  ).length;
  const totalPendingAmount =
    depositRequests
      .filter((r) => r.status === "대기")
      .reduce((sum, r) => sum + r.amount, 0) +
    withdrawalRequests
      .filter((r) => r.status === "대기")
      .reduce((sum, r) => sum + r.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-white text-3xl">입출금 관리</h1>
              <span className="text-gray-400 text-sm">
                신규 입출금 신청 관리 및 충전권 설정
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">
                입금대기 {pendingDeposits}건
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-red-400">
                출금대기 {pendingWithdrawals}건
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-blue-400">
                처리대기금액 {totalPendingAmount.toLocaleString()}원
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-yellow-400">
                총대기건수 {pendingDeposits + pendingWithdrawals}건
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "requests"
                  ? "bg-indigo-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              입출금 신청 관리
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "cards"
                  ? "bg-indigo-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              충전카드 관리
            </button>
          </div>
        </div>

        {activeTab === "requests" ? (
          <>
            {/* Filters */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="회원 이름, 닉네임, 이메일로 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400" size={20} />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">전체</option>
                    <option value="deposit">입금 신청만</option>
                    <option value="withdrawal">출금 신청만</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400" size={20} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">전체 상태</option>
                    <option value="pending">대기</option>
                    <option value="approved">승인</option>
                    <option value="rejected">거절</option>
                  </select>
                </div>

                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
            </div>

            {/* Deposit Requests */}
            {(typeFilter === "all" || typeFilter === "deposit") &&
              deposits.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-white flex items-center gap-2">
                        <TrendingUp className="text-green-500" size={20} />
                        입금 신청 ({deposits.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            downloadCsv(
                              deposits.map((r) => ({
                                id: r.id,
                                name: r.user,
                                nickname: r.nickname,
                                email: r.email,
                                amount: r.amount,
                                depositorName: r.depositName,
                                status: r.status,
                                rejectReason: r.rejectReason || "",
                                createdAt: r.createdAt,
                              })),
                              `deposit_requests_${new Date()
                                .toISOString()
                                .slice(0, 10)}.csv`,
                            )
                          }
                          className="px-3 py-2 rounded bg-gray-900 hover:bg-gray-700 text-gray-200 text-xs transition-colors"
                        >
                          CSV 다운로드
                        </button>
                        <button
                          onClick={() => handleBulkApprove("deposit")}
                          className="px-3 py-2 rounded bg-green-600/80 hover:bg-green-600 text-white text-xs transition-colors"
                        >
                          일괄 승인
                        </button>
                        <button
                          onClick={() => handleBulkReject("deposit")}
                          className="px-3 py-2 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs transition-colors"
                        >
                          일괄 거절
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            <input
                              type="checkbox"
                              checked={
                                deposits.length > 0 &&
                                deposits.every((r) =>
                                  selectedDepositIds.includes(r.id),
                                )
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDepositIds(
                                    deposits.map((r) => r.id),
                                  );
                                } else {
                                  setSelectedDepositIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            회원 정보
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            입금 금액
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            입금자명
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            신청 일시
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            상태
                          </th>
                          {statusFilter === "all" ||
                          statusFilter === "pending" ? (
                            <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                              작업
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {deposits.map((request) => (
                          <tr
                            key={request.id}
                            className="hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-2 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedDepositIds.includes(
                                  request.id,
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDepositIds((prev) =>
                                      prev.includes(request.id)
                                        ? prev
                                        : [...prev, request.id],
                                    );
                                  } else {
                                    setSelectedDepositIds((prev) =>
                                      prev.filter((id) => id !== request.id),
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td className="px-2 py-3 text-center">
                              <div>
                                <p className="text-white text-sm">
                                  {request.nickname}({request.user})
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {request.email}
                                </p>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="text-green-500">
                                +{request.amount.toLocaleString()}원
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center text-gray-300 text-sm">
                              {request.depositName}
                            </td>
                            <td className="px-2 py-3 text-center text-gray-300 text-xs">
                              <div className="flex items-center justify-center gap-1">
                                <Clock size={12} />
                                {request.requestDate}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    request.status === "대기"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : request.status === "승인"
                                        ? "bg-green-500/20 text-green-300"
                                        : "bg-red-500/20 text-red-300"
                                  }`}
                                >
                                  {request.status}
                                </span>
                                {request.status === "거절" &&
                                  request.rejectReason && (
                                    <span
                                      className="text-[10px] text-red-400 max-w-[120px] truncate"
                                      title={request.rejectReason}
                                    >
                                      사유: {request.rejectReason}
                                    </span>
                                  )}
                              </div>
                            </td>
                            {request.status === "대기" ? (
                              <td className="px-2 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleApproveDeposit(request.id)
                                    }
                                    className="px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs bg-green-600/80 hover:bg-green-600 text-white"
                                  >
                                    <CheckCircle size={12} />
                                    승인
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectDeposit(request.id)
                                    }
                                    className="px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs bg-red-600/80 hover:bg-red-600 text-white"
                                  >
                                    <XCircle size={12} />
                                    거절
                                  </button>
                                </div>
                              </td>
                            ) : statusFilter === "all" ||
                              statusFilter === "pending" ? (
                              <td className="px-2 py-3"></td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Withdrawal Requests */}
            {(typeFilter === "all" || typeFilter === "withdrawal") &&
              withdrawals.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-white flex items-center gap-2">
                        <TrendingDown className="text-red-500" size={20} />
                        출금 신청 ({withdrawals.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            downloadCsv(
                              withdrawals.map((r) => ({
                                id: r.id,
                                name: r.user,
                                nickname: r.nickname,
                                email: r.email,
                                amount: r.amount,
                                bank: r.bankName,
                                accountNumber: r.accountNumber,
                                accountHolder: r.accountHolder,
                                status: r.status,
                                rejectReason: r.rejectReason || "",
                                createdAt: r.createdAt,
                              })),
                              `withdrawal_requests_${new Date()
                                .toISOString()
                                .slice(0, 10)}.csv`,
                            )
                          }
                          className="px-3 py-2 rounded bg-gray-900 hover:bg-gray-700 text-gray-200 text-xs transition-colors"
                        >
                          CSV 다운로드
                        </button>
                        <button
                          onClick={() => handleBulkApprove("withdrawal")}
                          className="px-3 py-2 rounded bg-green-600/80 hover:bg-green-600 text-white text-xs transition-colors"
                        >
                          일괄 승인
                        </button>
                        <button
                          onClick={() => handleBulkReject("withdrawal")}
                          className="px-3 py-2 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs transition-colors"
                        >
                          일괄 거절
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            <input
                              type="checkbox"
                              checked={
                                withdrawals.length > 0 &&
                                withdrawals.every((r) =>
                                  selectedWithdrawalIds.includes(r.id),
                                )
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedWithdrawalIds(
                                    withdrawals.map((r) => r.id),
                                  );
                                } else {
                                  setSelectedWithdrawalIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            회원 정보
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            출금 금액
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            은행 정보
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            신청 일시
                          </th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                            상태
                          </th>
                          {statusFilter === "all" ||
                          statusFilter === "pending" ? (
                            <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                              작업
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {withdrawals.map((request) => (
                          <tr
                            key={request.id}
                            className="hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-2 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedWithdrawalIds.includes(
                                  request.id,
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedWithdrawalIds((prev) =>
                                      prev.includes(request.id)
                                        ? prev
                                        : [...prev, request.id],
                                    );
                                  } else {
                                    setSelectedWithdrawalIds((prev) =>
                                      prev.filter((id) => id !== request.id),
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td className="px-2 py-3 text-center">
                              <div>
                                <p className="text-white text-sm">
                                  {request.nickname}({request.user})
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {request.email}
                                </p>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="text-red-500">
                                -{request.amount.toLocaleString()}원
                              </span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <div className="text-gray-300 text-xs">
                                <p>{request.bankName}</p>
                                <p className="text-gray-500">
                                  {request.accountNumber}
                                </p>
                                <p className="text-gray-500">
                                  {request.accountHolder}
                                </p>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center text-gray-300 text-xs">
                              <div className="flex items-center justify-center gap-1">
                                <Clock size={12} />
                                {request.requestDate}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    request.status === "대기"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : request.status === "승인"
                                        ? "bg-green-500/20 text-green-300"
                                        : "bg-red-500/20 text-red-300"
                                  }`}
                                >
                                  {request.status}
                                </span>
                                {request.status === "거절" &&
                                  request.rejectReason && (
                                    <span
                                      className="text-[10px] text-red-400 max-w-[120px] truncate"
                                      title={request.rejectReason}
                                    >
                                      사유: {request.rejectReason}
                                    </span>
                                  )}
                              </div>
                            </td>
                            {request.status === "대기" ? (
                              <td className="px-2 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleApproveWithdrawal(request.id)
                                    }
                                    className="px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs bg-green-600/80 hover:bg-green-600 text-white"
                                  >
                                    <CheckCircle size={12} />
                                    승인
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectWithdrawal(request.id)
                                    }
                                    className="px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs bg-red-600/80 hover:bg-red-600 text-white"
                                  >
                                    <XCircle size={12} />
                                    거절
                                  </button>
                                </div>
                              </td>
                            ) : statusFilter === "all" ||
                              statusFilter === "pending" ? (
                              <td className="px-2 py-3"></td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Empty State */}
            {deposits.length === 0 && withdrawals.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <AlertCircle className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 text-lg">
                  대기 중인 입출금 신청이 없습니다
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  새로운 신청이 들어오면 여기에 표시됩니다
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Charge Cards Header */}
            <div className="flex justify-between items-center">
              <p className="text-gray-400">
                전체 {chargeCards.length}개 충전권
              </p>
              <button
                onClick={() => handleOpenCardModal()}
                className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Plus size={20} />새 충전권 추가
              </button>
            </div>

            {/* Charge Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {chargeCards.map((card) => (
                <div
                  key={card.id}
                  className={`bg-gray-900 border rounded-lg p-6 transition-all ${
                    card.isActive
                      ? "border-indigo-500/50 hover:border-indigo-500"
                      : "border-gray-800 opacity-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-indigo-400">
                      <DollarSign size={32} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          card.isActive
                            ? "bg-green-500/20 text-green-500"
                            : "bg-gray-500/20 text-gray-500"
                        }`}
                      >
                        {card.isActive ? "활성" : "비활성"}
                      </span>
                      <button
                        onClick={() => handleOpenCardModal(card)}
                        className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                        title="수정"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-400 text-sm">기본 금액</p>
                      <p className="text-white text-2xl">
                        {card.amount.toLocaleString()}원
                      </p>
                    </div>
                    {card.bonus > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm">보너스</p>
                        <p className="text-green-500 text-xl">
                          +{card.bonus.toLocaleString()}원
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-800">
                      <p className="text-gray-400 text-sm">총 지급 포인트</p>
                      <p className="text-indigo-400 text-2xl">
                        {card.totalAmount.toLocaleString()}P
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500 rounded-lg p-6">
              <h3 className="text-white text-lg mb-3">💡 충전권 설정 가이드</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>
                  • <strong>기본 금액</strong>: 사용자가 실제로 결제하는 금액
                </p>
                <p>
                  • <strong>보너스</strong>: 충전 시 추가로 지급되는 포인트
                </p>
                <p>
                  • <strong>총 지급 포인트</strong>: 기본 금액 + 보너스
                </p>
                <p>• 비활성 상태의 충전권은 사용자에게 표시되지 않습니다</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charge Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl">
                {editingCard ? "충전권 수정" : "새 충전권 추가"}
              </h2>
              <button
                onClick={handleCloseCardModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCardSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">
                  기본 금액 (원)
                </label>
                <input
                  type="number"
                  value={cardFormData.amount}
                  onChange={(e) =>
                    setCardFormData({
                      ...cardFormData,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="10000"
                  required
                  min="0"
                  step="1000"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">
                  보너스 포인트 (원)
                </label>
                <input
                  type="number"
                  value={cardFormData.bonus}
                  onChange={(e) =>
                    setCardFormData({
                      ...cardFormData,
                      bonus: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">총 지급 포인트</p>
                <p className="text-indigo-400 text-2xl">
                  {(cardFormData.amount + cardFormData.bonus).toLocaleString()}P
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={cardFormData.isActive}
                  onChange={(e) =>
                    setCardFormData({
                      ...cardFormData,
                      isActive: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-gray-300">
                  활성 상태
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {editingCard ? "수정하기" : "추가하기"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCardModal}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl">
                {confirmAction.action === "approve" ? "승인 확인" : "거절 확인"}
              </h2>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                  setRejectReasonInput("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm mb-2">
                {confirmAction.type === "deposit" ? "입금 신청" : "출금 신청"}
                을(를) {confirmAction.action === "approve" ? "승인" : "거절"}
                하시겠습니까?
              </p>

              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">처리 건수</p>
                <p className="text-white text-2xl">
                  {confirmAction.ids.length}건
                </p>
              </div>

              {confirmAction.action === "reject" && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    거절 사유
                  </label>
                  <textarea
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    rows={4}
                    placeholder="거절 사유를 입력하세요"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {confirmAction.action === "approve" ? "승인" : "거절"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setRejectReasonInput("");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteCardConfirm}
        title="충전권 삭제"
        message={deleteCardConfirm?.message || ""}
        onConfirm={() => {
          const payload = deleteCardConfirm;
          setDeleteCardConfirm(null);
          if (!payload) return;
          void payload.onConfirm();
        }}
        onCancel={() => setDeleteCardConfirm(null)}
      />
    </AdminLayout>
  );
}
