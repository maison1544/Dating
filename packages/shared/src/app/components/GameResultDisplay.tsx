/**
 * 게임 회차 결과 표시 컴포넌트
 * - 완료된 회차: 상세 결과 표시
 * - 진행중 + 예약: 예약된 결과 표시 (애니메이션)
 * - 그 외: 결과미정 표시
 */

interface GameResultDisplayProps {
  status: "진행중" | "완료" | "완료(예약)" | "대기" | string;
  result?: string;
  detailedResult?: string;
  reservedResult?: string;
  variant?: "table" | "header"; // table: 테이블용 작은 크기, header: 헤더용 큰 크기
}

export function GameResultDisplay({
  status,
  result,
  detailedResult,
  reservedResult,
  variant = "table",
}: GameResultDisplayProps) {
  const isCompleted = status === "완료" || status === "완료(예약)";

  // 완료되지 않은 경우
  if (!isCompleted) {
    if (status === "진행중" && reservedResult) {
      return (
        <span className="text-green-400 flex items-center gap-1 text-xs">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
          {reservedResult}
        </span>
      );
    }
    return <span className="text-gray-500">결과미정</span>;
  }

  // 완료된 경우: detailedResult 우선 표시
  if (detailedResult) {
    const lines = detailedResult.split("\n");

    if (variant === "header") {
      // 헤더용: 한 줄로 표시
      return (
        <div className="flex items-center gap-2">
          {lines.map((line, idx) => (
            <span key={idx} className="text-yellow-400 font-semibold text-lg">
              {line}
            </span>
          ))}
        </div>
      );
    }

    // 테이블용: 여러 줄 표시
    if (lines.length > 1) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-purple-400">{lines[0]}</span>
          <span className="text-purple-300">{lines[1]}</span>
        </div>
      );
    }
    return <span className="text-blue-400">{lines[0]}</span>;
  }

  // result만 있는 경우
  if (result && result !== "-") {
    return (
      <span className={variant === "header" ? "text-yellow-400 font-semibold text-lg" : "text-purple-400"}>
        {result}
      </span>
    );
  }

  return <span className="text-gray-500">-</span>;
}
