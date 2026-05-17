import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  X,
  DollarSign,
  Calendar,
  Key,
  MessageCircle,
  Info,
  Pencil,
  Check,
  XCircle,
} from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";
import { GiftHistoryTable } from "./GiftHistoryTable";
import { GiftInventoryManager } from "./GiftInventoryManager";
import { AdminPagination } from "@/components/common/AdminPagination";
import { SuspendConfirmModal } from "./SuspendConfirmModal";
import { supabaseAdmin } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useAdminUserActions } from "@/hooks/useSupabase";
import { getPublicUrlForPath } from "@/lib/utils/storage";
import { formatKST, getDisplayRoundNumber } from "@/lib/utils/dateUtils";

// 미니게임 베팅 옵션 한글 변환
const translateBetValue = (betValue: string, gameType: string): string => {
  if (gameType === "powerball") {
    const powerballMap: Record<string, string> = {
      // 언더스코어 형식
      normal_odd: "일반볼(홀)",
      normal_even: "일반볼(짝)",
      normal_under: "일반볼(언더)",
      normal_over: "일반볼(오버)",
      power_odd: "파워볼(홀)",
      power_even: "파워볼(짝)",
      power_under: "파워볼(언더)",
      power_over: "파워볼(오버)",
      powerball_odd: "파워볼(홀)",
      powerball_even: "파워볼(짝)",
      powerball_under: "파워볼(언더)",
      powerball_over: "파워볼(오버)",
      // 하이픈 형식 (DB 실제 값)
      "normal-odd": "일반볼(홀)",
      "normal-even": "일반볼(짝)",
      "normal-under": "일반볼(언더)",
      "normal-over": "일반볼(오버)",
      "power-odd": "파워볼(홀)",
      "power-even": "파워볼(짝)",
      "power-under": "파워볼(언더)",
      "power-over": "파워볼(오버)",
      "powerball-odd": "파워볼(홀)",
      "powerball-even": "파워볼(짝)",
      "powerball-under": "파워볼(언더)",
      "powerball-over": "파워볼(오버)",
      // 기존 영어 값도 처리
      odd: "홀",
      even: "짝",
      under: "언더",
      over: "오버",
    };
    return powerballMap[betValue] || betValue;
  } else if (gameType === "ladder") {
    const ladderMap: Record<string, string> = {
      left: "좌출발",
      right: "우출발",
      "3": "3줄",
      "4": "4줄",
      odd: "홀",
      even: "짝",
      // 언더스코어 형식 - 성립 가능한 4가지 조합만
      left_3_even: "좌3짝",
      left_4_odd: "좌4홀",
      right_3_odd: "우3홀",
      right_4_even: "우4짝",
      // camelCase 형식 (DB 실제 값)
      leftStart: "좌출발",
      rightStart: "우출발",
      threeLines: "3줄",
      fourLines: "4줄",
      line3: "3줄",
      line4: "4줄",
      oddEnd: "홀",
      evenEnd: "짝",
      // 하이픈 형식
      "left-start": "좌출발",
      "right-start": "우출발",
      "three-lines": "3줄",
      "four-lines": "4줄",
      "line-3": "3줄",
      "line-4": "4줄",
      "odd-end": "홀",
      "even-end": "짝",
      // 조합 배팅 - 성립 가능한 4가지 조합만 (3.5x)
      // 좌3짝, 좌4홀, 우3홀, 우4짝
      leftThreeEven: "좌3짝",
      leftFourOdd: "좌4홀",
      rightThreeOdd: "우3홀",
      rightFourEven: "우4짝",
      // 조합 배팅 (숫자 camelCase - DB 실제 값)
      left3Even: "좌3짝",
      left4Odd: "좌4홀",
      right3Odd: "우3홀",
      right4Even: "우4짝",
      // 조합 배팅 (하이픈)
      "left-three-even": "좌3짝",
      "left-four-odd": "좌4홀",
      "right-three-odd": "우3홀",
      "right-four-even": "우4짝",
      // 조합 배팅 (숫자)
      "left-3-even": "좌3짝",
      "left-4-odd": "좌4홀",
      "right-3-odd": "우3홀",
      "right-4-even": "우4짝",
    };
    return ladderMap[betValue] || betValue;
  }
  return betValue;
};

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
  const [chatStartDate, setChatStartDate] = useState("");
  const [chatEndDate, setChatEndDate] = useState("");

  // 날짜 유효성 검사 state 추가
  const [isPointDateRangeValid, setIsPointDateRangeValid] = useState(true);
  const [isChatDateRangeValid, setIsChatDateRangeValid] = useState(true);
  const [isBetDateRangeValid, setIsBetDateRangeValid] = useState(true);

  // 날짜 범위 유효성 검증 함수
  const _validateDateRange = (start: string, end: string) => {
    if (start && end) {
      return new Date(start) <= new Date(end);
    }
    return true;
  };
  void _validateDateRange;

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
  const [isReferralCodeUpdating, setIsReferralCodeUpdating] = useState(false);

  // 회원 정보 수정 state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");
  const [isUpdatingField, setIsUpdatingField] = useState(false);

  // 전화번호 자동 하이픈 포맷 함수
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
  };

  // 회원 정보 수정 함수
  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditFieldValue(currentValue || "");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditFieldValue("");
  };

  const handleSaveField = async (field: string) => {
    if (!user?.id || isReadOnly) return;

    setIsUpdatingField(true);
    try {
      const fieldMap: Record<string, string> = {
        name: "name",
        phone: "phone",
        bank: "bank",
        accountNumber: "account_number",
        accountHolder: "account_holder",
      };

      const dbField = fieldMap[field];
      if (!dbField) return;

      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update({ [dbField]: editFieldValue || null })
        .eq("id", user.id);

      if (error) throw error;

      // 로컬 상태 업데이트
      setLocalUser((prev) =>
        prev ? { ...prev, [field]: editFieldValue || null } : prev,
      );

      showAlert({
        title: "수정 완료",
        message: "회원 정보가 수정되었습니다.",
        type: "success",
      });
      setEditingField(null);
      setEditFieldValue("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.";
      showAlert({ title: "오류", message: msg, type: "error" });
    } finally {
      setIsUpdatingField(false);
    }
  };

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
      message: string | Record<string, unknown>;
    }>
  >([]);
  const [powerballGameChats, setPowerballGameChats] = useState<
    Array<{
      id: string;
      created_at: string | null;
      user_id: string;
      nickname: string | null;
      message: string | Record<string, unknown>;
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
      related_id: string | null;
      related_type: string | null;
    }>
  >([]);
  const [isPointHistoryLoading, setIsPointHistoryLoading] = useState(false);
  // 포인트 내역 페이지네이션
  const [pointHistoryPage, setPointHistoryPage] = useState(1);
  const POINT_HISTORY_PAGE_SIZE = 20;
  const [betHistoryPage, setBetHistoryPage] = useState(1);
  const BET_HISTORY_PAGE_SIZE = 20;
  const [chatHistoryPage, setChatHistoryPage] = useState(1);
  const CHAT_HISTORY_PAGE_SIZE = 20;

  const [approvedDeposits, setApprovedDeposits] = useState<
    Array<{ amount: number; bonus_amount: number | null }>
  >([]);
  const [approvedWithdrawals, setApprovedWithdrawals] = useState<
    Array<{ amount: number }>
  >([]);
  // 보너스 통계용 별도 state (point_transactions에서 bonus, admin_adjust 타입)
  const [bonusTransactions, setBonusTransactions] = useState<
    Array<{ amount: number; type: string }>
  >([]);
  // 충전 통계용 별도 state (point_transactions에서 charge 타입)
  const [chargeTransactions, setChargeTransactions] = useState<
    Array<{ amount: number }>
  >([]);
  // 롤링금액 통계용 별도 state (정산완료된 배팅만)
  const [settledBets, setSettledBets] = useState<
    Array<{ bet_amount: number; game_type: string }>
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
      sender_name?: string | null;
      receiver_name?: string | null;
      admin_name?: string | null;
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
      ip_address: string | null;
      game_rounds?: { game_type: string; round_number: string | null } | null;
    }>
  >([]);
  const [isBetHistoryLoading, setIsBetHistoryLoading] = useState(false);

  // 회원 정지/정지 해제 state
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [fetchedSuspendReason, setFetchedSuspendReason] = useState<
    string | null
  >(null);
  const isSuspending = displayUser.status === "활성";

  const handleSuspendConfirm = useCallback(async () => {
    if (isReadOnly) return;
    if (!isAdmin || !adminAccount?.id) {
      showAlert({
        title: "권한 오류",
        message: "관리자 권한이 필요합니다.",
        type: "warning",
      });
      return;
    }

    try {
      const nextStatus = displayUser.status === "활성" ? "suspended" : "active";
      await setUserStatus({
        userId: user.id,
        status: nextStatus,
        reason: suspendReason || undefined,
      });

      setLocalUser((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus === "suspended" ? "정지" : "활성",
            }
          : prev,
      );
      showAlert({
        title: "처리 완료",
        message: isSuspending
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
        err instanceof Error ? err.message : "처리 중 오류가 발생했습니다";
      showAlert({ title: "오류", message: msg, type: "error" });
    }
  }, [
    adminAccount?.id,
    displayUser.status,
    isAdmin,
    isReadOnly,
    isSuspending,
    setUserStatus,
    showAlert,
    suspendReason,
    user.id,
    user.name,
  ]);

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

  // 디바운스 타이머 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 디바운스 헬퍼 함수
  const debounce = useCallback((fn: () => void, delay: number = 300) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(fn, delay);
  }, []);

  // 포인트 내역 fetch 함수 (useCallback으로 분리)
  const fetchPointHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsPointHistoryLoading(true);
    const { data: txData, error: txError } = await supabaseAdmin
      .from("point_transactions")
      .select(
        "id, user_id, created_at, type, amount, balance_before, balance_after, description, related_id, related_type",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: withdrawalRows, error: withdrawalError } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("id, user_id, amount, processed_at, created_at")
      .eq("user_id", user.id)
      .eq("status", "approved");

    if (txError) {
      console.error("포인트 내역 fetch 오류:", txError.message);
    }
    if (withdrawalError) {
      console.error("출금 내역 fetch 오류:", withdrawalError.message);
    }

    const baseTx = (txData as any) || [];
    const existingWithdrawalIds = new Set(
      baseTx
        .filter(
          (t: any) =>
            t.type === "withdraw" &&
            t.related_type === "withdrawal_request" &&
            t.related_id,
        )
        .map((t: any) => t.related_id as string),
    );
    const existingWithdrawalKeys = new Set(
      baseTx
        .filter((t: any) => t.type === "withdraw")
        .map((t: any) => {
          const day = (t.created_at || "").split("T")[0] || "";
          return `${t.user_id || user.id}:${Math.abs(Number(t.amount || 0))}:${day}`;
        }),
    );

    const supplementalWithdrawals = (withdrawalRows || [])
      .filter((row: any) => {
        if (existingWithdrawalIds.has(row.id)) return false;
        const day = (row.processed_at || row.created_at || "").split("T")[0];
        const key = `${row.user_id || user.id}:${Math.abs(Number(row.amount || 0))}:${day}`;
        return !existingWithdrawalKeys.has(key);
      })
      .map((row: any) => ({
        id: `withdrawal-${row.id}`,
        created_at: row.processed_at || row.created_at,
        type: "withdraw",
        amount: -Math.abs(Number(row.amount || 0)),
        balance_before: 0,
        balance_after: 0,
        description: "출금 완료",
        related_id: row.id,
        related_type: "withdrawal_request",
      }));

    const mergedHistory = [...baseTx, ...supplementalWithdrawals].sort(
      (a: any, b: any) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      },
    );

    setDbPointHistory(mergedHistory);
    setIsPointHistoryLoading(false);
  }, [user?.id]);

  // 포인트 내역 초기 로드
  useEffect(() => {
    if (activeTab !== "points" || !user?.id) return;
    fetchPointHistory();
  }, [activeTab, user?.id, fetchPointHistory]);

  // 포인트 내역 실시간 업데이트 (Realtime subscription)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseAdmin
      .channel(`point_history_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "point_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // 디바운스로 빈번한 업데이트 방지
          debounce(() => fetchPointHistory(), 500);
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [user?.id, fetchPointHistory, debounce]);

  // 통계 데이터 fetch - 모달 열릴 때 바로 실행 (탭 상관없이)
  useEffect(() => {
    const fetchAllStats = async () => {
      if (!user?.id) return;

      const [
        { data: depositsData, error: depositsError },
        { data: withdrawalsData, error: withdrawalsError },
        { data: bonusData, error: bonusError },
        { data: chargeData, error: chargeError },
      ] = await Promise.all([
        // 승인된 입금 내역 (deposit_requests - 참고용)
        supabaseAdmin
          .from("deposit_requests")
          .select("amount, bonus_amount")
          .eq("user_id", user.id)
          .eq("status", "approved"),
        // 승인된 출금 내역
        supabaseAdmin
          .from("withdrawal_requests")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "approved"),
        // 보너스 관련 트랜잭션 (bonus 타입 + admin_adjust 타입)
        supabaseAdmin
          .from("point_transactions")
          .select("amount, type")
          .eq("user_id", user.id)
          .or("type.eq.bonus,type.eq.admin_adjust"),
        // 충전 트랜잭션 (charge 타입) - 전체 입금 계산용
        supabaseAdmin
          .from("point_transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("type", "charge"),
      ]);

      if (depositsError) {
        console.error("입금 내역 fetch 오류:", depositsError.message);
      }
      if (withdrawalsError) {
        console.error("출금 내역 fetch 오류:", withdrawalsError.message);
      }
      if (bonusError) {
        console.error("보너스 내역 fetch 오류:", bonusError.message);
      }
      if (chargeError) {
        console.error("충전 내역 fetch 오류:", chargeError.message);
      }

      setApprovedDeposits((depositsData as any) || []);
      setApprovedWithdrawals((withdrawalsData as any) || []);
      setBonusTransactions((bonusData as any) || []);
      setChargeTransactions((chargeData as any) || []);
    };

    void fetchAllStats();
  }, [user?.id]);

  // 기프트 내역 fetch 함수 (useCallback으로 분리)
  const fetchGiftHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsGiftHistoryLoading(true);
    const { data, error } = await supabaseAdmin
      .from("gift_transactions")
      .select(
        "id, created_at, transaction_type, quantity, points_amount, sender_id, sender_type, receiver_id, receiver_type, admin_id, gifts(name, emoji)",
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("기프트 내역 fetch 오류:", error.message);
      setIsGiftHistoryLoading(false);
      return;
    }

    // Fetch sender/receiver names
    const transactions = (data as any) || [];
    const userIds = new Set<string>();
    const profileIds = new Set<string>();
    const adminIds = new Set<string>();

    transactions.forEach((tx: any) => {
      if (tx.sender_type === "user" && tx.sender_id) userIds.add(tx.sender_id);
      if (tx.receiver_type === "user" && tx.receiver_id)
        userIds.add(tx.receiver_id);
      if (tx.sender_type === "profile" && tx.sender_id)
        profileIds.add(tx.sender_id);
      if (tx.receiver_type === "profile" && tx.receiver_id)
        profileIds.add(tx.receiver_id);
      if (tx.sender_type === "admin" && tx.sender_id)
        adminIds.add(tx.sender_id);
      if (tx.receiver_type === "admin" && tx.receiver_id)
        adminIds.add(tx.receiver_id);
      if (tx.admin_id) adminIds.add(tx.admin_id);
    });

    const nameMap: Record<string, string> = {};

    if (userIds.size > 0) {
      const { data: users } = await supabaseAdmin
        .from("user_profiles")
        .select("id, nickname, name")
        .in("id", Array.from(userIds));
      users?.forEach((u: any) => {
        nameMap[u.id] = u.nickname || u.name || "유저";
      });
    }

    if (profileIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("chat_profiles")
        .select("id, name")
        .in("id", Array.from(profileIds));
      profiles?.forEach((p: any) => {
        nameMap[p.id] = p.name || "프로필";
      });
    }

    if (adminIds.size > 0) {
      const { data: admins } = await supabaseAdmin
        .from("admins")
        .select("id, username, name")
        .in("id", Array.from(adminIds));
      admins?.forEach((a: any) => {
        nameMap[a.id] = a.name || a.username || "관리자";
      });
    }

    const enrichedData = transactions.map((tx: any) => ({
      ...tx,
      sender_name:
        nameMap[tx.sender_id] || (tx.sender_type === "admin" ? "관리자" : null),
      receiver_name:
        nameMap[tx.receiver_id] ||
        (tx.receiver_type === "admin" ? "관리자" : null),
      admin_name: tx.admin_id ? nameMap[tx.admin_id] || "관리자" : null,
    }));

    setDbGiftHistory(enrichedData);
    setIsGiftHistoryLoading(false);
  }, [user?.id]);

  // 기프트 내역 초기 로드
  useEffect(() => {
    if (activeTab !== "gifts" || !user?.id) return;
    fetchGiftHistory();
  }, [activeTab, user?.id, fetchGiftHistory]);

  // 기프트 내역 실시간 업데이트 (Realtime subscription)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseAdmin
      .channel(`gift_history_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gift_transactions",
        },
        () => {
          debounce(() => fetchGiftHistory(), 500);
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [user?.id, fetchGiftHistory, debounce]);

  const giftHistoryRows = useMemo(() => {
    if (!user?.id) return [];

    return dbGiftHistory.map((item) => {
      const isSender = item.sender_id === user.id;
      const txType = item.transaction_type || (isSender ? "send" : "receive");
      let txDescription = "";

      if (txType === "admin_grant") {
        txDescription = `${item.admin_name || "관리자"} 지급`;
      } else if (txType === "admin_revoke") {
        txDescription = `${item.admin_name || "관리자"} 회수`;
      } else if (txType === "buy") {
        txDescription = "구매";
      } else if (txType === "sell") {
        txDescription = "판매";
      } else if (isSender) {
        txDescription = `${item.receiver_name || "상대방"}에게 보냄`;
      } else {
        txDescription = `${item.sender_name || "상대방"}에게서 받음`;
      }

      const amount = Math.abs(Number(item.points_amount || 0));
      const signedAmount =
        txType === "admin_grant" ||
        txType === "sell" ||
        (!isSender && txType !== "buy" && txType !== "admin_revoke")
          ? amount
          : -amount;

      return {
        id: item.id,
        createdAt: item.created_at,
        giftName: item.gifts?.name || "선물",
        giftEmoji: item.gifts?.emoji || "🎁",
        quantity: item.quantity || 1,
        description: txDescription,
        pointsAmount: signedAmount,
      };
    });
  }, [dbGiftHistory, user?.id]);

  const filteredBetHistory = useMemo(() => {
    return dbBetHistory
      .filter((bet) => {
        if (minigameFilter === "ladder")
          return bet.game_rounds?.game_type === "ladder";
        if (minigameFilter === "powerball")
          return bet.game_rounds?.game_type === "powerball";
        return true;
      })
      .filter((bet) => {
        if (!betStartDate && !betEndDate) return true;
        // KST 기준으로 날짜 비교 (UTC -> KST 변환)
        const betDateKST = bet.created_at
          ? formatKST(bet.created_at, "date")
          : "";
        if (betStartDate && betDateKST < betStartDate) return false;
        if (betEndDate && betDateKST > betEndDate) return false;
        return true;
      });
  }, [dbBetHistory, minigameFilter, betStartDate, betEndDate]);

  const betTotalPages = Math.ceil(
    filteredBetHistory.length / BET_HISTORY_PAGE_SIZE,
  );
  const betStartIndex = (betHistoryPage - 1) * BET_HISTORY_PAGE_SIZE;
  const betEndIndex = betStartIndex + BET_HISTORY_PAGE_SIZE;
  const paginatedBetHistory = filteredBetHistory.slice(
    betStartIndex,
    betEndIndex,
  );

  useEffect(() => {
    setBetHistoryPage(1);
  }, [minigameFilter, betStartDate, betEndDate]);

  useEffect(() => {
    if (betTotalPages === 0) {
      if (betHistoryPage !== 1) setBetHistoryPage(1);
      return;
    }
    if (betHistoryPage > betTotalPages) {
      setBetHistoryPage(betTotalPages);
    }
  }, [betHistoryPage, betTotalPages]);

  const chatRoomsTotalPages = Math.ceil(
    chatRooms.length / CHAT_HISTORY_PAGE_SIZE,
  );
  const chatRoomsStartIndex = (chatHistoryPage - 1) * CHAT_HISTORY_PAGE_SIZE;
  const chatRoomsEndIndex = chatRoomsStartIndex + CHAT_HISTORY_PAGE_SIZE;
  const paginatedChatRooms = chatRooms.slice(
    chatRoomsStartIndex,
    chatRoomsEndIndex,
  );

  useEffect(() => {
    if (activeTab === "chats") {
      setChatHistoryPage(1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (chatRoomsTotalPages === 0) {
      if (chatHistoryPage !== 1) setChatHistoryPage(1);
      return;
    }
    if (chatHistoryPage > chatRoomsTotalPages) {
      setChatHistoryPage(chatRoomsTotalPages);
    }
  }, [chatHistoryPage, chatRoomsTotalPages]);

  // 배팅 내역 fetch 함수 (useCallback으로 분리하여 재사용)
  const fetchBetHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsBetHistoryLoading(true);
    const { data, error } = await supabaseAdmin
      .from("game_bets")
      .select(
        "id, created_at, bet_type, bet_value, bet_amount, odds, status, win_amount, ip_address, game_rounds(game_type, round_number)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("배팅 내역 fetch 오류:", error.message);
    } else {
      setDbBetHistory((data as any) || []);
    }
    setIsBetHistoryLoading(false);
  }, [user?.id]);

  // 롤링금액 fetch 함수 (useCallback으로 분리하여 재사용)
  // 롤링금액 = 배팅한 총액이므로 모든 상태 포함 (pending, won, lost, settled)
  const fetchSettledBets = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabaseAdmin
      .from("game_bets")
      .select("bet_amount, game_rounds(game_type)")
      .eq("user_id", user.id);
    if (error) {
      console.error("롤링금액 fetch 오류:", error.message);
    } else {
      const transformedBets = (data || []).map((bet: any) => ({
        bet_amount: bet.bet_amount,
        game_type: bet.game_rounds?.game_type || "unknown",
      }));
      setSettledBets(transformedBets);
    }
  }, [user?.id]);

  // 롤링금액 초기 로드 (모달 열릴 때)
  useEffect(() => {
    if (!user?.id) return;
    fetchSettledBets();
  }, [user?.id, fetchSettledBets]);

  // Fetch bet history from Supabase (관리자 클라이언트 사용)
  useEffect(() => {
    if (activeTab !== "minigames" || !user?.id) return;
    fetchBetHistory();
  }, [activeTab, user?.id, fetchBetHistory]);

  // 배팅 내역 실시간 업데이트 (Realtime subscription + 디바운스)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseAdmin
      .channel(`bet_history_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_bets",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // 디바운스로 빈번한 업데이트 방지
          debounce(() => {
            fetchBetHistory();
            fetchSettledBets();
          }, 500);
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [user?.id, fetchBetHistory, fetchSettledBets, debounce]);

  // 채팅방 목록 fetch 함수 (useCallback으로 분리)
  const fetchChatRooms = useCallback(async () => {
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
  }, [user?.id]);

  // 채팅방 목록 초기 로드
  useEffect(() => {
    if (activeTab !== "chats" || !user?.id) return;
    fetchChatRooms();
  }, [activeTab, user?.id, fetchChatRooms]);

  // 채팅 내역 실시간 업데이트 (Realtime subscription)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabaseAdmin
      .channel(`chat_rooms_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          debounce(() => fetchChatRooms(), 500);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          debounce(() => fetchChatRooms(), 500);
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [user?.id, fetchChatRooms, debounce]);

  // 미니게임 채팅 fetch 함수 (useCallback으로 분리)
  const fetchMinigameChats = useCallback(async () => {
    if (!user?.id) return;

    setIsMinigameChatsLoading(true);
    setMinigameChatsError(null);

    const p_from = chatStartDate
      ? new Date(`${chatStartDate}T00:00:00+09:00`).toISOString()
      : undefined;
    const p_to = chatEndDate
      ? new Date(`${chatEndDate}T23:59:59.999+09:00`).toISOString()
      : undefined;

    try {
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
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.details ||
        (typeof err === "string" ? err : "채팅 내역을 불러오지 못했습니다.");
      setMinigameChatsError(msg);
      setLadderGameChats([]);
      setPowerballGameChats([]);
      setIsMinigameChatsLoading(false);
    }
  }, [user?.id, chatStartDate, chatEndDate]);

  // 미니게임 채팅 초기 로드
  useEffect(() => {
    if (activeTab !== "chats" || !user?.id) return;
    fetchMinigameChats();
  }, [activeTab, user?.id, fetchMinigameChats]);

  const openChatRoomPopup = async (roomId: string, partnerName: string) => {
    setChatPopupRoomId(roomId);
    setChatPopupDbPartnerName(partnerName);
    setShowChatPopup(true);
    setIsChatPopupLoading(true);

    const { data, error } = await supabaseAdmin
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

  // 채팅 마지막 메시지 (useMemo로 최적화)
  const ladderLastChat = useMemo(
    () =>
      ladderGameChats.length > 0
        ? ladderGameChats[ladderGameChats.length - 1]
        : null,
    [ladderGameChats],
  );
  const powerballLastChat = useMemo(
    () =>
      powerballGameChats.length > 0
        ? powerballGameChats[powerballGameChats.length - 1]
        : null,
    [powerballGameChats],
  );

  // 미니게임 롤링(턴오버) 통계 계산 (useMemo로 최적화)
  const { totalMinigameRolling, powerballRolling, ladderRolling } =
    useMemo(() => {
      const total = settledBets.reduce((sum, bet) => sum + bet.bet_amount, 0);
      const powerball = settledBets
        .filter((bet) => bet.game_type === "powerball")
        .reduce((sum, bet) => sum + bet.bet_amount, 0);
      const ladder = settledBets
        .filter((bet) => bet.game_type === "ladder")
        .reduce((sum, bet) => sum + bet.bet_amount, 0);
      return {
        totalMinigameRolling: total,
        powerballRolling: powerball,
        ladderRolling: ladder,
      };
    }, [settledBets]);

  // 전체 입금 통계 (useMemo로 최적화)
  const totalDeposit = useMemo(
    () =>
      chargeTransactions.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ),
    [chargeTransactions],
  );

  // 전체 보너스 통계 (useMemo로 최적화)
  const totalBonus = useMemo(() => {
    const bonusFromTransactions = bonusTransactions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    const legacyDepositBonus = approvedDeposits.reduce(
      (sum, item) => sum + Number(item.bonus_amount || 0),
      0,
    );
    const bonusTypeTotal = bonusTransactions
      .filter((t) => t.type === "bonus")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return bonusTypeTotal > 0
      ? bonusFromTransactions
      : legacyDepositBonus + bonusFromTransactions;
  }, [bonusTransactions, approvedDeposits]);

  // 전체 출금 통계 (useMemo로 최적화)
  const totalWithdraw = useMemo(
    () =>
      approvedWithdrawals.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ),
    [approvedWithdrawals],
  );

  // 회원 기여 매출 (useMemo로 최적화)
  const memberRevenue = useMemo(
    () => totalDeposit - totalWithdraw,
    [totalDeposit, totalWithdraw],
  );

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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[80] p-4">
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
                      <td className="px-4 py-3 text-gray-400 w-1/4">이름</td>
                      <td className="px-4 py-3 text-white w-1/4">
                        {editingField === "name" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editFieldValue}
                              onChange={(e) =>
                                setEditFieldValue(e.target.value)
                              }
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full"
                              disabled={isUpdatingField}
                            />
                            <button
                              onClick={() => handleSaveField("name")}
                              disabled={isUpdatingField}
                              className="text-green-400 hover:text-green-300 disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdatingField}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{displayUser.name}</span>
                            {!isReadOnly && (
                              <button
                                onClick={() =>
                                  handleEditField("name", displayUser.name)
                                }
                                className="text-gray-400 hover:text-indigo-400 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                        )}
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
                        {editingField === "phone" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editFieldValue}
                              onChange={(e) =>
                                setEditFieldValue(
                                  formatPhoneNumber(e.target.value),
                                )
                              }
                              placeholder="010-1234-5678"
                              maxLength={13}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full"
                              disabled={isUpdatingField}
                            />
                            <button
                              onClick={() => handleSaveField("phone")}
                              disabled={isUpdatingField}
                              className="text-green-400 hover:text-green-300 disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdatingField}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{displayUser.phone || "-"}</span>
                            {!isReadOnly && (
                              <button
                                onClick={() =>
                                  handleEditField(
                                    "phone",
                                    displayUser.phone || "",
                                  )
                                }
                                className="text-gray-400 hover:text-indigo-400 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                        )}
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
                        {editingField === "bank" ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editFieldValue}
                              onChange={(e) =>
                                setEditFieldValue(e.target.value)
                              }
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full"
                              disabled={isUpdatingField}
                            >
                              <option value="">은행 선택</option>
                              <option value="KB국민은행">KB국민은행</option>
                              <option value="신협은행">신협은행</option>
                              <option value="새마을금고">새마을금고</option>
                              <option value="우리은행">우리은행</option>
                              <option value="SC제일은행">SC제일은행</option>
                              <option value="하나은행">하나은행</option>
                              <option value="신한은행">신한은행</option>
                              <option value="케이뱅크">케이뱅크</option>
                              <option value="카카오뱅크">카카오뱅크</option>
                              <option value="토스뱅크">토스뱅크</option>
                              <option value="기업은행">기업은행</option>
                              <option value="수협은행">수협은행</option>
                              <option value="NH농협은행">NH농협은행</option>
                              <option value="부산은행">부산은행</option>
                              <option value="경남은행">경남은행</option>
                              <option value="광주은행">광주은행</option>
                              <option value="대구은행">대구은행</option>
                              <option value="전북은행">전북은행</option>
                              <option value="제주은행">제주은행</option>
                            </select>
                            <button
                              onClick={() => handleSaveField("bank")}
                              disabled={isUpdatingField}
                              className="text-green-400 hover:text-green-300 disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdatingField}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{displayUser.bank || "-"}</span>
                            {!isReadOnly && (
                              <button
                                onClick={() =>
                                  handleEditField(
                                    "bank",
                                    displayUser.bank || "",
                                  )
                                }
                                className="text-gray-400 hover:text-indigo-400 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">계좌번호</td>
                      <td className="px-4 py-3 text-white">
                        {editingField === "accountNumber" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editFieldValue}
                              onChange={(e) =>
                                setEditFieldValue(e.target.value)
                              }
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full"
                              disabled={isUpdatingField}
                            />
                            <button
                              onClick={() => handleSaveField("accountNumber")}
                              disabled={isUpdatingField}
                              className="text-green-400 hover:text-green-300 disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdatingField}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{displayUser.accountNumber || "-"}</span>
                            {!isReadOnly && (
                              <button
                                onClick={() =>
                                  handleEditField(
                                    "accountNumber",
                                    displayUser.accountNumber || "",
                                  )
                                }
                                className="text-gray-400 hover:text-indigo-400 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-400">예금주</td>
                      <td className="px-4 py-3 text-white">
                        {editingField === "accountHolder" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editFieldValue}
                              onChange={(e) =>
                                setEditFieldValue(e.target.value)
                              }
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full"
                              disabled={isUpdatingField}
                            />
                            <button
                              onClick={() => handleSaveField("accountHolder")}
                              disabled={isUpdatingField}
                              className="text-green-400 hover:text-green-300 disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdatingField}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{displayUser.accountHolder || "-"}</span>
                            {!isReadOnly && (
                              <button
                                onClick={() =>
                                  handleEditField(
                                    "accountHolder",
                                    displayUser.accountHolder || "",
                                  )
                                }
                                className="text-gray-400 hover:text-indigo-400 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                        )}
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
                                onClick={async () => {
                                  // For unsuspend action, fetch the suspension reason first
                                  if (displayUser.status !== "활성") {
                                    try {
                                      const { supabaseAdmin } = await import(
                                        "@/lib/supabase/client"
                                      );
                                      const { data } = await supabaseAdmin
                                        .from("admin_action_logs")
                                        .select("changes")
                                        .eq("action", "suspend_user")
                                        .eq("target_id", user.id)
                                        .order("created_at", {
                                          ascending: false,
                                        })
                                        .limit(1)
                                        .single();
                                      if (
                                        data?.changes &&
                                        typeof data.changes === "object"
                                      ) {
                                        const changes = data.changes as Record<
                                          string,
                                          unknown
                                        >;
                                        if (
                                          typeof changes.reason === "string" &&
                                          changes.reason
                                        ) {
                                          setFetchedSuspendReason(
                                            changes.reason,
                                          );
                                        } else {
                                          setFetchedSuspendReason(null);
                                        }
                                      } else {
                                        setFetchedSuspendReason(null);
                                      }
                                    } catch {
                                      setFetchedSuspendReason(null);
                                    }
                                  } else {
                                    setFetchedSuspendReason(null);
                                  }
                                  setShowSuspendConfirm(true);
                                }}
                                className={`px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-white ${
                                  displayUser.status === "활성"
                                    ? "bg-red-500/80 hover:bg-red-500"
                                    : "bg-green-500/80 hover:bg-green-500"
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
                                <h3 className="text-white">
                                  비밀번호 변경 (6자리 이상)
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
                            onChange={(e) => {
                              setPointFilter(
                                e.target.value as
                                  | "all"
                                  | "deposit"
                                  | "withdraw"
                                  | "etc",
                              );
                              setPointHistoryPage(1);
                            }}
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
                              setPointHistoryPage(1);
                            }}
                            onEndDateChange={(val) => {
                              setPointEndDate(val);
                              setIsPointDateRangeValid(true);
                              setPointHistoryPage(1);
                            }}
                          />
                          {(pointStartDate || pointEndDate) && (
                            <button
                              onClick={() => {
                                setPointStartDate("");
                                setPointEndDate("");
                                setIsPointDateRangeValid(true);
                                setPointHistoryPage(1);
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
                      (() => {
                        // 필터링된 데이터
                        const filteredPointHistory = dbPointHistory
                          .filter((item) => {
                            if (pointFilter === "deposit")
                              return item.type === "charge";
                            if (pointFilter === "withdraw")
                              return item.type === "withdraw";
                            if (pointFilter === "etc")
                              return !["charge", "withdraw"].includes(
                                item.type,
                              );
                            return true;
                          })
                          .filter((item) => {
                            if (!pointStartDate && !pointEndDate) return true;
                            // KST 기준으로 날짜 비교 (UTC -> KST 변환)
                            const itemDateKST = item.created_at
                              ? formatKST(item.created_at, "date")
                              : "";
                            if (pointStartDate && itemDateKST < pointStartDate)
                              return false;
                            if (pointEndDate && itemDateKST > pointEndDate)
                              return false;
                            return true;
                          });

                        // 페이지네이션 계산
                        const totalItems = filteredPointHistory.length;
                        const totalPages = Math.ceil(
                          totalItems / POINT_HISTORY_PAGE_SIZE,
                        );
                        const startIndex =
                          (pointHistoryPage - 1) * POINT_HISTORY_PAGE_SIZE;
                        const endIndex = startIndex + POINT_HISTORY_PAGE_SIZE;
                        const paginatedData = filteredPointHistory.slice(
                          startIndex,
                          endIndex,
                        );

                        return (
                          <>
                            {paginatedData.map((item) => (
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
                                          : item.type === "lose"
                                            ? "미당첨"
                                            : item.type === "gift_buy"
                                              ? "기프트 구매"
                                              : item.type === "gift_sell"
                                                ? "기프트 판매"
                                                : item.type === "chat_start"
                                                  ? "채팅 시작"
                                                  : item.type === "admin_adjust"
                                                    ? "관리자 조정"
                                                    : item.type === "bonus"
                                                      ? "보너스"
                                                      : item.type}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-sm w-1/4">
                                  {(item.description || "-")
                                    .replace(/\bladder\b/gi, "사다리")
                                    .replace(/\bpowerball\b/gi, "파워볼")}
                                </td>
                              </tr>
                            ))}
                            {/* 페이지네이션 */}
                            {totalPages > 1 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-3 bg-gray-900/50"
                                >
                                  <div className="flex flex-col gap-2">
                                    <span className="text-gray-400 text-sm text-center">
                                      총 {totalItems.toLocaleString()}건 중{" "}
                                      {startIndex + 1}-
                                      {Math.min(endIndex, totalItems)}건
                                    </span>
                                    <AdminPagination
                                      currentPage={pointHistoryPage}
                                      totalPages={totalPages}
                                      onPageChange={setPointHistoryPage}
                                    />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()
                    )}
                  </>
                )}

                {activeTab === "gifts" && (
                  <>
                    <tr>
                      <td colSpan={4} className="px-4 py-4 bg-gray-900">
                        <GiftInventoryManager
                          ownerId={user?.id}
                          ownerType="user"
                          enabled={activeTab === "gifts"}
                          isReadOnly={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-4 py-4 bg-gray-800">
                        <GiftHistoryTable
                          title="기프트 내역"
                          rows={giftHistoryRows}
                          isLoading={isGiftHistoryLoading}
                          emptyMessage="선물 내역이 없습니다."
                        />
                      </td>
                    </tr>
                  </>
                )}

                {activeTab === "chats" && (
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
                      paginatedChatRooms.map((room) => {
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
                    {chatRoomsTotalPages > 1 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 bg-gray-900/50">
                          <AdminPagination
                            currentPage={chatHistoryPage}
                            totalPages={chatRoomsTotalPages}
                            onPageChange={setChatHistoryPage}
                          />
                        </td>
                      </tr>
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
                            {String(ladderLastChat?.message ?? "")}
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
                            {String(powerballLastChat?.message ?? "")}
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
                    ) : filteredBetHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          배팅 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      paginatedBetHistory.map((bet) => {
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
                                {translateBetValue(
                                  bet.bet_value,
                                  bet.game_rounds?.game_type || "",
                                )}
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
                              {bet.ip_address || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    {betTotalPages > 1 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-gray-900/50">
                          <AdminPagination
                            currentPage={betHistoryPage}
                            totalPages={betTotalPages}
                            onPageChange={setBetHistoryPage}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
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

            // KST 기준으로 날짜 비교 (UTC -> KST 변환)
            const msgDateKST = formatKST(msg.created_at, "date");

            if (chatStartDate && chatEndDate) {
              return msgDateKST >= chatStartDate && msgDateKST <= chatEndDate;
            } else if (chatStartDate) {
              return msgDateKST >= chatStartDate;
            } else if (chatEndDate) {
              return msgDateKST <= chatEndDate;
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
                        const rawBody = msg.content || msg.message;
                        // 선물 메시지인 경우 🎁 아이콘 사용하여 표시 (채팅목록과 일치)
                        const body = isGift
                          ? `🎁 ${rawBody}을 ${msg.gift_quantity || 1}개 보냈습니다`
                          : rawBody;
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

            // KST 기준으로 날짜 비교 (UTC -> KST 변환)
            const msgDateKST = formatKST(msg.created_at, "date");

            if (chatStartDate && chatEndDate) {
              return msgDateKST >= chatStartDate && msgDateKST <= chatEndDate;
            } else if (chatStartDate) {
              return msgDateKST >= chatStartDate;
            } else if (chatEndDate) {
              return msgDateKST <= chatEndDate;
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
                const rawMessage = msg.message;
                const body = (
                  typeof rawMessage === "object" && rawMessage !== null
                    ? (rawMessage as any).text ||
                      (rawMessage as any).content ||
                      JSON.stringify(rawMessage)
                    : String(rawMessage || "")
                ).trim();
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
                        // msg.message가 object인 경우 처리
                        const rawMessage = msg.message;
                        const body = (
                          typeof rawMessage === "object" && rawMessage !== null
                            ? (rawMessage as any).text ||
                              (rawMessage as any).content ||
                              JSON.stringify(rawMessage)
                            : String(rawMessage || "")
                        ).trim();

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
                  disabled={isReferralCodeUpdating}
                  onClick={() => {
                    if (isReadOnly) return;
                    if (isReferralCodeUpdating) return;
                    if (!isAdmin || !adminAccount?.id) {
                      showAlert({
                        title: "권한 오류",
                        message: "관리자 권한이 필요합니다.",
                        type: "warning",
                      });
                      return;
                    }

                    void (async () => {
                      setIsReferralCodeUpdating(true);
                      try {
                        const normalized = referralCodeInput.trim();
                        let agentId: string | null = null;

                        if (normalized) {
                          const { data: agentRow, error: agentError } =
                            await supabaseAdmin
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

                        const { data: currentProfile, error: currentError } =
                          await supabaseAdmin
                            .from("user_profiles")
                            .select("agent_id, agent_assigned_at")
                            .eq("id", user.id)
                            .maybeSingle();

                        if (currentError) throw currentError;

                        const previousAgentId =
                          currentProfile?.agent_id || null;
                        const previousAssignedAt =
                          currentProfile?.agent_assigned_at || null;
                        const nextAssignedAt = agentId
                          ? new Date().toISOString()
                          : null;

                        const updatePayload: {
                          agent_id: string | null;
                          agent_assigned_at: string | null;
                        } = {
                          agent_id: agentId,
                          agent_assigned_at: nextAssignedAt,
                        };

                        const { error: updateError } = await supabaseAdmin
                          .from("user_profiles")
                          .update(updatePayload)
                          .eq("id", user.id);

                        if (updateError) throw updateError;

                        if (previousAgentId !== agentId) {
                          await supabaseAdmin.from("admin_action_logs").insert({
                            action: "change_user_referral_code",
                            admin_id: adminAccount.id,
                            target_id: user.id,
                            target_type: "user_profiles",
                            changes: {
                              userId: user.id,
                              fromAgentId: previousAgentId,
                              toAgentId: agentId,
                              fromAssignedAt: previousAssignedAt,
                              toAssignedAt: nextAssignedAt,
                            },
                          });
                        }

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
                      } finally {
                        setIsReferralCodeUpdating(false);
                      }
                    })();
                  }}
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  {isReferralCodeUpdating ? "처리중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 정지/정지 해제 확인 팝업 */}
      <SuspendConfirmModal
        isOpen={showSuspendConfirm}
        title={isSuspending ? "회원 정지" : "정지 해제"}
        message={
          <p className="text-gray-300">
            {isSuspending
              ? `${user.name} 회원을 정지하시겠습니까?`
              : `${user.name} 회원의 정지를 해제하시겠습니까?`}
          </p>
        }
        isSuspending={isSuspending}
        reason={!isSuspending ? fetchedSuspendReason : null}
        reasonInputValue={suspendReason}
        onReasonInputChange={setSuspendReason}
        onReasonInputKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void handleSuspendConfirm();
          }
        }}
        confirmLabel="확인"
        confirmClassName={
          isSuspending
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }
        zIndexClassName="z-[60]"
        onCancel={() => {
          setShowSuspendConfirm(false);
          setSuspendReason("");
        }}
        onConfirm={() => {
          void handleSuspendConfirm();
        }}
      />

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
