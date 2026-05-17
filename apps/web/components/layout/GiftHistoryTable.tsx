import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";
import { AdminPagination } from "@/components/common/AdminPagination";
import { formatKST } from "@/lib/utils/dateUtils";

export type GiftHistoryRow = {
  id: string;
  createdAt: string | null;
  giftName: string;
  giftEmoji?: string | null;
  quantity: number;
  description: string;
  pointsAmount: number;
};

interface GiftHistoryTableProps {
  title?: string;
  rows: GiftHistoryRow[];
  isLoading?: boolean;
  emptyMessage?: string;
  itemsPerPage?: number;
}

export function GiftHistoryTable({
  title = "기프트 내역",
  rows,
  isLoading = false,
  emptyMessage = "선물 내역이 없습니다.",
  itemsPerPage = 20,
}: GiftHistoryTableProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!startDate && !endDate) {
      setIsDateRangeValid(true);
      return;
    }
    setIsDateRangeValid(startDate <= endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, rows.length]);

  const filteredRows = useMemo(() => {
    if (!startDate && !endDate) return rows;
    if (startDate && endDate && startDate > endDate) return rows;

    return rows.filter((item) => {
      const itemDateKST = item.createdAt
        ? formatKST(item.createdAt, "date")
        : "";
      if (startDate && itemDateKST < startDate) return false;
      if (endDate && itemDateKST > endDate) return false;
      return true;
    });
  }, [rows, startDate, endDate]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-white font-semibold">{title}</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Calendar className="text-indigo-400" size={18} />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(val) => {
                setStartDate(val);
                setIsDateRangeValid(true);
              }}
              onEndDateChange={(val) => {
                setEndDate(val);
                setIsDateRangeValid(true);
              }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setIsDateRangeValid(true);
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>
        {!isDateRangeValid && (
          <p className="text-red-400 text-xs mt-2">
            종료일은 시작일보다 이전일 수 없습니다.
          </p>
        )}
      </div>
      <table className="w-full">
        <tbody className="divide-y divide-gray-700">
          {isLoading ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                선물 내역을 불러오는 중...
              </td>
            </tr>
          ) : filteredRows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedRows.map((item) => {
              const amount = Math.abs(item.pointsAmount || 0);
              const isPositive = item.pointsAmount >= 0;
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {item.createdAt
                      ? formatKST(item.createdAt, "datetime")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {item.giftEmoji || "🎁"} {item.giftName || "선물"}
                    <span className="text-gray-400 ml-1">
                      ({item.quantity || 1}개)
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {item.description}
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {amount.toLocaleString()} P
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
