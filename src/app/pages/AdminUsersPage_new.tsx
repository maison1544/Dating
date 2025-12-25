import { AdminLayout } from "../components/AdminLayout";
import { useState } from "react";
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
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
    },
    {
      id: 5,
      name: "이서연",
      nickname: "서연",
      email: "seoyeon@example.com",
      phone: "010-5678-9012",
      joined: "2025-12-14 10:20",
      lastLogin: "2025-12-15 08:15",
      joinIp: "192.168.1.104",
      lastIp: "192.168.1.104",
      status: "활성",
      points: 8000,
      online: false,
      bank: "농협은행",
      accountNumber: "555666777888",
      accountHolder: "이서연",
      revenue: 89000,
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
  ];

  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedBetDate, setSelectedBetDate] = useState("");
  const [selectedPointDate, setSelectedPointDate] = useState("");
  const [selectedGiftDate, setSelectedGiftDate] = useState("");
  const [selectedChatDate, setSelectedChatDate] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 채팅 메시지 샘플 데이터
  const chatMessages: Record<string, Array<{time: string, sender: string, message: string}>> = {
    "유진": [
      { time: "2025-12-15 11:00", sender: "유진", message: "안녕하세요" },
      { time: "2025-12-15 11:01", sender: "소희", message: "네 안녕하세요!" },
      { time: "2025-12-15 11:03", sender: "유진", message: "프로필 사진 정말 예쁘네요" },
      { time: "2025-12-15 11:05", sender: "소희", message: "감사합니다 ^^" },
      { time: "2025-12-15 11:07", sender: "유진", message: "커피 한잔 어떠세요?" },
      { time: "2025-12-15 11:10", sender: "소희", message: "좋아요! 언제가 좋으세요?" },
      { time: "2025-12-15 11:12", sender: "유진", message: "이번 주말은 어떠세요?" },
      { time: "2025-12-15 11:15", sender: "소희", message: "토요일 오후 2시 괜찮을까요?" },
    ],
    "민지": [
      { time: "2025-12-14 16:30", sender: "민지", message: "선물 감사합니다" },
      { time: "2025-12-14 16:32", sender: "소희", message: "천만에요~" },
      { time: "2025-12-14 16:35", sender: "민지", message: "오늘 시간 되세요?" },
      { time: "2025-12-14 16:40", sender: "소희", message: "죄송하지만 오늘은 약속이 있어요" },
      { time: "2025-12-14 16:45", sender: "민지", message: "아 그렇군요. 다음에 또 연락드릴게요" },
      { time: "2025-12-14 16:47", sender: "소희", message: "네 언제든지 연락주세요!" },
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
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
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
            <table className="w-full">
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
                    className="hover:bg-gray-800/50 transition-colors h-16"
                  >
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-500/80 rounded-full flex items-center justify-center text-white text-sm">
                            {user.name[0]}
                          </div>
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
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="text-gray-300 text-xs">
                        <p>{user.joined}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{user.lastLogin}</p>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="text-gray-300 text-xs">
                        <p>{user.joinIp}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{user.lastIp}</p>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center align-middle text-white text-sm">
                      {user.points.toLocaleString()} P
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center justify-center gap-1">
                        {user.status === "활성" ? (
                          <button
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-500"
                            title="정지"
                          >
                            <Ban size={16} />
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
            
            {/* Rest of modal content - continuing from original file... */}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminUsersPage;
