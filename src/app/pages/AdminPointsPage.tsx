import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
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

interface WithdrawalRequest {
  id: number;
  user: string;
  nickname: string;
  email: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  requestDate: string;
  status: "대기" | "승인" | "거절";
}

interface DepositRequest {
  id: number;
  user: string;
  nickname: string;
  email: string;
  amount: number;
  depositName: string;
  requestDate: string;
  status: "대기" | "승인" | "거절";
}

interface ChargeCard {
  id: number;
  amount: number;
  bonus: number;
  totalAmount: number;
  isActive: boolean;
  salesCount: number;
}

export function AdminPointsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "deposit" | "withdrawal"
  >("all");
  const [activeTab, setActiveTab] = useState<
    "requests" | "cards"
  >("requests");
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] =
    useState<ChargeCard | null>(null);
  const [cardFormData, setCardFormData] = useState({
    amount: 10000,
    bonus: 0,
    isActive: true,
  });
  
  // 승인/거절 확인 팝업 상태
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "deposit" | "withdrawal";
    action: "approve" | "reject";
    request: DepositRequest | WithdrawalRequest;
  } | null>(null);

  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([
    {
      id: 1,
      user: "이서연",
      nickname: "서연",
      email: "seoyeon@example.com",
      amount: 50000,
      bankName: "국민은행",
      accountNumber: "123-456-789012",
      accountHolder: "이서연",
      requestDate: "2025-12-15 11:15",
      status: "대기",
    },
    {
      id: 2,
      user: "정하늘",
      nickname: "하늘",
      email: "haneul@example.com",
      amount: 20000,
      bankName: "신한은행",
      accountNumber: "110-123-456789",
      accountHolder: "정하늘",
      requestDate: "2025-12-15 09:50",
      status: "대기",
    },
    {
      id: 3,
      user: "윤서현",
      nickname: "서현",
      email: "seohyun@example.com",
      amount: 30000,
      bankName: "우리은행",
      accountNumber: "1002-123-456789",
      accountHolder: "윤서현",
      requestDate: "2025-12-15 08:20",
      status: "대기",
    },
    {
      id: 4,
      user: "박지훈",
      nickname: "지훈",
      email: "jihun@example.com",
      amount: 100000,
      bankName: "카카오뱅크",
      accountNumber: "3333-01-1234567",
      accountHolder: "박지훈",
      requestDate: "2025-12-14 18:30",
      status: "대기",
    },
  ]);

  const [depositRequests, setDepositRequests] = useState<
    DepositRequest[]
  >([
    {
      id: 1,
      user: "김민수",
      nickname: "민수",
      email: "minsu@example.com",
      amount: 10000,
      depositName: "김민수",
      requestDate: "2025-12-15 14:20",
      status: "대기",
    },
    {
      id: 2,
      user: "최유진",
      nickname: "유진",
      email: "yujin@example.com",
      amount: 50000,
      depositName: "최유진",
      requestDate: "2025-12-15 13:45",
      status: "대기",
    },
    {
      id: 3,
      user: "강민지",
      nickname: "민지",
      email: "minji@example.com",
      amount: 30000,
      depositName: "강민지",
      requestDate: "2025-12-15 12:10",
      status: "대기",
    },
  ]);

  const [chargeCards, setChargeCards] = useState<ChargeCard[]>([
    {
      id: 5,
      amount: 5000,
      bonus: 0,
      totalAmount: 5000,
      isActive: true,
      salesCount: 178,
    },
    {
      id: 1,
      amount: 10000,
      bonus: 1000,
      totalAmount: 11000,
      isActive: true,
      salesCount: 234,
    },
    {
      id: 2,
      amount: 30000,
      bonus: 5000,
      totalAmount: 35000,
      isActive: true,
      salesCount: 156,
    },
    {
      id: 3,
      amount: 50000,
      bonus: 10000,
      totalAmount: 60000,
      isActive: true,
      salesCount: 89,
    },
    {
      id: 4,
      amount: 100000,
      bonus: 25000,
      totalAmount: 125000,
      isActive: true,
      salesCount: 45,
    },
  ]);

  // 필터링된 입출금 신청
  const filteredRequests = () => {
    const deposits = depositRequests.filter(
      (req) =>
        req.status === "대기" &&
        (req.user
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          req.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase())),
    );

    const withdrawals = withdrawalRequests.filter(
      (req) =>
        req.status === "대기" &&
        (req.user
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          req.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase())),
    );

    if (typeFilter === "deposit")
      return { deposits, withdrawals: [] };
    if (typeFilter === "withdrawal")
      return { deposits: [], withdrawals };
    return { deposits, withdrawals };
  };

  const handleApproveDeposit = (id: number) => {
    const request = depositRequests.find((r) => r.id === id);
    if (request) {
      setConfirmAction({ type: "deposit", action: "approve", request });
      setShowConfirmModal(true);
    }
  };

  const handleRejectDeposit = (id: number) => {
    const request = depositRequests.find((r) => r.id === id);
    if (request) {
      setConfirmAction({ type: "deposit", action: "reject", request });
      setShowConfirmModal(true);
    }
  };

  const handleApproveWithdrawal = (id: number) => {
    const request = withdrawalRequests.find((r) => r.id === id);
    if (request) {
      setConfirmAction({ type: "withdrawal", action: "approve", request });
      setShowConfirmModal(true);
    }
  };

  const handleRejectWithdrawal = (id: number) => {
    const request = withdrawalRequests.find((r) => r.id === id);
    if (request) {
      setConfirmAction({ type: "withdrawal", action: "reject", request });
      setShowConfirmModal(true);
    }
  };

  // 실제 승인/거절 처리
  const handleConfirm = () => {
    if (!confirmAction) return;

    const { type, action, request } = confirmAction;

    if (type === "deposit") {
      setDepositRequests(
        depositRequests.map((req) =>
          req.id === request.id
            ? { ...req, status: action === "approve" ? "승인" : "거절" }
            : req
        )
      );
      alert(`입금 신청이 ${action === "approve" ? "승인" : "거절"}되었습니다.`);
    } else {
      setWithdrawalRequests(
        withdrawalRequests.map((req) =>
          req.id === request.id
            ? { ...req, status: action === "approve" ? "승인" : "거절" }
            : req
        )
      );
      alert(`출금 신청이 ${action === "approve" ? "승인" : "거절"}되었습니다.`);
    }

    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // 엔터키로 승인/거절 확인
  useEffect(() => {
    if (!showConfirmModal || !confirmAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmModal, confirmAction]);

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

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCard) {
      setChargeCards(
        chargeCards.map((card) =>
          card.id === editingCard.id
            ? {
                ...card,
                amount: cardFormData.amount,
                bonus: cardFormData.bonus,
                totalAmount:
                  cardFormData.amount + cardFormData.bonus,
                isActive: cardFormData.isActive,
              }
            : card,
        ),
      );
    } else {
      const newCard: ChargeCard = {
        id: Math.max(...chargeCards.map((c) => c.id), 0) + 1,
        amount: cardFormData.amount,
        bonus: cardFormData.bonus,
        totalAmount: cardFormData.amount + cardFormData.bonus,
        isActive: cardFormData.isActive,
        salesCount: 0,
      };
      setChargeCards(
        [...chargeCards, newCard].sort(
          (a, b) => a.amount - b.amount,
        ),
      );
    }

    handleCloseCardModal();
  };

  const handleDeleteCard = (id: number) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setChargeCards(
        chargeCards.filter((card) => card.id !== id),
      );
    }
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
              <h1 className="text-white text-3xl">
                입출금 관리
              </h1>
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
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400" size={20} />
                  <select
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value as any)
                    }
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">전체</option>
                    <option value="deposit">입금 신청만</option>
                    <option value="withdrawal">
                      출금 신청만
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Deposit Requests */}
            {(typeFilter === "all" ||
              typeFilter === "deposit") &&
              deposits.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                    <h3 className="text-white flex items-center gap-2">
                      <TrendingUp
                        className="text-green-500"
                        size={20}
                      />
                      입금 신청 ({deposits.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-800">
                        <tr>
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
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {deposits.map((request) => (
                          <tr
                            key={request.id}
                            className="hover:bg-gray-800/50 transition-colors"
                          >
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
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    handleApproveDeposit(
                                      request.id,
                                    )
                                  }
                                  className="px-2 py-1 bg-green-600/80 hover:bg-green-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
                                >
                                  <CheckCircle size={12} />
                                  승인
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectDeposit(
                                      request.id,
                                    )
                                  }
                                  className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
                                >
                                  <XCircle size={12} />
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
              )}

            {/* Withdrawal Requests */}
            {(typeFilter === "all" ||
              typeFilter === "withdrawal") &&
              withdrawals.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
                    <h3 className="text-white flex items-center gap-2">
                      <TrendingDown
                        className="text-red-500"
                        size={20}
                      />
                      출금 신청 ({withdrawals.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-800">
                        <tr>
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
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {withdrawals.map((request) => (
                          <tr
                            key={request.id}
                            className="hover:bg-gray-800/50 transition-colors"
                          >
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
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    handleApproveWithdrawal(
                                      request.id,
                                    )
                                  }
                                  className="px-2 py-1 bg-green-600/80 hover:bg-green-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
                                >
                                  <CheckCircle size={12} />
                                  승인
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectWithdrawal(
                                      request.id,
                                    )
                                  }
                                  className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
                                >
                                  <XCircle size={12} />
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
              )}

            {/* Empty State */}
            {deposits.length === 0 &&
              withdrawals.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                  <AlertCircle
                    className="mx-auto text-gray-600 mb-4"
                    size={48}
                  />
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
                        onClick={() =>
                          handleOpenCardModal(card)
                        }
                        className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                        title="수정"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteCard(card.id)
                        }
                        className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-400 text-sm">
                        기본 금액
                      </p>
                      <p className="text-white text-2xl">
                        {card.amount.toLocaleString()}원
                      </p>
                    </div>
                    {card.bonus > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm">
                          보너스
                        </p>
                        <p className="text-green-500 text-xl">
                          +{card.bonus.toLocaleString()}원
                        </p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-800">
                      <p className="text-gray-400 text-sm">
                        총 지급 포인트
                      </p>
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
              <h3 className="text-white text-lg mb-3">
                💡 충전권 설정 가이드
              </h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>
                  • <strong>기본 금액</strong>: 사용자가 실제로
                  결제하는 금액
                </p>
                <p>
                  • <strong>보너스</strong>: 충전 시 추가로
                  지급되는 포인트
                </p>
                <p>
                  • <strong>총 지급 포인트</strong>: 기본 금액 +
                  보너스
                </p>
                <p>
                  • 비활성 상태의 충전권은 사용자에게 표시되지
                  않습니다
                </p>
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
            <form
              onSubmit={handleCardSubmit}
              className="p-6 space-y-4"
            >
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
                <p className="text-gray-400 text-sm mb-1">
                  총 지급 포인트
                </p>
                <p className="text-indigo-400 text-2xl">
                  {(
                    cardFormData.amount + cardFormData.bonus
                  ).toLocaleString()}
                  P
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
                <label
                  htmlFor="isActive"
                  className="text-gray-300"
                >
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
                {confirmAction.action === "approve"
                  ? "승인 확인"
                  : "거절 확인"}
              </h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm mb-2">
                {confirmAction.type === "deposit"
                  ? "입금 신청"
                  : "출금 신청"}
                을(를) {confirmAction.action === "approve" ? "승인" : "거절"}하시겠습니까?
              </p>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">
                  {confirmAction.type === "deposit"
                    ? "입금자명"
                    : "출금자명"}
                </p>
                <p className="text-white text-2xl">
                  {confirmAction.request.depositName ||
                    confirmAction.request.user}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">
                  {confirmAction.type === "deposit"
                    ? "입금 금액"
                    : "출금 금액"}
                </p>
                <p className="text-indigo-400 text-2xl">
                  {confirmAction.request.amount.toLocaleString()}
                  원
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {confirmAction.action === "approve"
                    ? "승인"
                    : "거절"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}