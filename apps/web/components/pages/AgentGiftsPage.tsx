import { AdminLayout } from "@/components/layout/AdminLayout";
import { DateRangePicker } from "@/components/layout/DateRangePicker";
import { GiftInventoryManager } from "@/components/layout/GiftInventoryManager";
import { useState, useMemo } from "react";
import { ChevronDown, X, Package, Gift } from "lucide-react";
import { useGiftItems, useAgentGiftTransactions } from "@/hooks/useSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatKST } from "@/lib/utils/dateUtils";
import { AdminPagination } from "@/components/common/AdminPagination";

interface GiftRecord {
  id: string;
  memberName: string;
  memberNickname: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  points: number;
  quantity: number;
  dateKey: string;
  date: string;
  profileId: string;
  profileName: string;
  type: "received" | "sent"; // 받은 기프트 / 보낸 기프트
}

export function AgentGiftsPage() {
  const { adminAccount } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedGiftId, setSelectedGiftId] = useState<string>("all");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("all");
  const [giftTypeFilter, setGiftTypeFilter] = useState<
    "all" | "received" | "sent"
  >("all");
  const [isDateRangeValid] = useState(true);
  const [isGiftDropdownOpen, setIsGiftDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Supabase hooks for real data
  const {
    transactions: dbTransactions,
    isLoading,
    error,
    refetch,
  } = useAgentGiftTransactions(adminAccount?.id);
  const { gifts: dbGifts } = useGiftItems();

  // Transform gifts from Supabase for dropdown
  const giftsList = useMemo(() => {
    return dbGifts.map((g: any) => ({
      id: g.id,
      name: g.name,
      points: g.buy_price,
      icon: g.emoji,
    }));
  }, [dbGifts]);

  const selectedGiftLabel = useMemo(() => {
    if (selectedGiftId === "all") return "기프트 종류";
    const g = giftsList.find((x) => x.id === selectedGiftId);
    if (!g) return "기프트 종류";
    return `${g.icon} ${g.name}`;
  }, [giftsList, selectedGiftId]);

  // Transform transactions from Supabase
  const transformedRecords: GiftRecord[] = useMemo(() => {
    if (dbTransactions.length === 0) return [];

    const formatDateKey = (value: string | null) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return dbTransactions.map((t: any) => {
      const profileId =
        t.receiver_type === "profile"
          ? (t.receiver_id as string)
          : t.sender_type === "profile"
            ? (t.sender_id as string)
            : "";

      const type: "received" | "sent" =
        t.sender_type === "user" && t.receiver_type === "profile"
          ? "received"
          : t.sender_type === "profile" && t.receiver_type === "user"
            ? "sent"
            : t.receiver_type === "profile"
              ? "received"
              : "sent";

      return {
        id: t.id,
        memberName: t.users?.name || "Unknown",
        memberNickname: t.users?.nickname || "Unknown",
        giftId: t.gift_id || t.gifts?.id || "",
        giftName: t.gifts?.name || "Unknown",
        giftIcon: t.gifts?.emoji || "🎁",
        points: Number(t.points_amount || 0),
        quantity: Number(t.quantity ?? 1),
        dateKey: formatDateKey(t.created_at),
        date: t.created_at ? formatKST(t.created_at, "datetime") : "-",
        profileId,
        profileName: t.profileName || "Unknown",
        type,
      };
    });
  }, [dbTransactions]);

  // Use transformed Supabase data
  const giftRecords = transformedRecords;

  const filteredGiftRecords = useMemo(() => {
    return giftRecords.filter((record) => {
      if (startDate || endDate) {
        const recordDate = record.dateKey;
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
      }

      if (selectedGiftId !== "all" && record.giftId !== selectedGiftId) {
        return false;
      }

      if (
        selectedProfileId !== "all" &&
        record.profileId !== selectedProfileId
      ) {
        return false;
      }

      if (giftTypeFilter !== "all" && record.type !== giftTypeFilter) {
        return false;
      }

      return true;
    });
  }, [
    endDate,
    giftRecords,
    giftTypeFilter,
    selectedGiftId,
    selectedProfileId,
    startDate,
  ]);

  // Paginated gift records
  const paginatedGiftRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredGiftRecords.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredGiftRecords, currentPage]);

  const totalPages = Math.ceil(filteredGiftRecords.length / PAGE_SIZE);

  // Reset page when filters change
  const handleGiftTypeFilterChange = (filter: "all" | "received" | "sent") => {
    setGiftTypeFilter(filter);
    setCurrentPage(1);
  };

  const handleGiftIdChange = (id: string) => {
    setSelectedGiftId(id);
    setCurrentPage(1);
  };

  const handleProfileIdChange = (id: string) => {
    setSelectedProfileId(id);
    setCurrentPage(1);
  };

  const profileList = useMemo(() => {
    const map = new Map<string, string>();
    giftRecords.forEach((r) => {
      if (!r.profileId) return;
      if (!map.has(r.profileId)) map.set(r.profileId, r.profileName);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [giftRecords]);

  const selectedProfileLabel = useMemo(() => {
    if (selectedProfileId === "all") return "프로필";
    const p = profileList.find((x) => x.id === selectedProfileId);
    return p?.name || "프로필";
  }, [profileList, selectedProfileId]);

  // 받은 기프트 통계
  const getReceivedStats = () => {
    const received = filteredGiftRecords.filter((r) => r.type === "received");
    return {
      count: received.reduce((sum, r) => sum + r.quantity, 0),
      total: received.reduce((sum, r) => sum + r.points, 0),
    };
  };

  // 보낸 기프트 통계
  const getSentStats = () => {
    const sent = filteredGiftRecords.filter((r) => r.type === "sent");
    return {
      count: sent.reduce((sum, r) => sum + r.quantity, 0),
      total: sent.reduce((sum, r) => sum + r.points, 0),
    };
  };

  const receivedStats = getReceivedStats();
  const sentStats = getSentStats();

  // 받은 기프트 인벤토리 집계
  const getInventory = () => {
    const received = filteredGiftRecords.filter((r) => r.type === "received");
    const inventory = new Map<
      string,
      { icon: string; count: number; totalPoints: number }
    >();

    received.forEach((record) => {
      const existing = inventory.get(record.giftName);
      if (existing) {
        existing.count += record.quantity;
        existing.totalPoints += record.points;
      } else {
        inventory.set(record.giftName, {
          icon: record.giftIcon,
          count: record.quantity,
          totalPoints: record.points,
        });
      }
    });

    return Array.from(inventory.entries()).map(([name, data]) => ({
      name,
      icon: data.icon,
      count: data.count,
      totalPoints: data.totalPoints,
      unitPoints: data.totalPoints / data.count,
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* 헤더 */}
        <div>
          <h1 className="text-white text-2xl mb-2">기프트 관리</h1>
          <p className="text-gray-400 text-sm">
            에이전트 보유 선물과 프로필별 선물 내역을 관리하세요
          </p>
        </div>

        {/* 에이전트 보유 선물 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={20} className="text-indigo-400" />
            <h2 className="text-white text-lg font-medium">내 보유 선물</h2>
          </div>
          <GiftInventoryManager
            ownerId={adminAccount?.id}
            ownerType="agent"
            enabled={true}
            isReadOnly={true}
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-red-300 text-sm font-medium">
                  기프트 내역을 불러오지 못했습니다
                </p>
                <p className="text-red-200/80 text-xs mt-1">{error.message}</p>
              </div>
              <button
                onClick={() => void refetch()}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg text-sm transition-colors"
              >
                재시도
              </button>
            </div>
          </div>
        )}

        {/* 통계 한 줄 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-8 text-sm">
            <button
              onClick={() => setShowInventoryModal(true)}
              className="flex items-center gap-2 hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-colors"
            >
              <span className="text-gray-400">받은 기프트:</span>
              <span className="text-green-400 font-semibold">
                {receivedStats.total.toLocaleString()}P ({receivedStats.count}
                개)
              </span>
              <Package size={16} className="text-green-400" />
            </button>
            <div className="h-4 w-px bg-gray-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">보낸 기프트:</span>
              <span className="text-yellow-400 font-semibold">
                {sentStats.total.toLocaleString()}P ({sentStats.count}개)
              </span>
            </div>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 날짜 필터 */}
            <div className="flex items-center gap-2 flex-1">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  초기화
                </button>
              )}
            </div>

            {/* 받은/보낸 기프트 필터 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleGiftTypeFilterChange("all")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  giftTypeFilter === "all"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                전체
              </button>
              <button
                onClick={() => handleGiftTypeFilterChange("received")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  giftTypeFilter === "received"
                    ? "bg-green-500 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                받은 기프트
              </button>
              <button
                onClick={() => handleGiftTypeFilterChange("sent")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  giftTypeFilter === "sent"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                보낸 기프트
              </button>
            </div>

            {/* 기프트 종류 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsGiftDropdownOpen(!isGiftDropdownOpen)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 min-w-[150px] justify-between"
              >
                <span>{selectedGiftLabel}</span>
                <ChevronDown size={16} />
              </button>
              {isGiftDropdownOpen && (
                <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                  <button
                    onClick={() => {
                      handleGiftIdChange("all");
                      setIsGiftDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg ${
                      selectedGiftId === "all"
                        ? "text-indigo-400"
                        : "text-white"
                    }`}
                  >
                    전체
                  </button>
                  {giftsList.map((gift) => (
                    <button
                      key={gift.id}
                      onClick={() => {
                        handleGiftIdChange(gift.id);
                        setIsGiftDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors last:rounded-b-lg ${
                        selectedGiftId === gift.id
                          ? "text-indigo-400"
                          : "text-white"
                      }`}
                    >
                      <span className="mr-2">{gift.icon}</span>
                      {gift.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 프로필 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 min-w-[150px] justify-between"
              >
                <span>{selectedProfileLabel}</span>
                <ChevronDown size={16} />
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                  <button
                    onClick={() => {
                      handleProfileIdChange("all");
                      setIsProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg ${
                      selectedProfileId === "all"
                        ? "text-indigo-400"
                        : "text-white"
                    }`}
                  >
                    전체
                  </button>
                  {profileList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        handleProfileIdChange(p.id);
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors last:rounded-b-lg ${
                        selectedProfileId === p.id
                          ? "text-indigo-400"
                          : "text-white"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {!isDateRangeValid && (
            <p className="text-red-400 text-xs mt-2">
              종료일은 시작일보다 이전일 수 없습니다.
            </p>
          )}
        </div>

        {/* 기프트 내역 테이블 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                    일시
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                    구분
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                    회원명
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                    프로필
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                    기프트
                  </th>
                  <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">
                    포인트
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 py-8 text-sm"
                    >
                      불러오는 중...
                    </td>
                  </tr>
                ) : filteredGiftRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 py-8 text-sm"
                    >
                      조건에 맞는 기프트 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedGiftRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="text-gray-300 text-sm px-4 py-3">
                        {record.date}
                      </td>
                      <td className="text-sm px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            record.type === "received"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {record.type === "received" ? "받음" : "보냄"}
                        </span>
                      </td>
                      <td className="text-white text-sm px-4 py-3">
                        {record.memberNickname} ({record.memberName})
                      </td>
                      <td className="text-indigo-400 text-sm px-4 py-3">
                        {record.profileName}
                      </td>
                      <td className="text-white text-sm px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{record.giftIcon}</span>
                          <span>
                            {record.giftName}
                            {record.quantity > 1 ? ` x${record.quantity}` : ""}
                          </span>
                        </span>
                      </td>
                      <td
                        className={`text-sm font-semibold px-4 py-3 text-right ${
                          record.type === "received"
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {record.type === "received" ? "+" : "-"}
                        {record.points.toLocaleString()}P
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* 인벤토리 모달 */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white text-xl font-medium flex items-center gap-2">
                  <Package size={24} className="text-green-400" />
                  받은 기프트 인벤토리
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  총 {receivedStats.total.toLocaleString()}P ·{" "}
                  {receivedStats.count}개 기프트
                </p>
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* 인벤토리 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {getInventory().map((item) => (
                <div
                  key={item.name}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500/50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{item.icon}</div>
                    <h4 className="text-white font-medium mb-2">{item.name}</h4>
                    <div className="space-y-1">
                      <p className="text-green-400 text-sm font-semibold">
                        × {item.count}개
                      </p>
                      <p className="text-gray-400 text-xs">
                        {item.unitPoints.toLocaleString()}P / 개
                      </p>
                      <div className="pt-2 mt-2 border-t border-gray-700">
                        <p className="text-white text-sm font-semibold">
                          {item.totalPoints.toLocaleString()}P
                        </p>
                        <p className="text-gray-500 text-xs">총 가치</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getInventory().length === 0 && (
              <div className="text-center py-12">
                <Package size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">받은 기프트가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
