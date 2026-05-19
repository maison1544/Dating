import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminPageLoader } from "@/components/common/AdminPageLoader";
import { useState, useEffect, FormEvent, useRef } from "react";
import {
  ToggleLeft,
  ToggleRight,
  Save,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { useAdminGifts } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { CsvDownloadButton } from "@/components/layout/CsvDownloadButton";
import { getTodayKST } from "@/lib/utils/dateUtils";

interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  displayOrder: number;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
  salesCount: number;
  revenuePoints: number;
}

export function AdminGiftsPage() {
  const { adminAccount } = useAuth();
  const { showAlert } = useAlert();
  const {
    gifts: dbGifts,
    isLoading,
    error,
    createGift,
    updateGift,
    deleteGift,
  } = useAdminGifts(adminAccount?.id);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    buyPrice: number;
    sellPrice: number;
  }>({
    buyPrice: 0,
    sellPrice: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteReclaim, setDeleteReclaim] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    emoji: "🎁",
    displayOrder: 0,
    buyPrice: 0,
    sellPrice: 0,
    isActive: true,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dropdown state for actions
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Supabase 데이터를 로컬 상태로 변환
  const [gifts, setGifts] = useState<GiftItem[]>([]);

  useEffect(() => {
    const mapped = (dbGifts || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji ?? "🎁",
      displayOrder: Number(g.display_order ?? 0),
      buyPrice: Number(g.buy_price ?? 0),
      sellPrice: Number(g.sell_price ?? 0),
      isActive: g.is_active ?? true,
      salesCount: Number(g.sales_count ?? 0),
      revenuePoints: Number(g.revenue_points ?? 0),
    }));
    // Sort: active first, then by buyPrice ascending (low to high)
    mapped.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.buyPrice - b.buyPrice;
    });
    setGifts(mapped);
  }, [dbGifts]);

  useEffect(() => {
    if (!isModalOpen && !isDeleteModalOpen) {
      document.body.style.overflow = "unset";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDeleteModalOpen, isModalOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminPageLoader />
      </AdminLayout>
    );
  }

  const toggleActive = async (id: string) => {
    const target = gifts.find((g) => g.id === id);
    if (!target) return;
    await updateGift(id, { is_active: !target.isActive });
  };

  const startEditing = (gift: GiftItem) => {
    setEditingId(gift.id);
    setEditValues({
      buyPrice: gift.buyPrice,
      sellPrice: gift.sellPrice,
    });
  };

  const saveEditing = async (id: string) => {
    await updateGift(id, {
      buy_price: editValues.buyPrice,
      sell_price: editValues.sellPrice,
    });
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      emoji: "🎁",
      displayOrder:
        gifts.length > 0
          ? Math.max(...gifts.map((g) => g.displayOrder)) + 1
          : 0,
      buyPrice: 0,
      sellPrice: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (gift: GiftItem) => {
    setEditingId(gift.id);
    setFormData({
      name: gift.name,
      emoji: gift.emoji || "🎁",
      displayOrder: gift.displayOrder,
      buyPrice: gift.buyPrice,
      sellPrice: gift.sellPrice,
      isActive: gift.isActive,
    });
    setOpenDropdownId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (Number(formData.sellPrice) > Number(formData.buyPrice)) {
      showAlert({
        title: "입력 오류",
        message: "판매가는 구매가보다 클 수 없습니다.",
        type: "warning",
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      emoji: formData.emoji.trim() || "🎁",
      display_order: Number(formData.displayOrder) || 0,
      buy_price: Number(formData.buyPrice) || 0,
      sell_price: Number(formData.sellPrice) || 0,
      is_active: !!formData.isActive,
    };

    const { error: saveError } = editingId
      ? await updateGift(editingId, payload)
      : await createGift(payload as any);

    if (saveError) {
      showAlert({
        title: "오류",
        message: saveError.message || "기프트 저장에 실패했습니다.",
        type: "error",
      });
      return;
    }

    showAlert({
      title: "처리 완료",
      message: editingId ? "기프트가 수정되었습니다." : "기프트가 생성되었습니다.",
      type: "success",
    });

    closeModal();
  };

  const openDeleteModal = (id: string) => {
    setDeleteTargetId(id);
    setDeleteReclaim(false);
    setOpenDropdownId(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const { error: deleteError } = await deleteGift(deleteTargetId, {
      reclaim: deleteReclaim,
    });

    if (deleteError) {
      showAlert({
        title: "오류",
        message: deleteError.message || "기프트 삭제에 실패했습니다.",
        type: "error",
      });
      return;
    }

    showAlert({
      title: "처리 완료",
      message: "기프트가 비활성화되었습니다.",
      type: "success",
    });
    setIsDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  const totalRevenue = gifts.reduce((sum, gift) => sum + gift.revenuePoints, 0);

  const activeItems = gifts.filter((g) => g.isActive).length;

  // Pagination calculations
  const totalPages = Math.ceil(gifts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGifts = gifts.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">기프트 관리</h1>
            <p className="text-gray-400">
              <span className="text-gray-300">전체 {gifts.length}개</span> |{" "}
              <span className="text-green-400">활성 {activeItems}개</span> |{" "}
              <span className="text-blue-400">
                총 판매{" "}
                {gifts
                  .reduce((sum, g) => sum + g.salesCount, 0)
                  .toLocaleString()}
                건
              </span>{" "}
              |{" "}
              <span className="text-yellow-400">
                총 매출 {totalRevenue.toLocaleString()}P
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CsvDownloadButton
              data={gifts.map((g) => ({
                id: g.id,
                emoji: g.emoji,
                name: g.name,
                buyPrice: g.buyPrice,
                sellPrice: g.sellPrice,
                isActive: g.isActive ? "활성" : "비활성",
                salesCount: g.salesCount,
                revenuePoints: g.revenuePoints,
              }))}
              columns={[
                { key: "id", label: "ID" },
                { key: "emoji", label: "이모지" },
                { key: "name", label: "이름" },
                { key: "buyPrice", label: "구매가격" },
                { key: "sellPrice", label: "판매가격" },
                { key: "isActive", label: "활성상태" },
                { key: "salesCount", label: "판매건수" },
                { key: "revenuePoints", label: "매출포인트" },
              ]}
              filename={`기프트목록_${getTodayKST()}.csv`}
            />
            <button
              onClick={openCreateModal}
              className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
            >
              <Plus size={20} />새 선물 추가
            </button>
          </div>
        </div>

        {/* Gifts Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-visible relative z-10">
          {error && (
            <div className="p-4 text-red-400 border-b border-gray-800">
              {error.message}
            </div>
          )}
          <div className="w-full overflow-visible">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-3 text-center text-xs text-gray-400 uppercase">
                    아이템
                  </th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400 uppercase">
                    구매가
                  </th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400 uppercase">
                    판매가
                  </th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400 uppercase">
                    판매량
                  </th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400 uppercase">
                    매출
                  </th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400 uppercase">
                    상태
                  </th>
                  <th className="px-2 py-3 text-center text-xs text-gray-400 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedGifts.map((gift) => (
                  <tr
                    key={gift.id}
                    className={`hover:bg-gray-800/50 transition-colors ${
                      !gift.isActive ? "opacity-50" : ""
                    } ${openDropdownId === gift.id ? "relative z-20" : "relative z-0"}`}
                  >
                    <td className="px-2 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl leading-none">
                          {gift.emoji}
                        </span>
                        <p className="text-white truncate text-sm">
                          {gift.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      {editingId === gift.id ? (
                        <input
                          type="number"
                          value={editValues.buyPrice}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              buyPrice: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-center text-sm focus:outline-none focus:border-indigo-500"
                          min="0"
                        />
                      ) : (
                        <span className="text-white text-sm">
                          {gift.buyPrice.toLocaleString()}원
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {editingId === gift.id ? (
                        <input
                          type="number"
                          value={editValues.sellPrice}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              sellPrice: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-center text-sm focus:outline-none focus:border-indigo-500"
                          min="0"
                        />
                      ) : (
                        <span className="text-green-400 text-sm">
                          {gift.sellPrice.toLocaleString()}P
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-300 text-sm">
                      {gift.salesCount.toLocaleString()}건
                    </td>
                    <td className="px-2 py-3 text-center text-yellow-400 text-sm">
                      {gift.revenuePoints.toLocaleString()}P
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleActive(gift.id)}
                          className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
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
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-center">
                        {editingId === gift.id ? (
                          <>
                            <button
                              onClick={() => saveEditing(gift.id)}
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
                          <div
                            className="relative"
                            ref={
                              openDropdownId === gift.id ? dropdownRef : null
                            }
                          >
                            <button
                              onClick={() =>
                                setOpenDropdownId(
                                  openDropdownId === gift.id ? null : gift.id,
                                )
                              }
                              className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                              title="작업 선택"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openDropdownId === gift.id && (
                              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[140px] py-1">
                                <button
                                  onClick={() => openEditModal(gift)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                >
                                  <Save size={14} />
                                  상세 수정
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-800">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 rounded text-sm transition-colors ${
                        currentPage === page
                          ? "bg-indigo-500 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500 rounded-lg p-6 relative z-0">
          <h3 className="text-white text-lg mb-3">💡 가격 설정 가이드</h3>
          <div className="space-y-2 text-gray-300 text-sm">
            <p>
              • <strong>구매가</strong>: 사용자가 실제로 지불하는 현금 금액 (원)
            </p>
            <p>
              • <strong>판매가</strong>: 기프트 구매 시 차감되는 포인트
            </p>
            <p>
              • 상태 토글: 활성/비활성을 클릭하여 아이템의 판매 여부를 변경할 수
              있습니다
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl">
                {editingId ? "선물 수정" : "새 선물 추가"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">이름</label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">
                    이모지(이모지만 입력가능)
                  </label>
                  <input
                    value={formData.emoji}
                    onChange={(e) => {
                      // Filter to only allow emoji characters
                      const emojiOnly = e.target.value.replace(
                        /[^\p{Emoji}\p{Emoji_Component}]/gu,
                        "",
                      );
                      setFormData((p) => ({ ...p, emoji: emojiOnly || "🎁" }));
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-2xl text-center"
                    placeholder="🎁"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">구매가(원)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.buyPrice}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        buyPrice: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">판매가(P)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.sellPrice}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        sellPrice: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    활성
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {editingId ? "저장" : "생성"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deleteTargetId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-xl overflow-hidden">
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl">선물 삭제(비활성)</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm">
                선물을 완전히 삭제하지 않고 <strong>비활성화</strong>합니다.
              </p>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={deleteReclaim}
                  onChange={(e) => setDeleteReclaim(e.target.checked)}
                />
                보유 인벤토리 자동 회수(판매가 기준 환급)
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  확인
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
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
