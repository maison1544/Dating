import { AdminLayout } from "../components/AdminLayout";
import { UserDetailModal } from "../components/UserDetailModal";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Key,
  User,
  Users,
  TrendingUp,
  MessageCircle,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Gift,
  Clock,
  ChevronDown,
  MoreVertical,
  Ban,
} from "lucide-react";
import { useChatProfiles } from "../contexts/ChatProfileContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface AdminAccount {
  id: number;
  username: string;
  role: "super_admin" | "agent";
  createdAt: string;
  referralCode?: string;
  assignedProfiles: number[];
  totalRevenue: number;
  totalMembers: number;
  status: "활성" | "정지";
}

interface AgentMember {
  id: number;
  name: string;
  nickname?: string;
  email: string;
  phone?: string;
  joined: string;
  lastLogin?: string;
  joinIp?: string;
  lastIp?: string;
  status: "활성" | "정지";
  points?: number;
  online?: boolean;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
  revenue?: number;
  referralCode?: string;
  totalSpent?: number;
  location?: string;
  gender?: string;
  age?: number;
  recentPurchases?: {
    date: string;
    amount: number;
    description: string;
  }[];
}

interface RevenueRecord {
  date: string;
  memberName: string;
  memberNickname: string;
  amount: number;
  type: string;
}

export function AdminAccountsPage() {
  const { profiles: chatProfiles } = useChatProfiles();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] =
    useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] =
    useState(false);
  const [editingAccount, setEditingAccount] =
    useState<AdminAccount | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<AdminAccount | null>(null);
  const [showSuspendModal, setShowSuspendModal] =
    useState(false);
  const [suspendAccount, setSuspendAccount] =
    useState<AdminAccount | null>(null);
  const [roleFilter, setRoleFilter] = useState<
    "all" | "super_admin" | "agent"
  >("all");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<AgentMember | null>(null);
  const [showProfileModal, setShowProfileModal] =
    useState(false);
  const [
    selectedProfilesForAgent,
    setSelectedProfilesForAgent,
  ] = useState<number[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<
    number | null
  >(null);

  // 에이전트 상세 모달용 state
  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");
  const [detailActiveTab, setDetailActiveTab] =
    useState("revenue");
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<
    "all" | "충전" | "출금"
  >("all");
  const [isRevenueDateRangeValid, setIsRevenueDateRangeValid] =
    useState(true);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "agent" as "super_admin" | "agent",
    referralCode: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // 회원 정렬 필터 추가
  const [memberSortFilter, setMemberSortFilter] = useState<
    "date" | "revenue"
  >("date");

  const [accounts, setAccounts] = useState<AdminAccount[]>([
    {
      id: 1,
      username: "super_admin",
      role: "super_admin",
      createdAt: "2024-01-15",
      totalRevenue: 0,
      totalMembers: 0,
      assignedProfiles: [],
      status: "활성",
    },
    {
      id: 2,
      username: "agent_kim",
      role: "agent",
      createdAt: "2024-02-20",
      referralCode: "AGENT_KIM2024",
      assignedProfiles: [1, 2, 3],
      totalRevenue: 0,
      totalMembers: 0,
      status: "활성",
    },
    {
      id: 3,
      username: "agent_park",
      role: "agent",
      createdAt: "2024-03-10",
      referralCode: "AGENT_PARK2024",
      assignedProfiles: [4, 5],
      totalRevenue: 0,
      totalMembers: 0,
      status: "활성",
    },
  ]);

  // 샘플 에이전트 회원 데이터
  const [agentMembers] = useState<AgentMember[]>([
    {
      id: 1,
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
      totalSpent: 150000,
    },
    {
      id: 2,
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
      revenue: 230000,
      referralCode: "AGENT_KIM2024",
      totalSpent: 230000,
    },
    {
      id: 3,
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
      totalSpent: -50000,
    },
    {
      id: 4,
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
      totalSpent: -30000,
    },
    {
      id: 5,
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
      totalSpent: -25000,
    },
  ]);

  // 매출 기록 샘플 데이터
  const [revenueRecords] = useState<RevenueRecord[]>([
    {
      date: "2024-12-17 14:30",
      memberName: "김철수",
      memberNickname: "철수맨",
      amount: 50000,
      type: "충전",
    },
    {
      date: "2024-12-17 11:20",
      memberName: "이영희",
      memberNickname: "영희쓰",
      amount: 30000,
      type: "충전",
    },
    {
      date: "2024-12-16 18:45",
      memberName: "김철수",
      memberNickname: "철수맨",
      amount: -20000,
      type: "출금",
    },
    {
      date: "2024-12-16 15:30",
      memberName: "이영희",
      memberNickname: "영희쓰",
      amount: 100000,
      type: "충전",
    },
    {
      date: "2024-12-15 10:15",
      memberName: "박민수",
      memberNickname: "민수123",
      amount: -50000,
      type: "출금",
    },
    {
      date: "2024-12-15 09:20",
      memberName: "김철수",
      memberNickname: "철수맨",
      amount: 120000,
      type: "충전",
    },
    {
      date: "2024-12-14 16:40",
      memberName: "이영희",
      memberNickname: "영희쓰",
      amount: 100000,
      type: "충전",
    },
    {
      date: "2024-12-13 13:25",
      memberName: "최지영",
      memberNickname: "지영언니",
      amount: -30000,
      type: "출금",
    },
    {
      date: "2024-12-12 11:50",
      memberName: "정대호",
      memberNickname: "대호킹",
      amount: -25000,
      type: "출금",
    },
  ]);

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

  // 에이전트별 총 매출 및 전체 회원 수 계산 함수
  const calculateAgentStats = (referralCode?: string) => {
    if (!referralCode) {
      return { totalRevenue: 0, totalMembers: 0 };
    }

    const members = agentMembers.filter(
      (member) => member.referralCode === referralCode,
    );

    const totalRevenue = members.reduce(
      (sum, member) => sum + (member.totalSpent || 0),
      0,
    );

    const totalMembers = members.length;

    return { totalRevenue, totalMembers };
  };

  // 매출 포맷팅 함수 (양수는 +, 음수는 -)
  const formatRevenue = (amount: number) => {
    const sign = amount >= 0 ? "+" : "";
    return `${sign}${amount.toLocaleString()}원`;
  };

  const filteredAccounts = accounts
    .map((account) => {
      const { totalRevenue, totalMembers } =
        calculateAgentStats(account.referralCode);
      return {
        ...account,
        totalRevenue,
        totalMembers,
      };
    })
    .filter((account) => {
      const matchesSearch = account.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole =
        roleFilter === "all" || account.role === roleFilter;
      return matchesSearch && matchesRole;
    });

  const handleOpenModal = (account?: AdminAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        username: account.username,
        password: "",
        role: account.role,
        referralCode: account.referralCode || "",
      });
    } else {
      setEditingAccount(null);
      setFormData({
        username: "",
        password: "",
        role: "agent",
        referralCode: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAccount) {
      // 수정
      setAccounts(
        accounts.map((account) =>
          account.id === editingAccount.id
            ? {
                ...account,
                username: formData.username,
                role: formData.role,
                referralCode:
                  formData.referralCode || undefined,
              }
            : account,
        ),
      );
    } else {
      // 새로 등록
      const newAccount: AdminAccount = {
        id: Math.max(...accounts.map((a) => a.id), 0) + 1,
        username: formData.username,
        role: formData.role,
        createdAt: new Date().toISOString().split("T")[0],
        referralCode: formData.referralCode || undefined,
        assignedProfiles: [],
        totalRevenue: 0,
        totalMembers: 0,
        status: "활성",
      };
      setAccounts([...accounts, newAccount]);
    }

    handleCloseModal();
  };

  const handleSuspend = (id: number) => {
    setAccounts(
      accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              status:
                account.status === "활성" ? "정지" : "활성",
            }
          : account,
      ),
    );
  };

  // 정지 확인 엔터키
  useEffect(() => {
    if (!showSuspendModal || !suspendAccount) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSuspend(suspendAccount.id);
        setShowSuspendModal(false);
        setSuspendAccount(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [showSuspendModal, suspendAccount]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      passwordData.newPassword ===
        passwordData.confirmPassword &&
      editingAccount
    ) {
      // 비밀번호 변경 로직
      alert(
        `${editingAccount.username}의 비밀번호가 변경되었습니다.`,
      );
      setIsPasswordModalOpen(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
      setShowPassword(false);
      setShowConfirmPassword(false);
    } else {
      alert("비밀번호가 일치하지 않습니다.");
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "super_admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
          <Shield size={12} />
          최고관리자
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30">
        <User size={12} />
        에이전트
      </span>
    );
  };

  // 에이전트별 매출 기록 필터링
  const getAgentRevenueRecords = (referralCode?: string) => {
    if (!referralCode) return [];

    const memberNames = agentMembers
      .filter((m) => m.referralCode === referralCode)
      .map((m) => m.name);

    return revenueRecords.filter((record) =>
      memberNames.includes(record.memberName),
    );
  };

  // 날짜 검증 함수
  const validateDateRange = (start: string, end: string) => {
    if (start && end && start > end) {
      alert("시작일이 종료일보다 늦을 수 없습니다.");
      return false;
    }
    return true;
  };

  // 날짜 필터링된 매출 계산 (입금, 출금, 총매출)
  const getFilteredRevenue = (referralCode?: string) => {
    const records = getAgentRevenueRecords(referralCode);

    const filteredRecords = records.filter((record) => {
      // 날짜 필터 (같은 날짜도 포함)
      if (!revenueStartDate && !revenueEndDate) return true;
      const recordDate = record.date.split(" ")[0];
      if (revenueStartDate && recordDate < revenueStartDate)
        return false;
      if (revenueEndDate && recordDate > revenueEndDate)
        return false;
      return true;
    });

    const deposit = filteredRecords
      .filter((r) => r.type === "충전")
      .reduce((sum, record) => sum + record.amount, 0);

    const withdrawal = filteredRecords
      .filter((r) => r.type === "출금")
      .reduce(
        (sum, record) => sum + Math.abs(record.amount),
        0,
      );

    const total = deposit - withdrawal;

    return { deposit, withdrawal, total };
  };

  // 날짜 및 유형 필터링된 매출 목록
  const getFilteredRevenueRecords = (referralCode?: string) => {
    const records = getAgentRevenueRecords(referralCode);

    return records
      .filter((record) => {
        // 날짜 필터
        if (!revenueStartDate && !revenueEndDate) {
          // 날짜 필터 없음
        } else {
          const recordDate = record.date.split(" ")[0];
          if (revenueStartDate && recordDate < revenueStartDate)
            return false;
          if (revenueEndDate && recordDate > revenueEndDate)
            return false;
        }

        // 유형 필터
        if (
          revenueTypeFilter !== "all" &&
          record.type !== revenueTypeFilter
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      );
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openDropdownId]);

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const isAnyModalOpen =
      isModalOpen ||
      isPasswordModalOpen ||
      isDetailModalOpen ||
      showSuspendModal ||
      showMemberModal ||
      showProfileModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    isModalOpen,
    isPasswordModalOpen,
    isDetailModalOpen,
    showSuspendModal,
    showMemberModal,
    showProfileModal,
  ]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">
              관리자 계정 관리
            </h1>
            <p className="text-gray-400">
              전체{" "}
              <span className="text-white font-semibold">
                {accounts.length}
              </span>
              개 • 관리자{" "}
              <span className="text-purple-400 font-semibold">
                {
                  accounts.filter(
                    (a) => a.role === "super_admin",
                  ).length
                }
              </span>{" "}
              • 에이전트{" "}
              <span className="text-indigo-400 font-semibold">
                {
                  accounts.filter((a) => a.role === "agent")
                    .length
                }
              </span>
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />새 계정 생성
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 flex-1">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="계정명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value as
                    | "all"
                    | "super_admin"
                    | "agent",
                )
              }
              className="w-full sm:w-auto bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">
                전체 ({accounts.length})
              </option>
              <option value="super_admin">
                관리자 (
                {
                  accounts.filter(
                    (a) => a.role === "super_admin",
                  ).length
                }
                )
              </option>
              <option value="agent">
                에이전트 (
                {
                  accounts.filter((a) => a.role === "agent")
                    .length
                }
                )
              </option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-indigo-500/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white text-lg font-medium">
                      {account.username}
                    </h3>
                    {getRoleBadge(account.role)}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        account.status === "활성"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">
                        생성일
                      </p>
                      <p className="text-gray-300">
                        {account.createdAt}
                      </p>
                    </div>
                    {account.referralCode && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          추천코드
                        </p>
                        <p className="text-indigo-400">
                          {account.referralCode}
                        </p>
                      </div>
                    )}
                    {account.role === "agent" && (
                      <>
                        <div>
                          <p className="text-gray-500 text-xs">
                            전체 회원
                          </p>
                          <p className="text-green-400 font-semibold">
                            {account.totalMembers}명
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">
                            총 매출
                          </p>
                          <p
                            className={`font-semibold ${account.totalRevenue < 0 ? "text-red-400" : "text-yellow-400"}`}
                          >
                            {formatRevenue(
                              account.totalRevenue,
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 드롭다운 액션 메뉴 */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(
                        openDropdownId === account.id
                          ? null
                          : account.id,
                      );
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-700"
                  >
                    <MoreVertical size={16} />
                    <span className="text-sm">작업</span>
                  </button>

                  {openDropdownId === account.id && (
                    <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[160px] overflow-hidden">
                      {account.role === "agent" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const accountWithStats =
                              filteredAccounts.find(
                                (a) => a.id === account.id,
                              );
                            setSelectedAccount(
                              accountWithStats || account,
                            );
                            setIsDetailModalOpen(true);
                            setOpenDropdownId(null);
                          }}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm border-b border-gray-700"
                        >
                          <TrendingUp
                            size={14}
                            className="text-green-400"
                          />
                          상세보기
                        </button>
                      )}
                      {account.role === "agent" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(account);
                            setOpenDropdownId(null);
                          }}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm border-b border-gray-700"
                        >
                          <Edit
                            size={14}
                            className="text-indigo-400"
                          />
                          수정
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAccount(account);
                          setIsPasswordModalOpen(true);
                          setOpenDropdownId(null);
                        }}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm border-b border-gray-700"
                      >
                        <Key
                          size={14}
                          className="text-yellow-400"
                        />
                        비밀번호 변경
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSuspendAccount(account);
                          setShowSuspendModal(true);
                          setOpenDropdownId(null);
                        }}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 transition-colors flex items-center gap-2 text-sm"
                      >
                        <Ban
                          size={14}
                          className="text-red-400"
                        />
                        {account.status === "활성"
                          ? "정지"
                          : "활성화"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg">
                {editingAccount ? "계정 수정" : "새 계정 생성"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  계정명 (아이디)
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value,
                    })
                  }
                  disabled={!!editingAccount}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${
                    editingAccount
                      ? "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-800 border-gray-700 text-white focus:border-indigo-500"
                  }`}
                  placeholder="계정명을 입력하세요"
                  required
                />
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="비밀번호를 입력하세요"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  계정 유형
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as
                        | "super_admin"
                        | "agent",
                    })
                  }
                  disabled={!!editingAccount}
                  className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 ${!!editingAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="agent">에이전트</option>
                  <option value="super_admin">
                    최고관리자
                  </option>
                </select>
              </div>

              {formData.role === "agent" && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    추천코드 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referralCode: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="추천코드를 입력하세요 (선택사항)"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    회원가입 시 이 코드로 가입한 회원을 관리할
                    수 있습니다.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  {editingAccount ? "수정하기" : "생성하기"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && editingAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg flex items-center gap-2">
                <Key size={20} className="text-yellow-500" />
                비밀번호 변경
              </h2>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordData({
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handlePasswordChange}
              className="p-6 space-y-4"
            >
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-sm">계정명</p>
                <p className="text-white font-medium">
                  {editingAccount.username}
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="새 비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  변경하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordData({
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent Detail Modal */}
      {isDetailModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-white text-lg flex items-center gap-2">
                <TrendingUp
                  size={20}
                  className="text-green-500"
                />
                {selectedAccount.username} 상세 정보
              </h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedAccount(null);
                  setRevenueStartDate("");
                  setRevenueEndDate("");
                  setDetailActiveTab("revenue");
                  setRevenueTypeFilter("all");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 탭 네비게이션 */}
            <div className="border-b border-gray-700 bg-gray-900">
              <div className="flex gap-1 px-4">
                <button
                  onClick={() => setDetailActiveTab("revenue")}
                  className={`px-4 py-3 text-sm transition-colors relative ${
                    detailActiveTab === "revenue"
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>매출 관리</span>
                  </div>
                  {detailActiveTab === "revenue" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </button>
                <button
                  onClick={() => setDetailActiveTab("members")}
                  className={`px-4 py-3 text-sm transition-colors relative ${
                    detailActiveTab === "members"
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>회원 목록</span>
                  </div>
                  {detailActiveTab === "members" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </button>
                <button
                  onClick={() => setDetailActiveTab("profiles")}
                  className={`px-4 py-3 text-sm transition-colors relative ${
                    detailActiveTab === "profiles"
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span>프로필 관리</span>
                  </div>
                  {detailActiveTab === "profiles" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 매출 관리 탭 */}
              {detailActiveTab === "revenue" && (
                <div className="space-y-6">
                  {/* 매출 기간 선택 및 요약 */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <h3 className="text-white flex items-center gap-2">
                        <Calendar size={18} />
                        매출 기간 선택
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-400 whitespace-nowrap">
                            시작일
                          </label>
                          <input
                            type="date"
                            value={revenueStartDate}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              setRevenueStartDate(newStart);
                              if (revenueEndDate) {
                                setIsRevenueDateRangeValid(
                                  newStart <= revenueEndDate,
                                );
                              }
                            }}
                            className={`date-picker-indigo bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none transition-all ${
                              !isRevenueDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                          />
                        </div>
                        <span className="text-gray-600">~</span>
                        <div className="flex items-center gap-2">
                          <label className="text-gray-400 whitespace-nowrap">
                            종료일
                          </label>
                          <input
                            type="date"
                            value={revenueEndDate}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              setRevenueEndDate(newEnd);
                              if (revenueStartDate) {
                                setIsRevenueDateRangeValid(
                                  revenueStartDate <= newEnd,
                                );
                              }
                            }}
                            className={`date-picker-indigo bg-gray-800 border rounded px-3 py-1.5 text-white text-sm focus:outline-none transition-all ${
                              !isRevenueDateRangeValid
                                ? "border-red-500"
                                : "border-gray-700"
                            }`}
                          />
                        </div>
                        {(revenueStartDate ||
                          revenueEndDate) && (
                          <button
                            onClick={() => {
                              setRevenueStartDate("");
                              setRevenueEndDate("");
                              setIsRevenueDateRangeValid(true);
                            }}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                          >
                            초기화
                          </button>
                        )}
                      </div>
                    </div>
                    {!isRevenueDateRangeValid && (
                      <p className="text-red-400 text-xs">
                        종료일은 시작일보다 이전일 수 없습니다.
                      </p>
                    )}

                    {/* 총 매출 표시 */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-gray-500 text-xs mb-1">
                            총 매출
                          </p>
                          <p
                            className={`font-bold text-xl ${getFilteredRevenue(selectedAccount.referralCode).total < 0 ? "text-red-400" : "text-yellow-400"}`}
                          >
                            {formatRevenue(
                              getFilteredRevenue(
                                selectedAccount.referralCode,
                              ).total,
                            )}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs mb-1">
                            입금액
                          </p>
                          <p className="text-green-400 font-bold text-lg">
                            +
                            {getFilteredRevenue(
                              selectedAccount.referralCode,
                            ).deposit.toLocaleString()}
                            원
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs mb-1">
                            출금액
                          </p>
                          <p className="text-red-400 font-bold text-lg">
                            -
                            {getFilteredRevenue(
                              selectedAccount.referralCode,
                            ).withdrawal.toLocaleString()}
                            원
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
                        <span>
                          전체 회원:{" "}
                          <span className="font-semibold text-indigo-400">
                            {selectedAccount.totalMembers}명
                          </span>
                        </span>
                        <span className="text-gray-600">|</span>
                        <span>
                          배정 프로필:{" "}
                          <span className="font-semibold text-purple-400">
                            {
                              selectedAccount.assignedProfiles
                                .length
                            }
                            개
                          </span>
                        </span>
                        <span className="text-gray-600">|</span>
                        <span>
                          추천코드:{" "}
                          <span className="font-semibold text-indigo-400 text-xs">
                            {selectedAccount.referralCode}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 매출 목록 섹션 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white flex items-center gap-2">
                        <DollarSign size={18} />
                        매출 목록
                      </h3>
                      {/* 유형 필터 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setRevenueTypeFilter("all")
                          }
                          className={`px-3 py-1 rounded text-xs transition-colors ${
                            revenueTypeFilter === "all"
                              ? "bg-indigo-500 text-white"
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          }`}
                        >
                          전체
                        </button>
                        <button
                          onClick={() =>
                            setRevenueTypeFilter("충전")
                          }
                          className={`px-3 py-1 rounded text-xs transition-colors ${
                            revenueTypeFilter === "충전"
                              ? "bg-green-500 text-white"
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          }`}
                        >
                          입금
                        </button>
                        <button
                          onClick={() =>
                            setRevenueTypeFilter("출금")
                          }
                          className={`px-3 py-1 rounded text-xs transition-colors ${
                            revenueTypeFilter === "출금"
                              ? "bg-red-500 text-white"
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          }`}
                        >
                          출금
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800 sticky top-0">
                            <tr>
                              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                                일시
                              </th>
                              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                                회원명
                              </th>
                              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">
                                유형
                              </th>
                              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">
                                금액
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {getFilteredRevenueRecords(
                              selectedAccount.referralCode,
                            ).length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="text-center text-gray-500 py-8"
                                >
                                  조건에 맞는 매출 기록이
                                  없습니다
                                </td>
                              </tr>
                            ) : (
                              getFilteredRevenueRecords(
                                selectedAccount.referralCode,
                              ).map((record, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-gray-800/50 transition-colors"
                                >
                                  <td className="text-gray-300 text-sm px-4 py-3">
                                    {record.date}
                                  </td>
                                  <td className="text-white text-sm px-4 py-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const member =
                                          agentMembers.find(
                                            (m) =>
                                              m.name ===
                                              record.memberName,
                                          );
                                        if (member) {
                                          setSelectedMember(
                                            member,
                                          );
                                          setShowMemberModal(
                                            true,
                                          );
                                        }
                                      }}
                                      className="hover:text-indigo-400 transition-colors cursor-pointer underline decoration-dotted"
                                    >
                                      {record.memberNickname} (
                                      {record.memberName})
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        record.type === "충전"
                                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                                      }`}
                                    >
                                      {record.type}
                                    </span>
                                  </td>
                                  <td
                                    className={`text-right text-sm font-semibold px-4 py-3 ${
                                      record.amount < 0
                                        ? "text-red-400"
                                        : "text-green-400"
                                    }`}
                                  >
                                    {formatRevenue(
                                      record.amount,
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 회원 목록 탭 */}
              {detailActiveTab === "members" &&
                (() => {
                  const members = [...agentMembers].filter(
                    (member) =>
                      member.referralCode ===
                      selectedAccount.referralCode,
                  );
                  const totalMembers = members.length;
                  const activeMembers = members.filter(
                    (m) => m.status === "활성",
                  ).length;
                  const suspendedMembers = members.filter(
                    (m) => m.status === "정지",
                  ).length;

                  return (
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white flex items-center gap-2 mb-2">
                            <Users size={18} />
                            가입 회원 목록
                          </h3>
                          <p className="text-gray-400 text-sm">
                            <span className="text-gray-300">
                              전체 {totalMembers}명
                            </span>
                            <span className="text-gray-600 mx-2">
                              |
                            </span>
                            <span className="text-green-400">
                              활성 {activeMembers}명
                            </span>
                            <span className="text-gray-600 mx-2">
                              |
                            </span>
                            <span className="text-red-400">
                              정지 {suspendedMembers}명
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setMemberSortFilter("date")
                            }
                            className={`px-3 py-1 rounded text-xs transition-colors ${
                              memberSortFilter === "date"
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                            }`}
                          >
                            <Calendar
                              size={12}
                              className="inline mr-1"
                            />
                            가입일순
                          </button>
                          <button
                            onClick={() =>
                              setMemberSortFilter("revenue")
                            }
                            className={`px-3 py-1 rounded text-xs transition-colors ${
                              memberSortFilter === "revenue"
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                            }`}
                          >
                            <DollarSign
                              size={12}
                              className="inline mr-1"
                            />
                            매출액순
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {members
                          .sort((a, b) => {
                            if (memberSortFilter === "date") {
                              return (
                                new Date(b.joined).getTime() -
                                new Date(a.joined).getTime()
                              );
                            } else {
                              return (
                                (b.totalSpent || 0) -
                                (a.totalSpent || 0)
                              );
                            }
                          })
                          .map((member) => (
                            <div
                              key={member.id}
                              className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-indigo-500/50 transition-all"
                              onClick={() => {
                                setSelectedMember(member);
                                setShowMemberModal(true);
                              }}
                            >
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="text-white font-medium text-base">
                                      {member.nickname} (
                                      {member.name})
                                    </p>
                                    {member.online && (
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    )}
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        member.status === "활성"
                                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                                      }`}
                                    >
                                      {member.status}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-2 text-white">
                                      <Mail
                                        size={12}
                                        className="text-gray-400"
                                      />
                                      <span>
                                        {member.email}
                                      </span>
                                    </div>
                                    {member.phone && (
                                      <div className="flex items-center gap-2 text-white">
                                        <Phone
                                          size={12}
                                          className="text-gray-400"
                                        />
                                        <span>
                                          {member.phone}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-white">
                                      <Clock size={12} />
                                      <span>
                                        가입: {member.joined}
                                      </span>
                                    </div>
                                    {member.lastLogin && (
                                      <div className="flex items-center gap-2 text-white">
                                        <Clock size={12} />
                                        <span>
                                          최근 접속:{" "}
                                          {member.lastLogin}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-white text-xs mb-1">
                                    보유 포인트
                                  </p>
                                  <p className="text-indigo-400 font-semibold text-sm mb-2">
                                    {(
                                      member.points || 0
                                    ).toLocaleString()}
                                    P
                                  </p>
                                  <p className="text-white text-xs mb-1">
                                    기여 매출
                                  </p>
                                  <p
                                    className={`font-bold text-base ${(member.totalSpent || 0) < 0 ? "text-red-400" : "text-yellow-400"}`}
                                  >
                                    {formatRevenue(
                                      member.totalSpent || 0,
                                    )}
                                  </p>
                                </div>
                              </div>
                              {member.bank && (
                                <div className="pt-3 border-t border-gray-700 flex items-center gap-4 text-xs text-white">
                                  <div className="flex items-center gap-1">
                                    <CreditCard size={12} />
                                    <span>
                                      {member.bank}{" "}
                                      {member.accountNumber}
                                    </span>
                                  </div>
                                  <span>
                                    예금주:{" "}
                                    {member.accountHolder}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })()}

              {/* 프로필 관리 탭 */}
              {detailActiveTab === "profiles" && (
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white flex items-center gap-2">
                      <MessageCircle size={18} />
                      배정된 프로필 카드
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedProfilesForAgent(
                          selectedAccount.assignedProfiles,
                        );
                        setShowProfileModal(true);
                      }}
                      className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 border border-indigo-500/30"
                    >
                      <Plus size={14} />
                      관리
                    </button>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    {selectedAccount.assignedProfiles.length >
                    0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedAccount.assignedProfiles.map(
                          (profileId) => {
                            const profile = chatProfiles.find(
                              (p) => p.id === profileId,
                            );
                            return (
                              <div
                                key={profileId}
                                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm flex items-center gap-2"
                              >
                                {profile ? (
                                  <>
                                    <span>{profile.name}</span>
                                    <span className="text-gray-500">
                                      ({profile.age}세)
                                    </span>
                                  </>
                                ) : (
                                  <span>
                                    프로필 #{profileId}
                                  </span>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm text-center">
                        배정된 프로필이 없습니다
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && suspendAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg flex items-center gap-2">
                <Ban size={20} className="text-red-500" />
                계정{" "}
                {suspendAccount.status === "활성"
                  ? "정지"
                  : "활성화"}{" "}
                확인
              </h2>
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendAccount(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">
                  계정명
                </p>
                <p className="text-white font-medium text-lg">
                  {suspendAccount.username}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2">
                  {getRoleBadge(suspendAccount.role)}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      suspendAccount.status === "활성"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {suspendAccount.status}
                  </span>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 ${
                  suspendAccount.status === "활성"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-green-500/10 border-green-500/30"
                }`}
              >
                <p className="text-white text-center mb-2">
                  이 계정을{" "}
                  <span
                    className={`font-bold ${
                      suspendAccount.status === "활성"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {suspendAccount.status === "활성"
                      ? "정지"
                      : "활성화"}
                  </span>
                  하시겠습니까?
                </p>
                <p className="text-gray-400 text-sm text-center">
                  {suspendAccount.status === "활성"
                    ? "정지된 계정은 로그인할 수 없습니다."
                    : "활성화하면 계정이 정상적으로 로그인할 수 있습니다."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendAccount(null);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    handleSuspend(suspendAccount.id);
                    setShowSuspendModal(false);
                    setSuspendAccount(null);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${
                    suspendAccount.status === "활성"
                      ? "bg-red-500/80 hover:bg-red-500 text-white"
                      : "bg-green-500/80 hover:bg-green-500 text-white"
                  }`}
                >
                  {suspendAccount.status === "활성"
                    ? "정지하기"
                    : "활성화하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showMemberModal && selectedMember && (
        <UserDetailModal
          user={selectedMember}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
          chatMessages={chatMessages}
        />
      )}

      {/* Profile Card Management Modal */}
      {showProfileModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-white flex items-center gap-2">
                <MessageCircle
                  className="text-indigo-400"
                  size={18}
                />
                프로필 카드 관리
              </h3>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-sm">
                  에이전트
                </p>
                <p className="text-white font-medium">
                  {selectedAccount.username}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-3">
                  사용 가능한 프로필 카드
                </p>
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 max-h-[45vh] overflow-y-auto scrollbar-hide">
                  {chatProfiles.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      등록된 프로필 카드가 없습니다
                    </p>
                  ) : (
                    chatProfiles.map((profile) => {
                      const isAssigned =
                        selectedProfilesForAgent.includes(
                          profile.id,
                        );
                      return (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between gap-3 py-2 border-b border-gray-700 last:border-0"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
                              <ImageWithFallback
                                src={profile.imageUrl}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-white text-sm font-medium truncate">
                                  {profile.name}
                                </p>
                                <span className="text-gray-500 text-xs whitespace-nowrap">
                                  {profile.age}세
                                </span>
                                {profile.isOnline && (
                                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {profile.interests
                                  .slice(0, 2)
                                  .map((interest, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded"
                                    >
                                      #{interest}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (isAssigned) {
                                setSelectedProfilesForAgent(
                                  selectedProfilesForAgent.filter(
                                    (id) => id !== profile.id,
                                  ),
                                );
                              } else {
                                setSelectedProfilesForAgent([
                                  ...selectedProfilesForAgent,
                                  profile.id,
                                ]);
                              }
                            }}
                            className={`px-3 py-1 rounded text-xs transition-colors whitespace-nowrap flex-shrink-0 ${
                              isAssigned
                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                            }`}
                          >
                            {isAssigned ? "제거" : "추가"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
                <p className="text-indigo-400 text-sm">
                  현재{" "}
                  <span className="font-bold">
                    {selectedProfilesForAgent.length}개
                  </span>
                  의 프로필이 배정되어 있습니다.
                </p>
              </div>
            </div>

            <div className="flex gap-2 p-6 pt-0 flex-shrink-0">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setAccounts(
                    accounts.map((acc) =>
                      acc.id === selectedAccount.id
                        ? {
                            ...acc,
                            assignedProfiles:
                              selectedProfilesForAgent,
                          }
                        : acc,
                    ),
                  );
                  setSelectedAccount({
                    ...selectedAccount,
                    assignedProfiles: selectedProfilesForAgent,
                  });
                  alert("프로필 카드가 저장되었습니다.");
                  setShowProfileModal(false);
                }}
                className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
