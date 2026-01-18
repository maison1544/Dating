import { useState, useEffect } from "react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = "",
}: DateRangePickerProps) {
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);

  const validateDateRange = (start: string, end: string) => {
    if (start && end) {
      return new Date(start) <= new Date(end);
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

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className={`flex-1 bg-gray-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 ${
            !isDateRangeValid ? "border-red-500" : "border-gray-700"
          }`}
        />
        <span className="text-gray-500 flex-shrink-0">~</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
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
