import { AdminLayout } from "../components/AdminLayout";
import { UserDetailModal } from "../components/UserDetailModal";
import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  DollarSign,
  Gift,
  MessageCircle,
  Clock,
  X,
  Calendar,
  Key
} from "lucide-react";

export function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // 가입 신청 데이터
  const pendingApprovals = [
    {
      id: 101,
      name: "정수빈",
      nickname: "수빈이",
      email: "subin@example.com",
      phone: "010-1234-5678",
      joined: "2025-12-15 14:30",
      joinIp: "192.168.1.200",
      bank: "국민은행",
      accountNumber: "123456789012",
      accountHolder: "정수빈",
      referralCode: "AGENT_KIM2024",
    },
    {
      id: 102,
      name: "최하늘",
      nickname: "하늘하늘",
      email: "haneul@example.com",
      phone: "010-2345-6789",
      joined: "2025-12-15 13:15",
      joinIp: "192.168.1.201",
      bank: "신한은행",
      accountNumber: "987654321098",
      accountHolder: "최하늘",
      referralCode: "",
    },
    {
      id: 103,
      name: "강예은",
      nickname: "예은쓰",
      email: "yeeun@example.com",
      phone: "010-3456-7890",
      joined: "2025-12-15 12:00",
      joinIp: "192.168.1.202",
      bank: "우리은행",
      accountNumber: "456789123456",
      accountHolder: "강예은",
      referralCode: "AGENT_PARK2024",
    },
  ];

  // 승인/거절 로그
  const approvalLogs = [
    {
      id: 201,
      name: "김지우",
      nickname: "지우",
      email: "jiwoo@example.com",
      phone: "010-1111-2222",
      action: "승인",
      actionDate: "2025-12-15 11:00",
      actionBy: "관리자",
      joinIp: "192.168.1.180",
      bank: "하나은행",
      accountNumber: "111122223333",
      accountHolder: "김지우",
      referralCode: "AGENT_KIM2024",
    },
    {
      id: 202,
      name: "박서준",
      nickname: "서준이",
      email: "seojun@example.com",
      phone: "010-3333-4444",
      action: "거절",
      actionDate: "2025-12-15 10:30",
      actionBy: "관리자",
      joinIp: "192.168.1.181",
      bank: "농협은행",
      accountNumber: "444455556666",
      accountHolder: "박서준",
      referralCode: "",
    },
    {
      id: 203,
      name: "이하윤",
      nickname: "하윤",
      email: "hayoon@example.com",
      phone: "010-5555-6666",
      action: "승인",
      actionDate: "2025-12-15 09:45",
      actionBy: "관리자",
      joinIp: "192.168.1.182",
      bank: "기업은행",
      accountNumber: "777788889999",
      accountHolder: "이하윤",
    },
    {
      id: 204,
      name: "장민호",
      nickname: "민호123",
      email: "minho@example.com",
      phone: "010-7777-8888",
      action: "거절",
      actionDate: "2025-12-14 18:20",
      actionBy: "관리자",
      joinIp: "192.168.1.183",
      bank: "국민은행",
      accountNumber: "000011112222",
      accountHolder: "장민호",
    },
  ];

  const users = [
    {
      id: 1,
      name: "소희",
      nickname: "소희님",
      email: "sohee@example.com",
      phone: "010-1234-5678",
      joined: "2025-12-10 14:23",
      lastLogin: "2025-12-15 11:30",
      joinIp: "192.168.1.100",
      lastIp: "192.168.1.100",
      status: "활성",
      points: 5000,
      online: true,
      bank: "국민은행",
      accountNumber: "123456789012",
      accountHolder: "소희",
      revenue: 45000,
      referralCode: "AGENT_KIM2024",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    },
    {
      id: 2,
      name: "유진",
      nickname: "유진이",
      email: "yujin@example.com",
      phone: "010-2345-6789",
      joined: "2025-12-09 09:15",
      lastLogin: "2025-12-15 10:45",
      joinIp: "192.168.1.101",
      lastIp: "192.168.1.105",
      status: "활성",
      points: 12000,
      online: true,
      bank: "신한은행",
      accountNumber: "987654321098",
      accountHolder: "유진",
      revenue: 128000,
      referralCode: "AGENT_KIM2024",
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    },
    {
      id: 3,
      name: "민지",
      nickname: "민지쓰",
      email: "minji@example.com",
      phone: "010-3456-7890",
      joined: "2025-12-08 16:30",
      lastLogin: "2025-12-14 22:10",
      joinIp: "192.168.1.102",
      lastIp: "192.168.1.102",
      status: "활성",
      points: 7500,
      online: false,
      bank: "우리은행",
      accountNumber: "456789123456",
      accountHolder: "민지",
      revenue: 67500,
    },
    {
      id: 4,
      name: "김민수",
      nickname: "민수123",
      email: "minsu@example.com",
      phone: "010-4567-8901",
      joined: "2025-12-15 08:00",
      lastLogin: "2025-12-15 12:00",
      joinIp: "192.168.1.103",
      lastIp: "192.168.1.110",
      status: "활성",
      points: 25000,
      online: true,
      bank: "하나은행",
      accountNumber: "111222333444",
      accountHolder: "김민수",
      revenue: 230000,
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    },
    {
      id: 6,
      name: "박지훈",
      nickname: "지훈이",
      email: "jihun@example.com",
      phone: "010-6789-0123",
      joined: "2025-12-13 13:45",
      lastLogin: "2025-12-14 18:30",
      joinIp: "192.168.1.105",
      lastIp: "192.168.1.112",
      status: "정지",
      points: 3000,
      online: false,
      bank: "기업은행",
      accountNumber: "999888777666",
      accountHolder: "박지훈",
      revenue: 12000,
    },
    // 에이전트 페이지 회원들
    {
      id: 7,
      name: "김철수",
      nickname: "철수맨",
      email: "kim@example.com",
      phone: "010-1234-5678",
      joined: "2024-03-15 09:30",
      lastLogin: "2024-12-17 14:25",
      joinIp: "192.168.1.100",
      lastIp: "192.168.1.105",
      status: "활성",
      points: 15000,
      online: true,
      bank: "국민은행",
      accountNumber: "123456789012",
      accountHolder: "김철수",
      revenue: 150000,
      referralCode: "AGENT_KIM2024",
    },
    {
      id: 8,
      name: "이영희",
      nickname: "영희쓰",
      email: "lee@example.com",
      phone: "010-2345-6789",
      joined: "2024-03-20 11:00",
      lastLogin: "2024-12-17 13:10",
      joinIp: "192.168.1.101",
      lastIp: "192.168.1.101",
      status: "활성",
      points: 23000,
      online: true,
      bank: "신한은행",
      accountNumber: "987654321098",
      accountHolder: "이영희",
      revenue: 23000,
      referralCode: "AGENT_KIM2024",
    },
    {
      id: 9,
      name: "박민수",
      nickname: "민수123",
      email: "park@example.com",
      phone: "010-3456-7890",
      joined: "2024-04-01 15:30",
      lastLogin: "2024-12-15 18:30",
      joinIp: "192.168.1.102",
      lastIp: "192.168.1.110",
      status: "정지",
      points: 8000,
      online: false,
      bank: "우리은행",
      accountNumber: "456789123456",
      accountHolder: "박민수",
      revenue: -50000,
      referralCode: "AGENT_KIM2024",
    },
    {
      id: 10,
      name: "최지영",
      nickname: "지영언니",
      email: "choi@example.com",
      phone: "010-4567-8901",
      joined: "2024-05-10 10:15",
      lastLogin: "2024-12-16 16:45",
      joinIp: "192.168.1.103",
      lastIp: "192.168.1.103",
      status: "활성",
      points: 5000,
      online: false,
      bank: "하나은행",
      accountNumber: "111222333444",
      accountHolder: "최지영",
      revenue: -30000,
      referralCode: "AGENT_PARK2024",
    },
    {
      id: 11,
      name: "정대호",
      nickname: "대호킹",
      email: "jung@example.com",
      phone: "010-5678-9012",
      joined: "2024-06-05 14:20",
      lastLogin: "2024-12-17 09:10",
      joinIp: "192.168.1.104",
      lastIp: "192.168.1.104",
      status: "정지",
      points: 2000,
      online: false,
      bank: "기업은행",
      accountNumber: "555666777888",
      accountHolder: "정대호",
      revenue: -25000,
      referralCode: "AGENT_PARK2024",
    },
  ];

  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedBetDate, setSelectedBetDate] = useState("");
  const [selectedPointDate, setSelectedPointDate] = useState("");
  const [selectedGiftDate, setSelectedGiftDate] = useState("");
  const [selectedChatDate, setSelectedChatDate] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  
  // 프로필 이미지 팝업 state
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string>("");
  const [selectedProfileName, setSelectedProfileName] = useState<string>("");
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [pointAdjustType, setPointAdjustType] = useState<"add" | "subtract">("add");
  const [pointAdjustAmount, setPointAdjustAmount] = useState("");
  const [quickPointUserId, setQuickPointUserId] = useState<number | null>(null);
  const [quickPointType, setQuickPointType] = useState<"add" | "subtract">("add");
  const [quickPointAmount, setQuickPointAmount] = useState("");
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeUser, setStatusChangeUser] = useState<typeof users[0] | null>(null);
  const [statusChangeAction, setStatusChangeAction] = useState<"ban" | "unban">("ban");
  const [isEditingReferralCode, setIsEditingReferralCode] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  
  // 회원 가입 승인/거절 팝업 상태
  const [showApprovalConfirmModal, setShowApprovalConfirmModal] = useState(false);
  const [approvalConfirmAction, setApprovalConfirmAction] = useState<{
    action: "approve" | "reject";
    applicant: typeof pendingApprovals[0];
  } | null>(null);

  // 채팅 메시지 샘플 데이터
  const chatMessages: Record<string, Array<{time: string, sender: string, message: string, type?: string}>> = {
    "유진": [
      { time: "2025-12-10 09:00", sender: "유진", message: "안녕하세요" },
      { time: "2025-12-10 09:02", sender: "소희", message: "네 안녕하세요!" },
      { time: "2025-12-10 09:05", sender: "유진", message: "프로필 보고 연락드렸어요" },
      { time: "2025-12-10 09:07", sender: "소희", message: "감사합니다 ^^" },
      { time: "2025-12-10 09:10", sender: "유진", message: "취미가 어떻게 되세요?" },
      { time: "2025-12-10 09:12", sender: "소희", message: "영화 보는 거 좋아해요" },
      { time: "2025-12-11 14:30", sender: "유진", message: "어제는 즐거웠어요" },
      { time: "2025-12-11 14:32", sender: "소희", message: "저도요! 다음에 또 만나요" },
      { time: "2025-12-11 14:35", sender: "유진", message: "장미 꽃다발을 보냈습니다", type: "gift" },
      { time: "2025-12-11 14:40", sender: "소희", message: "와 감사합니다!" },
      { time: "2025-12-11 14:42", sender: "유진", message: "[이미지]", type: "image", imageUrl: "https://images.unsplash.com/photo-1639056610940-d7e9b0af3a99?w=1080" },
      { time: "2025-12-11 14:45", sender: "소희", message: "와 진짜 이쁘네요!" },
      { time: "2025-12-12 10:15", sender: "소희", message: "오늘 날씨 좋네요" },
      { time: "2025-12-12 10:20", sender: "유진", message: "그러게요. 산책하기 딱 좋은 날씨예요" },
      { time: "2025-12-12 10:25", sender: "소희", message: "초콜릿 박스를 보냈습니다", type: "gift" },
      { time: "2025-12-12 10:30", sender: "유진", message: "우와 제가 좋아하는 건데" },
      { time: "2025-12-12 10:35", sender: "유진", message: "정말 감사합니다 ㅎㅎ" },
      { time: "2025-12-13 18:00", sender: "유진", message: "저녁 드셨어요?" },
      { time: "2025-12-13 18:05", sender: "소희", message: "아직이요. 뭐 먹을까 고민 중이에요" },
      { time: "2025-12-13 18:10", sender: "유진", message: "같이 저녁 어때요?" },
      { time: "2025-12-13 18:15", sender: "소희", message: "좋아요! 어디서 만날까요?" },
      { time: "2025-12-13 18:20", sender: "유진", message: "강남역 근처 어떠세요?" },
      { time: "2025-12-13 18:25", sender: "소희", message: "좋아요 7시에 봐요!" },
      { time: "2025-12-14 21:30", sender: "유진", message: "오늘도 즐거웠습니다" },
      { time: "2025-12-14 21:35", sender: "소희", message: "저도요! 맛있는 거 많이 먹었어요" },
      { time: "2025-12-14 21:40", sender: "유진", message: "다음에는 영화 보러 갈까요?" },
      { time: "2025-12-14 21:45", sender: "소희", message: "좋아요! 보고 싶은 영화가 있어요" },
      { time: "2025-12-15 11:00", sender: "유진", message: "좋은 아침이에요" },
      { time: "2025-12-15 11:05", sender: "소희", message: "좋은 아침입니다!" },
      { time: "2025-12-15 11:10", sender: "유진", message: "프로필 사진 정말 예쁘네요" },
      { time: "2025-12-15 11:12", sender: "소희", message: "하트 쿠션을 보냈습니다", type: "gift" },
      { time: "2025-12-15 11:15", sender: "유진", message: "와 정말 감사합니다" },
      { time: "2025-12-15 11:20", sender: "유진", message: "커피 한잔 어떠세요?" },
      { time: "2025-12-15 11:25", sender: "소희", message: "좋아요! 언제가 좋으세요?" },
      { time: "2025-12-15 11:30", sender: "유진", message: "이번 주말은 어떠세요?" },
      { time: "2025-12-15 11:35", sender: "소희", message: "토요일 오후 2시 괜찮을까요?" },
      { time: "2025-12-15 11:40", sender: "유진", message: "완벽해요! 그럼 토요일에 봐요" },
      { time: "2025-12-15 11:45", sender: "소희", message: "네 기대할게요!" },
      { time: "2025-12-16 13:05", sender: "유진", message: "주말 약속 기대돼요" },
      { time: "2025-12-16 13:10", sender: "소희", message: "저도요! 어떤 카페 갈까요?" },
      { time: "2025-12-16 13:15", sender: "유진", message: "분위기 좋은 곳 찾아볼게요" },
      { time: "2025-12-16 13:20", sender: "소희", message: "좋아요! 연락 주세요" },
    ],
    "민지": [
      { time: "2025-12-08 15:00", sender: "민지", message: "안녕하세요!" },
      { time: "2025-12-08 15:05", sender: "소희", message: "안녕하세요 ^^" },
      { time: "2025-12-08 15:10", sender: "민지", message: "프로필이 인상적이네요" },
      { time: "2025-12-08 15:15", sender: "소희", message: "감사합니다" },
      { time: "2025-12-09 10:05", sender: "민지", message: "주말에 뭐 하세요?" },
      { time: "2025-12-09 10:10", sender: "소희", message: "특별한 계획은 없어요" },
      { time: "2025-12-09 10:15", sender: "민지", message: "같이 전시회 갈래요?" },
      { time: "2025-12-09 10:20", sender: "소희", message: "좋아요! 어떤 전시회인가요?" },
      { time: "2025-12-09 10:25", sender: "민지", message: "현대미술 전시회예요" },
      { time: "2025-12-10 16:00", sender: "민지", message: "오늘 전시회 정말 좋았어요" },
      { time: "2025-12-10 16:03", sender: "민지", message: "[이미지]", type: "image", imageUrl: "https://images.unsplash.com/photo-1647792845543-a8032c59cbdf?w=1080" },
      { time: "2025-12-10 16:05", sender: "소희", message: "저도 즐거웠어요!" },
      { time: "2025-12-10 16:10", sender: "소희", message: "장미 꽃다발을 보냈습니다", type: "gift" },
      { time: "2025-12-10 16:15", sender: "민지", message: "와 감사합니다!" },
      { time: "2025-12-11 20:00", sender: "민지", message: "저녁 드셨나요?" },
      { time: "2025-12-11 20:05", sender: "소희", message: "네 방금 먹었어요" },
      { time: "2025-12-11 20:10", sender: "민지", message: "뭐 드셨어요?" },
      { time: "2025-12-11 20:15", sender: "소희", message: "파스타 먹었어요" },
      { time: "2025-12-12 11:30", sender: "민지", message: "주말 약속 어때요?" },
      { time: "2025-12-12 11:35", sender: "소희", message: "좋아요! 어디로 갈까요?" },
      { time: "2025-12-12 11:40", sender: "민지", message: "한강 공원 산책 어때요?" },
      { time: "2025-12-12 11:45", sender: "소희", message: "완벽해요!" },
      { time: "2025-12-13 14:00", sender: "민지", message: "오늘 날씨가 너무 좋네요" },
      { time: "2025-12-13 14:05", sender: "소희", message: "그러게요. 산책하기 딱 좋아요" },
      { time: "2025-12-13 14:08", sender: "소희", message: "[이미지]", type: "image", imageUrl: "https://images.unsplash.com/photo-1542372147193-a7aca54189cd?w=1080" },
      { time: "2025-12-13 14:10", sender: "민지", message: "초콜릿 박스를 보냈습니다", type: "gift" },
      { time: "2025-12-13 14:15", sender: "소희", message: "감사합니다!" },
      { time: "2025-12-14 16:30", sender: "민지", message: "선물 정말 감사해요" },
      { time: "2025-12-14 16:32", sender: "소희", message: "천만에요~" },
      { time: "2025-12-14 16:33", sender: "소희", message: "하트 쿠션을 보냈습니다", type: "gift" },
      { time: "2025-12-14 16:35", sender: "민지", message: "오늘 시간 되세요?" },
      { time: "2025-12-14 16:40", sender: "소희", message: "죄송하지만 오늘은 약속이 있어요" },
      { time: "2025-12-14 16:45", sender: "민지", message: "아 그렇군요. 다음에 또 연락드릴게요" },
      { time: "2025-12-14 16:47", sender: "소희", message: "네 언제든지 연락주세요!" },
      { time: "2025-12-15 09:00", sender: "민지", message: "좋은 아침이에요" },
      { time: "2025-12-15 09:05", sender: "소희", message: "좋은 아침입니다!" },
      { time: "2025-12-15 09:10", sender: "민지", message: "오늘 점심 같이 어때요?" },
      { time: "2025-12-15 09:15", sender: "소희", message: "좋아요! 뭐 먹을까요?" },
      { time: "2025-12-15 09:20", sender: "민지", message: "일식 어때요?" },
      { time: "2025-12-15 09:25", sender: "소희", message: "완벽해요! 12시에 만나요" },
      { time: "2025-12-16 18:00", sender: "민지", message: "오늘도 즐거웠어요" },
      { time: "2025-12-16 18:05", sender: "소희", message: "저도요! 다음에 또 만나요" },
      { time: "2025-12-17 10:00", sender: "민지", message: "이번 주말 계획 있나요?" },
      { time: "2025-12-17 10:05", sender: "소희", message: "아직 없어요. 왜요?" },
      { time: "2025-12-17 10:10", sender: "민지", message: "같이 영화 보러 갈래요?" },
      { time: "2025-12-17 10:15", sender: "소희", message: "좋아요! 어떤 영화 볼까요?" },
      { time: "2025-12-17 10:20", sender: "민지", message: "새로 나온 액션 영화 어때요?" },
      { time: "2025-12-17 10:25", sender: "소희", message: "완벽해요! 일요일에 봐요" },
    ],
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 엔터키로 정지/정지 해제 확인
  useEffect(() => {
    if (!showStatusChangeModal || !statusChangeUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (statusChangeAction === "ban") {
          alert(`${statusChangeUser.name} 회원이 정지되었습니다.`);
          statusChangeUser.status = "정지";
        } else {
          alert(`${statusChangeUser.name} 회원의 정지가 해제되었습니다.`);
          statusChangeUser.status = "활성";
        }
        setShowStatusChangeModal(false);
        setStatusChangeUser(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStatusChangeModal, statusChangeUser, statusChangeAction]);

  // 엔터키로 회원 가입 승인/거절 확인
  useEffect(() => {
    if (!showApprovalConfirmModal || !approvalConfirmAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (approvalConfirmAction.action === "approve") {
          alert(`${approvalConfirmAction.applicant.name} 회원의 가입이 승인되었습니다.`);
        } else {
          alert(`${approvalConfirmAction.applicant.name} 회원의 가입이 거절되었습니다.`);
        }
        setShowApprovalConfirmModal(false);
        setApprovalConfirmAction(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showApprovalConfirmModal, approvalConfirmAction]);

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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">회원 관리</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-300">
                전체 {filteredUsers.length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">
                활성 {users.filter((u) => u.status === "활성").length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-red-400">
                정지 {users.filter((u) => u.status === "정지").length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-blue-400">
                현재접속 {users.filter((u) => u.online).length}명
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowApprovalModal(true)}
            className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
          >
            <UserCheck size={20} />
            회원 승인 대기 ({pendingApprovals.length})
          </button>
        </div>

        {/* Filters */}
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
                placeholder="회원 이름, 닉네임, 이메일, IP로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">전체 상태</option>
                <option value="활성">활성</option>
                <option value="정지">정지</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] admin-users-table">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    회원 정보
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    가입일 / 마지막 로그인
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    가입 IP / 마지막 IP
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    상태
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    포인트
                  </th>
                  <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-2 text-center h-16">
                      <div className="flex items-center justify-center gap-3 h-full">
                        <div className="relative flex-shrink-0">
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProfileImage(user.profileImage || "");
                                setSelectedProfileName(user.name);
                                setShowProfileImageModal(true);
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          {user.online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm leading-tight">{user.nickname} <span className="text-white text-sm">({user.name})</span></p>
                          <p className="text-gray-400 text-xs mt-1">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{user.joined}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{user.lastLogin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{user.joinIp}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{user.lastIp}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="h-full flex items-center justify-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16 text-white text-sm">
                      <div className="h-full flex flex-col items-center justify-center gap-1">
                        <span className="text-indigo-400 font-semibold">{user.points.toLocaleString()} P</span>
                        <button
                          onClick={() => {
                            setQuickPointUserId(user.id);
                            setQuickPointType("add");
                            setQuickPointAmount("");
                          }}
                          className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1"
                          title="포인트 조정"
                        >
                          <DollarSign size={12} />
                          조정
                        </button>
                      </div>
                    </td>
                    <td className="px-2 h-16">
                      <div className="flex items-center justify-center gap-1">
                        {user.status === "활성" ? (
                          <button
                            onClick={() => {
                              setStatusChangeUser(user);
                              setStatusChangeAction("ban");
                              setShowStatusChangeModal(true);
                            }}
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-500"
                            title="정지"
                          >
                            <Ban size={16} />
                          </button>
                        ) : user.status === "정지" ? (
                          <button
                            onClick={() => {
                              setStatusChangeUser(user);
                              setStatusChangeAction("unban");
                              setShowStatusChangeModal(true);
                            }}
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-green-500"
                            title="정지 해제"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : user.status === "대기" ? (
                          <button
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-green-500"
                            title="승인"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                          title="더보기"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          chatMessages={chatMessages}
        />
      )}

      {/* LEGACY Details Modal (REMOVED - Using UserDetailModal instead) */}
      {false && showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                    {selectedUser.name[0]}
                  </div>
                  {selectedUser.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                  )}
                </div>
                <div>
                  <span>{selectedUser.name} 회원 상세정보</span>
                  <p className="text-gray-400 text-sm mt-0.5">{selectedUser.email}</p>
                </div>
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
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
                  선물 내역
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
                          <td className="px-4 py-3 text-white w-1/4">{selectedUser.name}</td>
                          <td className="px-4 py-3 text-gray-400 w-1/4">닉네임</td>
                          <td className="px-4 py-3 text-white w-1/4">{selectedUser.nickname}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-400">이메일</td>
                          <td className="px-4 py-3 text-white">{selectedUser.email}</td>
                          <td className="px-4 py-3 text-gray-400">전화번호</td>
                          <td className="px-4 py-3 text-white">{selectedUser.phone}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-400">상태</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(selectedUser.status)}`}>
                              {selectedUser.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">접속 상태</td>
                          <td className="px-4 py-3">
                            <span className={selectedUser.online ? "text-green-500" : "text-gray-500"}>
                              {selectedUser.online ? "● 온라인" : "○ 오프라인"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-400">보유 포인트</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-indigo-400 font-bold">{selectedUser.points.toLocaleString()} P</span>
                              <button
                                onClick={() => setIsAdjustingPoints(!isAdjustingPoints)}
                                className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-1 rounded text-xs transition-colors whitespace-nowrap"
                              >
                                조정
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400">회원 기여 매출</td>
                          <td className="px-4 py-3 text-yellow-400 font-bold">
                            {((selectedUser.revenue || 0) >= 0 ? '+' : '')}{(selectedUser.revenue || 0).toLocaleString()}원
                          </td>
                        </tr>
                        {isAdjustingPoints && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 bg-gray-800/50">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <DollarSign className="text-indigo-400" size={18} />
                                  <h3 className="text-white">포인트 조정</h3>
                                </div>
                                <div className="flex flex-col gap-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-gray-400 text-sm mb-1">조정 타입</label>
                                      <select
                                        value={pointAdjustType}
                                        onChange={(e) => setPointAdjustType(e.target.value as "add" | "subtract")}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                      >
                                        <option value="add">지급 (+)</option>
                                        <option value="subtract">차감 (-)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-gray-400 text-sm mb-1">포인트 금액</label>
                                      <input
                                        type="number"
                                        value={pointAdjustAmount}
                                        onChange={(e) => setPointAdjustAmount(e.target.value)}
                                        placeholder="금액 입력"
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        if (pointAdjustAmount) {
                                          const amount = parseInt(pointAdjustAmount);
                                          const newPoints = pointAdjustType === "add" 
                                            ? selectedUser.points + amount 
                                            : selectedUser.points - amount;
                                          
                                          if (newPoints < 0) {
                                            alert("포인트는 0보다 작을 수 없습니다");
                                            return;
                                          }
                                          
                                          alert(`${pointAdjustType === "add" ? "+" : "-"}${amount.toLocaleString()}P ${pointAdjustType === "add" ? "지급" : "차감"}되었습니다`);
                                          selectedUser.points = newPoints;
                                          setIsAdjustingPoints(false);
                                          setPointAdjustAmount("");
                                        }
                                      }}
                                      disabled={!pointAdjustAmount || parseInt(pointAdjustAmount) <= 0}
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
                          <td className="px-4 py-3 text-white">{selectedUser.bank}</td>
                          <td className="px-4 py-3 text-gray-400">계좌번호</td>
                          <td className="px-4 py-3 text-white font-mono">{selectedUser.accountNumber}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-400">예금주</td>
                          <td className="px-4 py-3 text-white">{selectedUser.accountHolder}</td>
                          <td className="px-4 py-3 text-gray-400">추천코드</td>
                          <td className="px-4 py-3">
                            {isEditingReferralCode ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={referralCodeInput}
                                  onChange={(e) => setReferralCodeInput(e.target.value)}
                                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                                  placeholder="추천코드 입력"
                                />
                                <button
                                  onClick={() => {
                                    selectedUser.referralCode = referralCodeInput;
                                    setIsEditingReferralCode(false);
                                    alert("추천코드가 수정되었습니다.");
                                  }}
                                  className="bg-green-500/80 hover:bg-green-500 text-white px-2 py-1 rounded text-xs transition-colors"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditingReferralCode(false);
                                    setReferralCodeInput(selectedUser.referralCode || "");
                                  }}
                                  className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-indigo-400 font-mono text-sm">
                                  {selectedUser.referralCode || "-"}
                                </span>
                                <button
                                  onClick={() => {
                                    setIsEditingReferralCode(true);
                                    setReferralCodeInput(selectedUser.referralCode || "");
                                  }}
                                  className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-2 py-1 rounded text-xs transition-colors"
                                >
                                  수정
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-400">가입일</td>
                          <td className="px-4 py-3 text-white">{selectedUser.joined}</td>
                          <td className="px-4 py-3 text-gray-400">마지막 로그인</td>
                          <td className="px-4 py-3 text-white">{selectedUser.lastLogin}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-400">가입 IP</td>
                          <td className="px-4 py-3 text-white font-mono text-sm">{selectedUser.joinIp}</td>
                          <td className="px-4 py-3 text-gray-400">마지막 접속 IP</td>
                          <td className="px-4 py-3 text-white font-mono text-sm">{selectedUser.lastIp}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="px-4 py-4 bg-gray-900">
                            {/* 비밀번호 변경 UI */}
                            {!isChangingPassword ? (
                              <div className="flex justify-center">
                                <button
                                  onClick={() => setIsChangingPassword(true)}
                                  className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                  <Key size={18} />
                                  비밀번호 변경
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
                                    <label className="block text-gray-400 text-sm mb-1">새 비밀번호</label>
                                    <input
                                      type="password"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      placeholder="새 비밀번호 입력"
                                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-400 text-sm mb-1">비밀번호 재확인</label>
                                    <input
                                      type="password"
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      placeholder="비밀번호 재확인"
                                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                </div>
                                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                  <p className="text-red-400 text-sm">비밀번호가 일치하지 않습니다</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => {
                                      if (newPassword === confirmPassword && newPassword) {
                                        alert("비밀번호가 변경되었습니다");
                                        setIsChangingPassword(false);
                                        setNewPassword("");
                                        setConfirmPassword("");
                                      }
                                    }}
                                    disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
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
                      </>
                    )}

                    {activeTab === "points" && (
                      <>
                        {/* Date Filter */}
                        <tr>
                          <td colSpan={4} className="px-4 py-2 bg-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-indigo-400" size={18} />
                              <input
                                type="date"
                                value={selectedPointDate}
                                onChange={(e) => setSelectedPointDate(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                              />
                              {selectedPointDate && (
                                <button
                                  onClick={() => setSelectedPointDate("")}
                                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                >
                                  전체보기
                                </button>
                              )}
                              <span className="text-gray-400 text-sm">
                                {selectedPointDate ? `${selectedPointDate} 포인트 내역` : "전체 포인트 내역"}
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3 text-gray-300 text-sm w-1/3">2025-12-15 10:30</td>
                          <td className="px-4 py-3 text-green-400 font-semibold w-1/3">+10,000 P</td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/3">충전</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-300 text-sm">2025-12-14 15:20</td>
                          <td className="px-4 py-3 text-red-400 font-semibold">-500 P</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">기프트</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-300 text-sm">2025-12-13 09:15</td>
                          <td className="px-4 py-3 text-green-400 font-semibold">+5,000 P</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">충전</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-300 text-sm">2025-12-12 18:45</td>
                          <td className="px-4 py-3 text-red-400 font-semibold">-2,000 P</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">출금</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-300 text-sm">2025-12-11 14:20</td>
                          <td className="px-4 py-3 text-green-400 font-semibold">+15,000 P</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">충전</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-300 text-sm">2025-12-10 11:30</td>
                          <td className="px-4 py-3 text-red-400 font-semibold">-1,200 P</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">기프트</td>
                        </tr>
                      </>
                    )}

                    {activeTab === "gifts" && (
                      <>
                        {/* Date Filter */}
                        <tr>
                          <td colSpan={4} className="px-4 py-2 bg-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-indigo-400" size={18} />
                              <input
                                type="date"
                                value={selectedGiftDate}
                                onChange={(e) => setSelectedGiftDate(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                              />
                              {selectedGiftDate && (
                                <button
                                  onClick={() => setSelectedGiftDate("")}
                                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                >
                                  전체보기
                                </button>
                              )}
                              <span className="text-gray-400 text-sm">
                                {selectedGiftDate ? `${selectedGiftDate} 선물 내역` : "전체 선물 내역"}
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td className="px-4 py-3 text-white w-1/4">장미 꽃다발 (500 P)</td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/4">2025-12-14 15:20</td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/4">유진에게 전송</td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/4"></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-white">초콜릿 박스 (300 P)</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">2025-12-12 11:30</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">민지에게 전송</td>
                          <td className="px-4 py-3 text-gray-400 text-sm"></td>
                        </tr>
                      </>
                    )}

                    {activeTab === "chats" && (
                      <>
                        {/* Date Filter */}
                        <tr>
                          <td colSpan={4} className="px-4 py-2 bg-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-indigo-400" size={18} />
                              <input
                                type="date"
                                value={selectedChatDate}
                                onChange={(e) => setSelectedChatDate(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                              />
                              {selectedChatDate && (
                                <button
                                  onClick={() => setSelectedChatDate("")}
                                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                >
                                  전체보기
                                </button>
                              )}
                              <span className="text-gray-400 text-sm">
                                {selectedChatDate ? `${selectedChatDate} 채팅 내역` : "전체 채팅 내역"}
                              </span>
                            </div>
                          </td>
                        </tr>

                        <tr 
                          onClick={() => setSelectedChat("유진")}
                          className="cursor-pointer hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-3 text-white w-1/4">유진</td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/4">2025-12-15 11:00</td>
                          <td className="px-4 py-3 text-indigo-400 w-1/4">총 메시지: 8개</td>
                          <td className="px-4 py-3 text-gray-400 text-sm w-1/4">마지막: "토요일 오후 2시 괜찮을까요?"</td>
                        </tr>
                        <tr 
                          onClick={() => setSelectedChat("민지")}
                          className="cursor-pointer hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-3 text-white">민지</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">2025-12-14 16:30</td>
                          <td className="px-4 py-3 text-indigo-400">총 메시지: 6개</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">마지막: "네 언제든지 연락주세요!"</td>
                        </tr>
                      </>
                    )}

                    {activeTab === "minigames" && (
                      <>
                        {/* Date Filter */}
                        <tr>
                          <td colSpan={4} className="px-4 py-2 bg-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-indigo-400" size={18} />
                              <input
                                type="date"
                                value={selectedBetDate}
                                onChange={(e) => setSelectedBetDate(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                              />
                              {selectedBetDate && (
                                <button
                                  onClick={() => setSelectedBetDate("")}
                                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                >
                                  전체보기
                                </button>
                              )}
                              <span className="text-gray-400 text-sm">
                                {selectedBetDate ? `${selectedBetDate} 배팅내역` : "전체 배팅내역"}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Bet 1 - 2025-12-15 */}
                        <tr className="bg-gray-750">
                          <td colSpan={4} className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded text-xs font-semibold">파워볼</span>
                              <span className="text-white text-sm">회차 #1247</span>
                              <span className="text-gray-400 text-sm">|</span>
                              <span className="text-white text-sm">배팅: 일반볼-홀</span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅금액</td>
                          <td className="px-4 py-2 text-indigo-400 font-semibold text-sm">50,000 P</td>
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅시간</td>
                          <td className="px-4 py-2 text-gray-300 text-sm">2025-12-15 14:10:23</td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">결��</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 font-semibold">승리</span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 text-sm">당첨금</td>
                          <td className="px-4 py-2 text-green-400 font-semibold text-sm">95,000 P</td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅 IP</td>
                          <td className="px-4 py-2 text-white font-mono text-xs">192.168.1.100</td>
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅 후 금액</td>
                          <td className="px-4 py-2 text-blue-400 font-semibold text-sm">145,000 P</td>
                        </tr>
                        <tr className="border-b-4 border-gray-900">
                          <td colSpan={4}></td>
                        </tr>

                        {/* Bet 2 - 2025-12-15 */}
                        <tr className="bg-gray-750">
                          <td colSpan={4} className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-500/30 text-blue-300 rounded text-xs font-semibold">사다리</span>
                              <span className="text-white text-sm">회차 #858</span>
                              <span className="text-gray-400 text-sm">|</span>
                              <span className="text-white text-sm">배팅: 좌출발</span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅금액</td>
                          <td className="px-4 py-2 text-indigo-400 font-semibold text-sm">100,000 P</td>
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅시간</td>
                          <td className="px-4 py-2 text-gray-300 text-sm">2025-12-15 14:12:15</td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">결과</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 font-semibold">패배</span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 text-sm">당첨금</td>
                          <td className="px-4 py-2 text-gray-400 font-semibold text-sm">0 P</td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅 IP</td>
                          <td className="px-4 py-2 text-white font-mono text-xs">192.168.1.100</td>
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅 후 금액</td>
                          <td className="px-4 py-2 text-blue-400 font-semibold text-sm">45,000 P</td>
                        </tr>
                        <tr className="border-b-4 border-gray-900">
                          <td colSpan={4}></td>
                        </tr>

                        {/* Bet 3 - 2025-12-15 */}
                        <tr className="bg-gray-750">
                          <td colSpan={4} className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded text-xs font-semibold">파워볼</span>
                              <span className="text-white text-sm">회차 #1246</span>
                              <span className="text-gray-400 text-sm">|</span>
                              <span className="text-white text-sm">배팅: 파워볼-짝</span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅금액</td>
                          <td className="px-4 py-2 text-indigo-400 font-semibold text-sm">40,000 P</td>
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅시간</td>
                          <td className="px-4 py-2 text-gray-300 text-sm">2025-12-15 14:05:30</td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">결과</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 font-semibold">승리</span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 text-sm">당첨금</td>
                          <td className="px-4 py-2 text-green-400 font-semibold text-sm">76,000 P</td>
                        </tr>
                        <tr className="border-b-2 border-gray-900">
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅 IP</td>
                          <td className="px-4 py-2 text-white font-mono text-xs">192.168.1.100</td>
                          <td className="px-4 py-2 text-gray-400 text-sm">배팅 후 금액</td>
                          <td className="px-4 py-2 text-blue-400 font-semibold text-sm">81,000 P</td>
                        </tr>
                        <tr className="border-b-4 border-gray-900">
                          <td colSpan={4}></td>
                        </tr>

                        {/* Bet 4 - 2025-12-14 */}
                        {(!selectedBetDate || selectedBetDate === "2025-12-14") && (
                          <>
                            <tr className="bg-gray-750">
                              <td colSpan={4} className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded text-xs font-semibold">파워볼</span>
                                  <span className="text-white text-sm">회차 #1245</span>
                                  <span className="text-gray-400 text-sm">|</span>
                                  <span className="text-white text-sm">배팅: 일반볼-언더</span>
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅금액</td>
                              <td className="px-4 py-2 text-indigo-400 font-semibold text-sm">30,000 P</td>
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅시간</td>
                              <td className="px-4 py-2 text-gray-300 text-sm">2025-12-14 18:45:30</td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">결과</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 font-semibold">패배</span>
                              </td>
                              <td className="px-4 py-2 text-gray-400 text-sm">당첨금</td>
                              <td className="px-4 py-2 text-gray-400 font-semibold text-sm">0 P</td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅 IP</td>
                              <td className="px-4 py-2 text-white font-mono text-xs">192.168.1.101</td>
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅 후 금액</td>
                              <td className="px-4 py-2 text-blue-400 font-semibold text-sm">15,000 P</td>
                            </tr>
                            <tr className="border-b-4 border-gray-900">
                              <td colSpan={4}></td>
                            </tr>
                          </>
                        )}

                        {/* Bet 5 - 2025-12-14 */}
                        {(!selectedBetDate || selectedBetDate === "2025-12-14") && (
                          <>
                            <tr className="bg-gray-750">
                              <td colSpan={4} className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-blue-500/30 text-blue-300 rounded text-xs font-semibold">사다리</span>
                                  <span className="text-white text-sm">회차 #857</span>
                                  <span className="text-gray-400 text-sm">|</span>
                                  <span className="text-white text-sm">배팅: 우출발</span>
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅금액</td>
                              <td className="px-4 py-2 text-indigo-400 font-semibold text-sm">120,000 P</td>
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅시간</td>
                              <td className="px-4 py-2 text-gray-300 text-sm">2025-12-14 16:25:10</td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">결과</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 font-semibold">승리</span>
                              </td>
                              <td className="px-4 py-2 text-gray-400 text-sm">당첨금</td>
                              <td className="px-4 py-2 text-green-400 font-semibold text-sm">228,000 P</td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅 IP</td>
                              <td className="px-4 py-2 text-white font-mono text-xs">192.168.1.100</td>
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅 후 금액</td>
                              <td className="px-4 py-2 text-blue-400 font-semibold text-sm">243,000 P</td>
                            </tr>
                            <tr className="border-b-4 border-gray-900">
                              <td colSpan={4}></td>
                            </tr>
                          </>
                        )}

                        {/* Bet 6 - 2025-12-13 */}
                        {(!selectedBetDate || selectedBetDate === "2025-12-13") && (
                          <>
                            <tr className="bg-gray-750">
                              <td colSpan={4} className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded text-xs font-semibold">파워볼</span>
                                  <span className="text-white text-sm">회차 #1244</span>
                                  <span className="text-gray-400 text-sm">|</span>
                                  <span className="text-white text-sm">배팅: 파워볼-오버</span>
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅금액</td>
                              <td className="px-4 py-2 text-indigo-400 font-semibold text-sm">25,000 P</td>
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅시간</td>
                              <td className="px-4 py-2 text-gray-300 text-sm">2025-12-13 21:15:45</td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">결과</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 font-semibold">승리</span>
                              </td>
                              <td className="px-4 py-2 text-gray-400 text-sm">당첨금</td>
                              <td className="px-4 py-2 text-green-400 font-semibold text-sm">47,500 P</td>
                            </tr>
                            <tr className="border-b-2 border-gray-900">
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅 IP</td>
                              <td className="px-4 py-2 text-white font-mono text-xs">192.168.1.100</td>
                              <td className="px-4 py-2 text-gray-400 text-sm">배팅 후 금액</td>
                              <td className="px-4 py-2 text-blue-400 font-semibold text-sm">72,500 P</td>
                            </tr>
                            <tr className="border-b-4 border-gray-900">
                              <td colSpan={4}></td>
                            </tr>
                          </>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl flex items-center gap-2">
                <MessageCircle size={24} />
                {selectedChat}와의 채팅 내역
              </h2>
              <button
                onClick={() => setSelectedChat(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {chatMessages[selectedChat]?.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col ${msg.sender === selectedUser?.name ? "items-end" : "items-start"}`}
                >
                  <div className="text-gray-400 text-xs mb-1">
                    {msg.sender} · {msg.time}
                  </div>
                  <div 
                    className={`px-4 py-2 rounded-lg max-w-[70%] ${
                      msg.sender === selectedUser?.name 
                        ? "bg-indigo-500 text-white" 
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Point Adjustment Modal */}
      {quickPointUserId !== null && (() => {
        const targetUser = users.find(u => u.id === quickPointUserId);
        if (!targetUser) return null;
        
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
              <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                <h2 className="text-white text-lg flex items-center gap-2">
                  <DollarSign size={20} />
                  포인트 조정
                </h2>
                <button
                  onClick={() => {
                    setQuickPointUserId(null);
                    setQuickPointAmount("");
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* User Info */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                      {targetUser.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{targetUser.nickname} <span className="text-gray-400">({targetUser.name})</span></p>
                      <p className="text-gray-400 text-sm">{targetUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <span className="text-gray-400 text-sm">현재 포인트</span>
                    <span className="text-indigo-400 font-semibold text-lg">{targetUser.points.toLocaleString()} P</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">조정 타입</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuickPointType("add")}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      quickPointType === "add"
                        ? "bg-green-500 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    지급 (+)
                  </button>
                  <button
                    onClick={() => setQuickPointType("subtract")}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      quickPointType === "subtract"
                        ? "bg-red-500 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    차감 (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">포인트 금액</label>
                <input
                  type="number"
                  value={quickPointAmount}
                  onChange={(e) => setQuickPointAmount(e.target.value)}
                  placeholder="금액 입력"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    if (quickPointAmount && parseInt(quickPointAmount) > 0) {
                      const amount = parseInt(quickPointAmount);
                      const newPoints = quickPointType === "add" 
                        ? targetUser.points + amount 
                        : targetUser.points - amount;
                      
                      if (newPoints < 0) {
                        alert("포인트는 0보다 작을 수 없습니다");
                        return;
                      }
                      
                      targetUser.points = newPoints;
                      alert(`${quickPointType === "add" ? "+" : "-"}${amount.toLocaleString()}P ${quickPointType === "add" ? "지급" : "차감"}되었습니다`);
                      setQuickPointUserId(null);
                      setQuickPointAmount("");
                    }
                  }}
                  disabled={!quickPointAmount || parseInt(quickPointAmount) <= 0}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  확인
                </button>
                <button
                  onClick={() => {
                    setQuickPointUserId(null);
                    setQuickPointAmount("");
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Status Change Modal - 정지/정지 해제 확인 팝업 */}
      {showStatusChangeModal && statusChangeUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg flex items-center gap-2">
                {statusChangeAction === "ban" ? (
                  <>
                    <Ban size={20} className="text-red-500" />
                    회원 정지
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} className="text-green-500" />
                    정지 해제
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowStatusChangeModal(false);
                  setStatusChangeUser(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                  {statusChangeUser.name[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{statusChangeUser.nickname} ({statusChangeUser.name})</p>
                  <p className="text-gray-400 text-sm">{statusChangeUser.email}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                {statusChangeAction === "ban" ? (
                  <>
                    <p className="text-white text-center mb-2">
                      정말 이 회원을 <span className="text-red-500 font-bold">정지</span>하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      정지된 회원은 로그인 및 모든 서비스 이용이 제한됩니다.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white text-center mb-2">
                      이 회원의 정지를 <span className="text-green-500 font-bold">해제</span>하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      정지 해제 시 모든 서비스를 정상적으로 이용할 수 있습니다.
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowStatusChangeModal(false);
                    setStatusChangeUser(null);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (statusChangeAction === "ban") {
                      alert(`${statusChangeUser.name} 회원이 정지되었습니다.`);
                      statusChangeUser.status = "정지";
                    } else {
                      alert(`${statusChangeUser.name} 회원의 정지가 해제되었습니다.`);
                      statusChangeUser.status = "활성";
                    }
                    setShowStatusChangeModal(false);
                    setStatusChangeUser(null);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-white ${
                    statusChangeAction === "ban"
                      ? "bg-red-500/80 hover:bg-red-500"
                      : "bg-green-500/80 hover:bg-green-500"
                  }`}
                >
                  {statusChangeAction === "ban" ? "정지하기" : "해제하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl flex items-center gap-2">
                <UserCheck size={24} />
                회원 가입 승인 관리
              </h2>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Pending Approvals */}
              <div>
                <h3 className="text-white text-lg mb-4 flex items-center gap-2">
                  <Clock size={18} />
                  승인 대기 중 ({pendingApprovals.length}명)
                </h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">닉네임(이름)</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">이메일</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">전화번호</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">추천코드</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">은행</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">계좌번호</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">예금주</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">가입 신청일</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">가입 IP</th>
                          <th className="px-2 py-2 text-center text-xs text-gray-400 uppercase whitespace-nowrap">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {pendingApprovals.map((applicant) => (
                          <tr key={applicant.id} className="hover:bg-gray-700/50">
                            <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
                              <div className="text-white">{applicant.nickname}</div>
                              <div className="text-gray-400 text-[10px]">({applicant.name})</div>
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.email}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.phone}
                            </td>
                            <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
                              {applicant.referralCode ? (
                                <span className="text-indigo-400 font-mono text-[10px]">{applicant.referralCode}</span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.bank}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.accountNumber}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.accountHolder}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.joined}
                            </td>
                            <td className="px-2 py-2 text-center text-gray-300 text-xs whitespace-nowrap">
                              {applicant.joinIp}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                                <button 
                                  onClick={() => {
                                    setApprovalConfirmAction({ action: "approve", applicant });
                                    setShowApprovalConfirmModal(true);
                                  }}
                                  className="px-2 py-1 bg-green-500/80 hover:bg-green-500 text-white rounded text-xs transition-colors flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  승인
                                </button>
                                <button 
                                  onClick={() => {
                                    setApprovalConfirmAction({ action: "reject", applicant });
                                    setShowApprovalConfirmModal(true);
                                  }}
                                  className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded text-xs transition-colors flex items-center gap-1">
                                  <X size={12} />
                                  거절
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Approval Logs */}
              <div>
                <h3 className="text-white text-lg mb-4 flex items-center gap-2">
                  <Eye size={18} />
                  승인/거절 로그 ({approvalLogs.length}건)
                </h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">닉네임(이름)</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">이메일</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">전화번호</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">은행</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">계좌번호</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">예금주</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">결과</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">처리일시</th>
                          <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">처리자</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {approvalLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="text-white">{log.nickname}</div>
                              <div className="text-gray-400 text-xs">({log.name})</div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.email}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.phone}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.bank}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.accountNumber}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.accountHolder}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                log.action === "승인" 
                                  ? "bg-green-500/20 text-green-500" 
                                  : "bg-red-500/20 text-red-500"
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.actionDate}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 text-sm">
                              {log.actionBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirm Modal */}
      {showApprovalConfirmModal && approvalConfirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg flex items-center gap-2">
                {approvalConfirmAction.action === "approve" ? (
                  <>
                    <CheckCircle size={20} className="text-green-500" />
                    회원 가입 승인
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-red-500" />
                    회원 가입 거절
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowApprovalConfirmModal(false);
                  setApprovalConfirmAction(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-12 h-12 bg-indigo-500/80 rounded-full flex items-center justify-center text-white">
                  {approvalConfirmAction.applicant.name[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{approvalConfirmAction.applicant.nickname} ({approvalConfirmAction.applicant.name})</p>
                  <p className="text-gray-400 text-sm">{approvalConfirmAction.applicant.email}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                {approvalConfirmAction.action === "approve" ? (
                  <>
                    <p className="text-white text-center mb-2">
                      이 회원의 가입을 <span className="text-green-500 font-bold">승인</span>하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      승인 시 회원은 모든 서비스를 이용할 수 있습니다.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white text-center mb-2">
                      이 회원의 가입을 <span className="text-red-500 font-bold">거절</span>하시겠습니까?
                    </p>
                    <p className="text-gray-400 text-sm text-center">
                      거절된 회원은 서비스를 이용할 수 없습니다.
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowApprovalConfirmModal(false);
                    setApprovalConfirmAction(null);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (approvalConfirmAction.action === "approve") {
                      alert(`${approvalConfirmAction.applicant.name} 회원의 가입이 승인되었습니다.`);
                    } else {
                      alert(`${approvalConfirmAction.applicant.name} 회원의 가입이 거절되었습니다.`);
                    }
                    setShowApprovalConfirmModal(false);
                    setApprovalConfirmAction(null);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-white ${
                    approvalConfirmAction.action === "approve"
                      ? "bg-green-500/80 hover:bg-green-500"
                      : "bg-red-500/80 hover:bg-red-500"
                  }`}
                >
                  {approvalConfirmAction.action === "approve" ? "승인하기" : "거절하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Modal */}
      {showProfileImageModal && selectedProfileImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowProfileImageModal(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowProfileImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-gray-800/50 hover:bg-gray-700/50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <img
              src={selectedProfileImage}
              alt={selectedProfileName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}