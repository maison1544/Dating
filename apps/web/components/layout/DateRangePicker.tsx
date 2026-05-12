import { useState, useEffect, useMemo } from "react";
import { getTodayKST } from "@/lib/utils/dateUtils";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
  /** 미래 날짜 선택 허용 여부 (기본값: false) */
  allowFuture?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = "",
  allowFuture = false,
}: DateRangePickerProps) {
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);

  // KST 기준 오늘 날짜 (컴포넌트 마운트 시점 기준)
  const todayKST = useMemo(() => getTodayKST(), []);

  const validateDateRange = (start: string, end: string) => {
    if (start && end) {
      return start <= end; // 문자열 비교로 충분 (YYYY-MM-DD 형식)
    }
    return true;
  };

  useEffect(() => {
    setIsDateRangeValid(validateDateRange(startDate, endDate));
  }, [startDate, endDate]);

  const handleStartDateChange = (newStartDate: string) => {
    onStartDateChange(newStartDate);
    const isValid = validateDateRange(newStartDate, endDate);
    setIsDateRangeValid(isValid);
  };

  const handleEndDateChange = (newEndDate: string) => {
    onEndDateChange(newEndDate);
    const isValid = validateDateRange(startDate, newEndDate);
    setIsDateRangeValid(isValid);
  };

  // 미래 날짜 제한을 위한 max 값 (KST 기준)
  const maxDate = allowFuture ? undefined : todayKST;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          max={maxDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          onInput={(e) => handleStartDateChange(e.currentTarget.value)}
          className={`flex-1 bg-gray-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 ${
            !isDateRangeValid ? "border-red-500" : "border-gray-700"
          }`}
        />
        <span className="text-gray-500 flex-shrink-0">~</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          max={maxDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
          onInput={(e) => handleEndDateChange(e.currentTarget.value)}
          className={`flex-1 bg-gray-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 ${
            !isDateRangeValid ? "border-red-500" : "border-gray-700"
          }`}
        />
      </div>
      {!isDateRangeValid && (
        <p className="text-red-400 text-xs">
          종료일은 시작일보다 이전일 수 없습니다.
        </p>
      )}
    </div>
  );
}
