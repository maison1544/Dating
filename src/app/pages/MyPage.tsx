import {
  User,
  CreditCard,
  LogOut,
  Gift,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { QuantityModal } from "../components/QuantityModal";

export function MyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "menu" | "inventory"
  >("menu");
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
    maxQuantity?: number;
    onConfirm: (quantity: number) => void;
  }>({
    isOpen: false,
    title: "",
    itemName: "",
    itemEmoji: "",
    price: 0,
    maxQuantity: 99,
    onConfirm: () => {},
  });

  const giftInventory = [
    {
      id: 1,
      name: "장미",
      quantity: 3,
      sellPrice: 80,
      emoji: "🌹",
    },
    {
      id: 2,
      name: "초콜릿",
      quantity: 5,
      sellPrice: 240,
      emoji: "🍫",
    },
    {
      id: 3,
      name: "샴페인",
      quantity: 2,
      sellPrice: 400,
      emoji: "🍾",
    },
    {
      id: 4,
      name: "하트 풍선",
      quantity: 1,
      sellPrice: 160,
      emoji: "💝",
    },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Section */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8 text-center">
          <div className="w-24 h-24 rounded-full bg-pink-500/20 mx-auto mb-4 flex items-center justify-center">
            <User className="text-pink-500" size={40} />
          </div>
          <h2 className="text-white text-2xl mb-2">회원님</h2>
          <p className="text-gray-400 mb-4">
            example@email.com
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">
                보유 포인트
              </p>
              <p className="text-white">0 P</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">
                보유 선물
              </p>
              <p className="text-white">0개</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("menu")}
            className={`px-6 py-3 transition-colors ${
              activeTab === "menu"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            메뉴
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 transition-colors flex items-center gap-2 ${
              activeTab === "inventory"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Gift size={20} />
            <span>선물 인벤토리</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "menu" ? (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <button
              onClick={() => navigate("/profile-edit")}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <User className="text-gray-400" size={20} />
                <span className="text-white">프로필 수정</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              onClick={() => navigate("/payment-history")}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <CreditCard
                  className="text-gray-400"
                  size={20}
                />
                <span className="text-white">
                  충전/출금 내역
                </span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <LogOut className="text-gray-400" size={20} />
                <span className="text-white">로그아웃</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        ) : (
          <div>
            {giftInventory.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {giftInventory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-pink-500 transition-all text-center group"
                    >
                      <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
                        {item.emoji}
                      </div>
                      <h3 className="text-white mb-2 text-sm">
                        {item.name}
                      </h3>
                      <div className="mb-3 space-y-1">
                        <p className="text-gray-400 text-xs">
                          보유: {item.quantity}개
                        </p>
                        <p className="text-green-500 text-xs">
                          판매가: {item.sellPrice} P
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Value */}
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      총 보유 가치
                    </span>
                    <span className="text-pink-500 text-xl">
                      {giftInventory
                        .reduce(
                          (total, item) =>
                            total +
                            item.sellPrice * item.quantity,
                          0,
                        )
                        .toLocaleString()}{" "}
                      P
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Gift
                  className="text-gray-600 mx-auto mb-4"
                  size={48}
                />
                <p className="text-gray-400">
                  보유한 선물이 없습니다
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  포인트 페이지에서 선물을 구매해보세요
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal({ ...confirmModal, isOpen: false })
        }
      />

      {/* Quantity Modal */}
      <QuantityModal
        isOpen={quantityModal.isOpen}
        title={quantityModal.title}
        itemName={quantityModal.itemName}
        itemEmoji={quantityModal.itemEmoji}
        price={quantityModal.price}
        maxQuantity={quantityModal.maxQuantity}
        onConfirm={quantityModal.onConfirm}
        onCancel={() =>
          setQuantityModal({ ...quantityModal, isOpen: false })
        }
      />
    </div>
  );
}