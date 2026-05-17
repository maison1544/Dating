import {
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
  status: "진행중" | "완료" | "완료(예약)" | "대기";
  participants: number;
  date: string;
  betDistribution?: BetOption[];
  reservedResult?: string; // 예약된 결과
  isReservationPending?: boolean;
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

// 사다리 게임 유효 조합 규칙
// 좌출발 + 3줄 = 짝, 좌출발 + 4줄 = 홀
// 우출발 + 3줄 = 홀, 우출발 + 4줄 = 짝

// 출발 + 줄 → 홀/짝 결정
const getValidLadderOddEven = (
  start?: "좌출발" | "우출발",
  lines?: "3줄" | "4줄",
): "홀" | "짝" | undefined => {
  if (!start || !lines) return undefined;
  if (start === "좌출발" && lines === "3줄") return "짝";
  if (start === "좌출발" && lines === "4줄") return "홀";
  if (start === "우출발" && lines === "3줄") return "홀";
  if (start === "우출발" && lines === "4줄") return "짝";
  return undefined;
};

// 줄 + 홀/짝 → 출발 결정
const getValidLadderStart = (
  lines?: "3줄" | "4줄",
  oddEven?: "홀" | "짝",
): "좌출발" | "우출발" | undefined => {
  if (!lines || !oddEven) return undefined;
  if (lines === "3줄" && oddEven === "짝") return "좌출발";
  if (lines === "3줄" && oddEven === "홀") return "우출발";
  if (lines === "4줄" && oddEven === "짝") return "우출발";
  if (lines === "4줄" && oddEven === "홀") return "좌출발";
  return undefined;
};

// 출발 + 홀/짝 → 줄 결정
const getValidLadderLines = (
  start?: "좌출발" | "우출발",
  oddEven?: "홀" | "짝",
): "3줄" | "4줄" | undefined => {
  if (!start || !oddEven) return undefined;
  if (start === "좌출발" && oddEven === "짝") return "3줄";
  if (start === "좌출발" && oddEven === "홀") return "4줄";
  if (start === "우출발" && oddEven === "짝") return "4줄";
  if (start === "우출발" && oddEven === "홀") return "3줄";
  return undefined;
};

// 사다리 조합이 유효한지 검증
const isValidLadderCombination = (
  start?: "좌출발" | "우출발",
  lines?: "3줄" | "4줄",
  oddEven?: "홀" | "짝",
): boolean => {
  if (!start || !lines || !oddEven) return true; // 일부만 선택된 경우 유효
  const validOddEven = getValidLadderOddEven(start, lines);
  return validOddEven === oddEven;
};

interface ResultAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameRounds: GameRound[];
  onUpdateReservedResult: (roundId: number, result: string | null) => void;
  serverTimeOffset?: number; // 서버 시간 오프셋 (ms)
  onTimerEnd?: (gameType: string) => void; // 타이머 종료 시 즉시 갱신 트리거
}

export function ResultAdjustmentModal({
  isOpen,
  onClose,
  gameRounds,
  onUpdateReservedResult,
  serverTimeOffset = 0,
  onTimerEnd,
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

  // 진행중인 게임만 필터링 + 게임타입별 정렬 (파워볼 -> 사다리 순서 고정)
  const activeRounds = useMemo(() => {
    const filtered = gameRounds.filter((round) => round.status === "진행중");
    // 게임타입 우선순위: 파워볼(0) -> 사다리(1), 같은 타입이면 회차번호 오름차순
    return filtered.sort((a, b) => {
      const typeOrder = (type: string) => (type === "파워볼" ? 0 : 1);
      const typeCompare = typeOrder(a.gameType) - typeOrder(b.gameType);
      if (typeCompare !== 0) return typeCompare;
      return a.roundNumber - b.roundNumber;
    });
  }, [gameRounds]);

  const isRoundReserved = (round: GameRound) =>
    round.reservedResult !== undefined && round.reservedResult !== null;

  const isRoundLocked = (round: GameRound) =>
    isRoundReserved(round) || !!round.isReservationPending;

  const hasPendingReservation = activeRounds.some(
    (round) => round.isReservationPending,
  );

  // 전체 예약 상태 확인
  const allReserved =
    activeRounds.length > 0 &&
    activeRounds.every((round) => isRoundReserved(round));

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
      if (isRoundLocked(round)) return true;
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

        // 예약된 결과를 개별 선택으로 파싱 ("자동" 값은 제외)
        if (round.gameType === "파워볼") {
          const match = round.reservedResult.match(
            /일반볼\s+(.+?)\s+파워볼\s+(.+)/,
          );
          const normalBall = match?.[1] || "";
          const powerBall = match?.[2] || "";
          const normalParts = normalBall
            .split("/")
            .map((v: string) => v.trim());
          const powerParts = powerBall.split("/").map((v: string) => v.trim());

          if (normalParts.length === 2 && powerParts.length === 2) {
            const selection: PowerballSelection = {};
            if (normalParts[0] !== "자동") {
              selection.normalBallOddEven = normalParts[0] as "홀" | "짝";
            }
            if (normalParts[1] !== "자동") {
              selection.normalBallOverUnder = normalParts[1] as "오버" | "언더";
            }
            if (powerParts[0] !== "자동") {
              selection.powerBallOddEven = powerParts[0] as "홀" | "짝";
            }
            if (powerParts[1] !== "자동") {
              selection.powerBallOverUnder = powerParts[1] as "오버" | "언더";
            }
            if (Object.keys(selection).length > 0) {
              powerball[round.id] = selection;
            }
          }
        } else if (round.gameType === "사다리") {
          const parts = round.reservedResult.split("/");
          if (parts.length === 3) {
            const selection: LadderSelection = {};
            if (parts[0] !== "자동") {
              selection.start = parts[0] as "좌출발" | "우출발";
            }
            if (parts[1] !== "자동") {
              selection.lines = parts[1] as "3줄" | "4줄";
            }
            if (parts[2] !== "자동") {
              selection.oddEven = parts[2] as "홀" | "짝";
            }
            if (Object.keys(selection).length > 0) {
              ladder[round.id] = selection;
            }
          }
        }
      }
    });

    setSelectedResults(reserved);
    setPowerballSelections(powerball);
    setLadderSelections(ladder);
  }, [isOpen]); // gameRounds 대신 isOpen으로 변경하여 모달이 열릴 때만 초기화

  useEffect(() => {
    if (!isOpen || activeRounds.length === 0) return;

    setSelectedResults((prev) => {
      let changed = false;
      const next = { ...prev };

      activeRounds.forEach((round) => {
        if (!isRoundLocked(round)) return;

        if (round.reservedResult) {
          if (next[round.id] !== round.reservedResult) {
            next[round.id] = round.reservedResult;
            changed = true;
          }
        } else if (Object.prototype.hasOwnProperty.call(next, round.id)) {
          delete next[round.id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    setPowerballSelections((prev) => {
      let changed = false;
      const next = { ...prev };

      activeRounds.forEach((round) => {
        if (!isRoundLocked(round) || round.gameType !== "파워볼") return;

        if (!round.reservedResult) {
          if (Object.prototype.hasOwnProperty.call(next, round.id)) {
            delete next[round.id];
            changed = true;
          }
          return;
        }

        const match = round.reservedResult.match(
          /일반볼\s+(.+?)\s+파워볼\s+(.+)/,
        );
        const normalBall = match?.[1] || "";
        const powerBall = match?.[2] || "";
        const normalParts = normalBall.split("/").map((v: string) => v.trim());
        const powerParts = powerBall.split("/").map((v: string) => v.trim());

        if (normalParts.length === 2 && powerParts.length === 2) {
          // "자동" 값은 제외하고 실제 선택값만 설정
          const nextSelection: PowerballSelection = {};
          if (normalParts[0] !== "자동") {
            nextSelection.normalBallOddEven = normalParts[0] as "홀" | "짝";
          }
          if (normalParts[1] !== "자동") {
            nextSelection.normalBallOverUnder = normalParts[1] as
              | "오버"
              | "언더";
          }
          if (powerParts[0] !== "자동") {
            nextSelection.powerBallOddEven = powerParts[0] as "홀" | "짝";
          }
          if (powerParts[1] !== "자동") {
            nextSelection.powerBallOverUnder = powerParts[1] as "오버" | "언더";
          }

          const current = next[round.id];
          const hasChanges =
            !current ||
            current.normalBallOddEven !== nextSelection.normalBallOddEven ||
            current.normalBallOverUnder !== nextSelection.normalBallOverUnder ||
            current.powerBallOddEven !== nextSelection.powerBallOddEven ||
            current.powerBallOverUnder !== nextSelection.powerBallOverUnder;

          if (hasChanges) {
            if (Object.keys(nextSelection).length > 0) {
              next[round.id] = nextSelection;
            } else {
              delete next[round.id];
            }
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });

    setLadderSelections((prev) => {
      let changed = false;
      const next = { ...prev };

      activeRounds.forEach((round) => {
        if (!isRoundLocked(round) || round.gameType !== "사다리") return;

        if (!round.reservedResult) {
          if (Object.prototype.hasOwnProperty.call(next, round.id)) {
            delete next[round.id];
            changed = true;
          }
          return;
        }

        const parts = round.reservedResult.split("/");
        if (parts.length === 3) {
          // "자동" 값은 제외하고 실제 선택값만 설정
          const nextSelection: LadderSelection = {};
          if (parts[0] !== "자동") {
            nextSelection.start = parts[0] as "좌출발" | "우출발";
          }
          if (parts[1] !== "자동") {
            nextSelection.lines = parts[1] as "3줄" | "4줄";
          }
          if (parts[2] !== "자동") {
            nextSelection.oddEven = parts[2] as "홀" | "짝";
          }

          const current = next[round.id];
          const hasChanges =
            !current ||
            current.start !== nextSelection.start ||
            current.lines !== nextSelection.lines ||
            current.oddEven !== nextSelection.oddEven;

          if (hasChanges) {
            if (Object.keys(nextSelection).length > 0) {
              next[round.id] = nextSelection;
            } else {
              delete next[round.id];
            }
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [activeRounds, isOpen]);

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
      const distribution = round.betDistribution || [];
      const pickPair = (
        leftIndex: number,
        rightIndex: number,
        leftLabel: string,
        rightLabel: string,
      ) => {
        const left = distribution[leftIndex];
        const right = distribution[rightIndex];
        const leftAmount = left?.amount || 0;
        const rightAmount = right?.amount || 0;
        const leftCount = left?.count || 0;
        const rightCount = right?.count || 0;

        if (leftAmount === 0 && rightAmount === 0) {
          return { label: "자동", amount: 0 };
        }

        if (leftAmount === rightAmount) {
          if (leftCount === rightCount) {
            return { label: leftLabel, amount: leftAmount };
          }
          return leftCount > rightCount
            ? { label: leftLabel, amount: leftAmount }
            : { label: rightLabel, amount: rightAmount };
        }

        return leftAmount > rightAmount
          ? { label: leftLabel, amount: leftAmount }
          : { label: rightLabel, amount: rightAmount };
      };

      const normalOddEven = pickPair(0, 1, "홀", "짝");
      const normalUnderOver = pickPair(2, 3, "언더", "오버");
      const powerOddEven = pickPair(4, 5, "홀", "짝");
      const powerUnderOver = pickPair(6, 7, "언더", "오버");

      const totalAmount =
        normalOddEven.amount +
        normalUnderOver.amount +
        powerOddEven.amount +
        powerUnderOver.amount;

      if (totalAmount === 0) return null;

      return {
        combination: `일반볼 ${normalOddEven.label}/${normalUnderOver.label} 파워볼 ${powerOddEven.label}/${powerUnderOver.label}`,
        amount: totalAmount,
      };
    } else if (round.gameType === "사다리") {
      // 사다리: 단일 배팅과 조합배팅 모두 처리
      // betDistribution 순서: 0=좌출발, 1=우출발, 2=3줄, 3=4줄, 4=홀, 5=짝, 6=좌3짝, 7=좌4홀, 8=우3홀, 9=우4짝
      const distribution = round.betDistribution || [];

      // 파워볼과 동일한 방식으로 단일 배팅 쌍 비교
      const pickPair = (
        leftIndex: number,
        rightIndex: number,
        leftLabel: string,
        rightLabel: string,
      ) => {
        const left = distribution[leftIndex];
        const right = distribution[rightIndex];
        const leftAmount = left?.amount || 0;
        const rightAmount = right?.amount || 0;
        const leftCount = left?.count || 0;
        const rightCount = right?.count || 0;

        if (leftAmount === 0 && rightAmount === 0) {
          return { label: "자동", amount: 0 };
        }

        if (leftAmount === rightAmount) {
          if (leftCount === rightCount) {
            return { label: leftLabel, amount: leftAmount };
          }
          return leftCount > rightCount
            ? { label: leftLabel, amount: leftAmount }
            : { label: rightLabel, amount: rightAmount };
        }

        return leftAmount > rightAmount
          ? { label: leftLabel, amount: leftAmount }
          : { label: rightLabel, amount: rightAmount };
      };

      // 단일 배팅 쌍 비교: 좌/우, 3줄/4줄, 홀/짝
      const startPos = pickPair(0, 1, "좌출발", "우출발");
      const lineCount = pickPair(2, 3, "3줄", "4줄");
      const oddEven = pickPair(4, 5, "홀", "짝");

      const singleBetTotal =
        startPos.amount + lineCount.amount + oddEven.amount;

      // 조합배팅 확인 (index 6-9)
      let comboBetMax = { key: "", amount: 0 };
      if (distribution.length >= 10) {
        const combinations = [
          { key: "좌출발/3줄/짝", label: "좌3짝" },
          { key: "좌출발/4줄/홀", label: "좌4홀" },
          { key: "우출발/3줄/홀", label: "우3홀" },
          { key: "우출발/4줄/짝", label: "우4짝" },
        ];
        const comboBets = distribution.slice(6, 10);
        const maxBet = comboBets.reduce(
          (max, bet) => (bet.amount > max.amount ? bet : max),
          comboBets[0],
        );
        const comboIndex = distribution.indexOf(maxBet);
        if (maxBet.amount > 0) {
          comboBetMax = {
            key: combinations[comboIndex - 6]?.key || "",
            amount: maxBet.amount,
          };
        }
      }

      // 단일 배팅과 조합배팅 중 더 큰 금액 선택
      if (singleBetTotal === 0 && comboBetMax.amount === 0) return null;

      if (comboBetMax.amount > singleBetTotal) {
        // 조합배팅이 더 큼
        return { combination: comboBetMax.key, amount: comboBetMax.amount };
      } else {
        // 단일 배팅이 더 크거나 같음 - 각 항목별로 표시
        return {
          combination: `${startPos.label}/${lineCount.label}/${oddEven.label}`,
          amount: singleBetTotal,
        };
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
      // 사다리: 출발과 줄을 반대로 설정하고, 홀/짝은 규칙에 따라 자동 결정
      const parts = mostBetted.combination.split("/");
      if (parts.length === 3) {
        const startPart = parts[0];
        const linesPart = parts[1];
        const oddEvenPart = parts[2];

        // 출발과 줄 반전
        let newStart: "좌출발" | "우출발" | "자동" = "자동";
        let newLines: "3줄" | "4줄" | "자동" = "자동";

        if (startPart === "좌출발") newStart = "우출발";
        else if (startPart === "우출발") newStart = "좌출발";
        else newStart = "자동";

        if (linesPart === "3줄") newLines = "4줄";
        else if (linesPart === "4줄") newLines = "3줄";
        else newLines = "자동";

        // 홀/짝은 출발과 줄에 따라 자동 결정 (유효한 조합만 생성)
        let newOddEven: "홀" | "짝" | "자동" = "자동";
        if (newStart !== "자동" && newLines !== "자동") {
          const validOddEven = getValidLadderOddEven(newStart, newLines);
          if (validOddEven) {
            newOddEven = validOddEven;
          }
        } else if (oddEvenPart === "홀") {
          newOddEven = "짝";
        } else if (oddEvenPart === "짝") {
          newOddEven = "홀";
        }

        return `${newStart}/${newLines}/${newOddEven}`;
      }
    }

    return null;
  };

  // 개별 예약
  const handleReserveResult = (roundId: number) => {
    const result = selectedResults[roundId];
    const round = activeRounds.find((r) => r.id === roundId);
    if (!round || isRoundLocked(round)) {
      return;
    }
    if (result) {
      onUpdateReservedResult(roundId, result);
    }
  };

  // 예약 취소
  const handleCancelReservation = (roundId: number) => {
    const round = activeRounds.find((r) => r.id === roundId);
    if (!round || round.isReservationPending || !isRoundReserved(round)) {
      return;
    }
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
    if (hasPendingReservation) {
      return;
    }
    if (allReserved) {
      // 전체 취소
      activeRounds.forEach((round) => {
        if (isRoundReserved(round)) {
          onUpdateReservedResult(round.id, null);
        }
      });
      setSelectedResults({});
      setPowerballSelections({});
      setLadderSelections({});
    } else {
      // 선택된 게임만 예약
      activeRounds.forEach((round) => {
        if (isRoundLocked(round)) return;
        const selected = selectedResults[round.id];
        if (selected) {
          onUpdateReservedResult(round.id, selected);
        }
      });
    }
  };

  // 추천 결과 일괄 적용
  const handleApplyRecommendedAll = () => {
    if (hasPendingReservation) {
      return;
    }
    const newResults: { [key: number]: string } = {};
    const newPowerballSelections: {
      [key: number]: PowerballSelection;
    } = {};
    const newLadderSelections: {
      [key: number]: LadderSelection;
    } = {};

    activeRounds.forEach((round) => {
      if (isRoundLocked(round)) return;
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
              const normalOddEven =
                normalParts[0] !== "자동"
                  ? (normalParts[0] as "홀" | "짝")
                  : undefined;
              const normalUnderOver =
                normalParts[1] !== "자동"
                  ? (normalParts[1] as "오버" | "언더")
                  : undefined;
              const powerOddEven =
                powerParts[0] !== "자동"
                  ? (powerParts[0] as "홀" | "짝")
                  : undefined;
              const powerUnderOver =
                powerParts[1] !== "자동"
                  ? (powerParts[1] as "오버" | "언더")
                  : undefined;

              if (
                normalOddEven ||
                normalUnderOver ||
                powerOddEven ||
                powerUnderOver
              ) {
                newPowerballSelections[round.id] = {
                  ...(normalOddEven
                    ? { normalBallOddEven: normalOddEven }
                    : {}),
                  ...(normalUnderOver
                    ? { normalBallOverUnder: normalUnderOver }
                    : {}),
                  ...(powerOddEven ? { powerBallOddEven: powerOddEven } : {}),
                  ...(powerUnderOver
                    ? { powerBallOverUnder: powerUnderOver }
                    : {}),
                };
              }
            }
          }
        } else if (round.gameType === "사다리") {
          const parts = recommended.split("/");
          if (parts.length === 3) {
            const start = parts[0] !== "자동" ? parts[0] : undefined;
            const lines = parts[1] !== "자동" ? parts[1] : undefined;
            const oddEven = parts[2] !== "자동" ? parts[2] : undefined;

            if (start || lines || oddEven) {
              newLadderSelections[round.id] = {
                ...(start ? { start: start as "좌출발" | "우출발" } : {}),
                ...(lines ? { lines: lines as "3줄" | "4줄" } : {}),
                ...(oddEven ? { oddEven: oddEven as "홀" | "짝" } : {}),
              };
            }
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
    const round = activeRounds.find((r) => r.id === roundId);
    if (!round || isRoundLocked(round)) {
      return;
    }
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
    const round = activeRounds.find((r) => r.id === roundId);
    if (!round || isRoundLocked(round)) {
      return;
    }
    // 현재 선택 상태 가져오기
    const current = ladderSelections[roundId] || {};
    const updated: LadderSelection = { ...current };

    if (value) {
      (updated as any)[field] = value;
    } else {
      delete (updated as any)[field];
    }

    // 사다리 게임 규칙에 따라 나머지 값 자동 결정
    // 두 가지가 선택되면 나머지 하나를 자동으로 결정
    const hasStart = !!updated.start;
    const hasLines = !!updated.lines;
    const hasOddEven = !!updated.oddEven;

    if (hasStart && hasLines) {
      // 출발 + 줄 → 홀/짝 자동 결정
      const validOddEven = getValidLadderOddEven(updated.start, updated.lines);
      if (validOddEven) {
        updated.oddEven = validOddEven;
      }
    } else if (hasLines && hasOddEven) {
      // 줄 + 홀/짝 → 출발 자동 결정
      const validStart = getValidLadderStart(updated.lines, updated.oddEven);
      if (validStart) {
        updated.start = validStart;
      }
    } else if (hasStart && hasOddEven) {
      // 출발 + 홀/짝 → 줄 자동 결정
      const validLines = getValidLadderLines(updated.start, updated.oddEven);
      if (validLines) {
        updated.lines = validLines;
      }
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
                    disabled={hasPendingReservation}
                    className={`px-3 py-1.5 text-white rounded-lg transition-colors text-xs font-semibold ${
                      hasPendingReservation
                        ? "bg-gray-700 cursor-not-allowed opacity-50"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    전체 추천 적용
                  </button>
                  <button
                    onClick={handleReserveAll}
                    disabled={
                      hasPendingReservation ||
                      (!allReserved && !allHaveSelection)
                    }
                    className={`px-3 py-1.5 text-white rounded-lg transition-colors text-xs font-semibold ${
                      hasPendingReservation ||
                      (!allReserved && !allHaveSelection)
                        ? "bg-gray-700 cursor-not-allowed opacity-50"
                        : allReserved
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-indigo-600 hover:bg-indigo-700"
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
                  const isPending = !!round.isReservationPending;
                  const isReserved = isRoundReserved(round);
                  const isLocked = isReserved || isPending;
                  const selected = selectedResults[round.id];
                  const canReserve = !!(selected && !isLocked);
                  const reserveLabel = isPending
                    ? "처리중"
                    : isReserved
                      ? "예약됨"
                      : "결과 예약";

                  return (
                    <div
                      key={round.id}
                      className={`bg-gray-800 rounded-lg p-4 border transition-all flex flex-col ${
                        isPending
                          ? "border-yellow-500/50 bg-yellow-500/5"
                          : isReserved
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
                              serverTimeOffset={serverTimeOffset}
                              onEnd={() => onTimerEnd?.(round.gameType)}
                            />
                          </div>
                        </div>
                        {isPending ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded-full">
                            <Clock className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-400 text-xs font-semibold">
                              처리중
                            </span>
                          </div>
                        ) : (
                          isReserved && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              <span className="text-green-400 text-xs font-semibold">
                                예약완료
                              </span>
                            </div>
                          )
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
                                  if (isLocked) return;
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
                                disabled={isLocked}
                                className={`px-2 py-1 text-white text-xs rounded transition-colors ${
                                  isLocked
                                    ? "bg-gray-700 cursor-not-allowed opacity-50"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
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
                                    disabled={isLocked}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    disabled={isLocked}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    disabled={isLocked}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    disabled={isLocked}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                            {(() => {
                              const sel = ladderSelections[round.id] || {};
                              const hasStart = !!sel.start;
                              const hasLines = !!sel.lines;
                              const hasOddEven = !!sel.oddEven;

                              // 자동 결정 여부 판단
                              const isAutoStart =
                                !hasStart && hasLines && hasOddEven;
                              const isAutoLines =
                                hasStart && !hasLines && hasOddEven;
                              const isAutoOddEven = hasStart && hasLines;

                              // 자동 결정 값
                              const autoStart = isAutoStart
                                ? getValidLadderStart(sel.lines, sel.oddEven)
                                : undefined;
                              const autoLines = isAutoLines
                                ? getValidLadderLines(sel.start, sel.oddEven)
                                : undefined;
                              const autoOddEven = isAutoOddEven
                                ? getValidLadderOddEven(sel.start, sel.lines)
                                : undefined;

                              return (
                                <div className="grid grid-cols-3 gap-2">
                                  {/* 출발 */}
                                  <div>
                                    <div className="text-purple-400 text-xs mb-1">
                                      출발
                                      {isAutoStart && autoStart && (
                                        <span className="text-green-400 ml-1">
                                          (자동)
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={autoStart || sel.start || ""}
                                      onChange={(e) =>
                                        updateLadderSelection(
                                          round.id,
                                          "start",
                                          e.target.value,
                                        )
                                      }
                                      disabled={
                                        isLocked || (isAutoStart && !!autoStart)
                                      }
                                      className={`w-full bg-gray-900 border rounded px-2 py-1.5 text-white text-xs focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                        isAutoStart && autoStart
                                          ? "border-green-500/50 bg-green-500/10"
                                          : "border-gray-700 focus:border-indigo-500"
                                      }`}
                                    >
                                      <option value="">자동결과</option>
                                      {isAutoStart && autoStart ? (
                                        <option value={autoStart}>
                                          {autoStart === "좌출발" ? "좌" : "우"}
                                        </option>
                                      ) : (
                                        <>
                                          <option value="좌출발">좌</option>
                                          <option value="우출발">우</option>
                                        </>
                                      )}
                                    </select>
                                  </div>

                                  {/* 줄 */}
                                  <div>
                                    <div className="text-purple-400 text-xs mb-1">
                                      줄
                                      {isAutoLines && autoLines && (
                                        <span className="text-green-400 ml-1">
                                          (자동)
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={autoLines || sel.lines || ""}
                                      onChange={(e) =>
                                        updateLadderSelection(
                                          round.id,
                                          "lines",
                                          e.target.value,
                                        )
                                      }
                                      disabled={
                                        isLocked || (isAutoLines && !!autoLines)
                                      }
                                      className={`w-full bg-gray-900 border rounded px-2 py-1.5 text-white text-xs focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                        isAutoLines && autoLines
                                          ? "border-green-500/50 bg-green-500/10"
                                          : "border-gray-700 focus:border-indigo-500"
                                      }`}
                                    >
                                      <option value="">자동결과</option>
                                      {isAutoLines && autoLines ? (
                                        <option value={autoLines}>
                                          {autoLines}
                                        </option>
                                      ) : (
                                        <>
                                          <option value="3줄">3줄</option>
                                          <option value="4줄">4줄</option>
                                        </>
                                      )}
                                    </select>
                                  </div>

                                  {/* 홀/짝 */}
                                  <div>
                                    <div className="text-purple-400 text-xs mb-1">
                                      홀/짝
                                      {isAutoOddEven && autoOddEven && (
                                        <span className="text-green-400 ml-1">
                                          (자동)
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={autoOddEven || sel.oddEven || ""}
                                      onChange={(e) =>
                                        updateLadderSelection(
                                          round.id,
                                          "oddEven",
                                          e.target.value,
                                        )
                                      }
                                      disabled={
                                        isLocked ||
                                        (isAutoOddEven && !!autoOddEven)
                                      }
                                      className={`w-full bg-gray-900 border rounded px-2 py-1.5 text-white text-xs focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                        isAutoOddEven && autoOddEven
                                          ? "border-green-500/50 bg-green-500/10"
                                          : "border-gray-700 focus:border-indigo-500"
                                      }`}
                                    >
                                      <option value="">자동결과</option>
                                      {isAutoOddEven && autoOddEven ? (
                                        <option value={autoOddEven}>
                                          {autoOddEven}
                                        </option>
                                      ) : (
                                        <>
                                          <option value="홀">홀</option>
                                          <option value="짝">짝</option>
                                        </>
                                      )}
                                    </select>
                                  </div>
                                </div>
                              );
                            })()}

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
                            {reserveLabel}
                          </button>
                          {isReserved && !isPending && (
                            <button
                              onClick={() => handleCancelReservation(round.id)}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm font-semibold disabled:bg-gray-700 disabled:cursor-not-allowed"
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
