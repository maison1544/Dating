import { useState, useEffect, useRef } from "react";

interface CountdownTimerProps {
  gameType?: string;
  endTime?: string;
  onEnd?: () => void;
  serverTimeOffset?: number; // 서버시간 - 클라이언트시간 (ms)
}

export function CountdownTimer({
  endTime,
  onEnd,
  serverTimeOffset = 0,
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const onEndRef = useRef(onEnd);
  const didFireRef = useRef(false);

  // onEnd 함수가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    didFireRef.current = false;
  }, [endTime]);

  useEffect(() => {
    const calculateRemaining = () => {
      if (!endTime || endTime === "-") return 0;

      // 서버 시간 오프셋 적용
      const adjustedNow = Date.now() + serverTimeOffset;

      // ISO datetime
      if (endTime.includes("T")) {
        const end = new Date(endTime);
        const diff = Math.floor((end.getTime() - adjustedNow) / 1000);
        return diff > 0 ? diff : 0;
      }

      // "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss" datetime string
      const dtMatch = endTime.match(
        /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/,
      );
      if (dtMatch) {
        const iso = endTime.replace(" ", "T");
        const end = new Date(iso);
        const diff = Math.floor((end.getTime() - adjustedNow) / 1000);
        return diff > 0 ? diff : 0;
      }

      // "HH:mm" time string
      const parts = endTime.split(":");
      if (parts.length >= 2) {
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
          const now = new Date(adjustedNow);
          const end = new Date(adjustedNow);
          end.setHours(hours, minutes, 0, 0);
          const diff = Math.floor((end.getTime() - now.getTime()) / 1000);
          return diff > 0 ? diff : 0;
        }
      }

      return 0;
    };

    setSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSeconds(remaining);

      if (remaining <= 0 && onEndRef.current && !didFireRef.current) {
        didFireRef.current = true;
        onEndRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, serverTimeOffset]); // serverTimeOffset 추가

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const isUrgent = seconds <= 30;

  return (
    <span className={isUrgent ? "text-red-400" : "text-gray-400"}>
      {String(minutes).padStart(2, "0")}:
      {String(remainingSeconds).padStart(2, "0")}
    </span>
  );
}
