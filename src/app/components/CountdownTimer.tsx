import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  gameType?: string;
  endTime?: string;
  onEnd?: () => void;
}

export function CountdownTimer({ gameType, endTime, onEnd }: CountdownTimerProps) {
  // 파워볼, 사다리: 3분(180초)
  const totalSeconds = 180;
  const [seconds, setSeconds] = useState(totalSeconds);
  const onEndRef = useRef(onEnd);

  // onEnd 함수가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    // endTime이 제공된 경우 실제 남은 시간 계산
    if (endTime && endTime !== "-") {
      const calculateRemaining = () => {
        const now = new Date();
        const [hours, minutes] = endTime.split(":").map(Number);
        const end = new Date();
        end.setHours(hours, minutes, 0, 0);
        
        const diff = Math.floor((end.getTime() - now.getTime()) / 1000);
        return diff > 0 ? diff : 0;
      };

      setSeconds(calculateRemaining());

      const interval = setInterval(() => {
        const remaining = calculateRemaining();
        setSeconds(remaining);
        
        if (remaining <= 0 && onEndRef.current) {
          onEndRef.current();
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // 기본 카운트다운 (gameType만 있는 경우)
      const interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (onEndRef.current) onEndRef.current();
            return totalSeconds; // 리셋
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [endTime]); // onEnd를 dependency에서 제거

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