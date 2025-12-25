import { AdminLayout } from "../components/AdminLayout";
import { useState } from "react";
import { Calendar, ChevronDown, X, Package } from "lucide-react";

interface GiftRecord {
  id: number;
  memberName: string;
  memberNickname: string;
  giftName: string;
  giftIcon: string;
  points: number;
  date: string;
  profileName: string;
  type: "received" | "sent"; // 받은 기프트 / 보낸 기프트
}

const GIFTS = [
  { id: 1, name: "장미", points: 80, icon: "🌹" },
  { id: 2, name: "초콜릿", points: 240, icon: "🍫" },
  { id: 3, name: "샴페인", points: 400, icon: "🍾" },
  { id: 4, name: "하트 풍선", points: 160, icon: "💝" },
  { id: 5, name: "다이아 반지", points: 800, icon: "💍" },
  { id: 6, name: "럭셔리 향수", points: 2000, icon: "🧴" },
];

export function AgentGiftsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedGift, setSelectedGift] = useState<string>("all");
  const [giftTypeFilter, setGiftTypeFilter] = useState<"all" | "received" | "sent">("all");
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);
  const [isGiftDropdownOpen, setIsGiftDropdownOpen] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  // 선물 내역 더미 데이터
  const [giftRecords] = useState<GiftRecord[]>([
    {
      id: 1,
      memberName: "김철수",
      memberNickname: "철수맨",
      giftName: "장미",
      giftIcon: "🌹",
      points: 80,
      date: "2025-12-17 14:52",
      profileName: "지수",
      type: "received",
    },
    {
      id: 2,
      memberName: "이영희",
      memberNickname: "영희공주",
      giftName: "초콜릿",
      giftIcon: "🍫",
      points: 240,
      date: "2025-12-17 13:20",
      profileName: "수지",
      type: "sent",
    },
    {
      id: 3,
      memberName: "최지우",
      memberNickname: "지우별",
      giftName: "하트 풍선",
      giftIcon: "💝",
      points: 160,
      date: "2025-12-17 10:50",
      profileName: "지수",
      type: "received",
    },
    {
      id: 4,
      memberName: "김철수",
      memberNickname: "철수맨",
      giftName: "샴페인",
      giftIcon: "🍾",
      points: 400,
      date: "2025-12-16 18:30",
      profileName: "지수",
      type: "received",
    },
    {
      id: 5,
      memberName: "박민수",
      memberNickname: "민수킹",
      giftName: "장미",
      giftIcon: "🌹",
      points: 80,
      date: "2025-12-16 15:20",
      profileName: "예린",
      type: "sent",
    },
    {
      id: 6,
      memberName: "최지우",
      memberNickname: "지우별",
      giftName: "다이아 반지",
      giftIcon: "💍",
      points: 800,
      date: "2025-12-15 20:15",
      profileName: "지수",
      type: "received",
    },
    {
      id: 7,
      memberName: "이영희",
      memberNickname: "영희공주",
      giftName: "럭셔리 향수",
      giftIcon: "🧴",
      points: 2000,
      date: "2025-12-15 16:45",
      profileName: "수지",
      type: "sent",
    },
    {
      id: 8,
      memberName: "김철수",
      memberNickname: "철수맨",
      giftName: "초콜릿",
      giftIcon: "🍫",
      points: 240,
      date: "2025-12-14 12:30",
      profileName: "지수",
      type: "received",
    },
  ]);

  // 필터링된 선물 내역
  const getFilteredGiftRecords = () => {
    return giftRecords.filter((record) => {
      // 날짜 필터
      if (startDate || endDate) {
        const recordDate = record.date.split(" ")[0];
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
      }

      // 기프트 종류 필터
      if (selectedGift !== "all" && record.giftName !== selectedGift) {
        return false;
      }

      // 받은/보낸 기프트 필터
      if (giftTypeFilter !== "all" && record.type !== giftTypeFilter) {
        return false;
      }

      return true;
    });
  };

  // 받은 기프트 통계
  const getReceivedStats = () => {
    const received = giftRecords.filter((r) => r.type === "received");
    return {
      count: received.length,
      total: received.reduce((sum, r) => sum + r.points, 0),
    };
  };

  // 보낸 기프트 통계
  const getSentStats = () => {
    const sent = giftRecords.filter((r) => r.type === "sent");
    return {
      count: sent.length,
      total: sent.reduce((sum, r) => sum + r.points, 0),
    };
  };

  const receivedStats = getReceivedStats();
  const sentStats = getSentStats();

  // 받은 기프트 인벤토리 집계
  const getInventory = () => {
    const received = giftRecords.filter((r) => r.type === "received");
    const inventory = new Map<string, { icon: string; count: number; totalPoints: number }>();

    received.forEach((record) => {
      const existing = inventory.get(record.giftName);
      if (existing) {
        existing.count += 1;
        existing.totalPoints += record.points;
      } else {
        inventory.set(record.giftName, {
          icon: record.giftIcon,
          count: 1,
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
            회원들이 보낸 기프트 내역을 확인하세요
          </p>
        </div>

        {/* 통계 한 줄 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-8 text-sm">
            <button
              onClick={() => setShowInventoryModal(true)}
              className="flex items-center gap-2 hover:bg-gray-800/50 px-3 py-2 rounded-lg transition-colors"
            >
              <span className="text-gray-400">받은 기프트:</span>
              <span className="text-green-400 font-semibold">
                {receivedStats.total.toLocaleString()}P ({receivedStats.count}개)
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
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartDate(newStart);
                  if (endDate) {
                    setIsDateRangeValid(newStart <= endDate);
                  }
                }}
                className={`bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                  !isDateRangeValid ? "border-red-500" : "border-gray-700"
                }`}
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setEndDate(newEnd);
                  if (startDate) {
                    setIsDateRangeValid(startDate <= newEnd);
                  }
                }}
                className={`bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                  !isDateRangeValid ? "border-red-500" : "border-gray-700"
                }`}
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setIsDateRangeValid(true);
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
                onClick={() => setGiftTypeFilter("all")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  giftTypeFilter === "all"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setGiftTypeFilter("received")}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  giftTypeFilter === "received"
                    ? "bg-green-500 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                받은 기프트
              </button>
              <button
                onClick={() => setGiftTypeFilter("sent")}
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
                <span>
                  {selectedGift === "all"
                    ? "기프트 종류"
                    : GIFTS.find((g) => g.name === selectedGift)?.icon +
                      " " +
                      selectedGift}
                </span>
                <ChevronDown size={16} />
              </button>
              {isGiftDropdownOpen && (
                <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[150px]">
                  <button
                    onClick={() => {
                      setSelectedGift("all");
                      setIsGiftDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg ${
                      selectedGift === "all" ? "text-indigo-400" : "text-white"
                    }`}
                  >
                    전체
                  </button>
                  {GIFTS.map((gift) => (
                    <button
                      key={gift.id}
                      onClick={() => {
                        setSelectedGift(gift.name);
                        setIsGiftDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors last:rounded-b-lg ${
                        selectedGift === gift.name
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
                {getFilteredGiftRecords().length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 py-8 text-sm"
                    >
                      조건에 맞는 기프트 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  getFilteredGiftRecords().map((record) => (
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
                          <span>{record.giftName}</span>
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
                  총 {receivedStats.total.toLocaleString()}P · {receivedStats.count}개 기프트
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