import { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  Calendar,
  Key,
  MessageCircle,
  Info,
} from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";
import { supabase, supabaseAdmin } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { useAdminUserActions } from "../hooks/useSupabase";
import { getPublicUrlForPath } from "../../lib/storage";
import { formatKST, getDisplayRoundNumber } from "../../lib/dateUtils";

interface User {
  id: string;
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
  isReadOnly?: boolean; // 에이전트 모드 (관리 기능 숨김)
}

export function UserDetailModal({
  user,
  onClose,
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

  const { adminAccount, isAdmin } = useAuth();
  const { showAlert } = useAlert();
  const { adjustUserPoints, setUserStatus, updateUserPassword } =
    useAdminUserActions(adminAccount?.id);

  const [localUser, setLocalUser] = useState<User | null>(null);
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const displayUser = localUser || user;

  const profileImageUrl = getPublicUrlForPath(
    "profile-images",
    displayUser.profileImage,
  );

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
  const [isPointDateRangeValid, setIsPointDateRangeValid] = useState(true);
  const [isGiftDateRangeValid, setIsGiftDateRangeValid] = useState(true);
  const [isChatDateRangeValid, setIsChatDateRangeValid] = useState(true);
  const [isBetDateRangeValid, setIsBetDateRangeValid] = useState(true);

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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [pointAdjustType, setPointAdjustType] = useState<"add" | "subtract">(
    "add",
  );
  const [pointAdjustAmount, setPointAdjustAmount] = useState("");
  const [referralCodeInput, setReferralCodeInput] = useState(
    user.referralCode || "",
  );
  const [showReferralCodeModal, setShowReferralCodeModal] = useState(false);

  // 채팅 팝업 state 추가
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatPopupRoomId, setChatPopupRoomId] = useState<string | null>(null);
  const [chatPopupDbPartnerName, setChatPopupDbPartnerName] = useState<
    string | null
  >(null);
  const [chatRooms, setChatRooms] = useState<
    Array<{
      id: string;
      last_message_at: string | null;
      created_at: string | null;
      last_message: string | null;
      chat_profiles?: { id: string; name: string } | null;
    }>
  >([]);
  const [isChatRoomsLoading, setIsChatRoomsLoading] = useState(false);
  const [chatRoomsError, setChatRoomsError] = useState<string | null>(null);
  const [chatPopupDbMessages, setChatPopupDbMessages] = useState<
    Array<{
      id: string;
      created_at: string | null;
      sender_type: string;
      content: string | null;
      message: string;
      message_type: string | null;
      gift_id: string | null;
      gift_quantity: number | null;
    }>
  >([]);
  const [isChatPopupLoading, setIsChatPopupLoading] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(
    null,
  );

  const [ladderGameChats, setLadderGameChats] = useState<
    Array<{
      id: string;
      created_at: string | null;
      user_id: string;
      nickname: string | null;
      message: string;
    }>
  >([]);
  const [powerballGameChats, setPowerballGameChats] = useState<
    Array<{
      id: string;
      created_at: string | null;
      user_id: string;
      nickname: string | null;
      message: string;
    }>
  >([]);
  const [isMinigameChatsLoading, setIsMinigameChatsLoading] = useState(false);
  const [minigameChatsError, setMinigameChatsError] = useState<string | null>(
    null,
  );

  const [showMinigameChatPopup, setShowMinigameChatPopup] = useState(false);
  const [minigameChatPopupGameType, setMinigameChatPopupGameType] = useState<
    "ladder" | "powerball" | null
  >(null);
  const [minigameChatPopupMessages, setMinigameChatPopupMessages] = useState<
    Array<{
      id: string;
      created_at: string | null;
      user_id: string;
      nickname: string | null;
      message: string;
    }>
  >([]);
  const [isMinigameChatPopupLoading, setIsMinigameChatPopupLoading] =
    useState(false);

  // Real data states for point history, gift history, and bet history
  const [dbPointHistory, setDbPointHistory] = useState<
    Array<{
      id: string;
      created_at: string | null;
      type: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      description: string | null;
    }>
  >([]);
  const [isPointHistoryLoading, setIsPointHistoryLoading] = useState(false);

  const [approvedDeposits, setApprovedDeposits] = useState<
    Array<{ amount: number; bonus_amount: number | null }>
  >([]);
  const [approvedWithdrawals, setApprovedWithdrawals] = useState<
    Array<{ amount: number }>
  >([]);

  const [dbGiftHistory, setDbGiftHistory] = useState<
    Array<{
      id: string;
      created_at: string | null;
      transaction_type: string | null;
      quantity: number | null;
      points_amount: number;
      sender_id: string;
      sender_type: string;
      receiver_id: string;
      receiver_type: string;
      gifts?: { name: string; emoji: string | null } | null;
    }>
  >([]);
  const [isGiftHistoryLoading, setIsGiftHistoryLoading] = useState(false);

  const [dbBetHistory, setDbBetHistory] = useState<
    Array<{
      id: string;
      created_at: string | null;
      bet_type: string;
      bet_value: string;
      bet_amount: number;
      odds: number;
      status: string;
      win_amount: number | null;
      game_rounds?: { game_type: string; round_number: number | null } | null;
    }>
  >([]);
  const [isBetHistoryLoading, setIsBetHistoryLoading] = useState(false);

  // Real gift inventory data
  const [dbGiftInventory, setDbGiftInventory] = useState<
    Array<{
      id: string;
      gift_id: string;
      quantity: number;
      gifts: {
        id: string;
        name: string;
        emoji: string | null;
        sell_price: number;
      } | null;
    }>
  >([]);
  const [isGiftInventoryLoading, setIsGiftInventoryLoading] = useState(false);

  // Available gifts from database
  const [dbAvailableGifts, setDbAvailableGifts] = useState<
    Array<{
      id: string;
      name: string;
      emoji: string | null;
      sell_price: number;
      buy_price: number;
    }>
  >([]);
  const [isAvailableGiftsLoading, setIsAvailableGiftsLoading] = useState(false);

  // 회원 정지/정지 해제 state
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  // 선물 인벤토리 관리 state
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [giftAction, setGiftAction] = useState<"add" | "remove">("add");
  const [newGiftQuantity, setNewGiftQuantity] = useState("");

  // activeTab 변경 시 채팅창 닫기
  useEffect(() => {
    setShowChatPopup(false);
    setChatPopupRoomId(null);
    setChatPopupDbPartnerName(null);
    setChatPopupDbMessages([]);
    setShowMinigameChatPopup(false);
    setMinigameChatPopupGameType(null);
    setMinigameChatPopupMessages([]);
  }, [activeTab]);

  // Fetch point history from Supabase (관리자 클라이언트 사용)
  useEffect(() => {
    const fetchPointHistory = async () => {
      if (activeTab !== "points" || !user?.id) return;
      setIsPointHistoryLoading(true);
      const { data, error } = await supabaseAdmin
        .from("point_transactions")
        .select(
          "id, created_at, type, amount, balance_before, balance_after, description",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        showAlert({
          title: "오류",
          message: `포인트 내역을 불러오지 못했습니다: ${error.message}`,
          type: "error",
        });
      } else {
        setDbPointHistory((data as any) || []);
      }
      setIsPointHistoryLoading(false);
    };
    fetchPointHistory();
  }, [activeTab, user?.id]);

  useEffect(() => {
    const fetchPaymentStats = async () => {
      if (activeTab !== "points" || !user?.id) return;

      const [
        { data: depositsData, error: depositsError },
        { data: withdrawalsData, error: withdrawalsError },
      ] = await Promise.all([
        supabaseAdmin
          .from("deposit_requests")
          .select("amount, bonus_amount")
          .eq("user_id", user.id)
          .eq("status", "approved"),
        supabaseAdmin
          .from("withdrawal_requests")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "approved"),
      ]);

      if (depositsError) {
        showAlert({
          title: "오류",
          message: `입금 내역을 불러오지 못했습니다: ${depositsError.message}`,
          type: "error",
        });
      }
      if (withdrawalsError) {
        showAlert({
          title: "오류",
          message: `출금 내역을 불러오지 못했습니다: ${withdrawalsError.message}`,
          type: "error",
        });
      }

      setApprovedDeposits((depositsData as any) || []);
      setApprovedWithdrawals((withdrawalsData as any) || []);
    };

    void fetchPaymentStats();
  }, [activeTab, user?.id]);

  // Fetch gift history from Supabase (관리자 클라이언트 사용)
  useEffect(() => {
    const fetchGiftHistory = async () => {
      if (activeTab !== "gifts" || !user?.id) return;
      setIsGiftHistoryLoading(true);
      const { data, error } = await supabaseAdmin
        .from("gift_transactions")
        .select(
          "id, created_at, transaction_type, quantity, points_amount, sender_id, sender_type, receiver_id, receiver_type, gifts(name, emoji)",
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        showAlert({
          title: "오류",
          message: `기프트 내역을 불러오지 못했습니다: ${error.message}`,
          type: "error",
        });
      } else {
        setDbGiftHistory((data as any) || []);
      }
      setIsGiftHistoryLoading(false);
    };
    fetchGiftHistory();
  }, [activeTab, user?.id]);

  // Fetch bet history from Supabase (관리자 클라이언트 사용)
  useEffect(() => {
    const fetchBetHistory = async () => {
      if (activeTab !== "bets" || !user?.id) return;
      setIsBetHistoryLoading(true);
      const { data, error } = await supabaseAdmin
        .from("game_bets")
        .select(
          "id, created_at, bet_type, bet_value, bet_amount, odds, status, win_amount, game_rounds(game_type, round_number)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        showAlert({
          title: "오류",
          message: `배팅 내역을 불러오지 못했습니다: ${error.message}`,
          type: "error",
        });
      } else {
        setDbBetHistory((data as any) || []);
      }
      setIsBetHistoryLoading(false);
    };
    fetchBetHistory();
  }, [activeTab, user?.id]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (isReadOnly) return;
      if (activeTab !== "chats") return;
      if (!user?.id) return;

      setIsChatRoomsLoading(true);
      setChatRoomsError(null);

      const { data, error } = await supabaseAdmin
        .from("chat_rooms")
        .select(
          `
          id,
          last_message_at,
          created_at,
          last_message,
          chat_profiles:profile_id ( id, name )
        `,
        )
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) {
        setChatRoomsError(error.message);
        setChatRooms([]);
        setIsChatRoomsLoading(false);
        return;
      }

      setChatRooms((data as any) || []);
      setIsChatRoomsLoading(false);
    };

    void fetchRooms();
  }, [activeTab, isReadOnly, user?.id]);

  useEffect(() => {
    const fetchMinigameChats = async () => {
      if (isReadOnly) return;
      if (activeTab !== "chats") return;
      if (!user?.id) return;

      setIsMinigameChatsLoading(true);
      setMinigameChatsError(null);

      const p_from = chatStartDate
        ? new Date(`${chatStartDate}T00:00:00+09:00`).toISOString()
        : undefined;
      const p_to = chatEndDate
        ? new Date(`${chatEndDate}T23:59:59.999+09:00`).toISOString()
        : undefined;

      const [ladder, powerball] = await Promise.all([
        supabaseAdmin.rpc("ladder_game_chat_list_admin", {
          p_user_id: user.id,
          p_limit: 200,
          p_from,
          p_to,
        }),
        supabaseAdmin.rpc("powerball_game_chat_list_admin", {
          p_user_id: user.id,
          p_limit: 200,
          p_from,
          p_to,
        }),
      ]);

      if (ladder.error) throw ladder.error;
      if (powerball.error) throw powerball.error;

      setLadderGameChats(
        Array.isArray(ladder.data) ? (ladder.data as any) : [],
      );
      setPowerballGameChats(
        Array.isArray(powerball.data) ? (powerball.data as any) : [],
      );
      setIsMinigameChatsLoading(false);
    };

    void fetchMinigameChats().catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      setMinigameChatsError(msg);
      setLadderGameChats([]);
      setPowerballGameChats([]);
      setIsMinigameChatsLoading(false);
    });
  }, [activeTab, isReadOnly, user?.id, chatStartDate, chatEndDate]);

  // Fetch gift inventory for the user (관리자 클라이언트 사용)
  useEffect(() => {
    const fetchGiftInventory = async () => {
      if (activeTab !== "gifts" || !user?.id) return;
      setIsGiftInventoryLoading(true);
      const { data, error } = await supabaseAdmin
        .from("gift_inventory")
        .select("id, gift_id, quantity, gifts(id, name, emoji, sell_price)")
        .eq("user_id", user.id)
        .gt("quantity", 0);
      if (error) {
        showAlert({
          title: "오류",
          message: `선물 인벤토리를 불러오지 못했습니다: ${error.message}`,
          type: "error",
        });
      } else {
        setDbGiftInventory((data as any) || []);
      }
      setIsGiftInventoryLoading(false);
    };
    fetchGiftInventory();
  }, [activeTab, user?.id]);

  // Fetch available gifts list (관리자 클라이언트 사용)
  useEffect(() => {
    const fetchAvailableGifts = async () => {
      if (activeTab !== "gifts") return;
      setIsAvailableGiftsLoading(true);
      const { data, error } = await supabaseAdmin
        .from("gifts")
        .select("id, name, emoji, sell_price, buy_price")
        .eq("is_active", true)
        .order("buy_price", { ascending: true });
      if (error) {
        showAlert({
          title: "오류",
          message: `기프트 목록을 불러오지 못했습니다: ${error.message}`,
          type: "error",
        });
      } else {
        setDbAvailableGifts((data as any) || []);
      }
      setIsAvailableGiftsLoading(false);
    };
    fetchAvailableGifts();
  }, [activeTab]);

  // Refetch gift inventory helper
  const refetchGiftInventory = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("gift_inventory")
      .select("id, gift_id, quantity, gifts(id, name, emoji, sell_price)")
      .eq("user_id", user.id)
      .gt("quantity", 0);
    if (!error) {
      setDbGiftInventory((data as any) || []);
    }
  };

  const openChatRoomPopup = async (roomId: string, partnerName: string) => {
    if (isReadOnly) return;

    setChatPopupRoomId(roomId);
    setChatPopupDbPartnerName(partnerName);
    setShowChatPopup(true);
    setIsChatPopupLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, created_at, sender_type, content, message, message_type, gift_id, gift_quantity",
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      setChatPopupDbMessages([]);
      setIsChatPopupLoading(false);
      showAlert({
        title: "오류",
        message: `채팅 내역을 불러오지 못했습니다: ${error.message}`,
        type: "error",
      });
      return;
    }

    setChatPopupDbMessages((data as any) || []);
    setIsChatPopupLoading(false);
  };

  const openMinigameChatPopup = async (gameType: "ladder" | "powerball") => {
    if (isReadOnly) return;
    if (!user?.id) return;

    setShowMinigameChatPopup(true);
    setMinigameChatPopupGameType(gameType);
    setMinigameChatPopupMessages([]);
    setIsMinigameChatPopupLoading(true);

    const p_from = chatStartDate
      ? new Date(`${chatStartDate}T00:00:00+09:00`).toISOString()
      : null;
    const p_to = chatEndDate
      ? new Date(`${chatEndDate}T23:59:59.999+09:00`).toISOString()
      : null;

    const rpcName =
      gameType === "ladder"
        ? "ladder_game_chat_list_admin"
        : "powerball_game_chat_list_admin";

    const { data, error } = await supabaseAdmin.rpc(rpcName as any, {
      p_user_id: user.id,
      p_limit: 500,
      p_from,
      p_to,
    });

    if (error) {
      setIsMinigameChatPopupLoading(false);
      showAlert({
        title: "오류",
        message: `채팅 내역을 불러오지 못했습니다: ${error.message}`,
        type: "error",
      });
      return;
    }

    setMinigameChatPopupMessages(Array.isArray(data) ? (data as any) : []);
    setIsMinigameChatPopupLoading(false);
  };

  const ladderLastChat =
    ladderGameChats.length > 0
      ? ladderGameChats[ladderGameChats.length - 1]
      : null;
  const powerballLastChat =
    powerballGameChats.length > 0
      ? powerballGameChats[powerballGameChats.length - 1]
      : null;

  // 미니게임 롤링(턴오버) 통계 계산 - DB 데이터 사용
  const totalMinigameRolling = dbBetHistory.reduce(
    (sum, bet) => sum + bet.bet_amount,
    0,
  );
  const powerballRolling = dbBetHistory
    .filter((bet) => bet.game_rounds?.game_type === "powerball")
    .reduce((sum, bet) => sum + bet.bet_amount, 0);

  // 전체 입금 통계 (승인된 충전금만) - DB 데이터 사용
  const totalDeposit = approvedDeposits.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  // 전체 보너스 통계 - DB 데이터 사용
  const totalBonus =
    approvedDeposits.reduce(
      (sum, item) => sum + Number(item.bonus_amount || 0),
      0,
    ) +
    dbPointHistory
      .filter((item) => item.type === "admin_adjust" && item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

  // 전체 출금 통계 - DB 데이터 사용
  const totalWithdraw = approvedWithdrawals.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  // 회원 기여 매출 = 전체 입금 - 전체 출금
  const memberRevenue = totalDeposit - totalWithdraw;

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
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
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
                {user.nickname ? `${user.nickname}(${user.name})` : user.name}{" "}
                회원 상세 정보
              </span>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
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
            {!isReadOnly && (
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
            )}
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
                      <td className="px-4 py-3 text-gray-400 w-1/4">이름</td>
                      <td className="px-4 py-3 text-white w-1/4">
                        {user.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400 w-1/4">닉네임</td>
                      <td className="px-4 py-3 text-white w-1/4">
                        {user.nickname || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">이메일</td>
                      <td className="px-4 py-3 text-white">{user.email}</td>
                      <td className="px-4 py-3 text-gray-400">전화번호</td>
                      <td className="px-4 py-3 text-white">
                        {user.phone || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">상태</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                            displayUser.status,
                          )}`}
                        >
                          {displayUser.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">접속 상태</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.online ? "text-green-500" : "text-gray-500"
                          }
                        >
                          {user.online ? "● 온라인" : "○ 오프라인"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">보유 포인트</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-indigo-400 font-bold">
                            {(displayUser.points || 0).toLocaleString()} P
                          </span>
                          {!isReadOnly && (
                            <button
                              onClick={() =>
                                setIsAdjustingPoints(!isAdjustingPoints)
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
                              회원 기여 매출은 전체 입금 금액과 전체 출금 금액의
                              합산 금액입니다.
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
                        <td colSpan={4} className="px-4 py-4 bg-gray-800/50">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign
                                className="text-indigo-400"
                                size={18}
                              />
                              <h3 className="text-white">포인트 조정</h3>
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
                                        e.target.value as "add" | "subtract",
                                      )
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="add">지급 (+)</option>
                                    <option value="subtract">차감 (-)</option>
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
                                      setPointAdjustAmount(e.target.value)
                                    }
                                    placeholder="금액 입력"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const raw = parseInt(pointAdjustAmount, 10);
                                    if (!Number.isFinite(raw) || raw <= 0)
                                      return;
                                    if (isReadOnly) return;
                                    if (!isAdmin || !adminAccount?.id) {
                                      showAlert({
                                        title: "권한 오류",
                                        message: "관리자 권한이 필요합니다.",
                                        type: "warning",
                                      });
                                      return;
                                    }

                                    const signedAmount =
                                      pointAdjustType === "add" ? raw : -raw;

                                    void (async () => {
                                      try {
                                        const result = await adjustUserPoints({
                                          userId: user.id,
                                          amount: signedAmount,
                                          description:
                                            pointAdjustType === "add"
                                              ? "관리자 포인트 지급"
                                              : "관리자 포인트 차감",
                                        });

                                        if (
                                          typeof result?.balanceAfter ===
                                          "number"
                                        ) {
                                          setLocalUser((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  points: result.balanceAfter,
                                                }
                                              : prev,
                                          );
                                        }

                                        showAlert({
                                          title: "처리 완료",
                                          message: `${
                                            pointAdjustType === "add"
                                              ? "+"
                                              : "-"
                                          }${raw.toLocaleString()}P ${
                                            pointAdjustType === "add"
                                              ? "지급"
                                              : "차감"
                                          }되었습니다`,
                                          type: "success",
                                        });
                                        setIsAdjustingPoints(false);
                                        setPointAdjustAmount("");
                                      } catch (err) {
                                        const msg =
                                          err instanceof Error
                                            ? err.message
                                            : "처리 중 오류가 발생했습니다";
                                        showAlert({
                                          title: "오류",
                                          message: msg,
                                          type: "error",
                                        });
                                      }
                                    })();
                                  }}
                                  disabled={
                                    !pointAdjustAmount ||
                                    parseInt(pointAdjustAmount) <= 0
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
                      <td className="px-4 py-3 text-gray-400">은행</td>
                      <td className="px-4 py-3 text-white">
                        {displayUser.bank || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">계좌번호</td>
                      <td className="px-4 py-3 text-white">
                        {displayUser.accountNumber || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">예금주</td>
                      <td className="px-4 py-3 text-white">
                        {displayUser.accountHolder || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">추천코드</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400">
                            {displayUser.referralCode || "-"}
                          </span>
                          {!isReadOnly && (
                            <button
                              onClick={() => {
                                setShowReferralCodeModal(true);
                                setReferralCodeInput(
                                  displayUser.referralCode || "",
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
                      <td className="px-4 py-3 text-gray-400">가입일</td>
                      <td className="px-4 py-3 text-white">
                        {displayUser.joined || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">마지막 로그인</td>
                      <td className="px-4 py-3 text-white">
                        {displayUser.lastLogin || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">가입 IP</td>
                      <td className="px-4 py-3 text-white">
                        {displayUser.joinIp || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        마지막 접속 IP
                      </td>
                      <td className="px-4 py-3 text-white">
                        {displayUser.lastIp || "-"}
                      </td>
                    </tr>
                    {!isReadOnly && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 bg-gray-900">
                          {!isChangingPassword ? (
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => setIsChangingPassword(true)}
                                className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Key size={18} />
                                비밀번호 변경
                              </button>
                              <button
                                onClick={() => setShowSuspendConfirm(true)}
                                className={`px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                  displayUser.status === "활성"
                                    ? "bg-red-500/80 hover:bg-red-500 text-white"
                                    : "bg-green-500/80 hover:bg-green-500 text-white"
                                }`}
                              >
                                {displayUser.status === "활성"
                                  ? "회원 정지"
                                  : "정지 해제"}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <Key className="text-indigo-400" size={18} />
                                <h3 className="text-white">비밀번호 변경</h3>
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
                                      setNewPassword(e.target.value)
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
                                      setConfirmPassword(e.target.value)
                                    }
                                    placeholder="비밀번호 재확인"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              {newPassword &&
                                confirmPassword &&
                                newPassword !== confirmPassword && (
                                  <p className="text-red-400 text-sm">
                                    비밀번호가 일치하지 않습니다
                                  </p>
                                )}
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    if (
                                      newPassword === confirmPassword &&
                                      newPassword
                                    ) {
                                      if (isReadOnly) return;
                                      if (!isAdmin || !adminAccount?.id) {
                                        showAlert({
                                          title: "권한 오류",
                                          message: "관리자 권한이 필요합니다.",
                                          type: "warning",
                                        });
                                        return;
                                      }

                                      void (async () => {
                                        try {
                                          await updateUserPassword({
                                            userId: user.id,
                                            newPassword,
                                          });
                                          showAlert({
                                            title: "처리 완료",
                                            message:
                                              "비밀번호가 변경되었습니다",
                                            type: "success",
                                          });
                                          setIsChangingPassword(false);
                                          setNewPassword("");
                                          setConfirmPassword("");
                                        } catch (err) {
                                          const msg =
                                            err instanceof Error
                                              ? err.message
                                              : "처리 중 오류가 발생했습니다";
                                          showAlert({
                                            title: "오류",
                                            message: msg,
                                            type: "error",
                                          });
                                        }
                                      })();
                                    }
                                  }}
                                  disabled={
                                    !newPassword ||
                                    !confirmPassword ||
                                    newPassword !== confirmPassword
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
                      <td colSpan={4} className="px-4 py-2 bg-gray-900">
                        {/* 안내 메시지 */}
                        <div className="flex items-start gap-2 mb-1.5 p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg w-fit">
                          <Info
                            className="text-indigo-400 mt-0.5 flex-shrink-0"
                            size={14}
                          />
                          <p className="text-indigo-300 text-xs whitespace-nowrap">
                            미니게임 배팅금액은 포인트 내역에서 집계되지
                            않습니다. 미니게임 배팅내역에서 집계 됩니다.
                          </p>
                        </div>

                        {/* 필터 드롭다운과 캘린더를 같은 줄에 배치 */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-gray-400 text-sm">유형:</span>
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
                            <option value="deposit">입금</option>
                            <option value="withdraw">출금</option>
                            <option value="etc">기타</option>
                          </select>

                          {/* 세로 구분선 */}
                          <div className="h-6 w-px bg-gray-700"></div>

                          {/* 기간 선택 */}
                          <Calendar className="text-indigo-400" size={18} />
                          <DateRangePicker
                            startDate={pointStartDate}
                            endDate={pointEndDate}
                            onStartDateChange={(val) => {
                              setPointStartDate(val);
                              setIsPointDateRangeValid(true);
                            }}
                            onEndDateChange={(val) => {
                              setPointEndDate(val);
                              setIsPointDateRangeValid(true);
                            }}
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
                            종료일은 시작일보다 이전일 수 없습니다.
                          </p>
                        )}

                        {/* 통계 정보 */}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 group relative">
                            <span className="text-gray-400">전체 입금:</span>
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
                                입출금 관리에서 관리자가 승인한 실제 충전금만
                                집계 됩니다. 충전 보너스는 포함되지 않습니다.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 group relative">
                            <span className="text-gray-400">전체 보너스:</span>
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
                                충전 시 받은 보너스와 관리자가 증감시킨
                                포인트(증가/감소)를 모두 합산한 금액입니다.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 group relative">
                            <span className="text-gray-400">전체 출금:</span>
                            <span className="text-red-400 font-semibold">
                              -{totalWithdraw.toLocaleString()} P
                            </span>
                            <Info
                              size={14}
                              className="text-gray-500 hover:text-red-400 cursor-help transition-colors flex-shrink-0"
                            />
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-56 bg-gray-950 border border-gray-700 rounded-lg p-3 shadow-2xl z-50 pointer-events-none">
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-950 border-l border-t border-gray-700 transform rotate-45"></div>
                              <p className="text-white text-xs leading-relaxed">
                                입출금 관리에서 관리자가 승인한 실제 출금 금액만
                                집계됩니다. 기프트 구매/판매 등으로 소모 또는
                                증가된 값은 포함하지 않습니다.
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {isPointHistoryLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          포인트 내역을 불러오는 중...
                        </td>
                      </tr>
                    ) : dbPointHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          포인트 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      dbPointHistory
                        .filter((item) => {
                          if (pointFilter === "deposit")
                            return item.type === "charge";
                          if (pointFilter === "withdraw")
                            return item.type === "withdraw";
                          if (pointFilter === "etc")
                            return !["charge", "withdraw"].includes(item.type);
                          return true;
                        })
                        .filter((item) => {
                          if (!pointStartDate && !pointEndDate) return true;
                          const itemDate = item.created_at?.split("T")[0] || "";
                          if (pointStartDate && itemDate < pointStartDate)
                            return false;
                          if (pointEndDate && itemDate > pointEndDate)
                            return false;
                          return true;
                        })
                        .map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-gray-300 text-sm w-1/4">
                              {item.created_at
                                ? formatKST(item.created_at, "datetime")
                                : "-"}
                            </td>
                            <td
                              className={`px-4 py-3 ${
                                item.amount > 0
                                  ? "text-green-400 font-semibold"
                                  : item.amount < 0
                                    ? "text-red-400 font-semibold"
                                    : "text-gray-400 font-semibold"
                              } w-1/4`}
                            >
                              {item.amount > 0
                                ? `+${item.amount.toLocaleString()} P`
                                : `${item.amount.toLocaleString()} P`}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm w-1/4">
                              {item.type === "charge"
                                ? "충전"
                                : item.type === "withdraw"
                                  ? "출금"
                                  : item.type === "bet"
                                    ? "배팅"
                                    : item.type === "win"
                                      ? "당첨"
                                      : item.type === "gift_buy"
                                        ? "기프트 구매"
                                        : item.type === "gift_sell"
                                          ? "기프트 판매"
                                          : item.type === "chat_start"
                                            ? "채팅 시작"
                                            : item.type === "admin_adjust"
                                              ? "관리자 조정"
                                              : item.type}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-sm w-1/4">
                              {item.description || "-"}
                            </td>
                          </tr>
                        ))
                    )}
                  </>
                )}

                {activeTab === "gifts" && (
                  <>
                    <tr>
                      <td colSpan={4} className="px-4 py-3 bg-gray-900">
                        <div className="flex flex-wrap items-center gap-3">
                          <Calendar className="text-indigo-400" size={18} />
                          <DateRangePicker
                            startDate={giftStartDate}
                            endDate={giftEndDate}
                            onStartDateChange={(val) => {
                              setGiftStartDate(val);
                              setIsGiftDateRangeValid(true);
                            }}
                            onEndDateChange={(val) => {
                              setGiftEndDate(val);
                              setIsGiftDateRangeValid(true);
                            }}
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
                        {!isGiftDateRangeValid && (
                          <p className="text-red-400 text-xs mt-2">
                            종료일은 시작일보다 이전일 수 없습니다.
                          </p>
                        )}
                      </td>
                    </tr>
                    {isGiftHistoryLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          선물 내역을 불러오는 중...
                        </td>
                      </tr>
                    ) : dbGiftHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          선물 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      dbGiftHistory
                        .filter((item) => {
                          if (!giftStartDate && !giftEndDate) return true;
                          const itemDate = item.created_at?.split("T")[0] || "";
                          if (giftStartDate && itemDate < giftStartDate)
                            return false;
                          if (giftEndDate && itemDate > giftEndDate)
                            return false;
                          return true;
                        })
                        .map((item) => {
                          const isSender = item.sender_id === user.id;
                          const txType =
                            item.transaction_type ||
                            (isSender ? "send" : "receive");
                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-gray-300 text-sm">
                                {item.created_at
                                  ? formatKST(item.created_at, "datetime")
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-white">
                                {item.gifts?.emoji || "🎁"}{" "}
                                {item.gifts?.name || "선물"}
                                {item.quantity && item.quantity > 1 && (
                                  <span className="text-gray-400 ml-1">
                                    ×{item.quantity}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`px-4 py-3 ${
                                  txType === "buy"
                                    ? "text-red-400"
                                    : txType === "sell"
                                      ? "text-green-400"
                                      : isSender
                                        ? "text-red-400"
                                        : "text-green-400"
                                }`}
                              >
                                {txType === "buy"
                                  ? "구매"
                                  : txType === "sell"
                                    ? "판매"
                                    : isSender
                                      ? "보냄"
                                      : "받음"}
                              </td>
                              <td
                                className={`px-4 py-3 font-semibold ${
                                  item.points_amount >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {item.points_amount >= 0
                                  ? `+${item.points_amount.toLocaleString()}`
                                  : item.points_amount.toLocaleString()}{" "}
                                P
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </>
                )}

                {activeTab === "chats" && !isReadOnly && (
                  <>
                    <tr>
                      <td colSpan={4} className="px-4 py-3 bg-gray-900">
                        {/* 기간 선택 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Calendar className="text-indigo-400" size={18} />
                          <DateRangePicker
                            startDate={chatStartDate}
                            endDate={chatEndDate}
                            onStartDateChange={(val) => {
                              setChatStartDate(val);
                              setIsChatDateRangeValid(true);
                            }}
                            onEndDateChange={(val) => {
                              setChatEndDate(val);
                              setIsChatDateRangeValid(true);
                            }}
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
                            종료일은 시작일보다 이전일 수 없습니다.
                          </p>
                        )}
                      </td>
                    </tr>
                    {isChatRoomsLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          불러오는 중...
                        </td>
                      </tr>
                    ) : chatRoomsError ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-red-400"
                        >
                          {chatRoomsError}
                        </td>
                      </tr>
                    ) : chatRooms.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          채팅 내역이 없습니다
                        </td>
                      </tr>
                    ) : (
                      chatRooms.map((room) => {
                        const partnerName =
                          room.chat_profiles?.name || "알 수 없음";
                        const displayDate =
                          room.last_message_at || room.created_at || "";

                        const dateText = displayDate
                          ? formatKST(displayDate, "datetime")
                          : "";

                        return (
                          <tr
                            key={room.id}
                            onClick={() =>
                              void openChatRoomPopup(room.id, partnerName)
                            }
                            className="cursor-pointer hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-300 text-sm w-1/3">
                              {dateText}
                            </td>
                            <td className="px-4 py-3 text-white w-1/3">
                              {partnerName}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm w-1/3">
                              {room.last_message || ""}
                            </td>
                          </tr>
                        );
                      })
                    )}

                    <tr>
                      <td colSpan={4} className="px-4 py-3 bg-gray-900">
                        <div className="flex items-center gap-2">
                          <MessageCircle size={18} className="text-pink-400" />
                          <span className="text-white">미니게임 채팅</span>
                        </div>
                      </td>
                    </tr>
                    {isMinigameChatsLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          불러오는 중...
                        </td>
                      </tr>
                    ) : minigameChatsError ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-red-400"
                        >
                          {minigameChatsError}
                        </td>
                      </tr>
                    ) : ladderGameChats.length === 0 &&
                      powerballGameChats.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          미니게임 채팅 내역이 없습니다
                        </td>
                      </tr>
                    ) : (
                      <>
                        <tr
                          onClick={() =>
                            ladderGameChats.length > 0
                              ? void openMinigameChatPopup("ladder")
                              : undefined
                          }
                          className={
                            ladderGameChats.length > 0
                              ? "cursor-pointer hover:bg-gray-700/50 transition-colors"
                              : "text-gray-500"
                          }
                        >
                          <td className="px-4 py-3 text-gray-300 text-sm w-1/3">
                            {ladderLastChat?.created_at
                              ? formatKST(ladderLastChat.created_at, "datetime")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-white w-1/3">
                            사다리 게임 채팅
                            <span className="text-gray-400 ml-2 text-xs">
                              ({ladderGameChats.length}건)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/3">
                            {ladderLastChat?.message || ""}
                          </td>
                        </tr>
                        <tr
                          onClick={() =>
                            powerballGameChats.length > 0
                              ? void openMinigameChatPopup("powerball")
                              : undefined
                          }
                          className={
                            powerballGameChats.length > 0
                              ? "cursor-pointer hover:bg-gray-700/50 transition-colors"
                              : "text-gray-500"
                          }
                        >
                          <td className="px-4 py-3 text-gray-300 text-sm w-1/3">
                            {powerballLastChat?.created_at
                              ? formatKST(
                                  powerballLastChat.created_at,
                                  "datetime",
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-white w-1/3">
                            파워볼 게임 채팅
                            <span className="text-gray-400 ml-2 text-xs">
                              ({powerballGameChats.length}건)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/3">
                            {powerballLastChat?.message || ""}
                          </td>
                        </tr>
                      </>
                    )}
                  </>
                )}

                {activeTab === "minigames" && (
                  <>
                    <tr>
                      <td colSpan={7} className="px-4 py-3 bg-gray-900">
                        <div className="flex flex-col gap-3">
                          {/* 게임 타입 드롭다운과 기간 선택을 같은 줄에 배치 */}
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-gray-400 text-sm">게임:</span>
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
                              <option value="ladder">사다리</option>
                              <option value="powerball">파워볼</option>
                            </select>

                            {/* 세로 구분선 */}
                            <div className="h-6 w-px bg-gray-700"></div>
                            <Calendar className="text-indigo-400" size={18} />
                            <DateRangePicker
                              startDate={betStartDate}
                              endDate={betEndDate}
                              onStartDateChange={(val) => {
                                setBetStartDate(val);
                                setIsBetDateRangeValid(true);
                              }}
                              onEndDateChange={(val) => {
                                setBetEndDate(val);
                                setIsBetDateRangeValid(true);
                              }}
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
                              종료일은 시작일보다 이전일 수 없습니다.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 롤링 통계 */}
                    <tr>
                      <td colSpan={7} className="px-3 py-2 bg-gray-800/50">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">
                              전체 롤링금액:
                            </span>
                            <span className="text-yellow-400 font-semibold">
                              {totalMinigameRolling.toLocaleString()}P
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">
                              파워볼 롤링금액:
                            </span>
                            <span className="text-purple-400 font-semibold">
                              {powerballRolling.toLocaleString()}P
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
                    {isBetHistoryLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          배팅 내역을 불러오는 중...
                        </td>
                      </tr>
                    ) : dbBetHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          배팅 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      dbBetHistory
                        .filter((bet) => {
                          if (minigameFilter === "ladder")
                            return bet.game_rounds?.game_type === "ladder";
                          if (minigameFilter === "powerball")
                            return bet.game_rounds?.game_type === "powerball";
                          return true;
                        })
                        .filter((bet) => {
                          if (!betStartDate && !betEndDate) return true;
                          const betDate = bet.created_at?.split("T")[0] || "";
                          if (betStartDate && betDate < betStartDate)
                            return false;
                          if (betEndDate && betDate > betEndDate) return false;
                          return true;
                        })
                        .map((bet) => {
                          const gameType =
                            bet.game_rounds?.game_type === "ladder"
                              ? "사다리"
                              : "파워볼";
                          const result =
                            bet.status === "won"
                              ? "승리"
                              : bet.status === "lost"
                                ? "패배"
                                : "대기";
                          return (
                            <tr
                              key={bet.id}
                              className="hover:bg-gray-700/50 transition-colors"
                            >
                              <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                                {bet.created_at
                                  ? formatKST(bet.created_at, "datetime")
                                  : "-"}
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                      gameType === "사다리"
                                        ? "bg-blue-500/20 text-blue-300"
                                        : "bg-purple-500/20 text-purple-300"
                                    }`}
                                  >
                                    {gameType}
                                  </span>
                                  <span className="text-gray-400 text-xs whitespace-nowrap mt-0.5">
                                    #
                                    {getDisplayRoundNumber(
                                      bet.game_rounds?.round_number,
                                    ) || "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className="inline-block bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                                  {bet.bet_value}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center text-white text-xs whitespace-nowrap">
                                {bet.bet_amount.toLocaleString()}P
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                    result === "승리"
                                      ? "bg-green-500/20 text-green-300"
                                      : result === "패배"
                                        ? "bg-red-500/20 text-red-300"
                                        : "bg-gray-600 text-gray-300"
                                  }`}
                                >
                                  {result}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
                                <span
                                  className={
                                    bet.win_amount && bet.win_amount > 0
                                      ? "text-yellow-400 font-semibold"
                                      : "text-gray-400"
                                  }
                                >
                                  {bet.win_amount && bet.win_amount > 0
                                    ? `+${bet.win_amount.toLocaleString()}P`
                                    : "-"}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center text-gray-400 text-xs whitespace-nowrap">
                                -
                              </td>
                            </tr>
                          );
                        })
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
                      <Info size={18} className="text-indigo-400" />
                      현재 인벤토리 (캘린더 필터 무관)
                    </h3>
                    <div className="text-yellow-400 font-semibold">
                      총 가치:{" "}
                      {dbGiftInventory
                        .reduce(
                          (sum, inv) =>
                            sum + (inv.gifts?.sell_price || 0) * inv.quantity,
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
                    {isGiftInventoryLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          인벤토리를 불러오는 중...
                        </td>
                      </tr>
                    ) : dbGiftInventory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          보유 중인 선물이 없습니다
                        </td>
                      </tr>
                    ) : (
                      dbGiftInventory.map((inv) => (
                        <tr key={inv.id} className="border-t border-gray-700">
                          <td className="px-4 py-3 text-white">
                            {inv.gifts?.emoji || "🎁"}{" "}
                            {inv.gifts?.name || "선물"}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {(inv.gifts?.sell_price || 0).toLocaleString()} P
                          </td>
                          <td className="px-4 py-3 text-white">
                            {inv.quantity}개
                          </td>
                          <td className="px-4 py-3 text-indigo-400 font-semibold">
                            {(
                              (inv.gifts?.sell_price || 0) * inv.quantity
                            ).toLocaleString()}{" "}
                            P
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 기프트 내역 로그 */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                  <h3 className="text-white flex items-center gap-2">
                    <Info size={18} className="text-indigo-400" />
                    기프트 내역
                  </h3>
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 bg-gray-900">
                        {/* 기간 선택 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Calendar className="text-indigo-400" size={18} />
                          <DateRangePicker
                            startDate={giftStartDate}
                            endDate={giftEndDate}
                            onStartDateChange={(val) => {
                              setGiftStartDate(val);
                              setIsGiftDateRangeValid(true);
                            }}
                            onEndDateChange={(val) => {
                              setGiftEndDate(val);
                              setIsGiftDateRangeValid(true);
                            }}
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
                            종료일은 시작일보다 이전일 수 없습니다.
                          </p>
                        )}
                      </td>
                    </tr>
                    {isGiftHistoryLoading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          선물 내역을 불러오는 중...
                        </td>
                      </tr>
                    ) : dbGiftHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          선물 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      dbGiftHistory
                        .filter((item) => {
                          if (!giftStartDate && !giftEndDate) return true;
                          const itemDate = item.created_at?.split("T")[0] || "";
                          if (giftStartDate && itemDate < giftStartDate)
                            return false;
                          if (giftEndDate && itemDate > giftEndDate)
                            return false;
                          return true;
                        })
                        .map((item) => {
                          const isSender = item.sender_id === user.id;
                          const txType =
                            item.transaction_type ||
                            (isSender ? "send" : "receive");
                          const label =
                            txType === "buy"
                              ? "구매"
                              : txType === "sell"
                                ? "판매"
                                : txType === "admin_grant"
                                  ? "관리자 지급"
                                  : txType === "admin_revoke"
                                    ? "관리자 회수"
                                    : isSender
                                      ? "보냄"
                                      : "받음";
                          const giftName = item.gifts?.name || "선물";
                          const giftEmoji = item.gifts?.emoji || "🎁";

                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-gray-300 text-sm w-1/4">
                                {item.created_at
                                  ? formatKST(item.created_at, "datetime")
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 text-white w-1/4">
                                {giftEmoji} {giftName} ({item.quantity || 1}개)
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-sm w-1/4">
                                {label}
                              </td>
                              <td
                                className={`px-4 py-3 font-semibold w-1/4 ${
                                  item.points_amount >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {item.points_amount >= 0 ? "+" : ""}
                                {item.points_amount.toLocaleString()} P
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Popup */}
      {showChatPopup &&
        chatPopupRoomId &&
        chatPopupDbPartnerName &&
        (() => {
          const partnerName = chatPopupDbPartnerName || "알 수 없음";

          const filteredDbMessages = chatPopupDbMessages.filter((msg) => {
            if (!chatStartDate && !chatEndDate) return true;
            if (!msg.created_at) return true;

            const msgDate = msg.created_at.split("T")[0];

            if (chatStartDate && chatEndDate) {
              return msgDate >= chatStartDate && msgDate <= chatEndDate;
            } else if (chatStartDate) {
              return msgDate >= chatStartDate;
            } else if (chatEndDate) {
              return msgDate <= chatEndDate;
            }
            return true;
          });

          const copyAllMessages = () => {
            if (isCopying) return;
            setIsCopying(true);

            const textContent = filteredDbMessages
              .map((msg) => {
                const time = msg.created_at
                  ? formatKST(msg.created_at, "datetime")
                  : "";
                const sender =
                  msg.sender_type === "user"
                    ? user.nickname
                      ? `${user.nickname}(${user.name})`
                      : user.name
                    : partnerName;
                const body = msg.content || msg.message;
                return `[${time}] ${sender}: ${body}`;
              })
              .join("\n");

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
              const message =
                err instanceof Error ? err.message : "복사에 실패했습니다.";
              showAlert({
                title: "오류",
                message,
                type: "error",
              });
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
                    <MessageCircle size={18} className="text-indigo-400" />
                    {user.nickname
                      ? `${user.nickname}(${user.name})`
                      : user.name}
                    와 {partnerName}의 대화
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
                      onClick={() => {
                        setShowChatPopup(false);
                        setChatPopupRoomId(null);
                        setChatPopupDbPartnerName(null);
                        setChatPopupDbMessages([]);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-1 text-sm">
                    {isChatPopupLoading ? (
                      <div className="text-gray-400">불러오는 중...</div>
                    ) : (
                      filteredDbMessages.map((msg, idx) => {
                        const time = msg.created_at
                          ? formatKST(msg.created_at, "datetime")
                          : "";
                        const isUser = msg.sender_type === "user";
                        const isGift = msg.message_type === "gift";
                        const isImage = msg.message_type === "image";
                        const body = msg.content || msg.message;
                        const senderName = isUser
                          ? user.nickname
                            ? `${user.nickname}(${user.name})`
                            : user.name
                          : partnerName;
                        const imageUrl =
                          isImage && body && body.startsWith("http")
                            ? body
                            : null;

                        return (
                          <div
                            key={idx}
                            className={
                              isGift ? "text-pink-400" : "text-gray-300"
                            }
                          >
                            {isImage && imageUrl ? (
                              <span>
                                [{time}]{" "}
                                <span
                                  className={
                                    isUser
                                      ? "text-indigo-400"
                                      : "text-emerald-400"
                                  }
                                >
                                  {senderName}:
                                </span>{" "}
                                <span
                                  onClick={() => setImagePreviewModal(imageUrl)}
                                  className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors"
                                  style={{
                                    textDecoration: "none",
                                  }}
                                >
                                  [이미지]
                                </span>
                              </span>
                            ) : (
                              <span>
                                [{time}]{" "}
                                <span
                                  className={
                                    isUser
                                      ? "text-indigo-400"
                                      : "text-emerald-400"
                                  }
                                >
                                  {senderName}:
                                </span>{" "}
                                {body}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
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

      {showMinigameChatPopup &&
        minigameChatPopupGameType &&
        (() => {
          const title =
            minigameChatPopupGameType === "ladder"
              ? "사다리 게임 채팅"
              : "파워볼 게임 채팅";

          const filtered = minigameChatPopupMessages.filter((msg) => {
            if (!chatStartDate && !chatEndDate) return true;
            if (!msg.created_at) return true;

            const msgDate = msg.created_at.split("T")[0];

            if (chatStartDate && chatEndDate) {
              return msgDate >= chatStartDate && msgDate <= chatEndDate;
            } else if (chatStartDate) {
              return msgDate >= chatStartDate;
            } else if (chatEndDate) {
              return msgDate <= chatEndDate;
            }
            return true;
          });

          const copyAllMessages = () => {
            if (isCopying) return;
            setIsCopying(true);

            const textContent = filtered
              .map((msg) => {
                const time = msg.created_at
                  ? formatKST(msg.created_at, "datetime")
                  : "";
                const sender = (msg.nickname || "익명").trim();
                const body = (msg.message || "").trim();
                return `[${time}] ${sender}: ${body}`;
              })
              .join("\n");

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
              const message =
                err instanceof Error ? err.message : "복사에 실패했습니다.";
              showAlert({
                title: "오류",
                message,
                type: "error",
              });
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
                    <MessageCircle size={18} className="text-pink-400" />
                    {user.nickname
                      ? `${user.nickname}(${user.name})`
                      : user.name}{" "}
                    - {title}
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
                      onClick={() => {
                        setShowMinigameChatPopup(false);
                        setMinigameChatPopupGameType(null);
                        setMinigameChatPopupMessages([]);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-1 text-sm">
                    {isMinigameChatPopupLoading ? (
                      <div className="text-gray-400">불러오는 중...</div>
                    ) : filtered.length === 0 ? (
                      <div className="text-gray-400">채팅 내역이 없습니다.</div>
                    ) : (
                      filtered.map((msg, idx) => {
                        const time = msg.created_at
                          ? formatKST(msg.created_at, "datetime")
                          : "";
                        const sender = (msg.nickname || "익명").trim();
                        const body = (msg.message || "").trim();

                        return (
                          <div key={idx} className="text-gray-300">
                            <span>
                              [{time}]{" "}
                              <span className="text-pink-400">{sender}:</span>{" "}
                              {body}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

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
                  onChange={(e) => setSelectedGiftId(e.target.value)}
                  disabled={isAvailableGiftsLoading}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">기프트를 선택하세요</option>
                  {isAvailableGiftsLoading && (
                    <option value="" disabled>
                      불러오는 중...
                    </option>
                  )}
                  {dbAvailableGifts.map((gift) => (
                    <option key={gift.id} value={gift.id}>
                      {gift.emoji || "🎁"} {gift.name} (가치: {gift.sell_price}
                      P)
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
                      {dbAvailableGifts.find((g) => g.id === selectedGiftId)
                        ?.emoji || "🎁"}{" "}
                      {
                        dbAvailableGifts.find((g) => g.id === selectedGiftId)
                          ?.name
                      }
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    포인트 가치:{" "}
                    <span className="text-indigo-400">
                      {dbAvailableGifts.find((g) => g.id === selectedGiftId)
                        ?.sell_price || 0}
                      P
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    현재 보유 수량:{" "}
                    <span className="text-yellow-400">
                      {dbGiftInventory.find(
                        (inv) => inv.gift_id === selectedGiftId,
                      )?.quantity || 0}
                      개
                    </span>
                  </p>
                </div>
              )}

              {/* 수량 입력 */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">수량</label>
                <input
                  type="number"
                  value={newGiftQuantity}
                  onChange={(e) => setNewGiftQuantity(e.target.value)}
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
                  onClick={async () => {
                    if (!selectedGiftId || !newGiftQuantity || !user?.id)
                      return;

                    if (isReadOnly) return;
                    if (!isAdmin || !adminAccount?.id) {
                      showAlert({
                        title: "권한 오류",
                        message: "관리자 권한이 필요합니다.",
                        type: "warning",
                      });
                      return;
                    }

                    const selectedGift = dbAvailableGifts.find(
                      (g) => g.id === selectedGiftId,
                    );
                    const quantity = parseInt(newGiftQuantity, 10);

                    if (
                      !selectedGift ||
                      !Number.isFinite(quantity) ||
                      quantity < 1
                    )
                      return;

                    const existingInv = dbGiftInventory.find(
                      (inv) => inv.gift_id === selectedGiftId,
                    );

                    try {
                      if (giftAction === "add") {
                        const { error } = await supabaseAdmin.rpc(
                          "admin_gift_grant",
                          {
                            p_user_id: user.id,
                            p_gift_id: selectedGiftId,
                            p_quantity: quantity,
                          },
                        );
                        if (error) throw error;

                        showAlert({
                          title: "처리 완료",
                          message: `${selectedGift.name} ${quantity}개가 지급되었습니다.`,
                          type: "success",
                        });
                      } else {
                        if (!existingInv || existingInv.quantity < quantity) {
                          showAlert({
                            title: "입력 오류",
                            message: "보유 수량보다 많이 회수할 수 없습니다.",
                            type: "warning",
                          });
                          return;
                        }

                        const { error } = await supabaseAdmin.rpc(
                          "admin_gift_revoke",
                          {
                            p_user_id: user.id,
                            p_gift_id: selectedGiftId,
                            p_quantity: quantity,
                          },
                        );
                        if (error) throw error;

                        showAlert({
                          title: "처리 완료",
                          message: `${selectedGift.name} ${quantity}개가 회수되었습니다.`,
                          type: "success",
                        });
                      }

                      await refetchGiftInventory();
                      setIsAddingGift(false);
                      setSelectedGiftId("");
                      setGiftAction("add");
                      setNewGiftQuantity("");
                    } catch (err) {
                      const msg =
                        err instanceof Error
                          ? err.message
                          : "기프트 처리에 실패했습니다.";
                      showAlert({
                        title: "오류",
                        message: msg,
                        type: "error",
                      });
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
                      (!dbGiftInventory.find(
                        (inv) => inv.gift_id === selectedGiftId,
                      ) ||
                        (dbGiftInventory.find(
                          (inv) => inv.gift_id === selectedGiftId,
                        )?.quantity || 0) < parseInt(newGiftQuantity || "0")))
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
                <DollarSign className="text-indigo-400" size={18} />
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
                <p className="text-white font-medium">{user.name}</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  추천코드
                </label>
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="추천코드를 입력하세요"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowReferralCodeModal(false);
                    setReferralCodeInput(user.referralCode || "");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (isReadOnly) return;
                    if (!isAdmin || !adminAccount?.id) {
                      showAlert({
                        title: "권한 오류",
                        message: "관리자 권한이 필요합니다.",
                        type: "warning",
                      });
                      return;
                    }

                    void (async () => {
                      try {
                        const normalized = referralCodeInput.trim();
                        let agentId: string | null = null;

                        if (normalized) {
                          const { data: agentRow, error: agentError } =
                            await supabase
                              .from("agents")
                              .select("id")
                              .eq("referral_code", normalized)
                              .eq("is_active", true)
                              .maybeSingle();

                          if (agentError) throw agentError;
                          if (!agentRow?.id) {
                            throw new Error("존재하지 않는 추천코드입니다.");
                          }
                          agentId = agentRow.id;
                        }

                        const { error: updateError } = await supabase
                          .from("user_profiles")
                          .update({ agent_id: agentId })
                          .eq("id", user.id);

                        if (updateError) throw updateError;

                        setLocalUser((prev) =>
                          prev
                            ? {
                                ...prev,
                                referralCode: normalized || "",
                              }
                            : prev,
                        );
                        showAlert({
                          title: "처리 완료",
                          message: "추천코드가 수정되었습니다.",
                          type: "success",
                        });
                        setShowReferralCodeModal(false);
                      } catch (err) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "처리 중 오류가 발생했습니다";
                        showAlert({
                          title: "오류",
                          message: msg,
                          type: "error",
                        });
                      }
                    })();
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
              {displayUser.status === "활성" ? "회원 정지" : "정지 해제"}
            </h3>
            <p className="text-gray-300 mb-4">
              {displayUser.status === "활성"
                ? `${user.name} 회원을 정지하시겠습니까?`
                : `${user.name} 회원의 정지를 해제하시겠습니까?`}
            </p>
            {displayUser.status === "활성" && (
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
                      if (isReadOnly) return;
                      if (!isAdmin || !adminAccount?.id) {
                        showAlert({
                          title: "권한 오류",
                          message: "관리자 권한이 필요합니다.",
                          type: "warning",
                        });
                        return;
                      }

                      void (async () => {
                        try {
                          const nextStatus =
                            displayUser.status === "활성"
                              ? "suspended"
                              : "active";
                          await setUserStatus({
                            userId: user.id,
                            status: nextStatus,
                            reason: suspendReason || undefined,
                          });

                          setLocalUser((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status:
                                    nextStatus === "suspended"
                                      ? "정지"
                                      : "활성",
                                }
                              : prev,
                          );
                          showAlert({
                            title: "처리 완료",
                            message:
                              displayUser.status === "활성"
                                ? `${user.name} 회원이 정지되었습니다.${
                                    suspendReason
                                      ? `\n사유: ${suspendReason}`
                                      : ""
                                  }`
                                : `${user.name} 회원의 정지가 해제되었습니다.`,
                            type: "success",
                          });
                          setShowSuspendConfirm(false);
                          setSuspendReason("");
                        } catch (err) {
                          const msg =
                            err instanceof Error
                              ? err.message
                              : "처리 중 오류가 발생했습니다";
                          showAlert({
                            title: "오류",
                            message: msg,
                            type: "error",
                          });
                        }
                      })();
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
                  if (isReadOnly) return;
                  if (!isAdmin || !adminAccount?.id) {
                    showAlert({
                      title: "권한 오류",
                      message: "관리자 권한이 필요합니다.",
                      type: "warning",
                    });
                    return;
                  }

                  void (async () => {
                    try {
                      const nextStatus =
                        displayUser.status === "활성" ? "suspended" : "active";
                      await setUserStatus({
                        userId: user.id,
                        status: nextStatus,
                        reason: suspendReason || undefined,
                      });

                      setLocalUser((prev) =>
                        prev
                          ? {
                              ...prev,
                              status:
                                nextStatus === "suspended" ? "정지" : "활성",
                            }
                          : prev,
                      );
                      showAlert({
                        title: "처리 완료",
                        message:
                          displayUser.status === "활성"
                            ? `${user.name} 회원이 정지되었습니다.${
                                suspendReason ? `\n사유: ${suspendReason}` : ""
                              }`
                            : `${user.name} 회원의 정지가 해제되었습니다.`,
                        type: "success",
                      });
                      setShowSuspendConfirm(false);
                      setSuspendReason("");
                    } catch (err) {
                      const msg =
                        err instanceof Error
                          ? err.message
                          : "처리 중 오류가 발생했습니다";
                      showAlert({ title: "오류", message: msg, type: "error" });
                    }
                  })();
                }}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  displayUser.status === "활성"
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
      {showProfileImage && profileImageUrl && (
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
              src={profileImageUrl}
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
