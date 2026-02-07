import {
  Coins,
  CreditCard,
  Gift,
  TrendingUp,
  Download,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ConfirmModal } from "../components/ConfirmModal";
import { QuantityModal } from "../components/QuantityModal";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import {
  usePointPackages,
  useGiftItems,
  useUserGifts,
  useDepositRequests,
  useWithdrawalRequests,
  usePointTransactions,
} from "../hooks/useSupabase";
import { formatDatetime } from "../../lib/dateUtils";

export function PointPage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const {
    user,
    profile,
    adminAccount,
    isLoading: authLoading,
    refreshProfile,
  } = useAuth();
  const { packages, isLoading: packagesLoading } = usePointPackages();
  const {
    requests: depositRequests,
    isLoading: depositsLoading,
    createRequest: createDepositRequest,
  } = useDepositRequests(profile?.id);
  const {
    requests: withdrawalRequests,
    isLoading: withdrawalsLoading,
    createRequest: createWithdrawalRequest,
  } = useWithdrawalRequests(profile?.id);
  const { gifts: giftItems, isLoading: giftsLoading } = useGiftItems();
  const {
    userGifts,
    isLoading: userGiftsLoading,
    refetch: refetchUserGifts,
  } = useUserGifts(profile?.id);
  const { transactions: pointTransactions, isLoading: pointTxLoading } =
    usePointTransactions(profile?.id);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }
  }, [authLoading, user, navigate]);

  const [activeTab, setActiveTab] = useState<"charge" | "withdraw" | "gift">(
    "charge",
  );

  const currentPoints = profile?.points || 0;

  // 은행 목록 (메모이제이션)
  const banks = useMemo(
    () => [
      "KB국민은행",
      "신한은행",
      "하나은행",
      "우리은행",
      "NH농협은행",
      "한국산업은행",
      "IBK기업은행",
      "카카오뱅크",
      "케이뱅크",
      "토스뱅크",
      "부산은행",
      "경남은행",
      "대구은행",
      "광주은행",
      "전북은행",
      "제주은행",
    ],
    [],
  );

  // 기프트 데이터 메모이제이션
  const myGifts = useMemo(
    () =>
      userGifts
        .map((ug: any) => {
          const gift = ug.gifts;
          return {
            id: ug.id,
            gift_id: ug.gift_id,
            name: gift?.name,
            quantity: ug.quantity || 0,
            sellPrice: gift?.sell_price,
            emoji: gift?.emoji,
          };
        })
        .filter((g: any) => !!g.name),
    [userGifts],
  );

  const { totalChargedPoints, totalUsedPoints } = useMemo(() => {
    const txs = (pointTransactions || []) as any[];
    const charged = txs
      .filter((t) => t.type === "charge")
      .reduce((sum, t) => sum + Math.max(0, Number(t.amount || 0)), 0);
    const used = txs
      .filter((t) => t.type === "bet" || t.type === "gift_buy")
      .reduce((sum, t) => sum + Math.max(0, -Number(t.amount || 0)), 0);
    return { totalChargedPoints: charged, totalUsedPoints: used };
  }, [pointTransactions]);

  const formatDate = formatDatetime;

  const getDepositStatusText = (status: string | null | undefined) => {
    switch (status) {
      case "approved":
        return "완료";
      case "pending":
        return "처리중";
      case "rejected":
        return "실패";
      default:
        return status || "-";
    }
  };

  const getWithdrawalStatusText = (status: string | null | undefined) => {
    switch (status) {
      case "approved":
        return "완료";
      case "pending":
        return "처리중";
      case "rejected":
        return "거부";
      default:
        return status || "-";
    }
  };

  const isLoading =
    authLoading ||
    packagesLoading ||
    depositsLoading ||
    withdrawalsLoading ||
    giftsLoading ||
    userGiftsLoading ||
    pointTxLoading;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [quantityModal, setQuantityModal] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    itemEmoji: string;
    price: number;
    maxQuantity: number;
    currentPoints?: number;
    isBuying?: boolean;
    isSelling?: boolean;
    onConfirm: (quantity: number) => void;
  }>({
    isOpen: false,
    title: "",
    itemName: "",
    itemEmoji: "",
    price: 0,
    maxQuantity: 0,
    onConfirm: (quantity: number) => {
      void quantity;
    },
  });

  const [isGiftProcessing, setIsGiftProcessing] = useState(false);
  const [isChargeProcessing, setIsChargeProcessing] = useState(false);
  const [isWithdrawalProcessing, setIsWithdrawalProcessing] = useState(false);
  const [withdrawAmountText, setWithdrawAmountText] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  const handleWithdrawAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    const numeric = cleaned ? Number(cleaned) : 0;
    setWithdrawAmount(numeric);
    setWithdrawAmountText(numeric ? `${numeric.toLocaleString()} P` : "");
  };

  const handleCreateDeposit = async (
    pkg: (typeof packages)[number],
  ): Promise<void> => {
    if (isChargeProcessing) return;
    if (!profile?.id) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      return;
    }

    setIsChargeProcessing(true);

    try {
      const { error } = await createDepositRequest({
        user_id: profile.id,
        amount: pkg.points,
        bonus_amount: pkg.bonus_points || 0,
        depositor_name: profile.name || profile.nickname || null,
        status: "pending",
      });

      if (error) {
        throw error;
      }

      showAlert({
        title: "신청 완료",
        message:
          "충전 신청이 완료되었습니다. 관리자 승인 후 포인트가 지급됩니다.",
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "충전 신청에 실패했습니다.";
      showAlert({ title: "오류", message, type: "error" });
    } finally {
      setIsChargeProcessing(false);
    }
  };

  const handleCreateWithdrawal = async (): Promise<void> => {
    if (isWithdrawalProcessing) return;
    if (!profile?.id) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      return;
    }

    if (withdrawAmount < 10000) {
      showAlert({
        title: "입력 오류",
        message: "출금은 최소 10,000P부터 가능합니다.",
        type: "warning",
      });
      return;
    }

    if (withdrawAmount > currentPoints) {
      showAlert({
        title: "잔액 부족",
        message: "보유 포인트가 부족합니다.",
        type: "warning",
      });
      return;
    }

    if (!profile.bank || !profile.account_number || !profile.account_holder) {
      showAlert({
        title: "계좌 정보 필요",
        message:
          "출금 계좌 정보가 없습니다. 프로필에서 계좌 정보를 등록해주세요.",
        type: "warning",
      });
      return;
    }

    setIsWithdrawalProcessing(true);

    try {
      const { error } = await createWithdrawalRequest({
        user_id: profile.id,
        amount: withdrawAmount,
        bank: profile.bank,
        account_number: profile.account_number,
        account_holder: profile.account_holder,
        status: "pending",
      });

      if (error) {
        throw error;
      }

      setWithdrawAmount(0);
      setWithdrawAmountText("");
      showAlert({
        title: "신청 완료",
        message: "출금 신청이 완료되었습니다. 관리자 승인 후 처리됩니다.",
        type: "success",
      });
      // 프로필 새로고침은 백그라운드에서 실행 (팝업 표시 지연 방지)
      refreshProfile();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "출금 신청에 실패했습니다.";
      showAlert({ title: "오류", message, type: "error" });
    } finally {
      setIsWithdrawalProcessing(false);
    }
  };

  const handleBuyGift = async (
    giftId: string,
    giftName: string,
    unitPrice: number,
    quantity: number,
  ) => {
    if (isGiftProcessing) return;
    if (!profile?.id) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      return;
    }

    if (quantity <= 0) {
      showAlert({
        title: "입력 오류",
        message: "수량을 확인해주세요.",
        type: "warning",
      });
      return;
    }

    const totalCost = unitPrice * quantity;
    if (totalCost > currentPoints) {
      showAlert({
        title: "포인트 부족",
        message: "포인트가 부족합니다.",
        type: "warning",
      });
      return;
    }

    setIsGiftProcessing(true);

    try {
      const { error: rpcError } = await supabase.rpc("gift_buy", {
        p_gift_id: giftId,
        p_quantity: quantity,
      });

      if (rpcError) throw rpcError;

      await Promise.all([refreshProfile(), refetchUserGifts()]);
      showAlert({
        title: "구매 완료",
        message: `${giftName} ${quantity}개를 구매했습니다!`,
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "구매에 실패했습니다.";
      showAlert({ title: "오류", message, type: "error" });
      await Promise.all([refreshProfile(), refetchUserGifts()]);
    } finally {
      setIsGiftProcessing(false);
    }
  };

  const handleSellGift = async (
    giftId: string,
    giftName: string,
    unitPrice: number,
    quantity: number,
  ) => {
    if (isGiftProcessing) return;
    if (!profile?.id) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      return;
    }

    if (quantity <= 0) {
      showAlert({
        title: "입력 오류",
        message: "수량을 확인해주세요.",
        type: "warning",
      });
      return;
    }

    void unitPrice;

    setIsGiftProcessing(true);

    try {
      const { error: rpcError } = await supabase.rpc("gift_sell", {
        p_gift_id: giftId,
        p_quantity: quantity,
      });

      if (rpcError) throw rpcError;

      await Promise.all([refreshProfile(), refetchUserGifts()]);
      showAlert({
        title: "판매 완료",
        message: `${giftName} ${quantity}개를 판매했습니다!`,
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "판매에 실패했습니다.";
      showAlert({ title: "오류", message, type: "error" });
      await Promise.all([refreshProfile(), refetchUserGifts()]);
    } finally {
      setIsGiftProcessing(false);
    }
  };

  if (isLoading || (user && !adminAccount && !profile)) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!user || adminAccount || !profile) {
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-4">
            💎 포인트 시스템
          </div>
          <h1 className="text-4xl md:text-5xl mb-4">
            <span className="text-pink-500">포인트</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            포인트를 충전하고 다양한 프리미엄 서비스를 이용하세요
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500 rounded-lg p-8 mb-12 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Coins className="text-pink-500" size={40} />
              <div>
                <p className="text-gray-400 text-sm">보유 포인트</p>
                <p className="text-white text-3xl">
                  {currentPoints.toLocaleString()} P
                </p>
              </div>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">충전한 포인트</p>
              <p className="text-white">
                {totalChargedPoints.toLocaleString()} P
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">사용한 포인트</p>
              <p className="text-white">{totalUsedPoints.toLocaleString()} P</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 border-b border-gray-800 max-w-2xl mx-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("charge")}
            className={`px-4 sm:px-6 py-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "charge"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CreditCard size={20} />
            <span>충전</span>
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`px-4 sm:px-6 py-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "withdraw"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Download size={20} />
            <span>출금</span>
          </button>
          <button
            onClick={() => setActiveTab("gift")}
            className={`px-4 sm:px-6 py-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === "gift"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShoppingBag size={20} />
            <span>기프트</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "charge" && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl text-white mb-6 text-center">
              포인트 충전
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-gray-900 rounded-lg p-4 sm:p-6 border ${
                    (pkg.bonus_points || 0) > 0
                      ? "border-pink-500"
                      : "border-gray-800"
                  } hover:border-pink-500 transition-all relative`}
                >
                  {(pkg.bonus_points || 0) > 0 && (
                    <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs px-2 sm:px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      +{pkg.bonus_points}P 보너스
                    </div>
                  )}
                  <div className="text-center">
                    <Gift
                      className="text-pink-500 mx-auto mb-3 sm:mb-4"
                      size={32}
                    />
                    <p className="text-2xl sm:text-3xl text-white mb-2">
                      {pkg.points.toLocaleString()} P
                    </p>
                    {(pkg.bonus_points || 0) > 0 && (
                      <p className="text-green-500 text-xs sm:text-sm mb-2">
                        +{pkg.bonus_points.toLocaleString()} P 보너스
                      </p>
                    )}
                    <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">
                      {pkg.price.toLocaleString()}원
                    </p>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: "포인트 충전",
                          message: `${pkg.points.toLocaleString()} P를 ${pkg.price.toLocaleString()}원에 충전하시겠습니까?${
                            (pkg.bonus_points || 0) > 0
                              ? ` (+${pkg.bonus_points.toLocaleString()}P 보너스)`
                              : ""
                          }`,
                          onConfirm: () => {
                            setConfirmModal({
                              ...confirmModal,
                              isOpen: false,
                            });
                            void handleCreateDeposit(pkg);
                          },
                        });
                      }}
                      className="w-full bg-pink-500 text-white py-2 rounded hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <CreditCard size={14} className="sm:w-4 sm:h-4" />
                      <span>충전하기</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Charge History */}
            <h3 className="text-xl text-white mb-4">충전 내역</h3>
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs text-gray-400 uppercase">
                        날짜
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">
                        충전액
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-400 uppercase w-20">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {depositRequests.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-3 py-2 text-sm text-green-500 text-right">
                          +{item.amount.toLocaleString()}P
                        </td>
                        <td className="px-3 py-2 text-sm text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              (item as any).status === "approved"
                                ? "bg-green-500/20 text-green-500"
                                : (item as any).status === "rejected"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {getDepositStatusText((item as any).status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "withdraw" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl text-white mb-6 text-center">
              포인트 출금
            </h2>

            {/* Withdraw Form */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    출금 포인트
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="출금할 포인트를 입력하세요 (최소 10,000P)"
                      value={withdrawAmountText}
                      onChange={(e) =>
                        handleWithdrawAmountChange(e.target.value)
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    은행
                  </label>
                  <select
                    value={profile?.bank || ""}
                    disabled
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="" className="bg-gray-800 text-white">
                      은행 정보 없음
                    </option>
                    {banks.map((bank) => (
                      <option
                        key={bank}
                        value={bank}
                        className="bg-gray-800 text-white"
                      >
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={profile?.account_number || ""}
                    disabled
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500"
                  />
                  <p className="text-gray-500 text-xs mt-2">
                    * 회원가입 시 등록한 계좌로 출금됩니다
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    예금주
                  </label>
                  <input
                    type="text"
                    value={profile?.account_holder || ""}
                    disabled
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "포인트 출금",
                      message:
                        "출금 신청하시겠습니까? 등록된 계좌로 입금됩니다.",
                      onConfirm: () => {
                        setConfirmModal({
                          ...confirmModal,
                          isOpen: false,
                        });
                        void handleCreateWithdrawal();
                      },
                    });
                  }}
                  disabled={
                    isWithdrawalProcessing ||
                    withdrawAmount < 10000 ||
                    withdrawAmount > currentPoints ||
                    !profile?.bank ||
                    !profile?.account_number ||
                    !profile?.account_holder
                  }
                  className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  출금 신청
                </button>
              </div>
            </div>

            {/* Withdraw History */}
            <h3 className="text-xl text-white mb-4">출금 내역</h3>
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">
                        날짜
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">
                        금액
                      </th>
                      <th className="px-3 py-2 text-center text-xs text-gray-400 uppercase w-20">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {withdrawalRequests.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-3 py-2 text-sm text-red-500 text-right">
                          -{item.amount.toLocaleString()}P
                        </td>
                        <td className="px-3 py-2 text-sm text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              (item as any).status === "approved"
                                ? "bg-green-500/20 text-green-500"
                                : (item as any).status === "rejected"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {getWithdrawalStatusText((item as any).status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gift" && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl text-white mb-6 text-center">
              기프트 상점
            </h2>

            <p className="text-gray-400 text-center mb-8">
              선물을 구매하거나 보유한 선물을 판매하세요 💝
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {giftItems.map((item) => {
                // 내가 보유한 해당 선물 찾기
                const myGift = myGifts.find((g: any) => g.gift_id === item.id);
                const ownedQuantity = myGift ? myGift.quantity : 0;

                return (
                  <div
                    key={item.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-pink-500 transition-all text-center group"
                  >
                    <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
                      {item.emoji || ""}
                    </div>
                    <h3 className="text-white mb-2 text-sm">{item.name}</h3>
                    <div className="mb-3 space-y-1">
                      <p className="text-pink-500 text-xs">
                        구매: {item.buy_price.toLocaleString()} P
                      </p>
                      <p className="text-green-500 text-xs">
                        판매: {item.sell_price.toLocaleString()} P
                      </p>
                      <p className="text-gray-400 text-xs">
                        보유: {ownedQuantity}개
                      </p>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setQuantityModal({
                            isOpen: true,
                            title: "기프트 구매",
                            itemName: item.name,
                            itemEmoji: item.emoji ?? "",
                            price: item.buy_price,
                            maxQuantity: 99,
                            currentPoints: currentPoints,
                            isBuying: true,
                            onConfirm: (quantity) => {
                              setQuantityModal((prev) => ({
                                ...prev,
                                isOpen: false,
                              }));
                              void handleBuyGift(
                                item.id,
                                item.name,
                                item.buy_price,
                                quantity,
                              );
                            },
                          });
                        }}
                        className="w-full bg-pink-500 text-white py-2 rounded hover:bg-pink-600 transition-colors text-xs"
                      >
                        구매하기
                      </button>
                      <button
                        onClick={() => {
                          if (ownedQuantity === 0) {
                            showAlert({
                              title: "안내",
                              message: "보유한 선물이 없습니다.",
                              type: "info",
                            });
                            return;
                          }
                          setQuantityModal({
                            isOpen: true,
                            title: "기프트 판매",
                            itemName: item.name,
                            itemEmoji: item.emoji ?? "",
                            price: item.sell_price,
                            maxQuantity: ownedQuantity,
                            currentPoints: currentPoints,
                            isSelling: true,
                            onConfirm: (quantity) => {
                              setQuantityModal((prev) => ({
                                ...prev,
                                isOpen: false,
                              }));
                              void handleSellGift(
                                item.id,
                                item.name,
                                item.sell_price,
                                quantity,
                              );
                            },
                          });
                        }}
                        className={`w-full py-2 rounded transition-colors text-xs ${
                          ownedQuantity > 0
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={ownedQuantity === 0}
                      >
                        판매하기
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Value */}
            {myGifts.length > 0 && (
              <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">전체 보유 선물 가치</span>
                  <span className="text-green-500 text-xl">
                    {myGifts
                      .reduce(
                        (total: number, item: any) =>
                          total + (item.sellPrice || 0) * (item.quantity || 0),
                        0,
                      )
                      .toLocaleString()}{" "}
                    P
                  </span>
                </div>
              </div>
            )}

            {/* Gift Notice */}
            <div className="mt-8 bg-pink-500/10 border border-pink-500/20 rounded-lg p-6">
              <h3 className="text-white mb-3">기프트 안내</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• 기프트를 구매하면 선물 인벤토리에 저장됩니다</li>
                <li>• 마이페이지에서 보유한 선물을 확인할 수 있습니다</li>
                <li>• 판매 시 구매가의 80%로 판매됩니다</li>
                <li>• 구매한 선물은 채팅 중인 상대방에게 선물할 수 있습니다</li>
                <li>• 보유한 선물이 있는 경우 판매하기 버튼이 활성화됩니다</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Quantity Modal */}
      <QuantityModal
        isOpen={quantityModal.isOpen}
        title={quantityModal.title}
        itemName={quantityModal.itemName}
        itemEmoji={quantityModal.itemEmoji}
        price={quantityModal.price}
        maxQuantity={quantityModal.maxQuantity}
        currentPoints={quantityModal.currentPoints}
        isBuying={quantityModal.isBuying}
        isSelling={quantityModal.isSelling}
        onConfirm={quantityModal.onConfirm}
        onCancel={() => setQuantityModal({ ...quantityModal, isOpen: false })}
      />
    </div>
  );
}
