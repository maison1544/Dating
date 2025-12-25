import { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  Calendar,
  Key,
  MessageCircle,
  Info,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  nickname?: string;
  email: string;
  phone?: string;
  joined?: string;
  lastLogin?: string;
  joinIp?: string;
  lastIp?: string;
  status: string;
  points?: number;
  online?: boolean;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
  revenue?: number;
  referralCode?: string;
  profileImage?: string;
}

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  chatMessages?: Record<
    string,
    Array<{
      time: string;
      sender: string;
      message: string;
      type?: string;
    }>
  >;
  isReadOnly?: boolean; // 에이전트 모드 (관리 기능 숨김)
}

export function UserDetailModal({
  user,
  onClose,
  chatMessages = {},
  isReadOnly = false,
}: UserDetailModalProps) {
  // 모달 열릴 때 배경 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const [activeTab, setActiveTab] = useState("basic");
  const [selectedBetDate, setSelectedBetDate] = useState("");
  const [selectedPointDate, setSelectedPointDate] =
    useState("");
  const [selectedGiftDate, setSelectedGiftDate] = useState("");
  const [selectedChatDate, setSelectedChatDate] = useState("");

  // 프로필 이미지 팝업 state
  const [showProfileImage, setShowProfileImage] = useState(false);

  // 기간 선택을 위한 state 추가
  const [betStartDate, setBetStartDate] = useState("");
  const [betEndDate, setBetEndDate] = useState("");
  const [pointStartDate, setPointStartDate] = useState("");
  const [pointEndDate, setPointEndDate] = useState("");
  const [giftStartDate, setGiftStartDate] = useState("");
  const [giftEndDate, setGiftEndDate] = useState("");
  const [chatStartDate, setChatStartDate] = useState("");
  const [chatEndDate, setChatEndDate] = useState("");

  // 날짜 유효성 검사 state 추가
  const [isPointDateRangeValid, setIsPointDateRangeValid] =
    useState(true);
  const [isGiftDateRangeValid, setIsGiftDateRangeValid] =
    useState(true);
  const [isChatDateRangeValid, setIsChatDateRangeValid] =
    useState(true);
  const [isBetDateRangeValid, setIsBetDateRangeValid] =
    useState(true);

  // 날짜 범위 유효성 검증 함수
  const validateDateRange = (start: string, end: string) => {
    if (start && end) {
      return new Date(start) <= new Date(end);
    }
    return true;
  };

  // 포인트 필터 추가 (전체/입금/출금)
  const [pointFilter, setPointFilter] = useState<
    "all" | "deposit" | "withdraw" | "etc"
  >("all");

  // 미니게임 필터 추가 (전체/사다리/파워볼)
  const [minigameFilter, setMinigameFilter] = useState<
    "all" | "ladder" | "powerball"
  >("all");

  const [selectedChat, setSelectedChat] = useState<
    string | null
  >(null);
  const [isChangingPassword, setIsChangingPassword] =
    useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdjustingPoints, setIsAdjustingPoints] =
    useState(false);
  const [pointAdjustType, setPointAdjustType] = useState<
    "add" | "subtract"
  >("add");
  const [pointAdjustAmount, setPointAdjustAmount] =
    useState("");
  const [isEditingReferralCode, setIsEditingReferralCode] =
    useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState(
    user.referralCode || "",
  );
  const [showReferralCodeModal, setShowReferralCodeModal] =
    useState(false);

  // 채팅 팝업 state 추가
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatPopupPartner, setChatPopupPartner] = useState("");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState<
    string | null
  >(null);

  // 회원 정지/정지 해제 state
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  // 선물 인벤토리 관리 state
  const [giftInventory, setGiftInventory] = useState([
    {
      id: 1,
      name: "🌹 장미",
      emoji: "🌹",
      value: 80,
      quantity: 3,
    },
    {
      id: 2,
      name: "🍫 초콜릿",
      emoji: "🍫",
      value: 240,
      quantity: 5,
    },
    {
      id: 3,
      name: "🍾 샴페인",
      emoji: "🍾",
      value: 400,
      quantity: 2,
    },
    {
      id: 4,
      name: "💝 하트 풍선",
      emoji: "💝",
      value: 160,
      quantity: 4,
    },
    {
      id: 5,
      name: "💍 다이아 반지",
      emoji: "💍",
      value: 800,
      quantity: 1,
    },
    {
      id: 6,
      name: "🧴 럭셔리 향수",
      emoji: "🧴",
      value: 2000,
      quantity: 0,
    },
  ]);
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [giftAction, setGiftAction] = useState<
    "add" | "remove"
  >("add");
  const [newGiftQuantity, setNewGiftQuantity] = useState("");

  // 기프트 선택을 위한 사전 정의 목록
  const availableGifts = [
    {
      id: 1,
      name: "🌹 장미",
      emoji: "🌹",
      value: 80,
      price: 100,
    },
    {
      id: 2,
      name: "🍫 초콜릿",
      emoji: "🍫",
      value: 240,
      price: 300,
    },
    {
      id: 3,
      name: "🍾 샴페인",
      emoji: "🍾",
      value: 400,
      price: 500,
    },
    {
      id: 4,
      name: "💝 하트 풍선",
      emoji: "💝",
      value: 160,
      price: 200,
    },
    {
      id: 5,
      name: "💍 다이아 반지",
      emoji: "💍",
      value: 800,
      price: 1000,
    },
    {
      id: 6,
      name: "🧴 럭셔리 향수",
      emoji: "🧴",
      value: 2000,
      price: 2500,
    },
  ];

  // 선물 내역 더미 데이터
  const [giftHistory, setGiftHistory] = useState([
    {
      date: "2025-12-15 14:30",
      giftName: "🌹 장미",
      type: "받음",
      from: "유진",
      points: 80,
      quantity: 1,
    },
    {
      date: "2025-12-15 11:20",
      giftName: "💝 하트 풍선",
      type: "보냄",
      to: "민지",
      points: -160,
      quantity: 1,
    },
    {
      date: "2025-12-14 16:45",
      giftName: "🍫 초콜릿",
      type: "받음",
      from: "민지",
      points: 240,
      quantity: 1,
    },
    {
      date: "2025-12-14 10:15",
      giftName: "💍 다이아 반지",
      type: "관리자 지급",
      from: "superadmin",
      points: 800,
      quantity: 1,
    },
    {
      date: "2025-12-13 18:20",
      giftName: "🍾 샴페인",
      type: "보냄",
      to: "유진",
      points: -400,
      quantity: 1,
    },
    {
      date: "2025-12-12 15:30",
      giftName: "🌹 장미",
      type: "받음",
      from: "유진",
      points: 80,
      quantity: 1,
    },
    {
      date: "2025-12-11 20:10",
      giftName: "💝 하트 풍선",
      type: "관리자 지급",
      from: "superadmin",
      points: 160,
      quantity: 1,
    },
    {
      date: "2025-12-11 14:25",
      giftName: "🍫 초콜릿",
      type: "보냄",
      to: "민지",
      points: -240,
      quantity: 1,
    },
    {
      date: "2025-12-10 11:40",
      giftName: "🌹 장미",
      type: "받음",
      from: "유진",
      points: 80,
      quantity: 1,
    },
    {
      date: "2025-12-09 16:00",
      giftName: "🍫 초콜릿",
      type: "보냄",
      to: "유진",
      points: -240,
      quantity: 1,
    },
    {
      date: "2025-12-08 19:30",
      giftName: "💝 하트 풍선",
      type: "받음",
      from: "민지",
      points: 160,
      quantity: 1,
    },
    {
      date: "2025-12-07 13:15",
      giftName: "🧴 럭셔리 향수",
      type: "관리자 회수",
      from: "superadmin",
      points: -2000,
      quantity: 1,
    },
    {
      date: "2025-12-06 10:20",
      giftName: "💍 다이아 반지",
      type: "보냄",
      to: "유진",
      points: -800,
      quantity: 1,
    },
    {
      date: "2025-12-05 17:45",
      giftName: "🍾 샴페인",
      type: "받음",
      from: "민지",
      points: 400,
      quantity: 1,
    },
    {
      date: "2025-12-04 14:00",
      giftName: "🌹 장미",
      type: "보냄",
      to: "민지",
      points: -80,
      quantity: 1,
    },
  ]);

  // activeTab 변경 시 채팅창 닫기
  useEffect(() => {
    setSelectedChat(null);
  }, [activeTab]);

  // 미니게임 배팅 내역 더미 데이터
  const minigameBetHistory = [
    {
      id: 1,
      date: "2025-12-15 14:23:15",
      gameType: "사다리",
      roundNumber: 1234,
      betOption: "좌출발",
      amount: 10000,
      result: "승리",
      winAmount: 19500,
      ip: "192.168.1.105",
    },
    {
      id: 2,
      date: "2025-12-15 14:20:42",
      gameType: "파워볼",
      roundNumber: 5678,
      betOption: "일반볼-짝/오버",
      amount: 5000,
      result: "패배",
      winAmount: 0,
      ip: "192.168.1.105",
    },
    {
      id: 3,
      date: "2025-12-15 14:18:30",
      gameType: "사다리",
      roundNumber: 1233,
      betOption: "우출발/3줄",
      amount: 3000,
      result: "승리",
      winAmount: 5850,
      ip: "192.168.1.105",
    },
    {
      id: 4,
      date: "2025-12-15 13:45:10",
      gameType: "파워볼",
      roundNumber: 5677,
      betOption: "파워볼-홀/언더",
      amount: 7000,
      result: "패배",
      winAmount: 0,
      ip: "192.168.1.105",
    },
    {
      id: 5,
      date: "2025-12-15 13:40:28",
      gameType: "사다리",
      roundNumber: 1232,
      betOption: "좌출발/4줄",
      amount: 2000,
      result: "승리",
      winAmount: 3900,
      ip: "192.168.1.105",
    },
    {
      id: 6,
      date: "2025-12-15 12:30:55",
      gameType: "파워볼",
      roundNumber: 5676,
      betOption: "일반볼-홀/언더",
      amount: 15000,
      result: "승리",
      winAmount: 29250,
      ip: "192.168.1.105",
    },
    {
      id: 7,
      date: "2025-12-15 12:15:20",
      gameType: "사다리",
      roundNumber: 1231,
      betOption: "우출발",
      amount: 8000,
      result: "패배",
      winAmount: 0,
      ip: "192.168.1.105",
    },
    {
      id: 8,
      date: "2025-12-15 11:50:40",
      gameType: "파워볼",
      roundNumber: 5675,
      betOption: "파워볼-짝/오버",
      amount: 4000,
      result: "승리",
      winAmount: 7800,
      ip: "192.168.1.105",
    },
    {
      id: 9,
      date: "2025-12-14 18:25:33",
      gameType: "사다리",
      roundNumber: 1230,
      betOption: "좌출발/3줄",
      amount: 6000,
      result: "패배",
      winAmount: 0,
      ip: "192.168.1.98",
    },
    {
      id: 10,
      date: "2025-12-14 17:40:15",
      gameType: "파워볼",
      roundNumber: 5674,
      betOption: "일반볼-짝/언더",
      amount: 12000,
      result: "승리",
      winAmount: 23400,
      ip: "192.168.1.98",
    },
  ];

  // 포인트 내역 더미 데이터
  const pointHistory = [
    {
      date: "2025-12-15 10:30",
      amount: 10000,
      type: "충전",
      category: "deposit",
      bonus: 1000,
    },
    {
      date: "2025-12-14 15:20",
      amount: -80,
      type: "장미 구매",
      category: "etc",
    },
    {
      date: "2025-12-13 09:15",
      amount: 5000,
      type: "충전",
      category: "deposit",
      bonus: 500,
    },
    {
      date: "2025-12-12 18:45",
      amount: -2000,
      type: "출금",
      category: "withdraw",
    },
    {
      date: "2025-12-11 14:20",
      amount: 300,
      type: "superadmin 증가",
      category: "etc",
      isAdminBonus: true,
    },
    {
      date: "2025-12-10 11:30",
      amount: -1500,
      type: "출금",
      category: "withdraw",
    },
    {
      date: "2025-12-09 16:40",
      amount: 3000,
      type: "충전",
      category: "deposit",
      bonus: 0,
    },
    {
      date: "2025-12-08 13:20",
      amount: -240,
      type: "초콜릿 구매",
      category: "etc",
    },
    {
      date: "2025-12-07 10:15",
      amount: 7000,
      type: "충전",
      category: "deposit",
      bonus: 700,
    },
    {
      date: "2025-12-06 17:30",
      amount: -3000,
      type: "출금",
      category: "withdraw",
    },
    {
      date: "2025-12-05 14:50",
      amount: -400,
      type: "샴페인 구매",
      category: "etc",
    },
    {
      date: "2025-12-04 09:25",
      amount: -1000,
      type: "출금",
      category: "withdraw",
    },
    {
      date: "2025-12-03 16:10",
      amount: -160,
      type: "하트 풍선 구매",
      category: "etc",
    },
    {
      date: "2025-12-02 11:20",
      amount: 2000,
      type: "충전",
      category: "deposit",
      bonus: 200,
    },
    {
      date: "2025-12-01 14:35",
      amount: -500,
      type: "superadmin 감소",
      category: "etc",
      isAdminBonus: true,
    },
    {
      date: "2025-11-30 09:50",
      amount: -2500,
      type: "출금",
      category: "withdraw",
    },
    {
      date: "2025-11-29 10:30",
      amount: 800,
      type: "superadmin 증가",
      category: "etc",
      isAdminBonus: true,
    },
    {
      date: "2025-11-28 15:40",
      amount: -800,
      type: "다이아 반지 구매",
      category: "etc",
    },
    {
      date: "2025-11-27 12:20",
      amount: -1600,
      type: "럭셔리 향수 구매",
      category: "etc",
    },
    {
      date: "2025-11-26 18:30",
      amount: 80,
      type: "장미 판매",
      category: "etc",
    },
    {
      date: "2025-11-25 14:15",
      amount: 240,
      type: "초콜릿 판매",
      category: "etc",
    },
    {
      date: "2025-11-24 16:30",
      amount: -200,
      type: "하트 풍선 구매",
      category: "etc",
    },
    {
      date: "2025-11-24 10:20",
      amount: 160,
      type: "하트 풍선 판매",
      category: "etc",
    },
    {
      date: "2025-11-23 16:45",
      amount: 400,
      type: "샴페인 판매",
      category: "etc",
    },
    {
      date: "2025-11-23 09:15",
      amount: -500,
      type: "샴페인 구매",
      category: "etc",
    },
    {
      date: "2025-11-22 13:30",
      amount: 800,
      type: "다이아 반지 판매",
      category: "etc",
    },
    {
      date: "2025-11-21 11:10",
      amount: 2000,
      type: "럭셔리 향수 판매",
      category: "etc",
    },
    {
      date: "2025-11-20 14:25",
      amount: -100,
      type: "장미 구매",
      category: "etc",
    },
    {
      date: "2025-11-20 09:50",
      amount: 80,
      type: "장미 판매",
      category: "etc",
    },
    {
      date: "2025-11-19 18:40",
      amount: -300,
      type: "초콜릿 구매",
      category: "etc",
    },
    {
      date: "2025-11-19 15:25",
      amount: 240,
      type: "초콜릿 판매",
      category: "etc",
    },
    {
      date: "2025-11-18 11:50",
      amount: -1000,
      type: "다이아 반지 구매",
      category: "etc",
    },
  ];

  // 날짜 필터가 적용된 데이터
  const dateFilteredHistory = pointHistory.filter((item) => {
    if (!pointStartDate && !pointEndDate) return true;
    const itemDate = item.date.split(" ")[0]; // "2025-12-15 10:30" -> "2025-12-15"
    if (pointStartDate && itemDate < pointStartDate)
      return false;
    if (pointEndDate && itemDate > pointEndDate) return false;
    return true;
  });

  // 필터링된 포인트 내역 (카테고리 + 날짜 범위)
  const filteredPointHistory = dateFilteredHistory.filter(
    (item) => {
      if (pointFilter === "deposit")
        return item.category === "deposit";
      if (pointFilter === "withdraw")
        return item.category === "withdraw";
      if (pointFilter === "etc") return item.category === "etc";
      return true; // all
    },
  );

  // 미니게임 배팅 내역 필터링 (날짜 + 게임 타입)
  const dateFilteredBets = minigameBetHistory.filter((bet) => {
    if (!betStartDate && !betEndDate) return true;
    const betDate = bet.date.split(" ")[0]; // "2025-12-15 14:23:15" -> "2025-12-15"
    if (betStartDate && betDate < betStartDate) return false;
    if (betEndDate && betDate > betEndDate) return false;
    return true;
  });

  const filteredMinigameBets = dateFilteredBets.filter(
    (bet) => {
      if (minigameFilter === "ladder")
        return bet.gameType === "사다리";
      if (minigameFilter === "powerball")
        return bet.gameType === "파워볼";
      return true; // all
    },
  );

  // 미니게임 롤링(턴오버) 통계 계산 - 날짜 필터 적용된 데이터 사용
  const totalMinigameRolling = dateFilteredBets.reduce(
    (sum, bet) => sum + bet.amount,
    0,
  );
  const ladderRolling = dateFilteredBets
    .filter((bet) => bet.gameType === "사다리")
    .reduce((sum, bet) => sum + bet.amount, 0);
  const powerballRolling = dateFilteredBets
    .filter((bet) => bet.gameType === "파워볼")
    .reduce((sum, bet) => sum + bet.amount, 0);

  // 전체 입금 통계 (승인된 충전금만, 보너스 제외) - 날짜 필터 적용
  const totalDeposit = dateFilteredHistory
    .filter((item) => item.category === "deposit")
    .reduce((sum, item) => sum + item.amount, 0);

  // 전체 보너스 통계 (충전 보너스 + 관리자 증가 보너스) - 날짜 필터 적용
  const totalBonus =
    dateFilteredHistory
      .filter((item) => item.category === "deposit")
      .reduce((sum, item) => sum + (item.bonus || 0), 0) +
    dateFilteredHistory
      .filter(
        (item) => item.category === "etc" && item.isAdminBonus,
      )
      .reduce((sum, item) => sum + item.amount, 0);

  // 전체 출금 통계 (관리자 승인된 출금만) - 날짜 필터 적용
  const totalWithdraw = dateFilteredHistory
    .filter((item) => item.category === "withdraw")
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  // 회원 기여 매출 = 전체 입금 - 전체 출금 (보너스 제외) - 항상 전체 기간 데이터 사용
  const totalDepositAll = pointHistory
    .filter((item) => item.category === "deposit")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalWithdrawAll = pointHistory
    .filter((item) => item.category === "withdraw")
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const memberRevenue = totalDepositAll - totalWithdrawAll;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "활성":
        return "bg-green-500/20 text-green-500";
      case "정지":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-white text-xl flex items-center gap-3">
            <div className="relative">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                  onClick={() => setShowProfileImage(true)}
                />
              ) : (
                <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                  {user.name[0]}
                </div>
              )}
              {user.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></span>
              )}
            </div>
            <div>
              <span>
                {user.nickname
                  ? `${user.nickname}(${user.name})`
                  : user.name}{" "}
                회원 상세 정보
              </span>
              <p className="text-gray-400 text-sm mt-0.5">
                {user.email}
              </p>
            </div>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "basic"
                  ? "bg-indigo-500/80 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              회원 정보
            </button>
            <button
              onClick={() => setActiveTab("points")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "points"
                  ? "bg-indigo-500/80 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              포인트 내역
            </button>
            <button
              onClick={() => setActiveTab("gifts")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "gifts"
                  ? "bg-indigo-500/80 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              기프트 내역
            </button>
            <button
              onClick={() => setActiveTab("chats")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "chats"
                  ? "bg-indigo-500/80 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              채팅 내역
            </button>
            <button
              onClick={() => setActiveTab("minigames")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "minigames"
                  ? "bg-indigo-500/80 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              미니게임 배팅내역
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-gray-700">
                {activeTab === "basic" && (
                  <>
                    <tr>
                      <td className="px-4 py-3 text-gray-400 w-1/4">
                        이름
                      </td>
                      <td className="px-4 py-3 text-white w-1/4">
                        {user.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400 w-1/4">
                        닉네임
                      </td>
                      <td className="px-4 py-3 text-white w-1/4">
                        {user.nickname || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">
                        이메일
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        전화번호
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.phone || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">
                        상태
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${getStatusColor(user.status)}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        접속 상태
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.online
                              ? "text-green-500"
                              : "text-gray-500"
                          }
                        >
                          {user.online
                            ? "● 온라인"
                            : "○ 오프라인"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">
                        보유 포인트
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-indigo-400 font-bold">
                            {(
                              user.points || 0
                            ).toLocaleString()}{" "}
                            P
                          </span>
                          {!isReadOnly && (
                            <button
                              onClick={() =>
                                setIsAdjustingPoints(
                                  !isAdjustingPoints,
                                )
                              }
                              className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-1 rounded text-xs transition-colors whitespace-nowrap"
                            >
                              조정
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        <div className="flex items-center gap-2 group relative">
                          <span>회원 기여 매출</span>
                          <Info
                            size={14}
                            className="text-gray-500 hover:text-yellow-400 cursor-help transition-colors flex-shrink-0"
                          />
                          <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-56 bg-gray-950 border border-gray-700 rounded-lg p-3 shadow-2xl z-50 pointer-events-none">
                            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-950 border-l border-t border-gray-700 transform rotate-45"></div>
                            <p className="text-white text-xs leading-relaxed">
                              회원 기여 매출은 전체 입금 금액과
                              전체 출금 금액의 합산 금액입니다.
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-yellow-400">
                        {memberRevenue >= 0 ? "+" : ""}
                        {memberRevenue.toLocaleString()}원
                      </td>
                    </tr>
                    {isAdjustingPoints && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-4 bg-gray-800/50"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign
                                className="text-indigo-400"
                                size={18}
                              />
                              <h3 className="text-white">
                                포인트 조정
                              </h3>
                            </div>
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-400 text-sm mb-1">
                                    조정 타입
                                  </label>
                                  <select
                                    value={pointAdjustType}
                                    onChange={(e) =>
                                      setPointAdjustType(
                                        e.target.value as
                                          | "add"
                                          | "subtract",
                                      )
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="add">
                                      지급 (+)
                                    </option>
                                    <option value="subtract">
                                      차감 (-)
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-gray-400 text-sm mb-1">
                                    포인트 금액
                                  </label>
                                  <input
                                    type="number"
                                    value={pointAdjustAmount}
                                    onChange={(e) =>
                                      setPointAdjustAmount(
                                        e.target.value,
                                      )
                                    }
                                    placeholder="금액 입력"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (pointAdjustAmount) {
                                      const amount = parseInt(
                                        pointAdjustAmount,
                                      );
                                      alert(
                                        `${pointAdjustType === "add" ? "+" : "-"}${amount.toLocaleString()}P ${pointAdjustType === "add" ? "지급" : "차감"}되었습니다`,
                                      );
                                      setIsAdjustingPoints(
                                        false,
                                      );
                                      setPointAdjustAmount("");
                                    }
                                  }}
                                  disabled={
                                    !pointAdjustAmount ||
                                    parseInt(
                                      pointAdjustAmount,
                                    ) <= 0
                                  }
                                  className="flex-1 bg-green-500/80 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  확인
                                </button>
                                <button
                                  onClick={() => {
                                    setIsAdjustingPoints(false);
                                    setPointAdjustAmount("");
                                  }}
                                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-4 py-3 text-gray-400">
                        은행
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.bank || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        계좌번호
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.accountNumber || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">
                        예금주
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.accountHolder || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        추천코드
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400">
                            {user.referralCode || "-"}
                          </span>
                          {!isReadOnly && (
                            <button
                              onClick={() => {
                                setShowReferralCodeModal(true);
                                setReferralCodeInput(
                                  user.referralCode || "",
                                );
                              }}
                              className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1 rounded text-xs transition-colors whitespace-nowrap"
                            >
                              수정
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">
                        가입일
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.joined || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        마지막 로그인
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.lastLogin || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">
                        가입 IP
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.joinIp || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        마지막 접속 IP
                      </td>
                      <td className="px-4 py-3 text-white">
                        {user.lastIp || "-"}
                      </td>
                    </tr>
                    {!isReadOnly && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-4 bg-gray-900"
                        >
                          {!isChangingPassword ? (
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() =>
                                  setIsChangingPassword(true)
                                }
                                className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Key size={18} />
                                비밀번호 변경
                              </button>
                              <button
                                onClick={() => setShowSuspendConfirm(true)}
                                className={`px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                  user.status === "활성"
                                    ? "bg-red-500/80 hover:bg-red-500 text-white"
                                    : "bg-green-500/80 hover:bg-green-500 text-white"
                                }`}
                              >
                                {user.status === "활성" ? "회원 정지" : "정지 해제"}
                              </button>
                            </div>
                          ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Key
                                className="text-indigo-400"
                                size={18}
                              />
                              <h3 className="text-white">
                                비밀번호 변경
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-gray-400 text-sm mb-1">
                                  새 비밀번호
                                </label>
                                <input
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) =>
                                    setNewPassword(
                                      e.target.value,
                                    )
                                  }
                                  placeholder="새 비밀번호 입력"
                                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-400 text-sm mb-1">
                                  비밀번호 재확인
                                </label>
                                <input
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) =>
                                    setConfirmPassword(
                                      e.target.value,
                                    )
                                  }
                                  placeholder="비밀번호 재확인"
                                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                            {newPassword &&
                              confirmPassword &&
                              newPassword !==
                                confirmPassword && (
                                <p className="text-red-400 text-sm">
                                  비밀번호가 일치하지 않습니다
                                </p>
                              )}
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  if (
                                    newPassword ===
                                      confirmPassword &&
                                    newPassword
                                  ) {
                                    alert(
                                      "비밀번호가 변경되었습니다",
                                    );
                                    setIsChangingPassword(
                                      false,
                                    );
                                    setNewPassword("");
                                    setConfirmPassword("");
                                  }
                                }}
                                disabled={
                                  !newPassword ||
                                  !confirmPassword ||
                                  newPassword !==
                                    confirmPassword
                                }
                                className="flex-1 bg-green-500/80 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setIsChangingPassword(false);
                                  setNewPassword("");
                                  setConfirmPassword("");
                                }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        )}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {activeTab === "points" && (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-2 bg-gray-900"
                      >
                        {/* 안내 메시지 */}
                        <div className="flex items-start gap-2 mb-1.5 p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg w-fit">
                          <Info className="text-indigo-400 mt-0.5 flex-shrink-0" size={14} />
                          <p className="text-indigo-300 text-xs whitespace-nowrap">
                            미니게임 배팅금액은 포인트 내역에서 집계되지 않습니다. 미니게임 배팅내역에서 집계 됩니다.
                          </p>
                        </div>

                        {/* 필터 드롭다운과 캘린더를 같은 줄에 배치 */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-gray-400 text-sm">
                            유형:
                          </span>
                          <select
                            value={pointFilter}
                            onChange={(e) =>
                              setPointFilter(
                                e.target.value as
                                  | "all"
                                  | "deposit"
                                  | "withdraw"
                                  | "etc",
                              )
                            }
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                          >
                            <option value="all">전체</option>
                            <option value="deposit">
                              입금
                            </option>
                            <option value="withdraw">
                              출금
                            </option>
                            <option value="etc">기타</option>
                          </select>

                          {/* 세로 구분선 */}
                          <div className="h-6 w-px bg-gray-700"></div>

                          {/* 기간 선택 */}
                          <Calendar
                            className="text-indigo-400"
                            size={18}
                          />
                          <input
                            type="date"
                            value={pointStartDate}
                            onChange={(e) => {
                              setPointStartDate(e.target.value);
                              setIsPointDateRangeValid(
                                validateDateRange(
                                  e.target.value,
                                  pointEndDate,
                                ),
                              );
                            }}
                            className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                              !isPointDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                            placeholder="시작일"
                          />
                          <span className="text-gray-400">
                            ~
                          </span>
                          <input
                            type="date"
                            value={pointEndDate}
                            onChange={(e) => {
                              setPointEndDate(e.target.value);
                              setIsPointDateRangeValid(
                                validateDateRange(
                                  pointStartDate,
                                  e.target.value,
                                ),
                              );
                            }}
                            className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                              !isPointDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                            placeholder="종료일"
                          />
                          {(pointStartDate || pointEndDate) && (
                            <button
                              onClick={() => {
                                setPointStartDate("");
                                setPointEndDate("");
                                setIsPointDateRangeValid(true);
                              }}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                            >
                              초기화
                            </button>
                          )}
                        </div>

                        {/* 날짜 유효성 에러 메시지 */}
                        {!isPointDateRangeValid && (
                          <p className="text-red-400 text-xs mt-2">
                            종료일은 시작일보다 이전일 수
                            없습니다.
                          </p>
                        )}

                        {/* 통계 정보 */}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 group relative">
                            <span className="text-gray-400">
                              전체 입금:
                            </span>
                            <span className="text-green-400 font-semibold">
                              +{totalDeposit.toLocaleString()} P
                            </span>
                            <Info
                              size={14}
                              className="text-gray-500 hover:text-indigo-400 cursor-help transition-colors flex-shrink-0"
                            />
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-56 bg-gray-950 border border-gray-700 rounded-lg p-3 shadow-2xl z-50 pointer-events-none">
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-950 border-l border-t border-gray-700 transform rotate-45"></div>
                              <p className="text-white text-xs leading-relaxed">
                                입출금 관리에서 관리자가 승인한
                                실제 충전금만 집계 됩니다. 충전
                                보너스는 포함되지 않습니다.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 group relative">
                            <span className="text-gray-400">
                              전체 보너스:
                            </span>
                            <span className="text-yellow-400 font-semibold">
                              +{totalBonus.toLocaleString()} P
                            </span>
                            <Info
                              size={14}
                              className="text-gray-500 hover:text-yellow-400 cursor-help transition-colors flex-shrink-0"
                            />
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-56 bg-gray-950 border border-gray-700 rounded-lg p-3 shadow-2xl z-50 pointer-events-none">
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-950 border-l border-t border-gray-700 transform rotate-45"></div>
                              <p className="text-white text-xs leading-relaxed">
                                충전 시 받은 보너스와 관리자가
                                증감시킨 포인트(증가/감소)를
                                모두 합산한 금액입니다.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 group relative">
                            <span className="text-gray-400">
                              전체 출금:
                            </span>
                            <span className="text-red-400 font-semibold">
                              -{totalWithdraw.toLocaleString()}{" "}
                              P
                            </span>
                            <Info
                              size={14}
                              className="text-gray-500 hover:text-red-400 cursor-help transition-colors flex-shrink-0"
                            />
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-56 bg-gray-950 border border-gray-700 rounded-lg p-3 shadow-2xl z-50 pointer-events-none">
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-950 border-l border-t border-gray-700 transform rotate-45"></div>
                              <p className="text-white text-xs leading-relaxed">
                                입출금 관리에서 관리자가 승인한
                                실제 출금 금액만 집계됩니다.
                                기프트 구매/판매 등으로 소모
                                또는 증가된 값은 포함하지
                                않습니다.
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {filteredPointHistory.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-gray-300 text-sm w-1/3">
                          {item.date}
                        </td>
                        <td
                          className={`px-4 py-3 ${item.amount > 0 ? "text-green-400 font-semibold" : item.amount < 0 ? "text-red-400 font-semibold" : "text-gray-400 font-semibold"} w-1/3`}
                        >
                          {item.amount > 0
                            ? `+${item.amount.toLocaleString()} P`
                            : item.amount < 0
                              ? `${item.amount.toLocaleString()} P`
                              : `${item.amount.toLocaleString()} P`}
                          {item.category === "deposit" &&
                            item.bonus !== undefined &&
                            item.bonus !== null &&
                            item.bonus > 0 && (
                              <span className="text-yellow-400 ml-2 text-xs">
                                (+{item.bonus.toLocaleString()}{" "}
                                P 보너스)
                              </span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm w-1/3">
                          {item.type}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {activeTab === "gifts" && <></>}

                {activeTab === "chats" && (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-3 bg-gray-900"
                      >
                        {/* 기간 선택 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Calendar
                            className="text-indigo-400"
                            size={18}
                          />
                          <input
                            type="date"
                            value={chatStartDate}
                            onChange={(e) => {
                              setChatStartDate(e.target.value);
                              setIsChatDateRangeValid(
                                validateDateRange(
                                  e.target.value,
                                  chatEndDate,
                                ),
                              );
                            }}
                            className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                              !isChatDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                            placeholder="시작일"
                          />
                          <span className="text-gray-400">
                            ~
                          </span>
                          <input
                            type="date"
                            value={chatEndDate}
                            onChange={(e) => {
                              setChatEndDate(e.target.value);
                              setIsChatDateRangeValid(
                                validateDateRange(
                                  chatStartDate,
                                  e.target.value,
                                ),
                              );
                            }}
                            className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                              !isChatDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                            placeholder="종료일"
                          />
                          {(chatStartDate || chatEndDate) && (
                            <button
                              onClick={() => {
                                setChatStartDate("");
                                setChatEndDate("");
                                setIsChatDateRangeValid(true);
                              }}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                            >
                              초기화
                            </button>
                          )}
                        </div>

                        {/* 날짜 유효성 에러 메시지 */}
                        {!isChatDateRangeValid && (
                          <p className="text-red-400 text-xs mt-2">
                            종료일은 시작일보다 이전일 수
                            없습니다.
                          </p>
                        )}
                      </td>
                    </tr>
                    {Object.entries(chatMessages).map(
                      ([partner, messages]) => {
                        // 첫 메시지와 마지막 메시지의 날짜 추출
                        const firstDate =
                          messages[0]?.time.split(" ")[0] || "";
                        const lastDate =
                          messages[
                            messages.length - 1
                          ]?.time.split(" ")[0] || "";
                        const dateRange = `${firstDate} ~ ${lastDate}`;

                        return (
                          <tr
                            key={partner}
                            onClick={() => {
                              setChatPopupPartner(partner);
                              setShowChatPopup(true);
                            }}
                            className="cursor-pointer hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-300 text-sm w-1/3">
                              {dateRange}
                            </td>
                            <td className="px-4 py-3 text-white w-1/3">
                              {partner}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm w-1/3">
                              메시지 {messages.length}개
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </>
                )}

                {activeTab === "minigames" && (
                  <>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-3 bg-gray-900"
                      >
                        <div className="flex flex-col gap-3">
                          {/* 게임 타입 드롭다운과 기간 선택을 같은 줄에 배치 */}
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-gray-400 text-sm">
                              게임:
                            </span>
                            <select
                              value={minigameFilter}
                              onChange={(e) =>
                                setMinigameFilter(
                                  e.target.value as
                                    | "all"
                                    | "ladder"
                                    | "powerball",
                                )
                              }
                              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            >
                              <option value="all">전체</option>
                              <option value="ladder">
                                사다리
                              </option>
                              <option value="powerball">
                                파워볼
                              </option>
                            </select>

                            {/* 세로 구분선 */}
                            <div className="h-6 w-px bg-gray-700"></div>
                            <Calendar
                              className="text-indigo-400"
                              size={18}
                            />
                            <input
                              type="date"
                              value={betStartDate}
                              onChange={(e) => {
                                setBetStartDate(e.target.value);
                                setIsBetDateRangeValid(
                                  validateDateRange(
                                    e.target.value,
                                    betEndDate,
                                  ),
                                );
                              }}
                              className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                                !isBetDateRangeValid
                                  ? "border-red-500"
                                  : "border-gray-700"
                              }`}
                              placeholder="시작일"
                            />
                            <span className="text-gray-400">
                              ~
                            </span>
                            <input
                              type="date"
                              value={betEndDate}
                              onChange={(e) => {
                                setBetEndDate(e.target.value);
                                setIsBetDateRangeValid(
                                  validateDateRange(
                                    betStartDate,
                                    e.target.value,
                                  ),
                                );
                              }}
                              className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                                !isBetDateRangeValid
                                  ? "border-red-500"
                                  : "border-gray-700"
                              }`}
                              placeholder="종료일"
                            />
                            {(betStartDate || betEndDate) && (
                              <button
                                onClick={() => {
                                  setBetStartDate("");
                                  setBetEndDate("");
                                  setIsBetDateRangeValid(true);
                                }}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                              >
                                초기화
                              </button>
                            )}
                          </div>

                          {/* 날짜 유효성 에러 메시지 */}
                          {!isBetDateRangeValid && (
                            <p className="text-red-400 text-xs">
                              종료일은 시작일보다 이전일 수
                              없습니다.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 롤링 통계 */}
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-2 bg-gray-800/50"
                      >
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">
                              전체 롤링금액:
                            </span>
                            <span className="text-yellow-400 font-semibold">
                              {totalMinigameRolling.toLocaleString()}
                              P
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">
                              사다리 롤링금액:
                            </span>
                            <span className="text-blue-400 font-semibold">
                              {ladderRolling.toLocaleString()}P
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">
                              파워볼 롤링금액:
                            </span>
                            <span className="text-purple-400 font-semibold">
                              {powerballRolling.toLocaleString()}
                              P
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* 테이블 헤더 */}
                    <tr className="bg-gray-900">
                      <th className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                        배팅 시간
                      </th>
                      <th className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                        게임
                      </th>
                      <th className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                        배팅탭
                      </th>
                      <th className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                        금액
                      </th>
                      <th className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                        결과
                      </th>
                      <th className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                        당첨금
                      </th>
                      <th className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                        배팅 IP
                      </th>
                    </tr>

                    {/* 배팅 내역 데이터 */}
                    {filteredMinigameBets.map((bet) => (
                      <tr
                        key={bet.id}
                        className="hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                          {bet.date}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col items-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                bet.gameType === "사다리"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-purple-500/20 text-purple-300"
                              }`}
                            >
                              {bet.gameType}
                            </span>
                            <span className="text-gray-400 text-xs whitespace-nowrap mt-0.5">
                              #{bet.roundNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="inline-block bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                            {bet.betOption}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-white text-xs whitespace-nowrap">
                          {bet.amount.toLocaleString()}P
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                              bet.result === "승리"
                                ? "bg-green-500/20 text-green-300"
                                : bet.result === "패배"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-gray-600 text-gray-300"
                            }`}
                          >
                            {bet.result}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
                          <span
                            className={
                              bet.winAmount > 0
                                ? "text-yellow-400 font-semibold"
                                : "text-gray-400"
                            }
                          >
                            {bet.winAmount > 0
                              ? `+${bet.winAmount.toLocaleString()}P`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                          {bet.ip}
                        </td>
                      </tr>
                    ))}

                    {/* 데이터 없을 때 */}
                    {filteredMinigameBets.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          배팅 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* 선물 인벤토리 섹션 (선물내역 탭에만 표시) */}
          {activeTab === "gifts" && (
            <>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-white flex items-center gap-2">
                      <Info
                        size={18}
                        className="text-indigo-400"
                      />
                      현재 인벤토리 (캘린더 필터 무관)
                    </h3>
                    <div className="text-yellow-400 font-semibold">
                      총 가치:{" "}
                      {giftInventory
                        .reduce(
                          (sum, gift) =>
                            sum + gift.value * gift.quantity,
                          0,
                        )
                        .toLocaleString()}{" "}
                      P
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => setIsAddingGift(true)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
                    >
                      기프트 증감
                    </button>
                  )}
                </div>
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">
                        선물명
                      </th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">
                        가치
                      </th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">
                        수량
                      </th>
                      <th className="px-4 py-3 text-left text-gray-400 text-sm">
                        총 가치
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {giftInventory.map((gift) => (
                      <tr
                        key={gift.id}
                        className="border-t border-gray-700"
                      >
                        <td className="px-4 py-3 text-white">
                          {gift.name}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {gift.value.toLocaleString()} P
                        </td>
                        <td className="px-4 py-3 text-white">
                          {gift.quantity}개
                        </td>
                        <td className="px-4 py-3 text-indigo-400 font-semibold">
                          {(
                            gift.value * gift.quantity
                          ).toLocaleString()}{" "}
                          P
                        </td>
                      </tr>
                    ))}
                    {giftInventory.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          보유 중인 선물이 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 기프트 내역 로그 */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                  <h3 className="text-white flex items-center gap-2">
                    <Info
                      size={18}
                      className="text-indigo-400"
                    />
                    기프트 내역
                  </h3>
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-3 bg-gray-900"
                      >
                        {/* 기간 선택 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Calendar
                            className="text-indigo-400"
                            size={18}
                          />
                          <input
                            type="date"
                            value={giftStartDate}
                            onChange={(e) => {
                              setGiftStartDate(e.target.value);
                              setIsGiftDateRangeValid(
                                validateDateRange(
                                  e.target.value,
                                  giftEndDate,
                                ),
                              );
                            }}
                            className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                              !isGiftDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                            placeholder="시작일"
                          />
                          <span className="text-gray-400">
                            ~
                          </span>
                          <input
                            type="date"
                            value={giftEndDate}
                            onChange={(e) => {
                              setGiftEndDate(e.target.value);
                              setIsGiftDateRangeValid(
                                validateDateRange(
                                  giftStartDate,
                                  e.target.value,
                                ),
                              );
                            }}
                            className={`bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                              !isGiftDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                            placeholder="종료일"
                          />
                          {(giftStartDate || giftEndDate) && (
                            <button
                              onClick={() => {
                                setGiftStartDate("");
                                setGiftEndDate("");
                                setIsGiftDateRangeValid(true);
                              }}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                            >
                              초기화
                            </button>
                          )}
                        </div>

                        {/* 날짜 유효성 에러 메시지 */}
                        {!isGiftDateRangeValid && (
                          <p className="text-red-400 text-xs mt-2">
                            종료일은 시작일보다 이전일 수
                            없습니다.
                          </p>
                        )}
                      </td>
                    </tr>
                    {giftHistory
                      .filter((item) => {
                        if (!giftStartDate && !giftEndDate)
                          return true;
                        const itemDate =
                          item.date.split(" ")[0];
                        if (
                          giftStartDate &&
                          itemDate < giftStartDate
                        )
                          return false;
                        if (
                          giftEndDate &&
                          itemDate > giftEndDate
                        )
                          return false;
                        return true;
                      })
                      .map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-gray-300 text-sm w-1/4">
                            {item.date}
                          </td>
                          <td className="px-4 py-3 text-white w-1/4">
                            {item.giftName} ({item.quantity}개)
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/4">
                            {item.type === "받음" &&
                              `${item.from}에게서 받음`}
                            {item.type === "보냄" &&
                              `${item.to}에게 보냄`}
                            {item.type === "관리자 지급" &&
                              `${item.from} 지급`}
                            {item.type === "관리자 회수" &&
                              `${item.from} 회수`}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold w-1/4 ${
                              item.points > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {item.points > 0 ? "+" : ""}
                            {item.points.toLocaleString()} P
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Popup */}
      {showChatPopup &&
        chatPopupPartner &&
        chatMessages[chatPopupPartner] &&
        (() => {
          // 날짜 필터링 로직
          const filteredMessages = chatMessages[
            chatPopupPartner
          ].filter((msg) => {
            if (!chatStartDate && !chatEndDate) return true;

            const msgDate = msg.time.split(" ")[0]; // "2025-12-15 11:00" -> "2025-12-15"

            if (chatStartDate && chatEndDate) {
              return (
                msgDate >= chatStartDate &&
                msgDate <= chatEndDate
              );
            } else if (chatStartDate) {
              return msgDate >= chatStartDate;
            } else if (chatEndDate) {
              return msgDate <= chatEndDate;
            }
            return true;
          });

          // 전체 복사 함수 (fallback 방식)
          const copyAllMessages = () => {
            if (isCopying) return;

            setIsCopying(true);

            const textContent = filteredMessages
              .map((msg) => {
                return `[${msg.time}] ${msg.sender}: ${msg.message}`;
              })
              .join("\n");

            // textarea를 사용한 fallback 방식
            const textarea = document.createElement("textarea");
            textarea.value = textContent;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();

            try {
              document.execCommand("copy");
              setShowCopyToast(true);
              setTimeout(() => {
                setShowCopyToast(false);
              }, 2000);
            } catch (err) {
              console.error("복사 실패:", err);
            } finally {
              document.body.removeChild(textarea);
              setTimeout(() => {
                setIsCopying(false);
              }, 500);
            }
          };

          return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                  <h3 className="text-white flex items-center gap-2">
                    <MessageCircle
                      size={18}
                      className="text-indigo-400"
                    />
                    {user.nickname
                      ? `${user.nickname}(${user.name})`
                      : user.name}
                    와 {chatPopupPartner}의 대화
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAllMessages}
                      disabled={isCopying}
                      className={`px-3 py-1.5 text-white text-sm rounded transition-all flex items-center gap-1.5 ${
                        isCopying
                          ? "bg-indigo-800 opacity-50 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      전체 복사
                    </button>
                    <button
                      onClick={() => setShowChatPopup(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-1 text-sm">
                    {filteredMessages.map((msg, idx) => {
                      const isUser = msg.sender === user.name;
                      const isSystem = msg.sender === "system";
                      const isGift = msg.type === "gift";
                      const isImage = msg.type === "image";

                      return (
                        <div
                          key={idx}
                          className={
                            isSystem
                              ? "text-yellow-400"
                              : isGift
                                ? "text-pink-400"
                                : "text-gray-300"
                          }
                        >
                          {isSystem ? (
                            <span>
                              [{msg.time}]{" "}
                              <span className="text-yellow-400">
                                [시스템]
                              </span>{" "}
                              {msg.message}
                            </span>
                          ) : isImage ? (
                            <span>
                              [{msg.time}]{" "}
                              <span
                                className={
                                  isUser
                                    ? "text-indigo-400"
                                    : "text-emerald-400"
                                }
                              >
                                {isUser
                                  ? user.nickname
                                    ? `${user.nickname}(${user.name})`
                                    : user.name
                                  : msg.sender}
                                :
                              </span>{" "}
                              <span
                                onClick={() =>
                                  setImagePreviewModal(
                                    (msg as any).imageUrl,
                                  )
                                }
                                className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors"
                                style={{
                                  textDecoration: "none",
                                }}
                              >
                                {msg.message}
                              </span>
                            </span>
                          ) : (
                            <span>
                              [{msg.time}]{" "}
                              <span
                                className={
                                  isUser
                                    ? "text-indigo-400"
                                    : "text-emerald-400"
                                }
                              >
                                {isUser
                                  ? user.nickname
                                    ? `${user.nickname}(${user.name})`
                                    : user.name
                                  : msg.sender}
                                :
                              </span>{" "}
                              {msg.message}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 복사 완료 토스트 */}
                {showCopyToast && (
                  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] animate-fadeIn">
                    <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>복사 되었습니다</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* Image Preview Modal */}
      {imagePreviewModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setImagePreviewModal(null)}
        >
          <div className="relative w-full max-w-3xl">
            <button
              onClick={() => setImagePreviewModal(null)}
              className="absolute -top-14 right-0 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
            >
              <X size={28} />
            </button>
            <div className="w-full h-[80vh] flex items-center justify-center">
              <img
                src={imagePreviewModal}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add/Remove Gift Modal */}
      {isAddingGift && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <Info className="text-indigo-400" size={18} />
                기프트 증감 관리
              </h3>
              <button
                onClick={() => {
                  setIsAddingGift(false);
                  setSelectedGiftId("");
                  setGiftAction("add");
                  setNewGiftQuantity("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 증감 타입 선택 */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  작업 유형
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGiftAction("add")}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                      giftAction === "add"
                        ? "bg-green-500/80 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    지급 (+)
                  </button>
                  <button
                    onClick={() => setGiftAction("remove")}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                      giftAction === "remove"
                        ? "bg-red-500/80 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    회수 (-)
                  </button>
                </div>
              </div>

              {/* 선물 선택 */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  기프트 선택
                </label>
                <select
                  value={selectedGiftId}
                  onChange={(e) =>
                    setSelectedGiftId(e.target.value)
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">기프트를 선택하세요</option>
                  {availableGifts.map((gift) => (
                    <option key={gift.id} value={gift.id}>
                      {gift.name} (가치: {gift.value}P)
                    </option>
                  ))}
                </select>
              </div>

              {/* 선택한 선물 정보 표시 */}
              {selectedGiftId && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-1">
                  <p className="text-gray-400 text-sm">
                    선택한 기프트:{" "}
                    <span className="text-white">
                      {
                        availableGifts.find(
                          (g) =>
                            g.id === parseInt(selectedGiftId),
                        )?.name
                      }
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    포인트 가치:{" "}
                    <span className="text-indigo-400">
                      {
                        availableGifts.find(
                          (g) =>
                            g.id === parseInt(selectedGiftId),
                        )?.value
                      }
                      P
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    현재 보유 수량:{" "}
                    <span className="text-yellow-400">
                      {giftInventory.find(
                        (g) =>
                          g.id === parseInt(selectedGiftId),
                      )?.quantity || 0}
                      개
                    </span>
                  </p>
                </div>
              )}

              {/* 수량 입력 */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  수량
                </label>
                <input
                  type="number"
                  value={newGiftQuantity}
                  onChange={(e) =>
                    setNewGiftQuantity(e.target.value)
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="수량을 입력하세요"
                  min="1"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsAddingGift(false);
                    setSelectedGiftId("");
                    setGiftAction("add");
                    setNewGiftQuantity("");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (selectedGiftId && newGiftQuantity) {
                      const selectedGift = availableGifts.find(
                        (g) =>
                          g.id === parseInt(selectedGiftId),
                      );
                      const quantity =
                        parseInt(newGiftQuantity);

                      if (selectedGift) {
                        const existingGift = giftInventory.find(
                          (g) => g.id === selectedGift.id,
                        );

                        if (giftAction === "add") {
                          // 지급
                          if (existingGift) {
                            setGiftInventory(
                              giftInventory.map((g) =>
                                g.id === selectedGift.id
                                  ? {
                                      ...g,
                                      quantity:
                                        g.quantity + quantity,
                                    }
                                  : g,
                              ),
                            );
                          } else {
                            setGiftInventory([
                              ...giftInventory,
                              {
                                id: selectedGift.id,
                                name: selectedGift.name,
                                emoji: selectedGift.emoji,
                                value: selectedGift.value,
                                quantity: quantity,
                              },
                            ]);
                          }

                          // 기프트 내역에 로그 추가
                          const now = new Date();
                          const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

                          setGiftHistory([
                            {
                              date: dateString,
                              giftName: selectedGift.name,
                              type: "관리자 지급",
                              from: "superadmin",
                              points:
                                selectedGift.value * quantity,
                              quantity: quantity,
                            },
                            ...giftHistory,
                          ]);

                          alert(
                            `${selectedGift.name} ${quantity}개가 지급되었습니다.`,
                          );
                        } else {
                          // 회수
                          if (existingGift) {
                            const newQuantity =
                              existingGift.quantity - quantity;
                            if (newQuantity < 0) {
                              alert(
                                "보유 수량보다 많이 회수할 수 없습니다.",
                              );
                              return;
                            } else if (newQuantity === 0) {
                              setGiftInventory(
                                giftInventory.filter(
                                  (g) =>
                                    g.id !== selectedGift.id,
                                ),
                              );
                            } else {
                              setGiftInventory(
                                giftInventory.map((g) =>
                                  g.id === selectedGift.id
                                    ? {
                                        ...g,
                                        quantity: newQuantity,
                                      }
                                    : g,
                                ),
                              );
                            }

                            // 기프트 내역에 로그 추가
                            const now = new Date();
                            const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

                            setGiftHistory([
                              {
                                date: dateString,
                                giftName: selectedGift.name,
                                type: "관리자 회수",
                                from: "superadmin",
                                points: -(
                                  selectedGift.value * quantity
                                ),
                                quantity: quantity,
                              },
                              ...giftHistory,
                            ]);

                            alert(
                              `${selectedGift.name} ${quantity}개가 회수되었습니다.`,
                            );
                          } else {
                            alert(
                              "해당 기프트를 보유하고 있지 않습니다.",
                            );
                            return;
                          }
                        }

                        setIsAddingGift(false);
                        setSelectedGiftId("");
                        setGiftAction("add");
                        setNewGiftQuantity("");
                      }
                    }
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    giftAction === "add"
                      ? "bg-green-500/80 hover:bg-green-500 text-white"
                      : "bg-red-500/80 hover:bg-red-500 text-white"
                  }`}
                  disabled={
                    !selectedGiftId ||
                    !newGiftQuantity ||
                    parseInt(newGiftQuantity) < 1 ||
                    (giftAction === "remove" &&
                      (!giftInventory.find(
                        (g) =>
                          g.id === parseInt(selectedGiftId),
                      ) ||
                        (giftInventory.find(
                          (g) =>
                            g.id === parseInt(selectedGiftId),
                        )?.quantity || 0) <
                          parseInt(newGiftQuantity || "0")))
                  }
                >
                  {giftAction === "add" ? "지급" : "회수"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Code Edit Modal */}
      {showReferralCodeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <DollarSign
                  className="text-indigo-400"
                  size={18}
                />
                추천코드 수정
              </h3>
              <button
                onClick={() => {
                  setShowReferralCodeModal(false);
                  setReferralCodeInput(user.referralCode || "");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-sm">회원명</p>
                <p className="text-white font-medium">
                  {user.name}
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  추천코드
                </label>
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) =>
                    setReferralCodeInput(e.target.value)
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="추천코드를 입력하세요"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowReferralCodeModal(false);
                    setReferralCodeInput(
                      user.referralCode || "",
                    );
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    alert("추천코드가 수정되었습니다.");
                    setShowReferralCodeModal(false);
                  }}
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 정지/정지 해제 확인 팝업 */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white text-lg mb-4">
              {user.status === "활성" ? "회원 정지" : "정지 해제"}
            </h3>
            <p className="text-gray-300 mb-4">
              {user.status === "활성" 
                ? `${user.name} 회원을 정지하시겠습니까?`
                : `${user.name} 회원의 정지를 해제하시겠습니까?`
              }
            </p>
            {user.status === "활성" && (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  정지 사유 (선택)
                </label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="정지 사유를 입력하세요"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      alert(user.status === "활성" 
                        ? `${user.name} 회원이 정지되었습니다.${suspendReason ? `\n사유: ${suspendReason}` : ""}`
                        : `${user.name} 회원의 정지가 해제되었습니다.`
                      );
                      setShowSuspendConfirm(false);
                      setSuspendReason("");
                    }
                  }}
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSuspendConfirm(false);
                  setSuspendReason("");
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  alert(user.status === "활성" 
                    ? `${user.name} 회원이 정지되었습니다.${suspendReason ? `\n사유: ${suspendReason}` : ""}`
                    : `${user.name} 회원의 정지가 해제되었습니다.`
                  );
                  setShowSuspendConfirm(false);
                  setSuspendReason("");
                }}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  user.status === "활성"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Modal */}
      {showProfileImage && user.profileImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowProfileImage(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowProfileImage(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-gray-800/50 hover:bg-gray-700/50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <img
              src={user.profileImage}
              alt={user.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}