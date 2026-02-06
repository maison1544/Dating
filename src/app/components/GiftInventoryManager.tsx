import { useEffect, useMemo, useState, useCallback } from "react";
import { DollarSign, Info, X } from "lucide-react";
import { supabaseAdmin } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";

type GiftInventoryItem = {
  id: string;
  gift_id: string;
  quantity: number;
  gifts: {
    id: string;
    name: string;
    emoji: string | null;
    sell_price: number;
  } | null;
};

type GiftItem = {
  id: string;
  name: string;
  emoji: string | null;
  sell_price: number;
  buy_price: number;
};

interface GiftInventoryManagerProps {
  ownerId?: string;
  ownerType?: "user" | "agent";
  enabled?: boolean;
  isReadOnly?: boolean;
  title?: string;
}

export function GiftInventoryManager({
  ownerId,
  ownerType = "user",
  enabled = true,
  isReadOnly = false,
  title = "현재 인벤토리 (캘린더 필터 무관)",
}: GiftInventoryManagerProps) {
  const { adminAccount, isAdmin } = useAuth();
  const { showAlert } = useAlert();
  const [dbGiftInventory, setDbGiftInventory] = useState<GiftInventoryItem[]>(
    [],
  );
  const [isGiftInventoryLoading, setIsGiftInventoryLoading] = useState(false);
  const [dbAvailableGifts, setDbAvailableGifts] = useState<GiftItem[]>([]);
  const [isAvailableGiftsLoading, setIsAvailableGiftsLoading] = useState(false);
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [giftAction, setGiftAction] = useState<"add" | "remove">("add");
  const [newGiftQuantity, setNewGiftQuantity] = useState("");

  const fetchGiftInventory = useCallback(async () => {
    if (!enabled || !ownerId) return;
    setIsGiftInventoryLoading(true);
    const { data, error } = await supabaseAdmin
      .from("gift_inventory")
      .select("id, gift_id, quantity, gifts(id, name, emoji, sell_price)")
      .eq("owner_id", ownerId)
      .eq("owner_type", ownerType)
      .gt("quantity", 0);
    if (error) {
      showAlert({
        title: "오류",
        message: `선물 인벤토리를 불러오지 못했습니다: ${error.message}`,
        type: "error",
      });
    } else {
      setDbGiftInventory((data as any) || []);
    }
    setIsGiftInventoryLoading(false);
  }, [enabled, ownerId, ownerType, showAlert]);

  useEffect(() => {
    if (!enabled) return;
    if (!ownerId) {
      setDbGiftInventory([]);
      return;
    }

    void fetchGiftInventory();
  }, [enabled, ownerId, fetchGiftInventory]);

  useEffect(() => {
    const fetchAvailableGifts = async () => {
      if (!enabled) return;
      setIsAvailableGiftsLoading(true);
      const { data, error } = await supabaseAdmin
        .from("gifts")
        .select("id, name, emoji, sell_price, buy_price")
        .eq("is_active", true)
        .order("buy_price", { ascending: true });
      if (error) {
        showAlert({
          title: "오류",
          message: `기프트 목록을 불러오지 못했습니다: ${error.message}`,
          type: "error",
        });
      } else {
        setDbAvailableGifts((data as any) || []);
      }
      setIsAvailableGiftsLoading(false);
    };

    if (!enabled) return;
    void fetchAvailableGifts();
  }, [enabled, showAlert]);

  const totalValue = useMemo(() => {
    return dbGiftInventory.reduce(
      (sum, inv) => sum + (inv.gifts?.sell_price || 0) * inv.quantity,
      0,
    );
  }, [dbGiftInventory]);

  const selectedInventoryGift = useMemo(() => {
    return (
      dbGiftInventory.find((inv) => inv.gift_id === selectedGiftId) || null
    );
  }, [dbGiftInventory, selectedGiftId]);

  const selectedAvailableGift = useMemo(() => {
    return dbAvailableGifts.find((gift) => gift.id === selectedGiftId) || null;
  }, [dbAvailableGifts, selectedGiftId]);

  const selectedGiftName =
    selectedAvailableGift?.name || selectedInventoryGift?.gifts?.name || "선물";
  const selectedGiftEmoji =
    selectedAvailableGift?.emoji || selectedInventoryGift?.gifts?.emoji || "🎁";
  const selectedGiftPrice =
    selectedAvailableGift?.sell_price ||
    selectedInventoryGift?.gifts?.sell_price ||
    0;
  const selectedGiftQuantity = selectedInventoryGift?.quantity || 0;

  const resetGiftForm = () => {
    setIsAddingGift(false);
    setSelectedGiftId("");
    setGiftAction("add");
    setNewGiftQuantity("");
  };

  const handleSubmitGift = async () => {
    if (!selectedGiftId || !newGiftQuantity || !ownerId) return;
    if (isReadOnly) return;
    if (!isAdmin || !adminAccount?.id) {
      showAlert({
        title: "권한 오류",
        message: "관리자 권한이 필요합니다.",
        type: "warning",
      });
      return;
    }

    const quantity = parseInt(newGiftQuantity, 10);
    if (!Number.isFinite(quantity) || quantity < 1) return;

    if (!selectedGiftName) return;

    if (giftAction === "remove") {
      if (!selectedInventoryGift || selectedInventoryGift.quantity < quantity) {
        showAlert({
          title: "입력 오류",
          message: "보유 수량보다 많이 회수할 수 없습니다.",
          type: "warning",
        });
        return;
      }
    }

    try {
      if (giftAction === "add") {
        const { error } = await supabaseAdmin.rpc("admin_gift_grant", {
          p_owner_id: ownerId,
          p_gift_id: selectedGiftId,
          p_quantity: quantity,
          p_owner_type: ownerType,
          p_admin_id: adminAccount?.id || null,
        });
        if (error) throw error;

        showAlert({
          title: "처리 완료",
          message: `${selectedGiftName} ${quantity}개가 지급되었습니다.`,
          type: "success",
        });
      } else {
        const { error } = await supabaseAdmin.rpc("admin_gift_revoke", {
          p_owner_id: ownerId,
          p_gift_id: selectedGiftId,
          p_quantity: quantity,
          p_owner_type: ownerType,
          p_admin_id: adminAccount?.id || null,
        });
        if (error) throw error;

        showAlert({
          title: "처리 완료",
          message: `${selectedGiftName} ${quantity}개가 회수되었습니다.`,
          type: "success",
        });
      }

      await fetchGiftInventory();
      resetGiftForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "기프트 처리에 실패했습니다.";
      showAlert({
        title: "오류",
        message: msg,
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">{title}</h3>
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <button
              onClick={() => setIsAddingGift(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <DollarSign size={14} />
              기프트 관리
            </button>
          )}
          <div className="text-yellow-400 font-semibold text-sm">
            총 가치: {totalValue.toLocaleString()} P
          </div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-700">
            <th className="text-left py-2">선물명</th>
            <th className="text-center py-2">가치</th>
            <th className="text-center py-2">수량</th>
            <th className="text-right py-2">총 가치</th>
          </tr>
        </thead>
        <tbody>
          {isGiftInventoryLoading ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-400">
                인벤토리를 불러오는 중...
              </td>
            </tr>
          ) : !ownerId ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-400">
                {ownerType === "agent"
                  ? "에이전트를 선택해주세요."
                  : "회원을 선택해주세요."}
              </td>
            </tr>
          ) : dbGiftInventory.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-400">
                보유 중인 선물이 없습니다.
              </td>
            </tr>
          ) : (
            dbGiftInventory.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-700/50">
                <td className="py-2 text-white">
                  {inv.gifts?.emoji || "🎁"} {inv.gifts?.name || "선물"}
                </td>
                <td className="py-2 text-center text-gray-300">
                  {(inv.gifts?.sell_price || 0).toLocaleString()} P
                </td>
                <td className="py-2 text-center text-gray-300">
                  {inv.quantity}개
                </td>
                <td className="py-2 text-right text-yellow-400">
                  {(
                    (inv.gifts?.sell_price || 0) * inv.quantity
                  ).toLocaleString()}{" "}
                  P
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isAddingGift && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <Info className="text-indigo-400" size={18} />
                기프트 증감 관리
              </h3>
              <button
                onClick={resetGiftForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  작업 유형
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setGiftAction("add");
                      setSelectedGiftId("");
                      setNewGiftQuantity("");
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                      giftAction === "add"
                        ? "bg-green-500/80 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    지급 (+)
                  </button>
                  <button
                    onClick={() => {
                      setGiftAction("remove");
                      setSelectedGiftId("");
                      setNewGiftQuantity("");
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                      giftAction === "remove"
                        ? "bg-red-500/80 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    회수 (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  기프트 선택
                  {giftAction === "remove" && (
                    <span className="text-red-400 ml-2 text-xs">
                      (인벤토리에 있는 아이템만 표시)
                    </span>
                  )}
                </label>
                <select
                  value={selectedGiftId}
                  onChange={(e) => {
                    setSelectedGiftId(e.target.value);
                    setNewGiftQuantity("");
                  }}
                  disabled={isAvailableGiftsLoading || isGiftInventoryLoading}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">기프트를 선택하세요</option>
                  {(isAvailableGiftsLoading || isGiftInventoryLoading) && (
                    <option value="" disabled>
                      불러오는 중...
                    </option>
                  )}
                  {giftAction === "add"
                    ? dbAvailableGifts.map((gift) => (
                        <option key={gift.id} value={gift.id}>
                          {gift.emoji || "🎁"} {gift.name} (가치:{" "}
                          {gift.sell_price}
                          P)
                        </option>
                      ))
                    : dbGiftInventory
                        .filter((inv) => inv.quantity > 0)
                        .map((inv) => (
                          <option key={inv.gift_id} value={inv.gift_id}>
                            {inv.gifts?.emoji || "🎁"}{" "}
                            {inv.gifts?.name || "선물"}
                            (보유: {inv.quantity}개, 가치:{" "}
                            {inv.gifts?.sell_price || 0}P)
                          </option>
                        ))}
                </select>
              </div>

              {selectedGiftId && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-1">
                  <p className="text-gray-400 text-sm">
                    선택한 기프트:{" "}
                    <span className="text-white">
                      {selectedGiftEmoji} {selectedGiftName}
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    포인트 가치:{" "}
                    <span className="text-indigo-400">
                      {selectedGiftPrice}P
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    현재 보유 수량:{" "}
                    <span className="text-yellow-400">
                      {selectedGiftQuantity}개
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  수량
                  {giftAction === "remove" && selectedGiftId && (
                    <span className="text-yellow-400 ml-2 text-xs">
                      (최대: {selectedGiftQuantity}개)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={newGiftQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (giftAction === "remove" && selectedGiftId) {
                      const maxQty = selectedGiftQuantity || 0;
                      const numVal = parseInt(val, 10);
                      if (numVal > maxQty) {
                        setNewGiftQuantity(String(maxQty));
                        return;
                      }
                    }
                    setNewGiftQuantity(val);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="수량을 입력하세요"
                  min="1"
                  max={
                    giftAction === "remove" && selectedGiftId
                      ? selectedGiftQuantity || 1
                      : undefined
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetGiftForm}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitGift}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    giftAction === "add"
                      ? "bg-green-500/80 hover:bg-green-500 text-white"
                      : "bg-red-500/80 hover:bg-red-500 text-white"
                  }`}
                  disabled={
                    !selectedGiftId ||
                    !newGiftQuantity ||
                    parseInt(newGiftQuantity) < 1 ||
                    (giftAction === "remove" &&
                      (!selectedInventoryGift ||
                        selectedGiftQuantity <
                          parseInt(newGiftQuantity || "0")))
                  }
                >
                  {giftAction === "add" ? "지급" : "회수"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
