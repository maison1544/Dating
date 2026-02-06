import { X } from "lucide-react";

// 통합 배팅 타입 한글 변환 함수 (사다리 + 파워볼)
const translateBetType = (betType: string): string => {
  const betTypeMap: Record<string, string> = {
    // 사다리 배팅
    leftStart: "좌출발",
    rightStart: "우출발",
    line3: "3줄",
    line4: "4줄",
    oddEnd: "홀",
    evenEnd: "짝",
    left3Even: "좌3짝",
    left4Odd: "좌4홀",
    right3Odd: "우3홀",
    right4Even: "우4짝",
    leftThreeEven: "좌3짝",
    leftFourOdd: "좌4홀",
    rightThreeOdd: "우3홀",
    rightFourEven: "우4짝",
    // 파워볼 배팅 (하이픈 형식)
    "normal-odd": "일반볼-홀",
    "normal-even": "일반볼-짝",
    "normal-under": "일반볼-언더",
    "normal-over": "일반볼-오버",
    "power-odd": "파워볼-홀",
    "power-even": "파워볼-짝",
    "power-under": "파워볼-언더",
    "power-over": "파워볼-오버",
    "powerball-odd": "파워볼-홀",
    "powerball-even": "파워볼-짝",
    "powerball-under": "파워볼-언더",
    "powerball-over": "파워볼-오버",
    // 파워볼 배팅 (언더스코어 형식)
    normal_odd: "일반볼-홀",
    normal_even: "일반볼-짝",
    normal_under: "일반볼-언더",
    normal_over: "일반볼-오버",
    power_odd: "파워볼-홀",
    power_even: "파워볼-짝",
    power_under: "파워볼-언더",
    power_over: "파워볼-오버",
    powerball_odd: "파워볼-홀",
    powerball_even: "파워볼-짝",
    powerball_under: "파워볼-언더",
    powerball_over: "파워볼-오버",
    // 파워볼 배팅 (camelCase 형식)
    normalOdd: "일반볼-홀",
    normalEven: "일반볼-짝",
    normalUnder: "일반볼-언더",
    normalOver: "일반볼-오버",
    powerballOdd: "파워볼-홀",
    powerballEven: "파워볼-짝",
    powerballUnder: "파워볼-언더",
    powerballOver: "파워볼-오버",
    powerOdd: "파워볼-홀",
    powerEven: "파워볼-짝",
    powerUnder: "파워볼-언더",
    powerOver: "파워볼-오버",
    // 공통
    odd: "홀",
    even: "짝",
    under: "언더",
    over: "오버",
  };
  return betTypeMap[betType] || betType;
};

interface Bet {
  id: string;
  type: string;
  amount: number;
  result: string;
  round: number;
  betTime: string;
  winAmount: number;
  gameType?: string;
}

interface BetHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bets: Bet[];
  title?: string;
}

export function BetHistoryPanel({
  isOpen,
  onClose,
  bets,
  title = "배팅 기록",
}: BetHistoryPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full">
        <div className="bg-blue-500/20 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">📊</span>
            <span className="text-white">{title}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {bets.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                배팅 기록이 없습니다.
              </div>
            ) : (
              bets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {bet.gameType && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            bet.gameType === "ladder"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {bet.gameType === "ladder" ? "사다리" : "파워볼"}
                        </span>
                      )}
                      <span className="text-white">
                        {translateBetType(bet.type)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        bet.result === "승"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : bet.result === "패"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-gray-600/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {bet.result}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">회차: </span>
                      <span className="text-white">#{bet.round}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">배팅시간: </span>
                      <span className="text-white">{bet.betTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">배팅금액: </span>
                      <span className="text-white">
                        {bet.amount.toLocaleString()}P
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">당첨금액: </span>
                      <span
                        className={
                          bet.winAmount > 0 ? "text-green-400" : "text-gray-500"
                        }
                      >
                        {bet.winAmount.toLocaleString()}P
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
