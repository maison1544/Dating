import { AdminLayout } from "../components/AdminLayout";
import { UserDetailModal } from "../components/UserDetailModal";
import { useState } from "react";
import { Search, Filter, MoreVertical } from "lucide-react";

interface Member {
  id: number;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  location?: string;
  gender: string;
  age: number;
  joined: string;
  joinedAt?: string;
  totalSpent: number;
  status: "활성" | "정지";
  lastLogin: string;
  points: number;
  online: boolean;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
  recentPurchases?: {
    date: string;
    amount: number;
    description: string;
  }[];
  joinIp?: string;
  lastIp?: string;
  profileImage?: string;
}

export function AgentMembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] =
    useState<Member | null>(null);
  const [showDetailsModal, setShowDetailsModal] =
    useState(false);
  const [selectedProfileImage, setSelectedProfileImage] =
    useState("");
  const [selectedProfileName, setSelectedProfileName] =
    useState("");
  const [showProfileImageModal, setShowProfileImageModal] =
    useState(false);

  // 가입 기간 필터 state 추가
  const [joinStartDate, setJoinStartDate] = useState("");
  const [joinEndDate, setJoinEndDate] = useState("");
  const [isJoinDateRangeValid, setIsJoinDateRangeValid] = useState(true);

  // 에이전트 정보 (실제로는 로그인 정보에서 가져옴)
  const agentInfo = {
    username: "agent_kim",
    referralCode: "AGENT_KIM2024",
  };

  // 채팅 메시지 샘플 데이터
  const chatMessages: Record<
    string,
    Array<{
      time: string;
      sender: string;
      message: string;
      type?: string;
      imageUrl?: string;
    }>
  > = {
    유진: [
      {
        time: "2025-12-10 09:00",
        sender: "유진",
        message: "안녕하세요",
      },
      {
        time: "2025-12-10 09:02",
        sender: "김철수",
        message: "네 안녕하세요!",
      },
      {
        time: "2025-12-10 09:05",
        sender: "유진",
        message: "프로필 보고 연락드렸어요",
      },
      {
        time: "2025-12-10 09:07",
        sender: "김철수",
        message: "감사합니다 ^^",
      },
      {
        time: "2025-12-10 09:10",
        sender: "유진",
        message: "취미가 어떻게 되세요?",
      },
      {
        time: "2025-12-10 09:12",
        sender: "김철수",
        message: "영화 보는 거 좋아해요",
      },
      {
        time: "2025-12-11 14:30",
        sender: "유진",
        message: "어제는 즐거웠어요",
      },
      {
        time: "2025-12-11 14:32",
        sender: "김철수",
        message: "저도요! 다음에 또 만나요",
      },
      {
        time: "2025-12-11 14:35",
        sender: "유진",
        message: "장미 꽃다발을 보냈습니다",
        type: "gift",
      },
      {
        time: "2025-12-11 14:40",
        sender: "김철수",
        message: "와 감사합니다!",
      },
      {
        time: "2025-12-11 14:42",
        sender: "유진",
        message: "[이미지]",
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1639056610940-d7e9b0af3a99?w=1080",
      },
      {
        time: "2025-12-11 14:45",
        sender: "김철수",
        message: "와 진짜 이쁘네요!",
      },
      {
        time: "2025-12-12 10:15",
        sender: "김철수",
        message: "오늘 날씨 좋네요",
      },
      {
        time: "2025-12-12 10:20",
        sender: "유진",
        message: "그러게요. 산책하기 딱 좋은 날씨예요",
      },
      {
        time: "2025-12-12 10:25",
        sender: "김철수",
        message: "초콜릿 박스를 보냈습니다",
        type: "gift",
      },
      {
        time: "2025-12-12 10:30",
        sender: "유진",
        message: "우와 제가 좋아하는 건데",
      },
      {
        time: "2025-12-12 10:35",
        sender: "유진",
        message: "정말 감사합니다 ㅎㅎ",
      },
      {
        time: "2025-12-13 18:00",
        sender: "유진",
        message: "저녁 드셨어요?",
      },
      {
        time: "2025-12-13 18:05",
        sender: "김철수",
        message: "아직이요. 뭐 먹을까 고민 중이에요",
      },
      {
        time: "2025-12-13 18:10",
        sender: "유진",
        message: "같이 저녁 어때요?",
      },
      {
        time: "2025-12-13 18:15",
        sender: "김철수",
        message: "좋아요! 어디서 만날까요?",
      },
      {
        time: "2025-12-13 18:20",
        sender: "유진",
        message: "강남역 근처 어떠세요?",
      },
      {
        time: "2025-12-13 18:25",
        sender: "김철수",
        message: "좋아요 7시에 봐요!",
      },
      {
        time: "2025-12-14 21:30",
        sender: "유진",
        message: "오늘도 즐거웠습니다",
      },
      {
        time: "2025-12-14 21:35",
        sender: "김철수",
        message: "저도요! 맛있는 거 많이 먹었어요",
      },
      {
        time: "2025-12-14 21:40",
        sender: "유진",
        message: "다음에는 영화 보러 갈까요?",
      },
      {
        time: "2025-12-14 21:45",
        sender: "김철수",
        message: "좋아요! 보고 싶은 영화가 있어요",
      },
      {
        time: "2025-12-15 11:00",
        sender: "유진",
        message: "좋은 아침이에요",
      },
      {
        time: "2025-12-15 11:05",
        sender: "김철수",
        message: "좋은 아침입니다!",
      },
    ],
    민지: [
      {
        time: "2025-12-08 15:20",
        sender: "민지",
        message: "안녕하세요~",
      },
      {
        time: "2025-12-08 15:22",
        sender: "김철수",
        message: "안녕하세요!",
      },
      {
        time: "2025-12-08 15:25",
        sender: "민지",
        message: "프로필이 멋지시네요",
      },
      {
        time: "2025-12-08 15:27",
        sender: "김철수",
        message: "감사합니다 ^^",
      },
      {
        time: "2025-12-09 10:00",
        sender: "김철수",
        message: "좋은 아침이에요",
      },
      {
        time: "2025-12-09 10:05",
        sender: "민지",
        message: "좋은 아침입니다!",
      },
      {
        time: "2025-12-09 10:10",
        sender: "민지",
        message: "오늘 시간 되세요?",
      },
      {
        time: "2025-12-09 10:15",
        sender: "김철수",
        message: "네 오후에 괜찮아요",
      },
      {
        time: "2025-12-09 10:20",
        sender: "민지",
        message: "샴페인을 보냈습니다",
        type: "gift",
      },
      {
        time: "2025-12-09 10:25",
        sender: "김철수",
        message: "와 감사합니다!",
      },
    ],
  };

  // 추천코드로 가입한 회원 목록
  const [members] = useState<Member[]>([
    {
      id: 1,
      name: "김철수",
      nickname: "철수맨",
      email: "kim@example.com",
      phone: "010-1234-5678",
      location: "서울시 강남구",
      gender: "남성",
      age: 28,
      joined: "2024-03-15 09:30",
      joinedAt: "2024-03-15",
      totalSpent: 150000,
      status: "활성",
      lastLogin: "2024-12-17 14:25",
      points: 15000,
      online: true,
      bank: "국민은행",
      accountNumber: "123456789012",
      accountHolder: "김철수",
      joinIp: "192.168.1.100",
      lastIp: "192.168.1.105",
      profileImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      recentPurchases: [
        {
          date: "2024-12-15",
          amount: 50000,
          description: "포인트 충전",
        },
        {
          date: "2024-12-10",
          amount: 100000,
          description: "프리미엄 패키지",
        },
      ],
    },
    {
      id: 2,
      name: "이영희",
      nickname: "영희공주",
      email: "lee@example.com",
      phone: "010-2345-6789",
      location: "서울시 서초구",
      gender: "여성",
      age: 26,
      joined: "2024-03-20 15:40",
      joinedAt: "2024-03-20",
      totalSpent: 230000,
      status: "활성",
      lastLogin: "2024-12-16 18:30",
      points: 28000,
      online: false,
      bank: "신한은행",
      accountNumber: "987654321098",
      accountHolder: "이영희",
      joinIp: "192.168.1.110",
      lastIp: "192.168.1.115",
      profileImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      recentPurchases: [
        {
          date: "2024-12-14",
          amount: 80000,
          description: "채팅 패키지",
        },
        {
          date: "2024-12-01",
          amount: 150000,
          description: "VIP 멤버십",
        },
      ],
    },
    {
      id: 3,
      name: "박민수",
      nickname: "민수킹",
      email: "park@example.com",
      phone: "010-3456-7890",
      location: "경기도 수원시",
      gender: "남성",
      age: 32,
      joined: "2024-04-01 11:20",
      joinedAt: "2024-04-01",
      totalSpent: 89000,
      status: "활성",
      lastLogin: "2024-12-15 20:15",
      points: 8500,
      online: false,
      bank: "우리은행",
      accountNumber: "456789012345",
      accountHolder: "박민수",
      joinIp: "192.168.1.120",
      lastIp: "192.168.1.125",
      profileImage:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      recentPurchases: [
        {
          date: "2024-12-12",
          amount: 39000,
          description: "베이직 패키지",
        },
        {
          date: "2024-11-28",
          amount: 50000,
          description: "포인트 충전",
        },
      ],
    },
    {
      id: 4,
      name: "최지우",
      nickname: "지우별",
      email: "choi@example.com",
      phone: "010-4567-8901",
      location: "서울시 송파구",
      gender: "여성",
      age: 29,
      joined: "2024-04-10 16:50",
      joinedAt: "2024-04-10",
      totalSpent: 320000,
      status: "활성",
      lastLogin: "2024-12-17 10:40",
      points: 42000,
      online: true,
      bank: "하나은행",
      accountNumber: "321098765432",
      accountHolder: "최지우",
      joinIp: "192.168.1.130",
      lastIp: "192.168.1.135",
      profileImage:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      recentPurchases: [
        {
          date: "2024-12-16",
          amount: 120000,
          description: "프리미엄 플러스",
        },
        {
          date: "2024-12-05",
          amount: 200000,
          description: "연간 멤버십",
        },
      ],
    },
    {
      id: 5,
      name: "정우진",
      nickname: "우진짱",
      email: "jung@example.com",
      phone: "010-5678-9012",
      location: "부산시 해운대구",
      gender: "남성",
      age: 35,
      joined: "2024-05-05 13:20",
      joinedAt: "2024-05-05",
      totalSpent: 195000,
      status: "정지",
      lastLogin: "2024-12-10 22:10",
      points: 5200,
      online: false,
      bank: "기업은행",
      accountNumber: "789012345678",
      accountHolder: "정우진",
      joinIp: "192.168.1.140",
      lastIp: "192.168.1.145",
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      recentPurchases: [
        {
          date: "2024-12-08",
          amount: 95000,
          description: "포인트 충전",
        },
        {
          date: "2024-11-25",
          amount: 100000,
          description: "베이직 패키지",
        },
      ],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "활성":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "정지":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.nickname
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (member.joinIp && member.joinIp.includes(searchTerm)) ||
      (member.lastIp && member.lastIp.includes(searchTerm));

    const matchesStatus =
      statusFilter === "all" || member.status === statusFilter;

    // 가입 날짜 필터링
    let matchesJoinDateRange = true;
    if (joinStartDate || joinEndDate) {
      const memberJoinDate = (member.joinedAt || member.joined).split(' ')[0]; // "2024-03-15 09:30" -> "2024-03-15"
      
      if (joinStartDate && memberJoinDate < joinStartDate) {
        matchesJoinDateRange = false;
      }
      if (joinEndDate && memberJoinDate > joinEndDate) {
        matchesJoinDateRange = false;
      }
    }

    return matchesSearch && matchesStatus && matchesJoinDateRange;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">
              회원 관리
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-300">
                전체 {filteredMembers.length}명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-green-400">
                활성{" "}
                {
                  members.filter((u) => u.status === "활성")
                    .length
                }
                명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-red-400">
                정지{" "}
                {
                  members.filter((u) => u.status === "정지")
                    .length
                }
                명
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-blue-400">
                현재접속{" "}
                {members.filter((u) => u.online).length}명
              </span>
            </div>
          </div>
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">전체 상태</option>
                <option value="활성">활성</option>
                <option value="정지">정지</option>
              </select>
            </div>

            {/* Join Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={joinStartDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setJoinStartDate(newStart);
                  if (joinEndDate) {
                    setIsJoinDateRangeValid(newStart <= joinEndDate);
                  } else {
                    setIsJoinDateRangeValid(true);
                  }
                }}
                className={`bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                  !isJoinDateRangeValid ? "border-red-500" : "border-gray-700"
                }`}
                placeholder="시작일"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={joinEndDate}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setJoinEndDate(newEnd);
                  if (joinStartDate) {
                    setIsJoinDateRangeValid(joinStartDate <= newEnd);
                  } else {
                    setIsJoinDateRangeValid(true);
                  }
                }}
                className={`bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                  !isJoinDateRangeValid ? "border-red-500" : "border-gray-700"
                }`}
                placeholder="종료일"
              />
              {(joinStartDate || joinEndDate) && (
                <button
                  onClick={() => {
                    setJoinStartDate("");
                    setJoinEndDate("");
                    setIsJoinDateRangeValid(true);
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors whitespace-nowrap"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
          {!isJoinDateRangeValid && (
            <p className="text-red-400 text-xs mt-2">
              종료일은 시작일보다 이전일 수 없습니다.
            </p>
          )}
        </div>

        {/* Members Table */}
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
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-2 text-center h-16">
                      <div className="flex items-center justify-center gap-3 h-full">
                        <div className="relative flex-shrink-0">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProfileImage(
                                  member.profileImage || "",
                                );
                                setSelectedProfileName(
                                  member.name,
                                );
                                setShowProfileImageModal(true);
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                          )}
                          {member.online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm leading-tight">
                            {member.nickname}{" "}
                            <span className="text-white text-sm">
                              ({member.name})
                            </span>
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{member.joined}</p>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {member.lastLogin}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="text-gray-300 text-sm h-full flex items-center justify-center">
                        <div>
                          <p>{member.joinIp}</p>
                          <p className="text-gray-500 text-sm mt-0.5">
                            {member.lastIp}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16">
                      <div className="h-full flex items-center justify-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                            member.status,
                          )}`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 text-center h-16 text-white text-sm">
                      <div className="h-full flex flex-col items-center justify-center">
                        <span className="text-indigo-400 font-semibold">
                          {member.points.toLocaleString()} P
                        </span>
                      </div>
                    </td>
                    <td className="px-2 h-16">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
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

      {/* Profile Image Modal */}
      {showProfileImageModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileImageModal(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setShowProfileImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedProfileImage}
              alt={selectedProfileName}
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <p className="text-white text-center mt-4">
              {selectedProfileName}
            </p>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {showDetailsModal && selectedMember && (
        <UserDetailModal
          user={{
            ...selectedMember,
            status: selectedMember.status,
            referralCode: agentInfo.referralCode,
          }}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMember(null);
          }}
          chatMessages={chatMessages}
          isReadOnly={true}
        />
      )}
    </AdminLayout>
  );
}