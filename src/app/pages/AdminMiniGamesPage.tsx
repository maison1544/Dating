import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Calendar,
  X,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CountdownTimer } from "../components/CountdownTimer";
import { AdminMiniGamesSettingsTab } from "./AdminMiniGamesSettingsTab";
import { RoundDetailModal } from "../components/RoundDetailModal";
import { ResultAdjustmentModal } from "../components/ResultAdjustmentModal";

interface GameRound {
  id: number;
  gameType: string;
  roundNumber: number;
  result: string;
  detailedResult?: string; // 상세 결과 (예: "일반볼-홀/오버 파워볼-짝/언더")
  totalBets: number;
  totalAmount: number;
  startTime: string;
  endTime: string;
  status: "진행중" | "완료" | "대기";
  participants: number;
  date: string;
  reservedResult?: string; // 예약된 결과
  betDistribution?: {
    option: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

interface GameBet {
  id: number;
  userId: string;
  userName: string;
  gameType: string;
  roundNumber: number;
  betType: string;
  amount: number;
  result: "대기" | "승리" | "패배";
  timestamp: string;
  userPhone?: string;
  userPoints?: number;
}

interface BetHistoryItem {
  id: number;
  userId: string;
  userName: string;
  gameType: string;
  roundNumber: number;
  betType: string;
  amount: number;
  winAmount: number;
  result: string;
  timestamp: string;
  settled: string;
}

export function AdminMiniGamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<
    "betting" | "rounds" | "settings"
  >("betting");
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedGameType, setSelectedGameType] = useState<
    string | null
  >(null);
  const [selectedBetType, setSelectedBetType] = useState("all");
  const [selectedBetOption, setSelectedBetOption] = useState<{
    gameType: string;
    roundNumber: number;
    option: string;
  } | null>(null);
  const [selectedRoundDetail, setSelectedRoundDetail] = useState<GameRound | null>(null);
  const [isResultAdjustmentOpen, setIsResultAdjustmentOpen] = useState(false);
  const [startTimeFilter, setStartTimeFilter] = useState("");
  const [endTimeFilter, setEndTimeFilter] = useState("");
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const isAnyModalOpen = selectedBetOption !== null || selectedRoundDetail !== null || isResultAdjustmentOpen;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedBetOption, selectedRoundDetail, isResultAdjustmentOpen]);
  const [isTimeRangeValid, setIsTimeRangeValid] = useState(true);

  // 날짜 범위 유효성 검증
  const validateDateRange = (start: string, end: string) => {
    if (start && end) {
      return new Date(start) <= new Date(end);
    }
    return true;
  };

  // 시간 범위 유효성 검증
  const validateTimeRange = (startTime: string, endTime: string, startDate: string, endDate: string) => {
    if (!startTime || !endTime) return true;
    
    // 같은 날짜인 경우에만 시간 비교
    if (startDate === endDate) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      return startMinutes <= endMinutes;
    }
    
    return true;
  };

  // 결과 예약 업데이트
  const handleUpdateReservedResult = (roundId: number, result: string | null) => {
    setGameRounds((prevRounds) =>
      prevRounds.map((round) =>
        round.id === roundId
          ? { ...round, reservedResult: result || undefined }
          : round
      )
    );
  };

  const [gameRounds, setGameRounds] = useState<GameRound[]>([
    {
      id: 9,
      gameType: "파워볼",
      roundNumber: 425,
      result: "홀",
      detailedResult: "일반볼-홀/오버\n파워볼-짝/언더",
      totalBets: 83,
      totalAmount: 3240000,
      startTime: "2025-12-15 14:00",
      endTime: "2025-12-15 14:03",
      status: "완료",
      participants: 42,
      date: "2025-12-15",
      betDistribution: [
        {
          option: "일반볼-홀",
          amount: 950000,
          count: 28,
          percentage: 52,
        },
        {
          option: "일반볼-짝",
          amount: 750000,
          count: 22,
          percentage: 48,
        },
        {
          option: "일반볼-언더",
          amount: 680000,
          count: 20,
          percentage: 46,
        },
        {
          option: "일반볼-오버",
          amount: 790000,
          count: 24,
          percentage: 54,
        },
        {
          option: "파워볼-홀",
          amount: 620000,
          count: 18,
          percentage: 45,
        },
        {
          option: "파워볼-짝",
          amount: 760000,
          count: 22,
          percentage: 55,
        },
        {
          option: "파워볼-언더",
          amount: 540000,
          count: 15,
          percentage: 42,
        },
        {
          option: "파워볼-오버",
          amount: 710000,
          count: 19,
          percentage: 58,
        },
      ],
    },
    {
      id: 10,
      gameType: "파워볼",
      roundNumber: 426,
      result: "-",
      totalBets: 91,
      totalAmount: 3680000,
      startTime: "2025-12-15 14:03",
      endTime: "-",
      status: "진행중",
      participants: 46,
      date: "2025-12-15",
      betDistribution: [
        {
          option: "일반볼-홀",
          amount: 1020000,
          count: 32,
          percentage: 55,
        },
        {
          option: "일반볼-짝",
          amount: 980000,
          count: 28,
          percentage: 45,
        },
        {
          option: "일반볼-언더",
          amount: 850000,
          count: 25,
          percentage: 48,
        },
        {
          option: "일반볼-오버",
          amount: 920000,
          count: 27,
          percentage: 52,
        },
        {
          option: "파워볼-홀",
          amount: 730000,
          count: 21,
          percentage: 47,
        },
        {
          option: "파워볼-짝",
          amount: 820000,
          count: 24,
          percentage: 53,
        },
        {
          option: "파워볼-언더",
          amount: 680000,
          count: 19,
          percentage: 44,
        },
        {
          option: "파워볼-오버",
          amount: 860000,
          count: 25,
          percentage: 56,
        },
      ],
    },
    {
      id: 4,
      gameType: "사다리",
      roundNumber: 856,
      result: "왼쪽",
      detailedResult: "좌출발/4줄/홀",
      totalBets: 67,
      totalAmount: 2340000,
      startTime: "2025-12-15 14:00",
      endTime: "2025-12-15 14:03",
      status: "완료",
      participants: 34,
      date: "2025-12-15",
      betDistribution: [
        {
          option: "좌출발",
          amount: 1200000,
          count: 38,
          percentage: 62,
        },
        {
          option: "우출발",
          amount: 740000,
          count: 22,
          percentage: 38,
        },
        {
          option: "3줄",
          amount: 860000,
          count: 26,
          percentage: 54,
        },
        {
          option: "4줄",
          amount: 730000,
          count: 21,
          percentage: 46,
        },
        {
          option: "홀",
          amount: 950000,
          count: 29,
          percentage: 52,
        },
        {
          option: "짝",
          amount: 880000,
          count: 27,
          percentage: 48,
        },
        {
          option: "좌3짝",
          amount: 380000,
          count: 11,
          percentage: 25,
        },
        {
          option: "좌4홀",
          amount: 420000,
          count: 12,
          percentage: 25,
        },
        {
          option: "우3홀",
          amount: 390000,
          count: 11,
          percentage: 25,
        },
        {
          option: "우4짝",
          amount: 410000,
          count: 12,
          percentage: 25,
        },
      ],
    },
    {
      id: 5,
      gameType: "사다리",
      roundNumber: 857,
      result: "오른쪽",
      detailedResult: "우출발/3줄/홀",
      totalBets: 71,
      totalAmount: 2580000,
      startTime: "2025-12-15 14:03",
      endTime: "2025-12-15 14:06",
      status: "완료",
      participants: 38,
      date: "2025-12-15",
      betDistribution: [
        {
          option: "좌출발",
          amount: 1030000,
          count: 28,
          percentage: 48,
        },
        {
          option: "우출발",
          amount: 1120000,
          count: 32,
          percentage: 52,
        },
        {
          option: "3줄",
          amount: 970000,
          count: 27,
          percentage: 50,
        },
        {
          option: "4줄",
          amount: 970000,
          count: 27,
          percentage: 50,
        },
        {
          option: "홀",
          amount: 1050000,
          count: 30,
          percentage: 51,
        },
        {
          option: "짝",
          amount: 1010000,
          count: 29,
          percentage: 49,
        },
        {
          option: "좌3짝",
          amount: 450000,
          count: 13,
          percentage: 25,
        },
        {
          option: "좌4홀",
          amount: 480000,
          count: 14,
          percentage: 25,
        },
        {
          option: "우3홀",
          amount: 460000,
          count: 13,
          percentage: 25,
        },
        {
          option: "우4짝",
          amount: 470000,
          count: 14,
          percentage: 25,
        },
      ],
    },
    {
      id: 6,
      gameType: "사다리",
      roundNumber: 858,
      result: "-",
      totalBets: 0,
      totalAmount: 0,
      startTime: "2025-12-15 14:06",
      endTime: "-",
      status: "진행중",
      participants: 0,
      date: "2025-12-15",
      betDistribution: [
        {
          option: "좌출발",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "우출발",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "3줄",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "4줄",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "홀",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "짝",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "좌3짝",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "좌4홀",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "우3홀",
          amount: 0,
          count: 0,
          percentage: 0,
        },
        {
          option: "우4짝",
          amount: 0,
          count: 0,
          percentage: 0,
        },
      ],
    },
    {
      id: 8,
      gameType: "사다리",
      roundNumber: 854,
      result: "왼쪽",
      detailedResult: "좌출발/3줄/짝",
      totalBets: 55,
      totalAmount: 1870000,
      startTime: "2025-12-14 16:15",
      endTime: "2025-12-14 16:18",
      status: "완료",
      participants: 29,
      date: "2025-12-14",
      betDistribution: [
        {
          option: "좌출발",
          amount: 1050000,
          count: 31,
          percentage: 56,
        },
        {
          option: "우출발",
          amount: 820000,
          count: 24,
          percentage: 44,
        },
        {
          option: "3줄",
          amount: 920000,
          count: 27,
          percentage: 49,
        },
        {
          option: "4줄",
          amount: 950000,
          count: 28,
          percentage: 51,
        },
        {
          option: "홀",
          amount: 980000,
          count: 29,
          percentage: 53,
        },
        {
          option: "짝",
          amount: 890000,
          count: 26,
          percentage: 47,
        },
        {
          option: "좌3짝",
          amount: 420000,
          count: 12,
          percentage: 25,
        },
        {
          option: "좌4홀",
          amount: 450000,
          count: 13,
          percentage: 25,
        },
        {
          option: "우3홀",
          amount: 430000,
          count: 12,
          percentage: 25,
        },
        {
          option: "우4짝",
          amount: 440000,
          count: 13,
          percentage: 25,
        },
      ],
    },
    // 추가 파워볼 게임들
    {
      id: 11,
      gameType: "파워볼",
      roundNumber: 424,
      result: "짝",
      detailedResult: "일반볼-짝/언더\n파워볼-홀/오버",
      totalBets: 75,
      totalAmount: 2890000,
      startTime: "2025-12-15 13:50",
      endTime: "2025-12-15 13:55",
      status: "완료",
      participants: 38,
      date: "2025-12-15",
    },
    {
      id: 12,
      gameType: "파워볼",
      roundNumber: 423,
      result: "홀",
      detailedResult: "일반볼-홀/언더\n파워볼-짝/오버",
      totalBets: 68,
      totalAmount: 2560000,
      startTime: "2025-12-15 13:40",
      endTime: "2025-12-15 13:45",
      status: "완료",
      participants: 35,
      date: "2025-12-15",
    },
    {
      id: 13,
      gameType: "파워볼",
      roundNumber: 422,
      result: "짝",
      detailedResult: "일반볼-짝/오버\n파워볼-홀/언더",
      totalBets: 82,
      totalAmount: 3120000,
      startTime: "2025-12-15 13:30",
      endTime: "2025-12-15 13:33",
      status: "완료",
      participants: 41,
      date: "2025-12-15",
    },
    {
      id: 14,
      gameType: "파워볼",
      roundNumber: 421,
      result: "홀",
      detailedResult: "일반볼-홀/오버\n파워볼-홀/언더",
      totalBets: 77,
      totalAmount: 2940000,
      startTime: "2025-12-15 13:27",
      endTime: "2025-12-15 13:30",
      status: "완료",
      participants: 39,
      date: "2025-12-15",
    },
    // 추가 사다리 게임들
    {
      id: 15,
      gameType: "사다리",
      roundNumber: 855,
      result: "오른쪽",
      detailedResult: "우출발/4줄/짝",
      totalBets: 61,
      totalAmount: 2170000,
      startTime: "2025-12-15 13:48",
      endTime: "2025-12-15 13:51",
      status: "완료",
      participants: 31,
      date: "2025-12-15",
    },
    {
      id: 16,
      gameType: "사다리",
      roundNumber: 853,
      result: "왼쪽",
      detailedResult: "좌출발/3줄/짝",
      totalBets: 58,
      totalAmount: 2050000,
      startTime: "2025-12-15 13:45",
      endTime: "2025-12-15 13:48",
      status: "완료",
      participants: 29,
      date: "2025-12-15",
    },
    {
      id: 17,
      gameType: "사다리",
      roundNumber: 852,
      result: "오른쪽",
      detailedResult: "우출발/3줄/홀",
      totalBets: 64,
      totalAmount: 2280000,
      startTime: "2025-12-15 13:42",
      endTime: "2025-12-15 13:45",
      status: "완료",
      participants: 33,
      date: "2025-12-15",
    },
    {
      id: 18,
      gameType: "사다리",
      roundNumber: 851,
      result: "왼쪽",
      detailedResult: "좌출발/4줄/홀",
      totalBets: 69,
      totalAmount: 2450000,
      startTime: "2025-12-15 13:39",
      endTime: "2025-12-15 13:42",
      status: "완료",
      participants: 35,
      date: "2025-12-15",
    },
  ]);

  // 더미 베팅 유저 데이터 - 실제로는 API에서 가져와야 함
  const generateBetUsers = (gameType: string, roundNumber: number, option: string) => {
    // 간단한 더미 데이터 생성 로직
    const users = [
      { id: 1, userName: "김민수", userNickname: "민수킴", amount: 50000, timestamp: "2025-12-15 14:10:23", userIp: "192.168.1.45", userPoints: 250000 },
      { id: 2, userName: "이", userNickname: "서연쓰SuperLongNickname", amount: 30000, timestamp: "2025-12-15 14:10:45", userIp: "192.168.1.102", userPoints: 180000 },
      { id: 3, userName: "박지훈", userNickname: "지훈", amount: 100000, timestamp: "2025-12-15 14:12:15", userIp: "192.168.1.78", userPoints: 450000 },
      { id: 4, userName: "최유진유진유진", userNickname: "유진", amount: 40000, timestamp: "2025-12-15 14:05:30", userIp: "192.168.1.201", userPoints: 320000 },
      { id: 5, userName: "정하늘", userNickname: "Sky하늘정SuperLongName", amount: 25000, timestamp: "2025-12-15 14:06:12", userIp: "192.168.1.33", userPoints: 95000 },
      { id: 6, userName: "강", userNickname: "강", amount: 75000, timestamp: "2025-12-15 14:12:40", userIp: "192.168.1.156", userPoints: 280000 },
      { id: 7, userName: "윤지호지호지호", userNickname: "지호윤", amount: 60000, timestamp: "2025-12-15 14:11:05", userIp: "192.168.1.89", userPoints: 410000 },
      { id: 8, userName: "송민아", userNickname: "MinAhSongVeryLongNickname123", amount: 90000, timestamp: "2025-12-15 14:13:20", userIp: "192.168.1.210", userPoints: 190000 },
    ];
    return users;
  };

  const [gameBets, setGameBets] = useState<GameBet[]>([
    {
      id: 1,
      userId: "user001",
      userName: "김민수",
      gameType: "주사위",
      roundNumber: 1247,
      betType: "홀",
      amount: 50000,
      result: "대기",
      timestamp: "2025-12-15 14:10:23",
      userPhone: "010-1234-5678",
      userPoints: 250000,
    },
    {
      id: 2,
      userId: "user002",
      userName: "이서연",
      gameType: "주사위",
      roundNumber: 1247,
      betType: "짝",
      amount: 30000,
      result: "대기",
      timestamp: "2025-12-15 14:10:45",
      userPhone: "010-2345-6789",
      userPoints: 180000,
    },
    {
      id: 3,
      userId: "user003",
      userName: "박지훈",
      gameType: "사다리",
      roundNumber: 858,
      betType: "왼쪽",
      amount: 100000,
      result: "대기",
      timestamp: "2025-12-15 14:12:15",
      userPhone: "010-3456-7890",
      userPoints: 450000,
    },
    {
      id: 4,
      userId: "user004",
      userName: "최유진",
      gameType: "주사위",
      roundNumber: 1246,
      betType: "짝",
      amount: 40000,
      result: "승리",
      timestamp: "2025-12-15 14:05:30",
      userPhone: "010-4567-8901",
      userPoints: 320000,
    },
    {
      id: 5,
      userId: "user005",
      userName: "정하늘",
      gameType: "주사위",
      roundNumber: 1246,
      betType: "홀",
      amount: 25000,
      result: "패배",
      timestamp: "2025-12-15 14:06:12",
      userPhone: "010-5678-9012",
      userPoints: 95000,
    },
    {
      id: 6,
      userId: "user006",
      userName: "강서현",
      gameType: "사다리",
      roundNumber: 858,
      betType: "오른쪽",
      amount: 75000,
      result: "대기",
      timestamp: "2025-12-15 14:12:40",
      userPhone: "010-6789-0123",
      userPoints: 280000,
    },
    {
      id: 7,
      userId: "user007",
      userName: "윤지호",
      gameType: "주사위",
      roundNumber: 1247,
      betType: "홀",
      amount: 60000,
      result: "대기",
      timestamp: "2025-12-15 14:11:05",
      userPhone: "010-7890-1234",
      userPoints: 410000,
    },
    {
      id: 8,
      userId: "user008",
      userName: "송민아",
      gameType: "사다리",
      roundNumber: 858,
      betType: "왼쪽",
      amount: 90000,
      result: "대기",
      timestamp: "2025-12-15 14:13:20",
      userPhone: "010-8901-2345",
      userPoints: 190000,
    },
  ]);

  const betHistory: BetHistoryItem[] = [
    {
      id: 1,
      userId: "user001",
      userName: "김민수",
      gameType: "주사위",
      roundNumber: 1245,
      betType: "홀",
      amount: 50000,
      winAmount: 95000,
      result: "승리",
      timestamp: "2025-12-15 14:00:23",
      settled: "2025-12-15 14:03:00",
    },
    {
      id: 2,
      userId: "user002",
      userName: "이서연",
      gameType: "사다리",
      roundNumber: 856,
      betType: "왼쪽",
      amount: 80000,
      winAmount: 152000,
      result: "승리",
      timestamp: "2025-12-15 14:00:45",
      settled: "2025-12-15 14:05:00",
    },
    {
      id: 3,
      userId: "user003",
      userName: "박지훈",
      gameType: "주사위",
      roundNumber: 1245,
      betType: "짝",
      amount: 30000,
      winAmount: 0,
      result: "패배",
      timestamp: "2025-12-15 14:01:15",
      settled: "2025-12-15 14:03:00",
    },
    {
      id: 4,
      userId: "user004",
      userName: "최유진",
      gameType: "사다리",
      roundNumber: 857,
      betType: "오른쪽",
      amount: 120000,
      winAmount: 228000,
      result: "승리",
      timestamp: "2025-12-15 14:06:30",
      settled: "2025-12-15 14:11:00",
    },
    {
      id: 5,
      userId: "user005",
      userName: "정하늘",
      gameType: "주사위",
      roundNumber: 1246,
      betType: "홀",
      amount: 25000,
      winAmount: 0,
      result: "패배",
      timestamp: "2025-12-15 14:05:12",
      settled: "2025-12-15 14:08:00",
    },
    {
      id: 6,
      userId: "user006",
      userName: "강서현",
      gameType: "사다리",
      roundNumber: 856,
      betType: "오른쪽",
      amount: 60000,
      winAmount: 0,
      result: "패배",
      timestamp: "2025-12-15 14:01:45",
      settled: "2025-12-15 14:05:00",
    },
    {
      id: 7,
      userId: "user007",
      userName: "윤지호",
      gameType: "주사위",
      roundNumber: 1245,
      betType: "홀",
      amount: 40000,
      winAmount: 76000,
      result: "승리",
      timestamp: "2025-12-15 14:02:10",
      settled: "2025-12-15 14:03:00",
    },
    {
      id: 8,
      userId: "user001",
      userName: "김민수",
      gameType: "사다리",
      roundNumber: 857,
      betType: "왼쪽",
      amount: 90000,
      winAmount: 0,
      result: "패배",
      timestamp: "2025-12-15 14:07:20",
      settled: "2025-12-15 14:11:00",
    },
    {
      id: 9,
      userId: "user009",
      userName: "한지우",
      gameType: "주사위",
      roundNumber: 1246,
      betType: "짝",
      amount: 70000,
      winAmount: 133000,
      result: "승리",
      timestamp: "2025-12-15 14:05:45",
      settled: "2025-12-15 14:08:00",
    },
    {
      id: 10,
      userId: "user010",
      userName: "오수민",
      gameType: "사다리",
      roundNumber: 856,
      betType: "왼쪽",
      amount: 110000,
      winAmount: 209000,
      result: "승리",
      timestamp: "2025-12-15 14:01:10",
      settled: "2025-12-15 14:05:00",
    },
  ];

  const filteredRounds = gameRounds
    .filter((round) => {
      const matchesSearch =
        round.roundNumber.toString().includes(searchTerm) ||
        round.gameType
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesGame =
        gameFilter === "all" || round.gameType === gameFilter;
      const matchesStatus =
        statusFilter === "all" || round.status === statusFilter;
      
      // 날짜 범위 필터링
      const matchesDate = round.date >= selectedDate && round.date <= endDate;
      
      // 시간대 필터링 (시:분 단위)
      let matchesTime = true;
      if (startTimeFilter || endTimeFilter) {
        const roundStartDateTime = round.startTime; // "2025-12-15 14:00"
        const roundEndDateTime = round.endTime; // "2025-12-15 14:03"
        
        // 시작 시간 필터
        if (startTimeFilter) {
          const filterStartDateTime = `${selectedDate} ${startTimeFilter}`;
          if (roundStartDateTime < filterStartDateTime) {
            matchesTime = false;
          }
        }
        
        // 종료 시간 필터
        if (endTimeFilter) {
          const filterEndDateTime = `${endDate} ${endTimeFilter}`;
          if (roundEndDateTime > filterEndDateTime) {
            matchesTime = false;
          }
        }
      }
      
      // 배팅현황 탭에서는 모든 게임 타입 표시
      return (
        matchesSearch &&
        matchesGame &&
        matchesStatus &&
        matchesDate &&
        matchesTime
      );
    })
    .sort((a, b) => {
      // 먼저 진행중인 게임을 위로
      if (a.status === "진행중" && b.status !== "진행중") return -1;
      if (a.status !== "진행중" && b.status === "진행중") return 1;
      // 같은 상태면 회차 내림차순 정렬
      return b.roundNumber - a.roundNumber;
    });

  const filteredBets = gameBets.filter((bet) => {
    const matchesSearch =
      bet.userName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      bet.userId
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesGame =
      gameFilter === "all" || bet.gameType === gameFilter;
    const matchesBetType =
      selectedBetType === "all" ||
      bet.betType === selectedBetType;
    return matchesSearch && matchesGame && matchesBetType;
  });

  const filteredHistory = betHistory.filter((bet) => {
    const matchesSearch =
      bet.userName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      bet.userId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      bet.roundNumber.toString().includes(searchTerm);
    const matchesGame =
      gameFilter === "all" || bet.gameType === gameFilter;
    const matchesBetType =
      selectedBetType === "all" ||
      bet.betType === selectedBetType;
    return matchesSearch && matchesGame && matchesBetType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return "bg-green-500/20 text-green-400";
      case "진행중":
        return "bg-blue-500/20 text-blue-400";
      case "대기":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "승리":
        return "bg-green-500/20 text-green-400";
      case "패배":
        return "bg-red-500/20 text-red-400";
      case "대기":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const totalBetsCount = gameRounds.reduce(
    (sum, r) => sum + r.totalBets,
    0,
  );
  const totalBetsAmount = gameRounds.reduce(
    (sum, r) => sum + r.totalAmount,
    0,
  );
  const activeRounds = gameRounds.filter(
    (r) => r.status === "진행중",
  ).length;
  const avgParticipants = Math.round(
    gameRounds.reduce((sum, r) => sum + r.participants, 0) /
      gameRounds.length,
  );

  // 초기 마운트 시 더미 데이터의 날짜를 오늘로 업데이트
  useEffect(() => {
    const yesterday = (() => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date.toISOString().split('T')[0];
    })();
    
    setGameRounds((prevRounds) => 
      prevRounds.map((round) => ({
        ...round,
        date: round.date === "2025-12-14" ? yesterday : today,
        startTime: round.startTime.replace(/2025-12-14|2025-12-15/, round.date === "2025-12-14" ? yesterday : today),
        endTime: round.endTime === "-" ? "-" : round.endTime.replace(/2025-12-14|2025-12-15/, round.date === "2025-12-14" ? yesterday : today),
      }))
    );
    
    setGameBets((prevBets) =>
      prevBets.map((bet) => ({
        ...bet,
        timestamp: bet.timestamp.replace(/2025-12-15/, today),
      }))
    );
  }, []);

  // 실시간 배팅 시뮬레이션 - 진행중인 게임만 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setGameRounds((prevRounds) => {
        return prevRounds.map((round) => {
          // 진행중인 게임만 업데이트
          if (round.status !== "진행중") return round;

          // betDistribution이 있는 경우만 처리
          if (!round.betDistribution) return round;

          // 랜덤하게 배팅 옵션 선택 (30% 확률로 배팅 추가)
          if (Math.random() > 0.3) return round;

          const randomIndex = Math.floor(
            Math.random() * round.betDistribution.length
          );
          const randomAmount = Math.floor(Math.random() * 50000) + 10000; // 10,000 ~ 60,000

          // 선택된 옵션에 배팅 금액 추가
          const newBetDistribution = round.betDistribution.map((bet, idx) => {
            if (idx === randomIndex) {
              return {
                ...bet,
                amount: bet.amount + randomAmount,
                count: bet.count + 1,
              };
            }
            return bet;
          });

          // 전체 금액 계산
          const totalAmount = newBetDistribution.reduce(
            (sum, bet) => sum + bet.amount,
            0
          );

          // 페어별로 percentage 재계산
          const updatedBetDistribution = newBetDistribution.map((bet, idx) => {
            // 파워볼: 0-1, 2-3, 4-5, 6-7 페어
            // 사다리: 0-1, 2-3, 4-5 (일반), 6-9 (조합 배팅)
            let pairIdx = -1;
            if (round.gameType === "파워볼") {
              pairIdx = Math.floor(idx / 2) * 2;
            } else if (round.gameType === "사다리") {
              if (idx < 6) {
                // 일반 배팅 (0-5): 페어로 계산
                pairIdx = Math.floor(idx / 2) * 2;
              } else if (idx >= 6 && idx <= 9) {
                // 조합 배팅 (6-9): 전체 합계로 계산
                const combinationTotal = newBetDistribution
                  .slice(6, 10)
                  .reduce((sum, b) => sum + b.amount, 0);
                const percentage = combinationTotal === 0 ? 0 : Math.round((bet.amount / combinationTotal) * 100);
                return { ...bet, percentage };
              }
            }

            if (pairIdx !== -1 && pairIdx <= idx) {
              const pairTotal =
                newBetDistribution[pairIdx].amount +
                (newBetDistribution[pairIdx + 1]?.amount || 0);
              // 0으로 나누기 방지
              const percentage = pairTotal === 0 ? 0 : Math.round((bet.amount / pairTotal) * 100);
              return { ...bet, percentage };
            }

            return bet;
          });

          return {
            ...round,
            betDistribution: updatedBetDistribution,
            totalAmount: round.totalAmount + randomAmount,
            totalBets: round.totalBets + 1,
          };
        });
      });
    }, 2000); // 2초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // Get current round bets for distribution display
  const currentRoundBets = gameRounds.filter(
    (r) => r.status === "진행중",
  );

  // Prepare chart data for all bet types
  const prepareChartData = () => {
    const chartData: any[] = [];

    currentRoundBets.forEach((round) => {
      if (round.betDistribution) {
        round.betDistribution.forEach((dist) => {
          chartData.push({
            name: `${round.gameType} #${round.roundNumber} - ${dist.option}`,
            option: dist.option,
            percentage: dist.percentage,
            amount: dist.amount,
            count: dist.count,
            gameType: round.gameType,
          });
        });
      }
    });

    return chartData;
  };

  const chartData = prepareChartData();

  // Generate detailed result for display
  const generateDetailedResult = (round: GameRound): JSX.Element => {
    if (round.status !== "완료") {
      // 진행중이고 예약된 결과가 있으면 표시
      if (round.status === "진행중" && round.reservedResult) {
        return (
          <span className="text-green-400 flex items-center gap-1 text-xs">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            {round.reservedResult}
          </span>
        );
      }
      return <span className="text-gray-500">결과미정</span>;
    }
    
    // 저장된 상세 결과가 있으면 사용 (한 번 생성된 결과는 바뀌지 않음)
    if (round.detailedResult) {
      const lines = round.detailedResult.split('\n');
      if (lines.length > 1) {
        // 파워볼 (두 줄)
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-purple-400">{lines[0]}</span>
            <span className="text-purple-300">{lines[1]}</span>
          </div>
        );
      } else {
        // 사다리 (한 줄)
        return <span className="text-blue-400">{lines[0]}</span>;
      }
    }
    
    // detailedResult가 없으면 기본 결과 생성 (한 번만)
    if (round.gameType === "파워볼") {
      const normalBalls = ["홀", "짝"];
      const normalOverUnder = ["언더", "오버"];
      const powerBalls = ["홀", "짝"];
      const powerOverUnder = ["언더", "오버"];
      
      const id = round.id + round.roundNumber; // 일관된 시드
      const normalBall = normalBalls[id % 2];
      const normalOU = normalOverUnder[id % 2];
      const powerBall = powerBalls[(id + 1) % 2];
      const powerOU = powerOverUnder[(id + 1) % 2];
      
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-purple-400">일반볼-{normalBall}/{normalOU}</span>
          <span className="text-purple-300">파워볼-{powerBall}/{powerOU}</span>
        </div>
      );
    } else if (round.gameType === "사다리") {
      // 사다리 게임은 좌3짝, 좌4홀, 우3홀, 우4짝 4가지 조합만 가능
      const validResults = ["좌출발/3줄/짝", "좌출발/4줄/홀", "우출발/3줄/홀", "우출발/4줄/짝"];
      
      const id = round.id + round.roundNumber; // 일관된 시드
      const result = validResults[id % 4];
      
      return <span className="text-blue-400">{result}</span>;
    }
    
    return <span className="text-purple-400">{round.result}</span>;
  };

  // Color mapping for bet types
  const getBetColor = (option: string) => {
    switch (option) {
      case "홀":
        return "#6366f1"; // indigo-500
      case "짝":
        return "#a855f7"; // purple-500
      case "좌출발":
        return "#3b82f6"; // blue-500
      case "우출발":
        return "#f59e0b"; // amber-500
      default:
        return "#6b7280"; // gray-500
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">
            {data.name}
          </p>
          <p className="text-indigo-400">
            비율: {data.percentage}%
          </p>
          <p className="text-yellow-400">
            금액: {data.amount.toLocaleString()}P
          </p>
          <p className="text-gray-400">건수: {data.count}건</p>
        </div>
      );
    }
    return null;
  };



  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with inline stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">
              미니게임 관리
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-blue-400">
                진행중 게임 {activeRounds}회
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">
                총 배팅 건수 {totalBetsCount}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-yellow-400">
                총 배팅 금액{" "}
                {(totalBetsAmount / 1000000).toFixed(1)}M
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">
                평균 참여자 {avgParticipants}명
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsResultAdjustmentOpen(true)}
              className="bg-purple-500/80 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <RefreshCw size={20} />
              결과조정
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab("betting")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "betting"
                  ? "bg-purple-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              배팅 현황
            </button>
            <button
              onClick={() => setActiveTab("rounds")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "rounds"
                  ? "bg-purple-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              게임 회차 관리
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-6 py-3 text-center transition-colors ${
                activeTab === "settings"
                  ? "bg-purple-500/80 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              환경설정
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "betting" ? (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 날짜 범위 선택 */}
                <div className="flex flex-col gap-2">
                  <label className="text-white text-sm font-medium">
                    조회 기간 <span className="text-white font-normal">({selectedDate} ~ {endDate})</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          setSelectedDate(newStartDate);
                          const isValid = validateDateRange(newStartDate, endDate);
                          setIsDateRangeValid(isValid);
                          if (isValid) {
                            const timeValid = validateTimeRange(startTimeFilter, endTimeFilter, newStartDate, endDate);
                            setIsTimeRangeValid(timeValid);
                          }
                        }}
                        className={`flex-1 bg-gray-800 border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 ${
                          !isDateRangeValid ? 'border-red-500' : 'border-gray-700'
                        }`}
                      />
                      <span className="text-gray-500 flex-shrink-0">~</span>
                      <input
                        type="date"
                        value={endDate}
                        min={selectedDate}
                        onChange={(e) => {
                          const newEndDate = e.target.value;
                          setEndDate(newEndDate);
                          const isValid = validateDateRange(selectedDate, newEndDate);
                          setIsDateRangeValid(isValid);
                          if (isValid) {
                            const timeValid = validateTimeRange(startTimeFilter, endTimeFilter, selectedDate, newEndDate);
                            setIsTimeRangeValid(timeValid);
                          }
                        }}
                        className={`flex-1 bg-gray-800 border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 ${
                          !isDateRangeValid ? 'border-red-500' : 'border-gray-700'
                        }`}
                      />
                    </div>
                    {!isDateRangeValid && (
                      <p className="text-red-400 text-xs">종료일은 시작일보다 이전일 수 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 시간대 필터 */}
                <div className="flex flex-col gap-2">
                  <label className="text-white text-sm font-medium">
                    시간대 
                    {(startTimeFilter || endTimeFilter) && (
                      <span className="text-white font-normal ml-1">
                        ({startTimeFilter || '00:00'} ~ {endTimeFilter || '23:59'})
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    {/* 시작 시간 */}
                    <div className="flex-1 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                      <select
                        value={startTimeFilter.split(':')[0] || ''}
                        onChange={(e) => {
                          const minute = startTimeFilter.split(':')[1] || '00';
                          const newStartTime = e.target.value ? `${e.target.value}:${minute}` : '';
                          setStartTimeFilter(newStartTime);
                          
                          // 같은 날짜이고 종료 시간이 있을 때, 종료 시간이 시작 시간보다 이전이면 초기화
                          if (selectedDate === endDate && endTimeFilter && newStartTime) {
                            const [startHour, startMin] = newStartTime.split(':').map(Number);
                            const [endHour, endMin] = endTimeFilter.split(':').map(Number);
                            const startMinutes = startHour * 60 + startMin;
                            const endMinutes = endHour * 60 + endMin;
                            if (startMinutes > endMinutes) {
                              setEndTimeFilter('');
                            }
                          }
                        }}
                        className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                      >
                        <option value="">시</option>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          // 같은 날짜이고 종료 시간이 설정되어 있으면, 종료 시간 이후는 비활성화
                          let disabled = false;
                          if (selectedDate === endDate && endTimeFilter) {
                            const endHour = parseInt(endTimeFilter.split(':')[0]);
                            disabled = i > endHour;
                          }
                          return (
                            <option key={hour} value={hour} disabled={disabled}>
                              {hour}시
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-gray-500">:</span>
                      <select
                        value={startTimeFilter.split(':')[1] || ''}
                        onChange={(e) => {
                          const hour = startTimeFilter.split(':')[0] || '00';
                          const newStartTime = e.target.value !== '' ? `${hour}:${e.target.value}` : '';
                          setStartTimeFilter(newStartTime);
                          
                          // 같은 날짜이고 종료 시간이 있을 때, 종료 시간이 시작 시간보다 이전이면 초기화
                          if (selectedDate === endDate && endTimeFilter && newStartTime) {
                            const [startHour, startMin] = newStartTime.split(':').map(Number);
                            const [endHour, endMin] = endTimeFilter.split(':').map(Number);
                            const startMinutes = startHour * 60 + startMin;
                            const endMinutes = endHour * 60 + endMin;
                            if (startMinutes > endMinutes) {
                              setEndTimeFilter('');
                            }
                          }
                        }}
                        className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                      >
                        <option value="">분</option>
                        {Array.from({ length: 60 }, (_, i) => {
                          const minute = i.toString().padStart(2, '0');
                          // 같은 날짜이고 시작/종료 시간의 시가 같으면, 종료 분 이후는 비활성화
                          let disabled = false;
                          if (selectedDate === endDate && startTimeFilter && endTimeFilter) {
                            const startHour = parseInt(startTimeFilter.split(':')[0]);
                            const endHour = parseInt(endTimeFilter.split(':')[0]);
                            const endMinute = parseInt(endTimeFilter.split(':')[1]);
                            if (startHour === endHour) {
                              disabled = i > endMinute;
                            }
                          }
                          return (
                            <option key={minute} value={minute} disabled={disabled}>
                              {minute}분
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <span className="text-gray-500 flex-shrink-0">~</span>
                    
                    {/* 종료 시간 */}
                    <div className="flex-1 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                      <select
                        value={endTimeFilter.split(':')[0] || ''}
                        onChange={(e) => {
                          const minute = endTimeFilter.split(':')[1] || '00';
                          setEndTimeFilter(e.target.value ? `${e.target.value}:${minute}` : '');
                        }}
                        className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                      >
                        <option value="">시</option>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          // 같은 날짜이고 시작 시간이 설정되어 있으면, 시작 시간 이전은 비활성화
                          let disabled = false;
                          if (selectedDate === endDate && startTimeFilter) {
                            const startHour = parseInt(startTimeFilter.split(':')[0]);
                            disabled = i < startHour;
                          }
                          return (
                            <option key={hour} value={hour} disabled={disabled}>
                              {hour}시
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-gray-500">:</span>
                      <select
                        value={endTimeFilter.split(':')[1] || ''}
                        onChange={(e) => {
                          const hour = endTimeFilter.split(':')[0] || '00';
                          setEndTimeFilter(e.target.value !== '' ? `${hour}:${e.target.value}` : '');
                        }}
                        className="flex-1 bg-gray-800 text-white focus:outline-none [&>option]:bg-gray-800 [&>option]:text-white"
                      >
                        <option value="">분</option>
                        {Array.from({ length: 60 }, (_, i) => {
                          const minute = i.toString().padStart(2, '0');
                          // 같은 날짜이고 시작/종료 시간의 시가 같으면, 시작 분 이전은 비활성화
                          let disabled = false;
                          if (selectedDate === endDate && startTimeFilter && endTimeFilter) {
                            const startHour = parseInt(startTimeFilter.split(':')[0]);
                            const endHour = parseInt(endTimeFilter.split(':')[0]);
                            const startMinute = parseInt(startTimeFilter.split(':')[1]);
                            if (startHour === endHour) {
                              disabled = i < startMinute;
                            }
                          }
                          return (
                            <option key={minute} value={minute} disabled={disabled}>
                              {minute}분
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {(startTimeFilter || endTimeFilter) && (
                      <button
                        onClick={() => {
                          setStartTimeFilter("");
                          setEndTimeFilter("");
                        }}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                        title="시간대 초기화"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type="text"
                      placeholder="회차 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">모든 게임</option>
                    <option value="파워볼">파워볼</option>
                    <option value="사다리">사다리</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">모든 상태</option>
                    <option value="진행중">진행중</option>
                    <option value="완료">완료</option>
                  </select>
                </div>

                {/* 검색 결과 및 초기화 */}
                <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
                  <span className="text-gray-400 text-sm">
                    검색 결과: <span className="text-indigo-400 font-medium">{filteredRounds.length}건</span>
                  </span>
                  {(gameFilter !== "all" || statusFilter !== "all" || searchTerm || startTimeFilter || endTimeFilter || selectedDate !== endDate) && (
                    <button
                      onClick={() => {
                        setGameFilter("all");
                        setStatusFilter("all");
                        setSearchTerm("");
                        setStartTimeFilter("");
                        setEndTimeFilter("");
                        const today = new Date().toISOString().split('T')[0];
                        setSelectedDate(today);
                        setEndDate(today);
                      }}
                      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      전체 옵션 초기화
                    </button>
                  )}
                </div>
              </div>
            </div>


            {/* Game Rounds Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        게임
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        회차
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        결과
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅총액 / 건수
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        상태
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        발매시간 / 마감시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredRounds.map((round) => (
                      <tr
                        key={round.id}
                        onClick={() => setSelectedRoundDetail(round)}
                        className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-center">
                          <span className={`${round.gameType === '파워볼' ? 'bg-purple-500/30 text-purple-300' : 'bg-blue-500/30 text-blue-300'} px-2 py-1 rounded text-xs font-semibold`}>
                            {round.gameType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          #{round.roundNumber}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs">
                            {generateDetailedResult(round)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col">
                            <span className="text-white">
                              {round.totalAmount.toLocaleString()}P
                            </span>
                            <span className="text-gray-400 text-xs">
                              {round.totalBets}건
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                                round.status,
                              )}`}
                            >
                              {round.status}
                            </span>
                            {round.status === "진행중" && (
                              <div className="text-xs">
                                <CountdownTimer gameType={round.gameType} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col text-gray-300 text-xs">
                            <span>{round.startTime}</span>
                            <span className="text-gray-500">{round.endTime}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "rounds" ? (
          <div className="space-y-6">
            {/* Current Round Betting Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentRoundBets.map((round) => (
                <div
                  key={round.id}
                  className={`bg-gray-900 border rounded-lg p-6 ${
                    round.reservedResult 
                      ? 'border-green-500/50 shadow-lg shadow-green-500/10' 
                      : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${round.gameType === '파워볼' ? 'bg-purple-500/30 text-purple-300' : 'bg-blue-500/30 text-blue-300'} px-2 py-1 rounded text-sm font-semibold`}>
                          {round.gameType}
                        </span>
                        <span className="text-white text-lg">#{round.roundNumber}</span>
                        {round.reservedResult && (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border border-green-500/30">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            예약: {round.reservedResult}
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        진행중 • 총{" "}
                        {round.totalAmount.toLocaleString()}P •{" "}
                        {round.totalBets}건
                      </p>
                    </div>
                    <CountdownTimer gameType={round.gameType} />
                  </div>

                  {round.betDistribution && (
                    <div className="space-y-4">
                      {/* Separate regular bets and combination bets */}
                      {(() => {
                        const regularBets = round.gameType === '파워볼' 
                          ? round.betDistribution // For 파워볼, all 8 options are regular bets
                          : round.betDistribution.filter(bet => 
                              !bet.option.includes('좌') || !bet.option.includes('우') || 
                              bet.option === '좌출발' || bet.option === '우출발'
                            ).slice(0, 6); // For 사다리, first 6 are regular bets (좌출발/우출발, 3줄/4줄, 홀/짝)
                        
                        const combinationBets = round.gameType === '파워볼'
                          ? [] // No combination bets for 파워볼
                          : round.betDistribution.filter(bet => 
                              (bet.option.includes('좌') || bet.option.includes('우')) && 
                              bet.option !== '좌출발' && bet.option !== '우출발'
                            ); // Last 4 are combination bets (좌3짝, 좌4홀, 우3홀, 우4짝)
                        
                        return (
                          <>
                            {/* Regular bets - pairs */}
                            {regularBets
                              .reduce((pairs: any[], item, index) => {
                                if (index % 2 === 0) {
                                  pairs.push([item, regularBets[index + 1]]);
                                }
                                return pairs;
                              }, [])
                              .map((pair, pairIdx) => {
                                if (!pair[1]) return null;
                                return (
                            <div
                              key={pairIdx}
                              className="space-y-2"
                            >
                              {/* Bidirectional Bar - Combined view */}
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-semibold">
                                    {pair[0].option}
                                    {pair[0].option.includes('언더') && (
                                      <span className="text-gray-500 text-xs ml-1">
                                        ({pair[0].option.includes('일반볼') ? '72.5' : '4.5'})
                                      </span>
                                    )}
                                    {pair[0].option.includes('오버') && (
                                      <span className="text-gray-500 text-xs ml-1">
                                        ({pair[0].option.includes('일반볼') ? '72.5' : '4.5'})
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-indigo-400">
                                    {pair[0].percentage}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-indigo-400">
                                    {pair[1].percentage}%
                                  </span>
                                  <span className="text-white font-semibold">
                                    {pair[1].option}
                                    {pair[1].option.includes('언더') && (
                                      <span className="text-gray-500 text-xs ml-1">
                                        ({pair[1].option.includes('일반볼') ? '72.5' : '4.5'})
                                      </span>
                                    )}
                                    {pair[1].option.includes('오버') && (
                                      <span className="text-gray-500 text-xs ml-1">
                                        ({pair[1].option.includes('일반볼') ? '72.5' : '4.5'})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Bidirectional Progress Bar - Clickable */}
                              <div className="flex w-full h-8 bg-gray-800 rounded-lg overflow-hidden justify-between">
                                <div
                                  onClick={() => setSelectedBetOption({
                                    gameType: round.gameType,
                                    roundNumber: round.roundNumber,
                                    option: pair[0].option
                                  })}
                                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 flex items-center justify-start pl-2 transition-all duration-300 cursor-pointer hover:from-indigo-600 hover:to-indigo-500"
                                  style={{
                                    width: `${pair[0].percentage}%`,
                                  }}
                                >
                                  <span className="text-white text-xs font-semibold">
                                    {pair[0].percentage}%
                                  </span>
                                </div>
                                <div
                                  onClick={() => setSelectedBetOption({
                                    gameType: round.gameType,
                                    roundNumber: round.roundNumber,
                                    option: pair[1].option
                                  })}
                                  className="bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-end pr-2 transition-all duration-300 cursor-pointer hover:from-purple-600 hover:to-purple-500"
                                  style={{
                                    width: `${pair[1].percentage}%`,
                                  }}
                                >
                                  <span className="text-white text-xs font-semibold">
                                    {pair[1].percentage}%
                                  </span>
                                </div>
                              </div>

                              {/* Detail Info */}
                              <div className="flex items-center justify-between text-xs pt-1">
                                <button 
                                  onClick={() => setSelectedBetOption({
                                    gameType: round.gameType,
                                    roundNumber: round.roundNumber,
                                    option: pair[0].option
                                  })}
                                  className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                >
                                  {pair[0].amount.toLocaleString()}P ({pair[0].count}건)
                                </button>
                                <button 
                                  onClick={() => setSelectedBetOption({
                                    gameType: round.gameType,
                                    roundNumber: round.roundNumber,
                                    option: pair[1].option
                                  })}
                                  className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                >
                                  {pair[1].amount.toLocaleString()}P ({pair[1].count}건)
                                </button>
                              </div>
                            </div>
                                );
                              })}
                            
                            {/* Combination bets - 4 sections in one bar (only for 사다리) */}
                            {round.gameType === '사다리' && combinationBets.length === 4 && (
                              <div className="space-y-2">
                                <div className="text-gray-400 text-xs mb-2 font-semibold pt-2 border-t border-gray-800">조합배팅</div>
                                
                                {/* Label row with 4 options */}
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">{combinationBets[0].option}</span>
                                    <span className="text-indigo-400">{combinationBets[0].percentage}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">{combinationBets[1].option}</span>
                                    <span className="text-purple-400">{combinationBets[1].percentage}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">{combinationBets[2].option}</span>
                                    <span className="text-cyan-400">{combinationBets[2].percentage}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-white font-semibold">{combinationBets[3].option}</span>
                                    <span className="text-pink-400">{combinationBets[3].percentage}%</span>
                                  </div>
                                </div>
                                
                                {/* 4-section bar */}
                                <div className="flex w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
                                  {(() => {
                                    const totalPercentage = combinationBets.reduce((sum, bet) => sum + bet.percentage, 0);
                                    const hasNoBets = totalPercentage === 0;
                                    
                                    return (
                                      <>
                                        <div
                                          onClick={() => setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: combinationBets[0].option
                                          })}
                                          className="bg-gradient-to-r from-indigo-500 to-indigo-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-indigo-600 hover:to-indigo-500"
                                          style={{ width: hasNoBets ? '25%' : `${combinationBets[0].percentage}%` }}
                                        >
                                          {!hasNoBets && combinationBets[0].percentage > 0 && (
                                            <span className="text-white text-xs font-semibold">{combinationBets[0].percentage}%</span>
                                          )}
                                        </div>
                                        <div
                                          onClick={() => setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: combinationBets[1].option
                                          })}
                                          className="bg-gradient-to-r from-purple-500 to-purple-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-purple-600 hover:to-purple-500 border-l border-gray-900"
                                          style={{ width: hasNoBets ? '25%' : `${combinationBets[1].percentage}%` }}
                                        >
                                          {!hasNoBets && combinationBets[1].percentage > 0 && (
                                            <span className="text-white text-xs font-semibold">{combinationBets[1].percentage}%</span>
                                          )}
                                        </div>
                                        <div
                                          onClick={() => setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: combinationBets[2].option
                                          })}
                                          className="bg-gradient-to-r from-cyan-500 to-cyan-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-cyan-600 hover:to-cyan-500 border-l border-gray-900"
                                          style={{ width: hasNoBets ? '25%' : `${combinationBets[2].percentage}%` }}
                                        >
                                          {!hasNoBets && combinationBets[2].percentage > 0 && (
                                            <span className="text-white text-xs font-semibold">{combinationBets[2].percentage}%</span>
                                          )}
                                        </div>
                                        <div
                                          onClick={() => setSelectedBetOption({
                                            gameType: round.gameType,
                                            roundNumber: round.roundNumber,
                                            option: combinationBets[3].option
                                          })}
                                          className="bg-gradient-to-r from-pink-500 to-pink-400 flex items-center justify-center transition-all duration-500 cursor-pointer hover:from-pink-600 hover:to-pink-500 border-l border-gray-900"
                                          style={{ width: hasNoBets ? '25%' : `${combinationBets[3].percentage}%` }}
                                        >
                                          {!hasNoBets && combinationBets[3].percentage > 0 && (
                                            <span className="text-white text-xs font-semibold">{combinationBets[3].percentage}%</span>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                                
                                {/* Detail info row with 4 options */}
                                <div className="flex items-center justify-between text-xs pt-1">
                                  <button 
                                    onClick={() => setSelectedBetOption({
                                      gameType: round.gameType,
                                      roundNumber: round.roundNumber,
                                      option: combinationBets[0].option
                                    })}
                                    className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                  >
                                    {combinationBets[0].amount.toLocaleString()}P ({combinationBets[0].count}건)
                                  </button>
                                  <button 
                                    onClick={() => setSelectedBetOption({
                                      gameType: round.gameType,
                                      roundNumber: round.roundNumber,
                                      option: combinationBets[1].option
                                    })}
                                    className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                  >
                                    {combinationBets[1].amount.toLocaleString()}P ({combinationBets[1].count}건)
                                  </button>
                                  <button 
                                    onClick={() => setSelectedBetOption({
                                      gameType: round.gameType,
                                      roundNumber: round.roundNumber,
                                      option: combinationBets[2].option
                                    })}
                                    className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                  >
                                    {combinationBets[2].amount.toLocaleString()}P ({combinationBets[2].count}건)
                                  </button>
                                  <button 
                                    onClick={() => setSelectedBetOption({
                                      gameType: round.gameType,
                                      roundNumber: round.roundNumber,
                                      option: combinationBets[3].option
                                    })}
                                    className="text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                  >
                                    {combinationBets[3].amount.toLocaleString()}P ({combinationBets[3].count}건)
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AdminMiniGamesSettingsTab />
        )}

        {false && (
          <div className="space-y-6">
            {/* Bet Type Filter for History - OLD CONTENT REMOVED */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="회원명 또는 ID로 검색..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400" size={20} />
                  <select
                    value={gameFilter}
                    onChange={(e) =>
                      setGameFilter(e.target.value)
                    }
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">전체 게임</option>
                    <option value="주사위">주사위</option>
                    <option value="사다리">사다리</option>
                  </select>

                  <select
                    value={selectedBetType}
                    onChange={(e) =>
                      setSelectedBetType(e.target.value)
                    }
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">전체 종목</option>
                    <option value="홀">홀</option>
                    <option value="짝">짝</option>
                    <option value="좌출발">좌출발</option>
                    <option value="우출발">우출발</option>
                  </select>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">
                        회원
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        게임
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        회차
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅 종목
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅 금액
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        당첨 금액
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        결과
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        배팅 시간
                      </th>
                      <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                        정산 시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredHistory.map((bet) => (
                      <tr
                        key={bet.id}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white">
                              {bet.userName}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {bet.userId}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">
                            {bet.gameType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          #{bet.roundNumber}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-indigo-400 font-semibold">
                            {bet.betType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-white">
                          {bet.amount.toLocaleString()}P
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              bet.winAmount > 0
                                ? "text-green-400"
                                : "text-gray-500"
                            }
                          >
                            {bet.winAmount > 0
                              ? `+${bet.winAmount.toLocaleString()}P`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getResultColor(
                              bet.result,
                            )}`}
                          >
                            {bet.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300 text-sm">
                          {bet.timestamp}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300 text-sm">
                          {bet.settled}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Bet Modal */}
        {selectedBetOption && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h2 className="text-white text-xl">
                    {selectedBetOption.gameType} #{selectedBetOption.roundNumber} - {selectedBetOption.option}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    배팅 유저 목록
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBetOption(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Fixed Header */}
                <div className="bg-gray-800">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[40%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">
                          회원정보
                        </th>
                        <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                          배팅 금액
                        </th>
                        <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                          보유 포인트
                        </th>
                        <th className="px-4 py-2 text-center text-xs text-gray-400 uppercase">
                          배팅 시간
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-auto flex-1">
                  <table className="w-full table-fixed">
                    <colgroup>
                      <col className="w-[40%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <tbody className="divide-y divide-gray-800">
                      {generateBetUsers(selectedBetOption.gameType, selectedBetOption.roundNumber, selectedBetOption.option).map((user) => (
                        <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-2">
                            <div className="overflow-hidden">
                              <p className="text-white text-sm truncate">{user.userNickname}({user.userName})</p>
                              <p className="text-gray-500 text-xs">{user.userIp}</p>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-yellow-400 text-sm">
                            {user.amount.toLocaleString()}P
                          </td>
                          <td className="px-2 py-2 text-center text-gray-300 text-sm">
                            {user.userPoints.toLocaleString()}P
                          </td>
                          <td className="px-4 py-2 text-center text-gray-300 text-xs">
                            {user.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-800">
                <button
                  onClick={() => setSelectedBetOption(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Round Detail Modal */}
        {selectedRoundDetail && (
          <RoundDetailModal
            round={selectedRoundDetail}
            onClose={() => setSelectedRoundDetail(null)}
          />
        )}

        {/* Result Adjustment Modal */}
        <ResultAdjustmentModal
          isOpen={isResultAdjustmentOpen}
          onClose={() => setIsResultAdjustmentOpen(false)}
          gameRounds={gameRounds}
          onUpdateReservedResult={handleUpdateReservedResult}
        />
      </div>
    </AdminLayout>
  );
}