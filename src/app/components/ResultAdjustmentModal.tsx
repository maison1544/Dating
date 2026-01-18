import {
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { CountdownTimer } from "./CountdownTimer";
import { CustomAlert } from "./CustomAlert";

interface BetOption {
  option: string;
  amount: number;
  count: number;
  percentage: number;
}

interface GameRound {
  id: number;
  gameType: string;
  roundNumber: number;
  result: string;
  detailedResult?: string;
  totalBets: number;
  totalAmount: number;
  startTime: string;
  endTime: string;
  countdownEndTime?: string;
  status: "진행중" | "완료" | "대기";
  participants: number;
  date: string;
  betDistribution?: BetOption[];
  reservedResult?: string; // 예약된 결과
}

// 개별 선택을 위한 인터페이스
interface PowerballSelection {
  normalBallOddEven?: "홀" | "짝";
  normalBallOverUnder?: "오버" | "언더";
  powerBallOddEven?: "홀" | "짝";
  powerBallOverUnder?: "오버" | "언더";
}

interface LadderSelection {
  start?: "좌출발" | "우출발";
  lines?: "3줄" | "4줄";
  oddEven?: "홀" | "짝";
}

interface ResultAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameRounds: GameRound[];
  onUpdateReservedResult: (roundId: number, result: string | null) => void;
}

export function ResultAdjustmentModal({
  isOpen,
  onClose,
  gameRounds,
  onUpdateReservedResult,
}: ResultAdjustmentModalProps) {
  const [selectedResults, setSelectedResults] = useState<{
    [key: number]: string;
  }>({});

  // 개별 선택 상태 관리
  const [powerballSelections, setPowerballSelections] = useState<{
    [key: number]: PowerballSelection;
  }>({});

  const [ladderSelections, setLadderSelections] = useState<{
    [key: number]: LadderSelection;
  }>({});

  // 커스텀 알림 상태
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
  }>({ isOpen: false, title: "", message: "", type: "info" });

  // 진행중인 게임만 필터링
  const activeRounds = gameRounds.filter((round) => round.status === "진행중");

  // 전체 예약 상태 확인
  const allReserved =
    activeRounds.length > 0 &&
    activeRounds.every((round) => round.reservedResult);

  const isPowerballSelectionComplete = (selection?: PowerballSelection) => {
    // At least one option must be explicitly selected (not auto)
    return !!(
      selection?.normalBallOddEven ||
      selection?.normalBallOverUnder ||
      selection?.powerBallOddEven ||
      selection?.powerBallOverUnder
    );
  };

  const isLadderSelectionComplete = (selection?: LadderSelection) => {
    // At least one option must be explicitly selected (not auto)
    return !!(selection?.start || selection?.lines || selection?.oddEven);
  };

  // 모든 게임이 선택되어 있는지 확인 (전체 예약 버튼 활성화 조건)
  const allHaveSelection =
    activeRounds.length > 0 &&
    activeRounds.every((round) => {
      if (round.reservedResult) return true;
      if (round.gameType === "파워볼") {
        return isPowerballSelectionComplete(powerballSelections[round.id]);
      }
      if (round.gameType === "사다리") {
        return isLadderSelectionComplete(ladderSelections[round.id]);
      }
      return true;
    });

  useEffect(() => {
    // 이미 예약된 결과가 있으면 로드 (초기 로드 시에만)
    const reserved: { [key: number]: string } = {};
    const powerball: { [key: number]: PowerballSelection } = {};
    const ladder: { [key: number]: LadderSelection } = {};

    activeRounds.forEach((round) => {
      if (round.reservedResult) {
        reserved[round.id] = round.reservedResult;

        // 예약된 결과를 개별 선택으로 파싱
        if (round.gameType === "파워볼") {
          const match = round.reservedResult.match(
            /일반볼\s+(.+?)\s+파워볼\s+(.+)/,
          );
          const normalBall = match?.[1] || "";
          const powerBall = match?.[2] || "";
          const normalParts = normalBall.split("/").map((v) => v.trim());
          const powerParts = powerBall.split("/").map((v) => v.trim());

          if (normalParts.length === 2 && powerParts.length === 2) {
            powerball[round.id] = {
              normalBallOddEven: normalParts[0] as "홀" | "짝",
              normalBallOverUnder: normalParts[1] as "오버" | "언더",
              powerBallOddEven: powerParts[0] as "홀" | "짝",
              powerBallOverUnder: powerParts[1] as "오버" | "언더",
            };
          }
        } else if (round.gameType === "사다리") {
          const parts = round.reservedResult.split("/");
          if (parts.length === 3) {
            ladder[round.id] = {
              start: parts[0] as "좌출발" | "우출발",
              lines: parts[1] as "3줄" | "4줄",
              oddEven: parts[2] as "홀" | "짝",
            };
          }
        }
      }
    });

    setSelectedResults(reserved);
    setPowerballSelections(powerball);
    setLadderSelections(ladder);
  }, [isOpen]); // gameRounds 대신 isOpen으로 변경하여 모달이 열릴 때만 초기화

  if (!isOpen) return null;

  // 가장 배팅이 많이 몰린 조합 찾기
  const getMostBettedCombination = (round: GameRound) => {
    if (!round.betDistribution) return null;

    // 배팅이 아예 없는 경우 null 반환
    const totalBetAmount = round.betDistribution.reduce(
      (sum, bet) => sum + (bet?.amount || 0),
      0,
    );
    if (totalBetAmount === 0) return null;

    if (round.gameType === "파워볼") {
      // 파워볼: 16가지 조합 중 최대값 (일반볼 + 파워볼 조합)
      const normalBallOptions = [
        { key: "홀/오버", indices: [0, 2] },
        { key: "홀/언더", indices: [0, 3] },
        { key: "짝/오버", indices: [1, 2] },
        { key: "짝/언더", indices: [1, 3] },
      ];

      const powerBallOptions = [
        { key: "홀/오버", indices: [4, 6] },
        { key: "홀/언더", indices: [4, 7] },
        { key: "짝/오버", indices: [5, 6] },
        { key: "짝/언더", indices: [5, 7] },
      ];

      let maxAmount = 0;
      let maxCombination = "";

      normalBallOptions.forEach((normal) => {
        powerBallOptions.forEach((power) => {
          const amount = [...normal.indices, ...power.indices].reduce(
            (sum, idx) => sum + (round.betDistribution![idx]?.amount || 0),
            0,
          );
          if (amount > maxAmount) {
            maxAmount = amount;
            maxCombination = `일반볼 ${normal.key} 파워볼 ${power.key}`;
          }
        });
      });

      // 최대 금액이 0이면 null 반환
      if (maxAmount === 0) return null;
      return { combination: maxCombination, amount: maxAmount };
    } else if (round.gameType === "사다리") {
      // 사다리: 조합배팅 기준
      const combinations = [
        { key: "좌출발/3줄/홀", label: "좌3홀" },
        { key: "좌출발/3줄/짝", label: "좌3짝" },
        { key: "좌출발/4줄/홀", label: "좌4홀" },
        { key: "좌출발/4줄/짝", label: "좌4짝" },
        { key: "우출발/3줄/홀", label: "우3홀" },
        { key: "우출발/3줄/짝", label: "우3짝" },
        { key: "우출발/4줄/홀", label: "우4홀" },
        { key: "우출발/4줄/짝", label: "우4짝" },
      ];

      if (round.betDistribution.length >= 10) {
        // 조합배팅이 있는 경우
        const comboBets = round.betDistribution.slice(6, 10);
        const maxBet = comboBets.reduce(
          (max, bet) => (bet.amount > max.amount ? bet : max),
          comboBets[0],
        );

        const comboIndex = round.betDistribution.indexOf(maxBet);
        const comboKey = combinations[comboIndex - 6]?.key || "";

        // 최대 금액이 0이면 null 반환
        if (maxBet.amount === 0) return null;
        return { combination: comboKey, amount: maxBet.amount };
      }
    }

    return null;
  };

  // 반대 결과 추천
  const getRecommendedResult = (round: GameRound) => {
    const mostBetted = getMostBettedCombination(round);
    if (!mostBetted) return null;

    if (round.gameType === "파워볼") {
      // 파워볼: 각 요소의 반대로 설정
      const match = mostBetted.combination.match(/일반볼 (.+?) 파워볼 (.+)/);
      if (match) {
        const [, normalBall, powerBall] = match;

        const reverseNormal = normalBall
          .split("/")
          .map((part) => {
            if (part.includes("홀")) return part.replace("홀", "짝");
            if (part.includes("짝")) return part.replace("짝", "홀");
            if (part.includes("오버")) return part.replace("오버", "언더");
            if (part.includes("언더")) return part.replace("언더", "오버");
            return part;
          })
          .join("/");

        const reversePower = powerBall
          .split("/")
          .map((part) => {
            if (part.includes("홀")) return part.replace("홀", "짝");
            if (part.includes("짝")) return part.replace("짝", "홀");
            if (part.includes("오버")) return part.replace("오버", "언더");
            if (part.includes("언더")) return part.replace("언더", "오버");
            return part;
          })
          .join("/");

        return `일반볼 ${reverseNormal} 파워볼 ${reversePower}`;
      }
    } else if (round.gameType === "사다리") {
      // 사다리: 각 요소의 반대로 설정
      const parts = mostBetted.combination.split("/");
      const reversedParts = parts.map((part) => {
        if (part === "좌출발") return "우출발";
        if (part === "우출발") return "좌출발";
        if (part === "3줄") return "4줄";
        if (part === "4줄") return "3줄";
        if (part === "홀") return "짝";
        if (part === "짝") return "홀";
        return part;
      });
      return reversedParts.join("/");
    }

    return null;
  };

  // 개별 예약
  const handleReserveResult = (roundId: number) => {
    const result = selectedResults[roundId];
    const round = activeRounds.find((r) => r.id === roundId);
    if (result && (!round?.reservedResult || round.reservedResult !== result)) {
      onUpdateReservedResult(roundId, result);
    }
  };

  // 예약 취소
  const handleCancelReservation = (roundId: number) => {
    // state에서도 제거
    setSelectedResults((prev) => {
      const newResults = { ...prev };
      delete newResults[roundId];
      return newResults;
    });

    // 개별 선택도 초기화
    setPowerballSelections((prev) => {
      const newSelections = { ...prev };
      delete newSelections[roundId];
      return newSelections;
    });

    setLadderSelections((prev) => {
      const newSelections = { ...prev };
      delete newSelections[roundId];
      return newSelections;
    });

    onUpdateReservedResult(roundId, null);
  };

  // 전체 일괄 예약/취소 토글
  const handleReserveAll = () => {
    if (allReserved) {
      // 전체 취소
      activeRounds.forEach((round) => {
        onUpdateReservedResult(round.id, null);
      });
      setSelectedResults({});
      setPowerballSelections({});
      setLadderSelections({});
    } else {
      // 선택된 게임만 예약
      activeRounds.forEach((round) => {
        const selected = selectedResults[round.id];
        if (selected && round.reservedResult !== selected) {
          onUpdateReservedResult(round.id, selected);
        }
      });
    }
  };

  // 추천 결과 일괄 적용
  const handleApplyRecommendedAll = () => {
    const newResults: { [key: number]: string } = {};
    const newPowerballSelections: {
      [key: number]: PowerballSelection;
    } = {};
    const newLadderSelections: {
      [key: number]: LadderSelection;
    } = {};

    activeRounds.forEach((round) => {
      const recommended = getRecommendedResult(round);
      if (recommended) {
        newResults[round.id] = recommended;

        // 개별 선택도 함께 업데이트
        if (round.gameType === "파워볼") {
          // "일반볼 홀/언더 파워볼 짝/오버" 형식 파싱
          const match = recommended.match(/일반볼 (.+?) 파워볼 (.+)/);
          if (match) {
            const [, normalBall, powerBall] = match;
            const normalParts = normalBall.split("/");
            const powerParts = powerBall.split("/");

            if (normalParts.length === 2 && powerParts.length === 2) {
              newPowerballSelections[round.id] = {
                normalBallOddEven: normalParts[0] as "홀" | "짝",
                normalBallOverUnder: normalParts[1] as "오버" | "언더",
                powerBallOddEven: powerParts[0] as "홀" | "짝",
                powerBallOverUnder: powerParts[1] as "오버" | "언더",
              };
            }
          }
        } else if (round.gameType === "사다리") {
          const parts = recommended.split("/");
          if (parts.length === 3) {
            newLadderSelections[round.id] = {
              start: parts[0] as "좌출발" | "우출발",
              lines: parts[1] as "3줄" | "4줄",
              oddEven: parts[2] as "홀" | "짝",
            };
          }
        }
      }
    });

    setSelectedResults((prev) => ({ ...prev, ...newResults }));
    setPowerballSelections((prev) => ({
      ...prev,
      ...newPowerballSelections,
    }));
    setLadderSelections((prev) => ({
      ...prev,
      ...newLadderSelections,
    }));
  };

  // 파워볼 개별 선택 업데이트
  const updatePowerballSelection = (
    roundId: number,
    field: keyof PowerballSelection,
    value: string,
  ) => {
    // 현재 선택 상태 가져오기
    const current = powerballSelections[roundId] || {};
    const updated: PowerballSelection = { ...current };

    if (value) {
      (updated as any)[field] = value;
    } else {
      delete (updated as any)[field];
    }

    // 선택 상태 업데이트
    setPowerballSelections((prev) => ({
      ...prev,
      [roundId]: updated,
    }));

    // 하나라도 선택되면 결과 생성 (미선택 항목은 '자동'으로 표시)
    if (isPowerballSelectionComplete(updated)) {
      const normalOddEven = updated.normalBallOddEven || "자동";
      const normalOverUnder = updated.normalBallOverUnder || "자동";
      const powerOddEven = updated.powerBallOddEven || "자동";
      const powerOverUnder = updated.powerBallOverUnder || "자동";
      const resultString = `일반볼 ${normalOddEven}/${normalOverUnder} 파워볼 ${powerOddEven}/${powerOverUnder}`;
      setSelectedResults((prevResults) => ({
        ...prevResults,
        [roundId]: resultString,
      }));
    } else {
      // 아무것도 선택되지 않으면 결과 제거
      setSelectedResults((prevResults) => {
        const next = { ...prevResults };
        delete next[roundId];
        return next;
      });
    }
  };

  // 사다리 개별 선택 업데이트
  const updateLadderSelection = (
    roundId: number,
    field: keyof LadderSelection,
    value: string,
  ) => {
    // 현재 선택 상태 가져오기
    const current = ladderSelections[roundId] || {};
    const updated: LadderSelection = { ...current };

    if (value) {
      (updated as any)[field] = value;
    } else {
      delete (updated as any)[field];
    }

    // 선택 상태 업데이트
    setLadderSelections((prev) => ({
      ...prev,
      [roundId]: updated,
    }));

    // 하나라도 선택되면 결과 생성 (미선택 항목은 '자동'으로 표시)
    if (isLadderSelectionComplete(updated)) {
      const start = updated.start || "자동";
      const lines = updated.lines || "자동";
      const oddEven = updated.oddEven || "자동";
      const resultString = `${start}/${lines}/${oddEven}`;
      setSelectedResults((prevResults) => ({
        ...prevResults,
        [roundId]: resultString,
      }));
    } else {
      // 아무것도 선택되지 않으면 결과 제거
      setSelectedResults((prevResults) => {
        const next = { ...prevResults };
        delete next[roundId];
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      {/* 커스텀 알림 */}
      <CustomAlert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />

      <div className="bg-gray-900 rounded-xl border-2 border-indigo-500/30 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">결과조정</h2>
              <p className="text-xs text-gray-400">
                진행중인 게임의 결과를 예약할 수 있습니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-h-0 overflow-y-auto">
          {activeRounds.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">진행중인 게임이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 일괄 적용 버튼 */}
              <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span className="text-white text-sm font-semibold">
                    일괄 작업
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyRecommendedAll}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs font-semibold"
                  >
                    전체 추천 적용
                  </button>
                  <button
                    onClick={handleReserveAll}
                    disabled={!allReserved && !allHaveSelection}
                    className={`px-3 py-1.5 text-white rounded-lg transition-colors text-xs font-semibold ${
                      allReserved
                        ? "bg-red-600 hover:bg-red-700"
                        : allHaveSelection
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-gray-700 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {allReserved ? "전체 취소" : "전체 예약"}
                  </button>
                </div>
              </div>

              {/* 게임별 결과조정 */}
              <div className="grid grid-cols-2 gap-3">
                {activeRounds.map((round) => {
                  const mostBetted = getMostBettedCombination(round);
                  const recommended = getRecommendedResult(round);
                  const isReserved =
                    round.reservedResult !== undefined &&
                    round.reservedResult !== null;
                  const selected = selectedResults[round.id];
                  const canReserve = !!(
                    selected &&
                    (!isReserved || selected !== round.reservedResult)
                  );

                  return (
                    <div
                      key={round.id}
                      className={`bg-gray-800 rounded-lg p-4 border transition-all flex flex-col ${
                        isReserved
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-gray-700"
                      }`}
                    >
                      {/* 게임 정보 헤더 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              round.gameType === "파워볼"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {round.gameType}
                          </div>
                          <span className="text-white font-bold text-sm">
                            #{round.roundNumber}회차
                          </span>
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Clock className="w-3 h-3" />
                            <CountdownTimer
                              endTime={round.countdownEndTime || round.endTime}
                            />
                          </div>
                        </div>
                        {isReserved && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 text-xs font-semibold">
                              예약완료
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 배팅 현황 */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-900/50 rounded p-2">
                          <div className="text-gray-400 text-xs mb-0.5">
                            총 배팅금액
                          </div>
                          <div className="text-white font-bold text-sm">
                            {round.totalAmount.toLocaleString()}P
                          </div>
                        </div>
                        <div className="bg-gray-900/50 rounded p-2">
                          <div className="text-gray-400 text-xs mb-0.5">
                            배팅 참여자
                          </div>
                          <div className="text-white font-bold text-sm">
                            {round.participants}명 ({round.totalBets}건)
                          </div>
                        </div>
                      </div>

                      {/* 가장 많이 몰린 조합 - 항상 표시 */}
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-red-400 text-xs font-semibold mb-0.5">
                              ⚠️ 최다 배팅 조합
                            </div>
                            <div className="text-white font-bold text-sm">
                              {mostBetted ? mostBetted.combination : "-"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-red-400 font-bold text-sm">
                              {mostBetted
                                ? `${mostBetted.amount.toLocaleString()}P`
                                : "-"}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {mostBetted && round.totalAmount > 0
                                ? Math.round(
                                    (mostBetted.amount / round.totalAmount) *
                                      100,
                                  )
                                : 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 추천 결과 - 항상 표시 */}
                      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-indigo-400 text-xs font-semibold">
                              추천 결과
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">
                              {recommended || "-"}
                            </span>
                            {recommended && (
                              <button
                                onClick={() => {
                                  // 개별 선택도 함께 업데이트
                                  if (round.gameType === "파워볼") {
                                    // "일반볼 홀/언더 파워볼 짝/오버" 형식 파싱
                                    const match =
                                      recommended.match(
                                        /일반볼 (.+?) 파워볼 (.+)/,
                                      );
                                    if (match) {
                                      const [, normalBall, powerBall] = match;
                                      const normalParts = normalBall.split("/");
                                      const powerParts = powerBall.split("/");

                                      if (
                                        normalParts.length === 2 &&
                                        powerParts.length === 2
                                      ) {
                                        setPowerballSelections((prev) => ({
                                          ...prev,
                                          [round.id]: {
                                            normalBallOddEven:
                                              normalParts[0] as "홀" | "짝",
                                            normalBallOverUnder:
                                              normalParts[1] as "오버" | "언더",
                                            powerBallOddEven: powerParts[0] as
                                              | "홀"
                                              | "짝",
                                            powerBallOverUnder:
                                              powerParts[1] as "오버" | "언더",
                                          },
                                        }));

                                        setSelectedResults((prev) => ({
                                          ...prev,
                                          [round.id]: recommended,
                                        }));
                                      }
                                    }
                                  } else if (round.gameType === "사다리") {
                                    const parts = recommended.split("/");
                                    if (parts.length === 3) {
                                      setLadderSelections((prev) => ({
                                        ...prev,
                                        [round.id]: {
                                          start: parts[0] as
                                            | "좌출발"
                                            | "우출발",
                                          lines: parts[1] as "3줄" | "4줄",
                                          oddEven: parts[2] as "홀" | "짝",
                                        },
                                      }));

                                      setSelectedResults((prev) => ({
                                        ...prev,
                                        [round.id]: recommended,
                                      }));
                                    }
                                  }
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
                              >
                                적용
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 결과 선택 - 개별 선택 UI */}
                      <div className="mb-3">
                        <label className="text-gray-400 text-xs mb-1.5 block">
                          결과 선택
                        </label>

                        {round.gameType === "파워볼" ? (
                          <div className="space-y-2">
                            {/* 일반볼 + 파워볼 통합 */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-indigo-400 text-xs mb-1">
                                    일반볼 홀/짝
                                  </div>
                                  <select
                                    value={
                                      powerballSelections[round.id]
                                        ?.normalBallOddEven || ""
                                    }
                                    onChange={(e) =>
                                      updatePowerballSelection(
                                        round.id,
                                        "normalBallOddEven",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                  >
                                    <option value="">자동결과</option>
                                    <option value="홀">홀</option>
                                    <option value="짝">짝</option>
                                  </select>
                                </div>
                                <div>
                                  <div className="text-indigo-400 text-xs mb-1">
                                    일반볼 오버/언더
                                  </div>
                                  <select
                                    value={
                                      powerballSelections[round.id]
                                        ?.normalBallOverUnder || ""
                                    }
                                    onChange={(e) =>
                                      updatePowerballSelection(
                                        round.id,
                                        "normalBallOverUnder",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                  >
                                    <option value="">자동결과</option>
                                    <option value="오버">오버</option>
                                    <option value="언더">언더</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-blue-400 text-xs mb-1">
                                    파워볼 홀/짝
                                  </div>
                                  <select
                                    value={
                                      powerballSelections[round.id]
                                        ?.powerBallOddEven || ""
                                    }
                                    onChange={(e) =>
                                      updatePowerballSelection(
                                        round.id,
                                        "powerBallOddEven",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                  >
                                    <option value="">자동결과</option>
                                    <option value="홀">홀</option>
                                    <option value="짝">짝</option>
                                  </select>
                                </div>
                                <div>
                                  <div className="text-blue-400 text-xs mb-1">
                                    파워볼 오버/언더
                                  </div>
                                  <select
                                    value={
                                      powerballSelections[round.id]
                                        ?.powerBallOverUnder || ""
                                    }
                                    onChange={(e) =>
                                      updatePowerballSelection(
                                        round.id,
                                        "powerBallOverUnder",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                  >
                                    <option value="">자동결과</option>
                                    <option value="오버">오버</option>
                                    <option value="언더">언더</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* 액션 버튼 - 별도 섹션 (하단 고정) */}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* 사다리 개별 선택 */}
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <div className="text-purple-400 text-xs mb-1">
                                  출발
                                </div>
                                <select
                                  value={
                                    ladderSelections[round.id]?.start || ""
                                  }
                                  onChange={(e) =>
                                    updateLadderSelection(
                                      round.id,
                                      "start",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                  <option value="">자동결과</option>
                                  <option value="좌출발">좌</option>
                                  <option value="우출발">우</option>
                                </select>
                              </div>
                              <div>
                                <div className="text-purple-400 text-xs mb-1">
                                  줄
                                </div>
                                <select
                                  value={
                                    ladderSelections[round.id]?.lines || ""
                                  }
                                  onChange={(e) =>
                                    updateLadderSelection(
                                      round.id,
                                      "lines",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                  <option value="">자동결과</option>
                                  <option value="3줄">3줄</option>
                                  <option value="4줄">4줄</option>
                                </select>
                              </div>
                              <div>
                                <div className="text-purple-400 text-xs mb-1">
                                  홀/짝
                                </div>
                                <select
                                  value={
                                    ladderSelections[round.id]?.oddEven || ""
                                  }
                                  onChange={(e) =>
                                    updateLadderSelection(
                                      round.id,
                                      "oddEven",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                  <option value="">자동결과</option>
                                  <option value="홀">홀</option>
                                  <option value="짝">짝</option>
                                </select>
                              </div>
                            </div>

                            {/* 액션 버튼 - 별도 섹션 (하단 고정) */}
                          </div>
                        )}
                      </div>

                      {/* 결과 예약 - 버튼 섹션 (하단 고정) */}
                      <div className="mt-auto space-y-2">
                        {/* 액션 버튼 */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReserveResult(round.id)}
                            disabled={!canReserve}
                            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors text-sm font-semibold"
                          >
                            {isReserved ? "예약 변경" : "결과 예약"}
                          </button>
                          {isReserved && (
                            <button
                              onClick={() => handleCancelReservation(round.id)}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm font-semibold"
                            >
                              예약 취소
                            </button>
                          )}
                        </div>

                        {/* 선택된 결과 표시 */}
                        {selectedResults[round.id] && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                            <div className="text-green-400 text-xs">
                              ✓ 선택완료: {selectedResults[round.id]}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
