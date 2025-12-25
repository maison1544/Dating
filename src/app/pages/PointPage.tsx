import {
  Coins,
  CreditCard,
  Gift,
  TrendingUp,
  Download,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { QuantityModal } from "../components/QuantityModal";

export function PointPage() {
  const [activeTab, setActiveTab] = useState<
    "charge" | "withdraw" | "gift"
  >("charge");
  const [sellTab, setSellTab] = useState<"buy" | "sell">("buy");
  const [currentPoints, setCurrentPoints] = useState(5000); // 현재 보유 포인트 (예시)
  const [selectedBank, setSelectedBank] =
    useState("KB국민은행");

  // 은행 목록
  const banks = [
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
  ];

  // 판매할 내 선물 목록
  const myGifts = [
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

  const packages = [
    { id: 1, points: 1000, price: 10000, bonus: 0 },
    { id: 2, points: 5000, price: 45000, bonus: 10 },
    { id: 3, points: 10000, price: 85000, bonus: 15 },
    { id: 4, points: 30000, price: 240000, bonus: 20 },
  ];

  const chargeHistory = [
    {
      id: 1,
      date: "2025-12-14 14:32:15",
      amount: 5000,
      status: "완료",
    },
    {
      id: 2,
      date: "2025-12-13 09:21:43",
      amount: 10000,
      status: "완료",
    },
    {
      id: 3,
      date: "2025-12-12 18:45:22",
      amount: 1000,
      status: "처리중",
    },
  ];

  const withdrawHistory = [
    {
      id: 1,
      date: "2025-12-14 16:20:35",
      amount: 50000,
      status: "처리중",
    },
    {
      id: 2,
      date: "2025-12-10 11:15:48",
      amount: 30000,
      status: "완료",
    },
  ];

  const giftItems = [
    {
      id: 1,
      name: "장미",
      buyPrice: 100,
      sellPrice: 80,
      emoji: "🌹",
    },
    {
      id: 2,
      name: "초콜릿",
      buyPrice: 300,
      sellPrice: 240,
      emoji: "🍫",
    },
    {
      id: 3,
      name: "샴페인",
      buyPrice: 500,
      sellPrice: 400,
      emoji: "🍾",
    },
    {
      id: 4,
      name: "하트 풍선",
      buyPrice: 200,
      sellPrice: 160,
      emoji: "💝",
    },
    {
      id: 5,
      name: "다이아 반지",
      buyPrice: 1000,
      sellPrice: 800,
      emoji: "💍",
    },
    {
      id: 6,
      name: "럭셔리 향수",
      buyPrice: 2000,
      sellPrice: 1600,
      emoji: "🎁",
    },
  ];

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
    onConfirm: (quantity: number) => {},
  });

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
            포인트를 충전하고 다양한 프리미엄 서비스를
            이용하세요
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500 rounded-lg p-8 mb-12 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Coins className="text-pink-500" size={40} />
              <div>
                <p className="text-gray-400 text-sm">
                  보유 포인트
                </p>
                <p className="text-white text-3xl">
                  {currentPoints.toLocaleString()} P
                </p>
              </div>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">
                충전한 포인트
              </p>
              <p className="text-white">0 P</p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">
                사용한 포인트
              </p>
              <p className="text-white">0 P</p>
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
                  className={`bg-gray-900 rounded-lg p-4 sm:p-6 border ${pkg.bonus > 0 ? "border-pink-500" : "border-gray-800"} hover:border-pink-500 transition-all relative`}
                >
                  {pkg.bonus > 0 && (
                    <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs px-2 sm:px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      +{pkg.bonus}% 보너스
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
                    {pkg.bonus > 0 && (
                      <p className="text-green-500 text-xs sm:text-sm mb-2">
                        +
                        {Math.round(
                          (pkg.points * pkg.bonus) / 100,
                        )}{" "}
                        P 보너스
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
                          message: `${pkg.points.toLocaleString()} P를 ${pkg.price.toLocaleString()}원에 충전하시겠습니까?`,
                          onConfirm: () => {
                            setConfirmModal({
                              ...confirmModal,
                              isOpen: false,
                            });
                            alert("충전 기능은 준비중입니다.");
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
            <h3 className="text-xl text-white mb-4">
              충전 내역
            </h3>
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
                    {chargeHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {item.date}
                        </td>
                        <td className="px-3 py-2 text-sm text-green-500 text-right">
                          +{item.amount.toLocaleString()} P
                        </td>
                        <td className="px-3 py-2 text-sm text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.status === "완료"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {item.status}
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
                      onChange={(e) => {
                        const value = e.target.value.replace(
                          /[^\d]/g,
                          "",
                        );
                        e.target.value = value
                          ? `${parseInt(value).toLocaleString()} P`
                          : "";
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    은행
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  >
                    {banks.map((bank) => (
                      <option key={bank} value={bank} className="bg-gray-800 text-white">
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
                    value="1234567890"
                    disabled
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500"
                  />
                  <p className="text-gray-500 text-xs mt-2">
                    * 회원가입 시 등록한 계좌로 출금됩니다
                  </p>
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
                        alert("출금 신청이 완료되었습니다.");
                      },
                    });
                  }}
                  className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  출금 신청
                </button>
              </div>
            </div>

            {/* Withdraw History */}
            <h3 className="text-xl text-white mb-4">
              출금 내역
            </h3>
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
                    {withdrawHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {item.date}
                        </td>
                        <td className="px-3 py-2 text-sm text-white text-right">
                          {item.amount.toLocaleString()}원
                        </td>
                        <td className="px-3 py-2 text-sm text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.status === "완료"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {item.status}
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
                const myGift = myGifts.find(
                  (g) => g.name === item.name,
                );
                const ownedQuantity = myGift
                  ? myGift.quantity
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-pink-500 transition-all text-center group"
                  >
                    <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
                      {item.name === "럭셔리 향수"
                        ? "🧴"
                        : item.emoji}
                    </div>
                    <h3 className="text-white mb-2 text-sm">
                      {item.name}
                    </h3>
                    <div className="mb-3 space-y-1">
                      <p className="text-pink-500 text-xs">
                        구매: {item.buyPrice} P
                      </p>
                      <p className="text-green-500 text-xs">
                        판매: {item.sellPrice} P
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
                            itemEmoji: item.emoji,
                            price: item.buyPrice,
                            maxQuantity: 99,
                            currentPoints: currentPoints,
                            isBuying: true,
                            onConfirm: (quantity) => {
                              setQuantityModal({
                                ...quantityModal,
                                isOpen: false,
                              });
                              alert(
                                `${item.name} ${quantity}개를 구매했습니다!`,
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
                            alert("보유한 선물이 없습니다.");
                            return;
                          }
                          setQuantityModal({
                            isOpen: true,
                            title: "기프트 판매",
                            itemName: item.name,
                            itemEmoji: item.emoji,
                            price: item.sellPrice,
                            maxQuantity: ownedQuantity,
                            currentPoints: currentPoints,
                            isSelling: true,
                            onConfirm: (quantity) => {
                              setQuantityModal({
                                ...quantityModal,
                                isOpen: false,
                              });
                              alert(
                                `${item.name} ${quantity}개를 판매했습니다!`,
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
                  <span className="text-gray-400">
                    전체 보유 선물 가치
                  </span>
                  <span className="text-green-500 text-xl">
                    {myGifts
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
            )}

            {/* Gift Notice */}
            <div className="mt-8 bg-pink-500/10 border border-pink-500/20 rounded-lg p-6">
              <h3 className="text-white mb-3">기프트 안내</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>
                  • 기프트를 구매하면 선물 인벤토리에 저장됩니다
                </li>
                <li>
                  • 마이페이지에서 보유한 선물을 확인할 수
                  있습니다
                </li>
                <li>• 판매 시 구매가의 80%로 판매됩니다</li>
                <li>
                  • 구매한 선물은 채팅 중인 상대방에게 선물할 수
                  있습니다
                </li>
                <li>
                  • 보유한 선물이 있는 경우 판매하기 버튼이
                  활성화됩니다
                </li>
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
        currentPoints={quantityModal.currentPoints}
        isBuying={quantityModal.isBuying}
        isSelling={quantityModal.isSelling}
        onConfirm={quantityModal.onConfirm}
        onCancel={() =>
          setQuantityModal({ ...quantityModal, isOpen: false })
        }
      />
    </div>
  );
}