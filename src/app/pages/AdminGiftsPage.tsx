import { AdminLayout } from "../components/AdminLayout";
import { useState } from "react";
import {
  Filter,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Save,
} from "lucide-react";

interface GiftItem {
  id: number;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
  icon: string;
  stock: number;
  salesCount: number;
}

export function AdminGiftsPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(
    null,
  );
  const [editValues, setEditValues] = useState<{
    buyPrice: number;
    sellPrice: number;
  }>({
    buyPrice: 0,
    sellPrice: 0,
  });

  const [gifts, setGifts] = useState<GiftItem[]>([
    {
      id: 1,
      name: "장미",
      category: "꽃",
      buyPrice: 100,
      sellPrice: 80,
      isActive: true,
      icon: "🌹",
      stock: 999,
      salesCount: 234,
    },
    {
      id: 2,
      name: "초콜릿",
      category: "간식",
      buyPrice: 300,
      sellPrice: 240,
      isActive: true,
      icon: "🍫",
      stock: 999,
      salesCount: 456,
    },
    {
      id: 3,
      name: "샴페인",
      category: "음료",
      buyPrice: 500,
      sellPrice: 400,
      isActive: true,
      icon: "🍾",
      stock: 999,
      salesCount: 189,
    },
    {
      id: 4,
      name: "하트 풍선",
      category: "액세서리",
      buyPrice: 200,
      sellPrice: 160,
      isActive: true,
      icon: "💝",
      stock: 999,
      salesCount: 323,
    },
    {
      id: 5,
      name: "다이아 반지",
      category: "액세서리",
      buyPrice: 1000,
      sellPrice: 800,
      isActive: true,
      icon: "💍",
      stock: 999,
      salesCount: 67,
    },
    {
      id: 6,
      name: "럭셔리 향수",
      category: "뷰티",
      buyPrice: 2000,
      sellPrice: 1600,
      isActive: true,
      icon: "🧴",
      stock: 999,
      salesCount: 45,
    },
  ]);

  const categories = [
    "all",
    ...Array.from(new Set(gifts.map((g) => g.category))),
  ];

  const filteredGifts = gifts.filter((gift) => {
    const matchesCategory =
      categoryFilter === "all" ||
      gift.category === categoryFilter;
    return matchesCategory;
  });

  const toggleActive = (id: number) => {
    setGifts(
      gifts.map((gift) =>
        gift.id === id
          ? { ...gift, isActive: !gift.isActive }
          : gift,
      ),
    );
  };

  const startEditing = (gift: GiftItem) => {
    setEditingId(gift.id);
    setEditValues({
      buyPrice: gift.buyPrice,
      sellPrice: gift.sellPrice,
    });
  };

  const saveEditing = (id: number) => {
    setGifts(
      gifts.map((gift) =>
        gift.id === id
          ? {
              ...gift,
              buyPrice: editValues.buyPrice,
              sellPrice: editValues.sellPrice,
            }
          : gift,
      ),
    );
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const totalRevenue = gifts.reduce(
    (sum, gift) => sum + gift.sellPrice * gift.salesCount,
    0,
  );

  const activeItems = gifts.filter((g) => g.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">
              기프트 관리
            </h1>
            <p className="text-gray-400">
              <span className="text-gray-300">전체 {gifts.length}개</span> | <span className="text-green-400">활성 {activeItems}개</span> | <span className="text-blue-400">총
              판매{" "}
              {gifts
                .reduce((sum, g) => sum + g.salesCount, 0)
                .toLocaleString()}
              건</span> | <span className="text-yellow-400">총 매출 {totalRevenue.toLocaleString()}P</span>
            </p>
          </div>
        </div>

        {/* Gifts Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                    아이템
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                    구매가 (실제가격)
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                    판매가 (포인트)
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                    판매량
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                    매출
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase whitespace-nowrap">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredGifts.map((gift) => (
                  <tr
                    key={gift.id}
                    className={`hover:bg-gray-800/50 transition-colors ${
                      !gift.isActive ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl">
                          {gift.icon}
                        </span>
                        <p className="text-white">
                          {gift.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === gift.id ? (
                        <input
                          type="number"
                          value={editValues.buyPrice}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              buyPrice:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-indigo-500"
                          min="0"
                        />
                      ) : (
                        <span className="text-white">
                          {gift.buyPrice.toLocaleString()}원
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === gift.id ? (
                        <input
                          type="number"
                          value={editValues.sellPrice}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              sellPrice:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-indigo-500"
                          min="0"
                        />
                      ) : (
                        <span className="text-green-400">
                          {gift.sellPrice.toLocaleString()}P
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {gift.salesCount.toLocaleString()}건
                    </td>
                    <td className="px-4 py-3 text-center text-yellow-400">
                      {(
                        gift.sellPrice * gift.salesCount
                      ).toLocaleString()}
                      P
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleActive(gift.id)}
                          className={`inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full text-xs transition-colors min-w-[100px] whitespace-nowrap ${
                            gift.isActive
                              ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                              : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                          }`}
                        >
                          {gift.isActive ? (
                            <>
                              <ToggleRight size={16} />
                              활성
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={16} />
                              비활성
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === gift.id ? (
                          <>
                            <button
                              onClick={() =>
                                saveEditing(gift.id)
                              }
                              className="p-2 hover:bg-gray-700 rounded transition-colors text-green-500 hover:text-green-400"
                              title="저장"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 hover:bg-gray-700 rounded transition-colors text-red-500 hover:text-red-400"
                              title="취소"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditing(gift)}
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                            title="가격 수정"
                          >
                            <DollarSign size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500 rounded-lg p-6">
          <h3 className="text-white text-lg mb-3">
            💡 가격 설정 가이드
          </h3>
          <div className="space-y-2 text-gray-300 text-sm">
            <p>
              • <strong>구매가</strong>: 사용자가 실제로
              지불하는 현금 금액 (원)
            </p>
            <p>
              • <strong>판매가</strong>: 기프트 구매 시 차감되는
              포인트
            </p>
            <p>
              • 가격 수정: 가격 옆의 $ 아이콘을 클릭하여 수정할
              수 있습니다
            </p>
            <p>
              • 상태 토글: 활성/비활성을 클릭하여 아이템의 판매
              여부를 변경할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}