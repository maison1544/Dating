import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Image as ImageIcon,
  MessageCircle,
  List,
  Filter,
  Gift,
  ChevronLeft,
} from "lucide-react";

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: string;
  isMe: boolean;
  type?: "text" | "gift" | "image";
  imageUrl?: string;
}

interface ChatConversation {
  id: number;
  userName: string;
  userImage: string;
  profileName: string;
  profileImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean; // 온라인 상태
  messages: ChatMessage[];
}

interface ChatModal {
  id: number;
  conversation: ChatConversation;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isBubbleMode: boolean;
  isDragging: boolean;
  isResizing: boolean;
  dragStart: { x: number; y: number };
  resizeStart: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 선물 목록
const GIFTS = [
  { id: 1, name: "장미", points: 80, icon: "🌹" },
  { id: 2, name: "초콜릿", points: 240, icon: "🍫" },
  { id: 3, name: "샴페인", points: 400, icon: "🍾" },
  { id: 4, name: "하트 풍선", points: 160, icon: "💝" },
  { id: 5, name: "다이아 반지", points: 800, icon: "💍" },
  { id: 6, name: "럭셔리 향수", points: 2000, icon: "🧴" },
];

export function AgentChatsPage() {
  const [selectedChat, setSelectedChat] =
    useState<ChatConversation | null>(null);
  const [chatModals, setChatModals] = useState<ChatModal[]>([]);
  const [messageInputs, setMessageInputs] = useState<
    Record<number, string>
  >({});
  const [profileFilter, setProfileFilter] =
    useState<string>("all");
  const [showGiftModal, setShowGiftModal] = useState<
    number | null
  >(null);
  const [activeModalId, setActiveModalId] = useState<
    number | null
  >(null);
  const [imagePreviewModal, setImagePreviewModal] = useState<
    string | null
  >(null);

  // 채팅 스크롤을 위한 refs
  const chatScrollRefs = useRef<
    Record<number, HTMLDivElement | null>
  >({});

  // 채팅 메시지 더미 데이터 (AdminUsersPage와 동일)
  const chatMessagesData: Record<
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
        sender: "소희",
        message: "네 안녕하세요!",
      },
      {
        time: "2025-12-10 09:05",
        sender: "유진",
        message: "프로필 보고 연락드렸어요",
      },
      {
        time: "2025-12-10 09:07",
        sender: "소희",
        message: "감사합니다 ^^",
      },
      {
        time: "2025-12-10 09:10",
        sender: "유진",
        message: "취미가 어떻게 되세요?",
      },
      {
        time: "2025-12-10 09:12",
        sender: "소희",
        message: "영화 보는 거 좋아해요",
      },
      {
        time: "2025-12-11 14:30",
        sender: "유진",
        message: "어제는 즐거웠어요",
      },
      {
        time: "2025-12-11 14:32",
        sender: "소희",
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
        sender: "소희",
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
        sender: "소희",
        message: "와 진짜 이쁘네요!",
      },
      {
        time: "2025-12-12 10:15",
        sender: "소희",
        message: "오늘 날씨 좋네요",
      },
      {
        time: "2025-12-12 10:20",
        sender: "유진",
        message: "그러게요. 산책하기 딱 좋은 날씨예요",
      },
      {
        time: "2025-12-12 10:25",
        sender: "소희",
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
        sender: "소희",
        message: "아직이요. 뭐 먹을까 고민 중이에요",
      },
      {
        time: "2025-12-13 18:10",
        sender: "유진",
        message: "같이 저녁 어때요?",
      },
      {
        time: "2025-12-13 18:15",
        sender: "소희",
        message: "좋아요! 어디서 만날까요?",
      },
      {
        time: "2025-12-13 18:20",
        sender: "유진",
        message: "강남역 근처 어떠세요?",
      },
      {
        time: "2025-12-13 18:25",
        sender: "소희",
        message: "좋아요 7시에 봐요!",
      },
      {
        time: "2025-12-14 21:30",
        sender: "유진",
        message: "오늘도 즐거웠습니다",
      },
      {
        time: "2025-12-14 21:35",
        sender: "소희",
        message: "저도요! 맛있는 거 많이 먹었어요",
      },
      {
        time: "2025-12-14 21:40",
        sender: "유진",
        message: "다음에는 영화 보러 갈까요?",
      },
      {
        time: "2025-12-14 21:45",
        sender: "소희",
        message: "좋아요! 보고 싶은 영화가 있어요",
      },
      {
        time: "2025-12-15 11:00",
        sender: "유진",
        message: "좋은 아침이에요",
      },
      {
        time: "2025-12-15 11:05",
        sender: "소희",
        message: "좋은 아침입니다!",
      },
      {
        time: "2025-12-15 11:10",
        sender: "유진",
        message: "프로필 사진 정말 예쁘네요",
      },
      {
        time: "2025-12-15 11:12",
        sender: "소희",
        message: "하트 쿠션을 보냈습니다",
        type: "gift",
      },
      {
        time: "2025-12-15 11:15",
        sender: "유진",
        message: "와 정말 감사합니다",
      },
      {
        time: "2025-12-15 11:20",
        sender: "유진",
        message: "커피 한잔 어떠세요?",
      },
      {
        time: "2025-12-15 11:25",
        sender: "소희",
        message: "좋아요! 언제가 좋으세요?",
      },
      {
        time: "2025-12-15 11:30",
        sender: "유진",
        message: "이번 주말은 어떠세요?",
      },
      {
        time: "2025-12-15 11:35",
        sender: "소희",
        message: "토요일 오후 2시 괜찮을까요?",
      },
      {
        time: "2025-12-15 11:40",
        sender: "유진",
        message: "완벽해요! 그럼 토요일에 봐요",
      },
      {
        time: "2025-12-15 11:45",
        sender: "소희",
        message: "네 기대할게요!",
      },
      {
        time: "2025-12-16 13:05",
        sender: "유진",
        message: "주말 약속 기대돼요",
      },
      {
        time: "2025-12-16 13:10",
        sender: "소희",
        message: "저도요! 어떤 카페 갈까요?",
      },
      {
        time: "2025-12-16 13:15",
        sender: "유진",
        message: "분위기 좋은 곳 찾아볼게요",
      },
      {
        time: "2025-12-16 13:20",
        sender: "소희",
        message: "좋아요! 연락 주세요",
      },
    ],
    민지: [
      {
        time: "2025-12-08 15:00",
        sender: "민지",
        message: "녕하세요!",
      },
      {
        time: "2025-12-08 15:05",
        sender: "소희",
        message: "안녕하세요 ^^",
      },
      {
        time: "2025-12-08 15:10",
        sender: "민지",
        message: "프로필이 인상적이네요",
      },
      {
        time: "2025-12-08 15:15",
        sender: "소희",
        message: "감사합니다",
      },
      {
        time: "2025-12-09 10:05",
        sender: "민지",
        message: "주말에 뭐 하세요?",
      },
      {
        time: "2025-12-09 10:10",
        sender: "소희",
        message: "특별한 계획은 없어요",
      },
      {
        time: "2025-12-09 10:15",
        sender: "민지",
        message: "같이 전시회 갈래요?",
      },
      {
        time: "2025-12-09 10:20",
        sender: "소희",
        message: "좋아요! 어떤 전시회인가요?",
      },
      {
        time: "2025-12-09 10:25",
        sender: "민지",
        message: "현대미술 전시회예요",
      },
      {
        time: "2025-12-10 16:00",
        sender: "민지",
        message: "오늘 전시회 정말 좋았어요",
      },
      {
        time: "2025-12-10 16:03",
        sender: "민지",
        message: "[이미지]",
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1647792845543-a8032c59cbdf?w=1080",
      },
      {
        time: "2025-12-10 16:05",
        sender: "소희",
        message: "저도 즐거웠어요!",
      },
      {
        time: "2025-12-10 16:10",
        sender: "소희",
        message: "장미 꽃다발을 보냈습니다",
        type: "gift",
      },
      {
        time: "2025-12-10 16:15",
        sender: "민지",
        message: "와 감사합니다!",
      },
      {
        time: "2025-12-11 20:00",
        sender: "민지",
        message: "저녁 드셨나요?",
      },
      {
        time: "2025-12-11 20:05",
        sender: "소희",
        message: "네 방금 먹었어요",
      },
      {
        time: "2025-12-11 20:10",
        sender: "민지",
        message: "뭐 드셨어요?",
      },
      {
        time: "2025-12-11 20:15",
        sender: "소희",
        message: "파스타 먹었어요",
      },
      {
        time: "2025-12-12 11:30",
        sender: "민지",
        message: "주말 약속 어때요?",
      },
      {
        time: "2025-12-12 11:35",
        sender: "소희",
        message: "좋아요! 어디로 갈까요?",
      },
      {
        time: "2025-12-12 11:40",
        sender: "민지",
        message: "한강 공원 산책 어때요?",
      },
      {
        time: "2025-12-12 11:45",
        sender: "소희",
        message: "완벽해요!",
      },
      {
        time: "2025-12-13 14:00",
        sender: "민지",
        message: "오늘 날씨가 너무 좋네요",
      },
      {
        time: "2025-12-13 14:05",
        sender: "소희",
        message: "그러게요. 산책하기 딱 좋아요",
      },
      {
        time: "2025-12-13 14:08",
        sender: "소희",
        message: "[이미지]",
        type: "image",
        imageUrl:
          "https://images.unsplash.com/photo-1542372147193-a7aca54189cd?w=1080",
      },
      {
        time: "2025-12-13 14:10",
        sender: "민지",
        message: "초콜릿 박스를 보냈습니다",
        type: "gift",
      },
      {
        time: "2025-12-13 14:15",
        sender: "소희",
        message: "감사합니다!",
      },
      {
        time: "2025-12-14 16:30",
        sender: "민지",
        message: "선물 정말 감사해요",
      },
      {
        time: "2025-12-14 16:32",
        sender: "소희",
        message: "천만에요~",
      },
      {
        time: "2025-12-14 16:33",
        sender: "소희",
        message: "하트 쿠션을 보냈습니다",
        type: "gift",
      },
      {
        time: "2025-12-14 16:35",
        sender: "민지",
        message: "오늘 시간 되세요?",
      },
      {
        time: "2025-12-14 16:40",
        sender: "소희",
        message: "죄송하지만 오늘은 약속이 있어요",
      },
      {
        time: "2025-12-14 16:45",
        sender: "민지",
        message: "아 그렇군요. 다음에 또 연락드릴게요",
      },
      {
        time: "2025-12-14 16:47",
        sender: "소희",
        message: "네 언제든지 연락주세요!",
      },
      {
        time: "2025-12-15 09:00",
        sender: "민지",
        message: "좋은 아침이에요",
      },
      {
        time: "2025-12-15 09:05",
        sender: "소희",
        message: "좋은 아침입니다!",
      },
      {
        time: "2025-12-15 09:10",
        sender: "민지",
        message: "오늘 점심 같이 어때요?",
      },
      {
        time: "2025-12-15 09:15",
        sender: "소희",
        message: "좋아요! 뭐 먹을까요?",
      },
      {
        time: "2025-12-15 09:20",
        sender: "민지",
        message: "일식 어때요?",
      },
      {
        time: "2025-12-15 09:25",
        sender: "소희",
        message: "완벽해요! 12시에 만나요",
      },
      {
        time: "2025-12-16 18:00",
        sender: "민지",
        message: "오늘도 즐거웠어요",
      },
      {
        time: "2025-12-16 18:05",
        sender: "소희",
        message: "저도요! 다음에 또 만나요",
      },
      {
        time: "2025-12-17 10:00",
        sender: "민지",
        message: "이번 주말 계획 있나요?",
      },
      {
        time: "2025-12-17 10:05",
        sender: "소희",
        message: "아직 없어요. 왜요?",
      },
      {
        time: "2025-12-17 10:10",
        sender: "민지",
        message: "같이 영화 보러 갈래요?",
      },
      {
        time: "2025-12-17 10:15",
        sender: "소희",
        message: "좋아요! 어떤 영화 볼까요?",
      },
      {
        time: "2025-12-17 10:20",
        sender: "민지",
        message: "새로 나온 액션 영화 어때요?",
      },
      {
        time: "2025-12-17 10:25",
        sender: "소희",
        message: "완벽해요! 일요일에 봐요",
      },
    ],
  };

  // 채팅 대화 목록
  const [conversations] = useState<ChatConversation[]>([
    {
      id: 1,
      userName: "유진",
      userImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      profileName: "소희",
      profileImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      lastMessage: "좋아요! 연락 주세요",
      lastMessageTime: "13:20",
      unreadCount: 2,
      isOnline: true,
      messages: (chatMessagesData["유진"] || []).map(
        (msg, idx) => ({
          id: idx + 1,
          senderId: msg.sender === "유진" ? 1 : 2,
          senderName: msg.sender,
          message: msg.message,
          timestamp: msg.time,
          isMe: msg.sender !== "유진",
          type:
            msg.type === "gift"
              ? "gift"
              : msg.type === "image"
                ? "image"
                : "text",
          imageUrl: msg.imageUrl,
        }),
      ),
    },
    {
      id: 2,
      userName: "민지",
      userImage:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      profileName: "소희",
      profileImage:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      lastMessage: "완벽해요! 일요일에 봐요",
      lastMessageTime: "10:25",
      unreadCount: 0,
      isOnline: false,
      messages: (chatMessagesData["민지"] || []).map(
        (msg, idx) => ({
          id: idx + 1,
          senderId: msg.sender === "민지" ? 3 : 4,
          senderName: msg.sender,
          message: msg.message,
          timestamp: msg.time,
          isMe: msg.sender !== "민지",
          type:
            msg.type === "gift"
              ? "gift"
              : msg.type === "image"
                ? "image"
                : "text",
          imageUrl: msg.imageUrl,
        }),
      ),
    },
  ]);

  // 프로필 목록 추출
  const profileList = Array.from(
    new Set(conversations.map((c) => c.profileName)),
  );

  // 필터링된 대화 목록
  const filteredConversations =
    profileFilter === "all"
      ? conversations
      : conversations.filter(
          (c) => c.profileName === profileFilter,
        );

  const handleChatClick = (
    conv: ChatConversation,
    isCtrlClick: boolean,
  ) => {
    if (isCtrlClick) {
      // Ctrl+클릭: 새 모달 추가
      // 마지막 모달의 크기를 사용하거나, 없으면 기본 크기 사용
      const lastModal = chatModals[chatModals.length - 1];
      const baseSize = lastModal
        ? lastModal.size
        : { width: 600, height: 700 };

      const newModal: ChatModal = {
        id: Date.now(),
        conversation: conv,
        position: {
          x:
            window.innerWidth / 2 -
            baseSize.width / 2 +
            chatModals.length * 30,
          y:
            window.innerHeight / 2 -
            baseSize.height / 2 +
            chatModals.length * 30,
        },
        size: baseSize,
        isBubbleMode: true,
        isDragging: false,
        isResizing: false,
        dragStart: { x: 0, y: 0 },
        resizeStart: { x: 0, y: 0, width: 0, height: 0 },
      };
      setChatModals([...chatModals, newModal]);
      setActiveModalId(newModal.id);
    } else {
      // 일반 클릭: 우측 영역에 표시
      setSelectedChat(conv);
    }
  };

  const closeModal = (modalId: number) => {
    setChatModals(chatModals.filter((m) => m.id !== modalId));
    if (activeModalId === modalId) {
      setActiveModalId(null);
    }
  };

  const updateModal = (
    modalId: number,
    updates: Partial<ChatModal>,
  ) => {
    setChatModals(
      chatModals.map((m) =>
        m.id === modalId ? { ...m, ...updates } : m,
      ),
    );
  };

  const handleMouseDown = (
    modalId: number,
    e: React.MouseEvent,
  ) => {
    const modal = chatModals.find((m) => m.id === modalId);
    if (!modal) return;

    setActiveModalId(modalId);
    updateModal(modalId, {
      isDragging: true,
      dragStart: {
        x: e.clientX - modal.position.x,
        y: e.clientY - modal.position.y,
      },
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    chatModals.forEach((modal) => {
      if (modal.isDragging) {
        updateModal(modal.id, {
          position: {
            x: e.clientX - modal.dragStart.x,
            y: e.clientY - modal.dragStart.y,
          },
        });
      }
      if (modal.isResizing) {
        const newWidth = Math.max(
          400,
          modal.resizeStart.width +
            (e.clientX - modal.resizeStart.x),
        );
        const newHeight = Math.max(
          500,
          modal.resizeStart.height +
            (e.clientY - modal.resizeStart.y),
        );
        updateModal(modal.id, {
          size: { width: newWidth, height: newHeight },
        });
      }
    });
  };

  const handleMouseUp = () => {
    chatModals.forEach((modal) => {
      if (modal.isDragging || modal.isResizing) {
        updateModal(modal.id, {
          isDragging: false,
          isResizing: false,
        });
      }
    });
  };

  const handleResizeStart = (
    modalId: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const modal = chatModals.find((m) => m.id === modalId);
    if (!modal) return;

    updateModal(modalId, {
      isResizing: true,
      resizeStart: {
        x: e.clientX,
        y: e.clientY,
        width: modal.size.width,
        height: modal.size.height,
      },
    });
  };

  const handleSendMessage = (conversationId: number) => {
    const input = messageInputs[conversationId] || "";
    if (!input.trim()) return;

    console.log("메시지 전송:", input);
    setMessageInputs({
      ...messageInputs,
      [conversationId]: "",
    });
  };

  const handleSendGift = (gift: (typeof GIFTS)[0]) => {
    console.log(`선물 전송: ${gift.name} (${gift.points}P)`);
    setShowGiftModal(null);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    conversationId: number,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(conversationId);
    }
  };

  // 전역 마우스 이벤트
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [chatModals]);

  // 선물 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (showGiftModal !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showGiftModal]);

  // 선택된 채팅이 변경될 때 자동 스크롤
  useEffect(() => {
    if (
      selectedChat &&
      chatScrollRefs.current[selectedChat.id]
    ) {
      // DOM 렌더링 완료 후 스크롤 적용
      setTimeout(() => {
        const scrollEl =
          chatScrollRefs.current[selectedChat.id];
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }
      }, 0);
    }
  }, [selectedChat?.id]);

  // 모달 채팅이 열릴 때 자동 스크롤
  useEffect(() => {
    chatModals.forEach((modal) => {
      const scrollEl =
        chatScrollRefs.current[modal.conversation.id];
      if (scrollEl) {
        setTimeout(() => {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }, 0);
      }
    });
  }, [chatModals.length]);

  const renderChatWindow = (
    conversation: ChatConversation,
    isBubbleMode: boolean,
    onToggleMode: () => void,
    messageInput: string,
    onMessageChange: (value: string) => void,
    onSend: () => void,
    onKeyPress: (e: React.KeyboardEvent) => void,
    onShowGift: () => void,
    scrollRef?: React.RefObject<HTMLDivElement>,
  ) => {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* 메시지 목록 - 말풍선 모드 */}
        {isBubbleMode ? (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
          >
            {conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
              >
                <div className="text-gray-400 text-xs mb-1">
                  {msg.senderName} · {msg.timestamp}
                </div>
                <div
                  className={`px-4 py-2 rounded-lg max-w-[70%] ${
                    msg.isMe
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  {msg.type === "gift" ? (
                    <span className="text-yellow-400">
                      🎁 {msg.message}
                    </span>
                  ) : msg.type === "image" ? (
                    <div>
                      <p className="mb-2">{msg.message}</p>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="이미지"
                          className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() =>
                            setImagePreviewModal(msg.imageUrl)
                          }
                        />
                      )}
                    </div>
                  ) : (
                    msg.message
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 메시지 목록 - 로그 모드 */
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 min-h-0"
          >
            <div className="space-y-1 text-sm">
              {conversation.messages.map((msg) => {
                const isGift = msg.type === "gift";
                const isImage = msg.type === "image";

                return (
                  <div
                    key={msg.id}
                    className={
                      isGift ? "text-pink-400" : "text-gray-300"
                    }
                  >
                    {isImage ? (
                      <span>
                        [{msg.timestamp}]{" "}
                        <span
                          className={
                            msg.isMe
                              ? "text-indigo-400"
                              : "text-emerald-400"
                          }
                        >
                          {msg.senderName}:
                        </span>{" "}
                        <span
                          onClick={() =>
                            setImagePreviewModal(
                              msg.imageUrl || null,
                            )
                          }
                          className="text-purple-400 cursor-pointer hover:text-purple-300 transition-colors"
                        >
                          {msg.message}
                        </span>
                      </span>
                    ) : (
                      <span>
                        [{msg.timestamp}]{" "}
                        <span
                          className={
                            msg.isMe
                              ? "text-indigo-400"
                              : "text-emerald-400"
                          }
                        >
                          {msg.senderName}:
                        </span>{" "}
                        {msg.message}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 메시지 입력 - 하단 고정 */}
        <div className="border-t border-gray-800 p-2.5 flex-shrink-0 bg-gray-900">
          <div className="flex gap-2">
            <button
              onClick={onShowGift}
              className="text-gray-400 hover:text-yellow-400 transition-colors p-2 flex-shrink-0"
              title="선물 보내기"
            >
              <Gift size={18} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors p-2 flex-shrink-0">
              <ImageIcon size={18} />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={onSend}
              className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Send size={16} />
              <span className="text-sm">전송</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-white text-2xl mb-2">
            채팅 관리
          </h1>
          <p className="text-gray-400 text-sm">
            배정받은 프로필로 회원들과 채팅하세요 (채팅목록을
            Ctrl키 누른 상태로 클릭하면 팝업창으로 볼 수
            있습니다)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[500px] min-h-0">
          {/* 채팅 목록 */}
          <div className={`lg:col-span-1 min-h-0 ${selectedChat && 'hidden lg:block'}`}>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden lg:h-full h-[500px] flex flex-col">
              {/* 목록 헤더 */}
              <div className="bg-gray-800 border-b border-gray-700 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-white font-medium">
                      채팅 목록
                    </h2>
                    <p className="text-gray-400 text-xs">
                      총 {filteredConversations.length}개 대화
                    </p>
                  </div>
                  <Filter size={16} className="text-gray-400" />
                </div>

                {/* 프로필 필터 */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setProfileFilter("all")}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      profileFilter === "all"
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    전체
                  </button>
                  {profileList.map((profile) => (
                    <button
                      key={profile}
                      onClick={() => setProfileFilter(profile)}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        profileFilter === profile
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
              </div>

              {/* 대화 목록 */}
              <div className="overflow-y-auto flex-1">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={(e) =>
                      handleChatClick(
                        conv,
                        e.ctrlKey || e.metaKey,
                      )
                    }
                    className={`w-full p-3 text-left transition-colors border-b border-gray-800 last:border-b-0 ${
                      selectedChat?.id === conv.id
                        ? "bg-indigo-500/10 border-l-4 border-l-indigo-500"
                        : "hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={conv.userImage}
                          alt={conv.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {/* 온라인 상태 표시 */}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${conv.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        {/* 읽지 않은 메시지 수 */}
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-medium truncate text-sm">
                            {conv.userName}
                          </h3>
                          <span className="text-gray-500 text-xs flex-shrink-0 ml-2">
                            {conv.lastMessageTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={conv.profileImage}
                            alt={conv.profileName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <p className="text-indigo-400 text-xs">
                            {conv.profileName}
                          </p>
                        </div>
                        <p className="text-gray-400 text-xs truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 우측 고정 채팅 화면 */}
          <div className="lg:col-span-2 relative min-h-0">
            {selectedChat ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg h-[calc(100vh-200px)] lg:h-full flex flex-col min-h-0">
                {/* 채팅 헤더 */}
                <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden text-gray-400 hover:text-white transition-colors p-2"
                      title="뒤로 가기"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <img
                      src={selectedChat.userImage}
                      alt={selectedChat.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-white font-medium text-sm">
                        {selectedChat.userName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedChat.profileImage}
                          alt={selectedChat.profileName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <p className="text-indigo-400 text-xs">
                          {selectedChat.profileName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const isBubble =
                          messageInputs[
                            `bubble_${selectedChat.id}`
                          ] !== "false";
                        setMessageInputs({
                          ...messageInputs,
                          [`bubble_${selectedChat.id}`]:
                            isBubble ? "false" : "true",
                        });
                      }}
                      className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                      title="모드 전환"
                    >
                      {messageInputs[
                        `bubble_${selectedChat.id}`
                      ] !== "false" ? (
                        <MessageCircle size={16} />
                      ) : (
                        <List size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="hidden lg:block text-gray-400 hover:text-white transition-colors p-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {renderChatWindow(
                  selectedChat,
                  messageInputs[`bubble_${selectedChat.id}`] !==
                    "false",
                  () => {},
                  messageInputs[selectedChat.id] || "",
                  (value) =>
                    setMessageInputs({
                      ...messageInputs,
                      [selectedChat.id]: value,
                    }),
                  () => handleSendMessage(selectedChat.id),
                  (e) => handleKeyPress(e, selectedChat.id),
                  () => setShowGiftModal(selectedChat.id),
                  {
                    current:
                      chatScrollRefs.current[selectedChat.id] ||
                      null,
                  } as React.RefObject<HTMLDivElement>,
                )}
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare
                    size={64}
                    className="text-gray-700 mx-auto mb-4"
                  />
                  <p className="text-gray-400 text-sm">
                    채팅을 선택하여 대화를 시작하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 플로팅 채팅 모달들 */}
      {chatModals.map((modal) => (
        <div
          key={modal.id}
          className="fixed bg-gray-900 border border-gray-800 rounded-lg shadow-2xl flex flex-col"
          style={{
            left: `${modal.position.x}px`,
            top: `${modal.position.y}px`,
            width: `${modal.size.width}px`,
            height: `${modal.size.height}px`,
            zIndex: activeModalId === modal.id ? 100 : 50,
          }}
        >
          {/* 모달 헤더 */}
          <div
            className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between cursor-move"
            onMouseDown={(e) => handleMouseDown(modal.id, e)}
          >
            <div className="flex items-center gap-3">
              <img
                src={modal.conversation.userImage}
                alt={modal.conversation.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="text-white font-medium text-sm">
                  {modal.conversation.userName}
                </h3>
                <div className="flex items-center gap-2">
                  <img
                    src={modal.conversation.profileImage}
                    alt={modal.conversation.profileName}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <p className="text-indigo-400 text-xs">
                    {modal.conversation.profileName}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateModal(modal.id, {
                    isBubbleMode: !modal.isBubbleMode,
                  })
                }
                className={`p-2 rounded-lg transition-colors ${
                  modal.isBubbleMode
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
                title="모드 전환"
              >
                {modal.isBubbleMode ? (
                  <MessageCircle size={16} />
                ) : (
                  <List size={16} />
                )}
              </button>
              <button
                onClick={() => closeModal(modal.id)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {renderChatWindow(
            modal.conversation,
            modal.isBubbleMode,
            () =>
              updateModal(modal.id, {
                isBubbleMode: !modal.isBubbleMode,
              }),
            messageInputs[modal.conversation.id] || "",
            (value) =>
              setMessageInputs({
                ...messageInputs,
                [modal.conversation.id]: value,
              }),
            () => handleSendMessage(modal.conversation.id),
            (e) => handleKeyPress(e, modal.conversation.id),
            () => setShowGiftModal(modal.conversation.id),
          )}

          {/* 크기 조정 핸들 */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-indigo-500/30 hover:bg-indigo-500/50 transition-colors flex items-center justify-center rounded-tl-lg"
            onMouseDown={(e) => handleResizeStart(modal.id, e)}
            title="드래그하여 크기 조정"
          >
            <div className="text-indigo-300 text-xs font-bold">
              ⇲
            </div>
          </div>
        </div>
      ))}

      {/* 선물 보내기 모달 */}
      {showGiftModal !== null &&
        (() => {
          const currentConv =
            selectedChat?.id === showGiftModal
              ? selectedChat
              : chatModals.find(
                  (m) => m.conversation.id === showGiftModal,
                )?.conversation;

          if (!currentConv) return null;

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-medium">
                    선물 보내기
                  </h3>
                  <button
                    onClick={() => setShowGiftModal(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* 프로필 및 회원 정보 */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={currentConv.profileImage}
                      alt={currentConv.profileName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                    />
                    <div className="flex-1">
                      <p className="text-indigo-400 text-sm font-medium">
                        프로필: {currentConv.profileName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        내가 사용 중인 프로필
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentConv.userImage}
                        alt={currentConv.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          받는 회원: {currentConv.userName}
                        </p>
                        <p className="text-gray-500 text-xs">
                          선물을 받을 회원
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {GIFTS.map((gift) => (
                    <button
                      key={gift.id}
                      onClick={() => handleSendGift(gift)}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 transition-colors text-center"
                    >
                      <div className="text-4xl mb-2">
                        {gift.icon}
                      </div>
                      <p className="text-white text-sm font-medium mb-1">
                        {gift.name}
                      </p>
                      <p className="text-yellow-400 text-xs">
                        {gift.points}P
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      {/* 이미지 미리보기 모달 */}
      {imagePreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">
                이미지 미리보기
              </h3>
              <button
                onClick={() => setImagePreviewModal(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <img
              src={imagePreviewModal}
              alt="미리보기"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}