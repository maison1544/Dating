import { CreditCard, Download, Gift, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  useDepositRequests,
  useGiftTransactions,
  useWithdrawalRequests,
} from "../hooks/useSupabase";
import { formatKST } from "../../lib/dateUtils";

export function PaymentHistoryPage() {
  const navigate = useNavigate();
  const { user, profile, adminAccount, isLoading: authLoading } = useAuth();
  const { requests: depositRequests, isLoading: depositsLoading } =
    useDepositRequests(profile?.id);
  const { requests: withdrawalRequests, isLoading: withdrawalsLoading } =
    useWithdrawalRequests(profile?.id);
  const { giftTransactions, isLoading: giftsLoading } = useGiftTransactions(
    profile?.id
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }
  }, [authLoading, user, navigate]);

  const [activeTab, setActiveTab] = useState<"charge" | "withdraw" | "gift">(
    "charge"
  );

  const chargeHistory = depositRequests;
  const withdrawHistory = withdrawalRequests;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return formatKST(dateString, "datetime") || "-";
  };

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

  const [partyNameMap, setPartyNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPartyNames = async () => {
      if (!profile?.id || giftTransactions.length === 0) {
        setPartyNameMap({});
        return;
      }

      const userId = profile.id;
      const profileIds = new Set<string>();
      const userIds = new Set<string>();

      for (const tx of giftTransactions as any[]) {
        const txType = tx.transaction_type as string | null;
        if (txType === "buy" || txType === "sell") {
          continue;
        }

        const isSender = tx.sender_type === "user" && tx.sender_id === userId;
        const isReceiver =
          tx.receiver_type === "user" && tx.receiver_id === userId;

        if (isSender) {
          if (tx.receiver_type === "profile") profileIds.add(tx.receiver_id);
          if (tx.receiver_type === "user") userIds.add(tx.receiver_id);
        } else if (isReceiver) {
          if (tx.sender_type === "profile") profileIds.add(tx.sender_id);
          if (tx.sender_type === "user") userIds.add(tx.sender_id);
        }
      }

      if (profileIds.size === 0 && userIds.size === 0) {
        setPartyNameMap({});
        return;
      }

      const nextMap: Record<string, string> = {};

      if (profileIds.size > 0) {
        const { data, error } = await supabase
          .from("chat_profiles")
          .select("id, name")
          .in("id", Array.from(profileIds));

        if (!error) {
          (data || []).forEach((row) => {
            nextMap[`profile:${row.id}`] = row.name || "프로필";
          });
        }
      }

      if (userIds.size > 0) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("id, name, nickname")
          .in("id", Array.from(userIds));

        if (!error) {
          (data || []).forEach((row) => {
            nextMap[`user:${row.id}`] = row.nickname || row.name || "회원";
          });
        }
      }

      setPartyNameMap(nextMap);
    };

    void loadPartyNames();
  }, [profile?.id, giftTransactions]);

  const giftHistory = useMemo(() => {
    if (!profile?.id) return [];

    const userId = profile.id;

    return (giftTransactions as any[]).map((tx) => {
      const txType = (tx.transaction_type || "") as string;
      const pointsAmount = Number(tx.points_amount || 0);
      const giftName = tx.gifts?.name || "기프트";

      if (txType === "buy") {
        return {
          id: tx.id,
          created_at: tx.created_at,
          type: "구매",
          target: "기프트샵",
          item: giftName,
          amount: -pointsAmount,
        };
      }

      if (txType === "sell") {
        return {
          id: tx.id,
          created_at: tx.created_at,
          type: "판매",
          target: "기프트샵",
          item: giftName,
          amount: pointsAmount,
        };
      }

      const isSender = tx.sender_type === "user" && tx.sender_id === userId;
      const isReceiver =
        tx.receiver_type === "user" && tx.receiver_id === userId;

      const otherType = isSender ? tx.receiver_type : tx.sender_type;
      const otherId = isSender ? tx.receiver_id : tx.sender_id;
      const otherKey = `${otherType}:${otherId}`;

      return {
        id: tx.id,
        created_at: tx.created_at,
        type: "선물",
        target: partyNameMap[otherKey] || "상대방",
        item: giftName,
        amount: isReceiver ? pointsAmount : -pointsAmount,
      };
    });
  }, [giftTransactions, partyNameMap, profile?.id]);

  const isLoading = depositsLoading || withdrawalsLoading || giftsLoading;

  if (authLoading || isLoading || (user && !adminAccount && !profile)) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user || adminAccount || !profile) {
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl text-white mb-2">충전/출금 내역</h1>
          <p className="text-gray-400">모든 포인트 거래 내역을 확인하세요</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("charge")}
            className={`px-6 py-3 flex items-center gap-2 transition-colors ${
              activeTab === "charge"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CreditCard size={20} />
            <span>충전 내역</span>
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`px-6 py-3 flex items-center gap-2 transition-colors ${
              activeTab === "withdraw"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Download size={20} />
            <span>출금 내역</span>
          </button>
          <button
            onClick={() => setActiveTab("gift")}
            className={`px-6 py-3 flex items-center gap-2 transition-colors ${
              activeTab === "gift"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Gift size={20} />
            <span>기프트 내역</span>
          </button>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          {activeTab === "charge" ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {chargeHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  충전 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">
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
                      {chargeHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs text-gray-400">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-3 py-2 text-sm text-green-500 text-right">
                            +{item.amount.toLocaleString()}원
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
              )}
            </div>
          ) : activeTab === "withdraw" ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {withdrawHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  출금 내역이 없습니다.
                </div>
              ) : (
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
                      {withdrawHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs text-gray-400">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-3 py-2 text-sm text-red-500 text-right">
                            -{item.amount.toLocaleString()}원
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
              )}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {giftHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  기프트 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">
                          날짜
                        </th>
                        <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">
                          유형
                        </th>
                        <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">
                          대상
                        </th>
                        <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">
                          선물
                        </th>
                        <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase w-24">
                          포인트
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {giftHistory.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs text-gray-400">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                item.type === "선물"
                                  ? "bg-pink-500/20 text-pink-500"
                                  : item.type === "구매"
                                  ? "bg-blue-500/20 text-blue-500"
                                  : "bg-green-500/20 text-green-500"
                              }`}
                            >
                              {item.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-300">
                            {item.target}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-300">
                            {item.item}
                          </td>
                          <td className="px-3 py-2 text-sm text-right">
                            <span
                              className={
                                item.amount > 0
                                  ? "text-green-500"
                                  : item.amount < 0
                                  ? "text-red-500"
                                  : "text-gray-400"
                              }
                            >
                              {item.amount > 0 ? "+" : ""}
                              {item.amount.toLocaleString()} P
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
