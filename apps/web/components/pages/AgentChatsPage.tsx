import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState, useEffect, useMemo, useRef } from "react";
import { Send, Gift, ChevronLeft, List, Bell, BellOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAgentChatProfiles,
  useAgentChatRooms,
  useAgentGifts,
  useAgentGiftTransactions,
  useRealtimeChat,
  useSendMessage,
  useMarkMessagesAsRead,
} from "@/hooks/useSupabase";
import { useAlert } from "@/contexts/AlertContext";
import { getPublicUrlForPath } from "@/lib/utils/storage";
import { supabaseAdmin } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QuantityModal } from "@/components/layout/QuantityModal";
import {
  GiftSelectionModal,
  InventoryGift,
} from "@/components/layout/GiftSelectionModal";
import { ChatImageUpload } from "@/components/layout/ChatImageUpload";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  OnlineStatusIndicator,
  OnlineStatusText,
} from "@/components/layout/OnlineStatus";
import { formatKST } from "@/lib/utils/dateUtils";
import { useNotification } from "@/contexts/NotificationContext";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isMe: boolean;
  type?: "text" | "gift" | "image";
  imageUrl?: string;
}

interface ChatConversation {
  id: string;
  userId: string;
  profileId: string;
  userName: string;
  userImage: string | null;
  profileName: string;
  profileImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean; // 온라인 상태
  messages: ChatMessage[];
}

interface ChatModal {
  id: string;
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

type RenderChatWindowFn = (
  conversation: ChatConversation,
  isBubbleMode: boolean,
  onToggleMode: () => void,
  messageInput: string,
  onMessageChange: (value: string) => void,
  onSend: () => void,
  onKeyPress: (e: React.KeyboardEvent) => void,
  onShowGift: () => void,
  scrollRef?: React.RefObject<HTMLDivElement>,
) => JSX.Element;

const getAvatarFallbackText = (name: string) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
};

function NameAvatar({ name, src }: { name: string; src: string | null }) {
  return (
    <Avatar className="w-10 h-10">
      {src ? (
        <AvatarImage src={src} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback
        delayMs={0}
        className="bg-gray-700 text-gray-200 text-xs font-semibold"
      >
        {getAvatarFallbackText(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function InfoCircleIcon({
  className,
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="10" x2="12" y2="16"></line>
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none"></circle>
    </svg>
  );
}

function GiftRevenueInfoTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 rounded"
          aria-label="기프트 수익 계산 규칙"
        >
          <InfoCircleIcon />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-gray-900 text-gray-100 border border-gray-700 max-w-xs"
      >
        <div className="space-y-1">
          <p className="text-xs text-gray-200">
            기프트 수익 = 유저가 보낸 선물 금액 - 프로필이 보낸 선물 금액
          </p>
          <p className="text-xs text-gray-400">
            괄호는 유저가 보낸 선물 개수입니다.
          </p>
          <p className="text-xs text-gray-300">
            예: 하트(150P) 3개, 초콜릿(200P) 5개 → 기프트 수익 -550P(3개)
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function RealtimeChatWindow({
  conversation,
  isBubbleMode,
  onToggleMode,
  messageInput,
  onMessageChange,
  onSend,
  onKeyPress,
  onShowGift,
  renderChatWindow,
}: {
  conversation: ChatConversation;
  isBubbleMode: boolean;
  onToggleMode: () => void;
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onShowGift: () => void;
  renderChatWindow: RenderChatWindowFn;
}) {
  // Use admin mode to bypass RLS for agent chat
  const { messages: dbMessages } = useRealtimeChat(conversation.id, {
    useAdmin: true,
  });
  const { markAsRead } = useMarkMessagesAsRead();
  const scrollRef = useRef<HTMLDivElement>(null);

  const uiMessages = useMemo<ChatMessage[]>(() => {
    return (dbMessages || []).map((msg: any) => {
      const messageType = (msg.message_type || "text") as
        | "text"
        | "gift"
        | "image";

      const isMe =
        msg.sender_type === "profile" &&
        msg.sender_id === conversation.profileId;

      const timestamp = msg.created_at
        ? formatKST(msg.created_at, "datetime")
        : "";

      // Gift message format: 🎁{emoji} {recipient}님에게 {giftName} {qty}개를 보냈습니다!
      // isMe = true means profile (agent) sent to user, recipient = userName
      // isMe = false means user sent to profile (agent), recipient = profileName
      const giftEmoji = msg.gift_items?.emoji || "🎁";
      const giftName = msg.gift_items?.name || "선물";
      const giftQty = msg.gift_quantity || 1;
      const recipient = isMe ? conversation.userName : conversation.profileName;

      const message =
        messageType === "gift"
          ? `${giftEmoji} ${recipient}님에게 ${giftName} ${giftQty}개를 보냈습니다!`
          : (msg.content || msg.message || "").trim();

      return {
        id: msg.id,
        senderId: msg.sender_id,
        senderName: isMe ? conversation.profileName : conversation.userName,
        message: messageType === "image" ? "[이미지]" : message,
        imageUrl:
          messageType === "image"
            ? msg.content || msg.message || ""
            : undefined,
        timestamp,
        isMe,
        type: messageType,
      };
    });
  }, [
    dbMessages,
    conversation.profileId,
    conversation.profileName,
    conversation.userName,
  ]);

  useEffect(() => {
    if (!conversation.id || !conversation.profileId) return;
    void markAsRead(conversation.id, conversation.profileId);
  }, [conversation.id, conversation.profileId, dbMessages.length]);

  useEffect(() => {
    if (!scrollRef.current) return;
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  }, [conversation.id, uiMessages.length]);

  const conversationWithMessages = useMemo<ChatConversation>(() => {
    return { ...conversation, messages: uiMessages };
  }, [conversation, uiMessages]);

  return renderChatWindow(
    conversationWithMessages,
    isBubbleMode,
    onToggleMode,
    messageInput,
    onMessageChange,
    onSend,
    onKeyPress,
    onShowGift,
    scrollRef,
  );
}

// 선물 목록 - Supabase에서 가져옴

export function AgentChatsPage() {
  const { adminAccount } = useAuth();
  const { showAlert } = useAlert();
  const {
    addOpenChatModal,
    removeOpenChatModal,
    toggleChatMute,
    isChatMuted,
    setActiveChatId,
  } = useNotification();
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(
    null,
  );
  const [chatModals, setChatModals] = useState<ChatModal[]>([]);
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>(
    {},
  );
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [showGiftModal, setShowGiftModal] = useState<string | null>(null);
  const [pendingGift, setPendingGift] = useState<{
    conversationId: string;
    gift: InventoryGift;
  } | null>(null);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(
    null,
  );
  const [mainChatBubbleMode, setMainChatBubbleMode] = useState(true);
  const [totalRoomCountByUser, setTotalRoomCountByUser] = useState<
    Map<string, number>
  >(new Map());
  const [requestedChatId, setRequestedChatId] = useState<string | null>(null);
  const chatModalsRef = useRef<ChatModal[]>([]);

  // Supabase hooks for real data
  const { rooms: dbChatRooms, isLoading: roomsLoading } = useAgentChatRooms(
    adminAccount?.id,
  );
  const { profiles: dbProfiles, updateProfileOnline } = useAgentChatProfiles(
    adminAccount?.id,
  );
  const { agentGifts, refetch: refetchAgentGifts } = useAgentGifts(
    adminAccount?.id,
  );
  const { transactions: giftTransactions } = useAgentGiftTransactions(
    adminAccount?.id,
  );
  const { sendMessage, isLoading: sendingMessage } = useSendMessage();

  void roomsLoading;

  useEffect(() => {
    chatModalsRef.current = chatModals;
  }, [chatModals]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setRequestedChatId(new URLSearchParams(window.location.search).get("chatId"));
  }, []);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{ roomId?: string }>;
      if (customEvent.detail?.roomId) {
        setRequestedChatId(customEvent.detail.roomId);
      }
    };

    window.addEventListener("agent-chat-notification-open", handleOpenChat);
    return () => {
      window.removeEventListener("agent-chat-notification-open", handleOpenChat);
    };
  }, []);

  const isSelectedChatMuted = selectedChat
    ? isChatMuted(selectedChat.id, true)
    : false;

  // Transform agent's gift inventory to InventoryGift format
  const myGifts: InventoryGift[] = useMemo(
    () =>
      (agentGifts || [])
        .map((ag: any) => {
          const gift = ag.gifts;
          return {
            id: ag.id,
            gift_id: ag.gift_id,
            name: gift?.name,
            emoji: gift?.emoji,
            buy_price: Number(gift?.buy_price ?? 0),
            quantity: Number(ag.quantity ?? 0),
          };
        })
        .filter((g: any) => !!g.gift_id && !!g.name && g.quantity > 0),
    [agentGifts],
  );

  // 채팅 스크롤을 위한 refs
  const chatScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const profilesById = useMemo(() => {
    const map = new Map<string, any>();
    (dbProfiles || []).forEach((p: any) => {
      if (p?.id) map.set(p.id, p);
    });
    return map;
  }, [dbProfiles]);

  // Transform Supabase chat rooms to conversations
  const conversations: ChatConversation[] = useMemo(
    () =>
      (dbChatRooms || []).map((room: any) => ({
        id: room.id,
        userId: room.user_id,
        profileId: room.profile_id,
        userName: room.users?.nickname || room.users?.name || "Unknown",
        userImage: getPublicUrlForPath(
          "profile-images",
          room.users?.profile_image,
        ),
        profileName: room.chat_profiles?.name || "프로필",
        profileImage: getPublicUrlForPath(
          "chat-profile-images",
          room.chat_profiles?.image,
        ),
        lastMessage: room.last_message || "",
        lastMessageTime: room.last_message_at
          ? formatKST(room.last_message_at, "datetime")
          : "",
        unreadCount: room.profile_unread_count || 0,
        isOnline: !!room.users?.is_online,
        messages: [],
      })),
    [dbChatRooms],
  );

  // Fetch total room counts for all users (across all profiles, not just agent's)
  useEffect(() => {
    const userIds = [
      ...new Set(
        (dbChatRooms || []).map((r: any) => r.user_id).filter(Boolean),
      ),
    ];
    if (userIds.length === 0) {
      setTotalRoomCountByUser(new Map());
      return;
    }

    const fetchTotalRoomCounts = async () => {
      // Use RPC function to bypass RLS and get total room counts
      const { data, error } = await supabaseAdmin.rpc(
        "get_user_total_room_counts",
        { user_ids: userIds },
      );

      if (error || !data) {
        console.error("Failed to fetch total room counts:", error);
        setTotalRoomCountByUser(new Map());
        return;
      }

      const countMap = new Map<string, number>();
      (data as { user_id: string; room_count: number }[]).forEach((row) => {
        if (row.user_id) {
          countMap.set(row.user_id, Number(row.room_count));
        }
      });
      setTotalRoomCountByUser(countMap);
    };

    void fetchTotalRoomCounts();
  }, [dbChatRooms]);

  const profileStats = useMemo(() => {
    return { roomCountByUser: totalRoomCountByUser };
  }, [totalRoomCountByUser]);

  useEffect(() => {
    setActiveChatId(selectedChat?.id || null);
    return () => {
      setActiveChatId(null);
    };
  }, [selectedChat?.id, setActiveChatId]);

  // 채팅 모달 열림/닫힘 시 알림 컨텍스트에 반영
  useEffect(() => {
    chatModals.forEach((modal) => {
      addOpenChatModal(modal.conversation.id);
    });
    return () => {
      chatModals.forEach((modal) => {
        removeOpenChatModal(modal.conversation.id);
      });
    };
  }, [chatModals, addOpenChatModal, removeOpenChatModal]);

  const giftRevenueStats = useMemo(() => {
    const map: Record<
      string,
      {
        receivedCount: number;
        receivedValue: number;
        sentValue: number;
        netProfit: number;
      }
    > = {};

    (dbChatRooms || []).forEach((room: any) => {
      if (!room?.id) return;
      map[room.id] = {
        receivedCount: 0,
        receivedValue: 0,
        sentValue: 0,
        netProfit: 0,
      };
    });

    if (!giftTransactions || giftTransactions.length === 0) {
      return map;
    }

    giftTransactions.forEach((t: any) => {
      const roomId = t.room_id as string | undefined;
      if (!roomId || !map[roomId]) return;
      const quantity = Number(t.quantity ?? 1);
      const points = Number(t.points_amount ?? 0);
      if (t.receiver_type === "profile" && t.transaction_type === "send") {
        map[roomId].receivedCount += quantity;
        map[roomId].receivedValue += points;
      }
      if (t.sender_type === "profile" && t.transaction_type === "send") {
        map[roomId].sentValue += points;
      }
    });

    Object.keys(map).forEach((roomId) => {
      map[roomId].netProfit = map[roomId].receivedValue - map[roomId].sentValue;
    });

    return map;
  }, [dbChatRooms, giftTransactions]);

  const profileList = useMemo(() => {
    return (dbProfiles || []).map((p: any) => ({
      id: p.id as string,
      name: p.name || "프로필",
      isOnline: !!p.is_online,
    }));
  }, [dbProfiles]);

  // 필터링된 대화 목록
  const filteredConversations =
    profileFilter === "all"
      ? conversations
      : conversations.filter((c) => c.profileId === profileFilter);

  useEffect(() => {
    if (!requestedChatId) return;
    const target = conversations.find((conversation) => {
      return conversation.id === requestedChatId;
    });
    if (!target) return;
    setSelectedChat((current) => {
      return current?.id === target.id ? current : target;
    });
  }, [requestedChatId, conversations]);

  const handleChatClick = (conv: ChatConversation, isCtrlClick: boolean) => {
    if (isCtrlClick) {
      const existingModal = chatModalsRef.current.find(
        (modal) => modal.conversation.id === conv.id,
      );
      if (existingModal) {
        setActiveModalId(existingModal.id);
        return;
      }

      // Ctrl+클릭: 새 모달 추가
      // 마지막 모달의 크기를 사용하거나, 없으면 기본 크기 사용
      const currentModals = chatModalsRef.current;
      const lastModal = currentModals[currentModals.length - 1];
      const baseSize = lastModal ? lastModal.size : { width: 600, height: 700 };
      const modalCount = currentModals.length;

      const newModal: ChatModal = {
        id: crypto.randomUUID(),
        conversation: conv,
        position: {
          x:
            window.innerWidth / 2 - baseSize.width / 2 + modalCount * 30,
          y:
            window.innerHeight / 2 -
            baseSize.height / 2 +
            modalCount * 30,
        },
        size: baseSize,
        isBubbleMode: true,
        isDragging: false,
        isResizing: false,
        dragStart: { x: 0, y: 0 },
        resizeStart: { x: 0, y: 0, width: 0, height: 0 },
      };
      chatModalsRef.current = [...currentModals, newModal];
      setChatModals((prev) => {
        if (prev.some((modal) => modal.conversation.id === conv.id)) {
          return prev;
        }
        return [...prev, newModal];
      });
      setActiveModalId(newModal.id);
    } else {
      // 일반 클릭: 우측 영역에 표시
      setSelectedChat(conv);
    }
  };

  const closeModal = (modalId: string) => {
    setChatModals((prev) => prev.filter((m) => m.id !== modalId));
    if (activeModalId === modalId) {
      setActiveModalId(null);
    }
  };

  const updateModal = (modalId: string, updates: Partial<ChatModal>) => {
    setChatModals((prev) =>
      prev.map((m) => (m.id === modalId ? { ...m, ...updates } : m)),
    );
  };

  const handleMouseDown = (modalId: string, e: React.MouseEvent) => {
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
          modal.resizeStart.width + (e.clientX - modal.resizeStart.x),
        );
        const newHeight = Math.max(
          500,
          modal.resizeStart.height + (e.clientY - modal.resizeStart.y),
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

  const handleResizeStart = (modalId: string, e: React.MouseEvent) => {
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

  const handleSendMessage = async (conversationId: string) => {
    const input = messageInputs[conversationId] || "";
    if (!input.trim() || sendingMessage) return;

    const conv = findConversation(conversationId);
    if (!conv?.profileId) return;

    const content = input.trim();
    setMessageInputs((prev) => ({
      ...prev,
      [conversationId]: "",
    }));

    const result = await sendMessage(
      conversationId,
      conv.profileId,
      "profile",
      content,
      "text",
    );

    if (result.error) {
      showAlert({
        title: "오류",
        message: result.error.message || "메시지 전송에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handlePrepareGift = (conversationId: string, gift: InventoryGift) => {
    setPendingGift({ conversationId, gift });
    setShowGiftModal(null);
  };

  const handleConfirmSendGift = async (quantity: number) => {
    if (!pendingGift) return;
    if (sendingMessage) return;

    const { conversationId, gift } = pendingGift;
    const conv = findConversation(conversationId);
    if (!conv?.profileId || !conv.userId) return;

    const giftQuantity = quantity;
    if (!giftQuantity || giftQuantity <= 0) return;

    try {
      const { error: rpcError } = await supabaseAdmin.rpc(
        "chat_send_gift_profile",
        {
          p_room_id: conversationId,
          p_gift_id: gift.gift_id,
          p_quantity: giftQuantity,
        },
      );

      if (rpcError) throw rpcError;

      setPendingGift(null);
      setShowGiftModal(null);
      refetchAgentGifts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "선물 전송에 실패했습니다.";
      showAlert({
        title: "오류",
        message,
        type: "error",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(conversationId);
    }
  };

  function findConversation(conversationId: string) {
    if (selectedChat?.id === conversationId) return selectedChat;
    const modalConv = chatModals.find(
      (m) => m.conversation.id === conversationId,
    )?.conversation;
    if (modalConv) return modalConv;
    return conversations.find((c) => c.id === conversationId) || null;
  }

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
    if (selectedChat && chatScrollRefs.current[selectedChat.id]) {
      // DOM 렌더링 완료 후 스크롤 적용
      setTimeout(() => {
        const scrollEl = chatScrollRefs.current[selectedChat.id];
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }
      }, 0);
    }
  }, [selectedChat?.id]);

  // 모달 채팅이 열릴 때 자동 스크롤
  useEffect(() => {
    chatModals.forEach((modal) => {
      const scrollEl = chatScrollRefs.current[modal.conversation.id];
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
    void onToggleMode;

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
                className={`flex flex-col ${
                  msg.isMe ? "items-end" : "items-start"
                }`}
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
                    <span className="text-yellow-400">🎁 {msg.message}</span>
                  ) : msg.type === "image" ? (
                    <div>
                      <p className="mb-2">{msg.message}</p>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="이미지"
                          className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() =>
                            setImagePreviewModal(msg.imageUrl || null)
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="space-y-1 text-sm">
              {conversation.messages.map((msg) => {
                const isGift = msg.type === "gift";
                const isImage = msg.type === "image";

                return (
                  <div
                    key={msg.id}
                    className={isGift ? "text-pink-400" : "text-gray-300"}
                  >
                    {isImage ? (
                      <span>
                        [{msg.timestamp}]{" "}
                        <span
                          className={
                            msg.isMe ? "text-indigo-400" : "text-emerald-400"
                          }
                        >
                          {msg.senderName}:
                        </span>{" "}
                        <span
                          onClick={() =>
                            setImagePreviewModal(msg.imageUrl || null)
                          }
                          className="text-purple-400 cursor-pointer hover:text-purple-300 underline transition-colors"
                        >
                          [이미지]
                        </span>
                      </span>
                    ) : (
                      <span>
                        [{msg.timestamp}]{" "}
                        <span
                          className={
                            msg.isMe ? "text-indigo-400" : "text-emerald-400"
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
            <ChatImageUpload
              roomId={conversation.id}
              senderType="profile"
              onImageSent={() => {}}
              onError={(err) =>
                showAlert({ title: "오류", message: err, type: "error" })
              }
              size={18}
              className="text-gray-400 hover:text-white transition-colors p-2 flex-shrink-0"
            />
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

  const giftConversation = showGiftModal
    ? findConversation(showGiftModal)
    : null;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-white text-2xl mb-2">채팅 관리</h1>
          <p className="text-gray-400 text-sm">
            배정받은 프로필로 회원들과 채팅하세요 (채팅목록을 Ctrl키 누른 상태로
            클릭하면 팝업창으로 볼 수 있습니다)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[500px] min-h-0">
          {/* 채팅 목록 */}
          <div
            className={`lg:col-span-1 min-h-0 ${
              selectedChat && "hidden lg:block"
            }`}
          >
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden lg:h-full h-[500px] flex flex-col">
              {/* 목록 헤더 */}
              <div className="bg-gray-800 border-b border-gray-700 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-white font-medium">채팅 목록</h2>
                    <p className="text-gray-400 text-xs">
                      총 {filteredConversations.length}개 대화
                    </p>
                  </div>
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
                  {profileList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProfileFilter(p.id)}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        profileFilter === p.id
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 대화 목록 */}
              <div className="overflow-y-auto flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    대화가 없습니다
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedChat?.id === conv.id;

                    return (
                      <button
                        key={conv.id}
                        onClick={(e) =>
                          handleChatClick(conv, e.ctrlKey || e.metaKey)
                        }
                        className={`w-full text-left p-3 border-b border-gray-800 hover:bg-gray-800/40 transition-colors ${
                          isSelected ? "bg-gray-800/60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <NameAvatar
                              name={conv.userName}
                              src={conv.userImage}
                            />
                            <OnlineStatusIndicator isOnline={!!conv.isOnline} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-white text-sm font-medium truncate">
                                {conv.userName}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {conv.lastMessageTime}
                              </p>
                            </div>
                            <OnlineStatusText
                              isOnline={!!conv.isOnline}
                              className="text-xs"
                            />
                            <p className="text-gray-400 text-xs truncate">
                              {conv.lastMessage || ""}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-0.5">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 채팅 상세 */}
          <div className="lg:col-span-2 min-h-0">
            {selectedChat ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg h-[500px] lg:h-full flex flex-col">
                {/* 채팅 헤더 */}
                <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden text-gray-400 hover:text-white"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="relative">
                      <NameAvatar
                        name={selectedChat.userName}
                        src={selectedChat.userImage}
                      />
                      <OnlineStatusIndicator isOnline={!!selectedChat.isOnline} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">
                        {selectedChat.userName}
                      </h3>
                      <OnlineStatusText
                        isOnline={!!selectedChat.isOnline}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-300 hidden sm:flex items-center gap-2">
                      <span>
                        활성방{" "}
                        {(
                          profileStats.roomCountByUser.get(
                            selectedChat.userId,
                          ) || 0
                        ).toLocaleString()}
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="flex items-center gap-1 text-gray-200">
                        기프트 수익
                        <GiftRevenueInfoTooltip />
                      </span>
                      <span
                        className={`font-medium ${
                          (giftRevenueStats[selectedChat.id]?.netProfit || 0) >=
                          0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {(giftRevenueStats[selectedChat.id]?.netProfit || 0) >=
                        0
                          ? "+"
                          : ""}
                        {(
                          giftRevenueStats[selectedChat.id]?.netProfit || 0
                        ).toLocaleString()}
                        P(
                        {(
                          giftRevenueStats[selectedChat.id]?.receivedCount || 0
                        ).toLocaleString()}
                        개)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        selectedChat && toggleChatMute(selectedChat.id, true)
                      }
                      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                        isSelectedChatMuted
                          ? "border-gray-700 text-gray-400 hover:text-gray-200"
                          : "border-indigo-400/70 text-indigo-200 hover:text-indigo-100"
                      }`}
                      title={
                        isSelectedChatMuted
                          ? "채팅 알림 켜기"
                          : "채팅 알림 끄기"
                      }
                    >
                      {isSelectedChatMuted ? (
                        <BellOff size={14} />
                      ) : (
                        <Bell size={14} />
                      )}
                      <span className="hidden sm:inline">
                        {isSelectedChatMuted ? "알림 끔" : "알림 켬"}
                      </span>
                    </button>
                    <button
                      onClick={() => setMainChatBubbleMode((prev) => !prev)}
                      className={`p-2 rounded-lg transition-colors ${
                        mainChatBubbleMode
                          ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          : "bg-indigo-500 text-white hover:bg-indigo-600"
                      }`}
                      title={
                        mainChatBubbleMode
                          ? "로그 모드로 전환"
                          : "말풍선 모드로 전환"
                      }
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>

                <RealtimeChatWindow
                  conversation={selectedChat}
                  isBubbleMode={mainChatBubbleMode}
                  onToggleMode={() => setMainChatBubbleMode((prev) => !prev)}
                  messageInput={messageInputs[selectedChat.id] || ""}
                  onMessageChange={(value) =>
                    setMessageInputs((prev) => ({
                      ...prev,
                      [selectedChat.id]: value,
                    }))
                  }
                  onSend={() => void handleSendMessage(selectedChat.id)}
                  onKeyPress={(e) => handleKeyPress(e, selectedChat.id)}
                  onShowGift={() => setShowGiftModal(selectedChat.id)}
                  renderChatWindow={renderChatWindow}
                />
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg h-[500px] lg:h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">대화를 선택하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 팝업 채팅창 */}
        {chatModals.map((modal) => (
          <div
            key={modal.id}
            className={`fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl flex flex-col overflow-hidden ${
              activeModalId === modal.id ? "ring-2 ring-indigo-500" : ""
            }`}
            style={{
              left: modal.position.x,
              top: modal.position.y,
              width: modal.size.width,
              height: modal.size.height,
            }}
            onMouseDown={() => setActiveModalId(modal.id)}
          >
            <div
              className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between cursor-move"
              onMouseDown={(e) => handleMouseDown(modal.id, e)}
            >
              <div className="flex items-center gap-2 text-white text-xs font-medium truncate">
                <OnlineStatusText
                  isOnline={!!modal.conversation.isOnline}
                  className="text-xs"
                />
                <span className="text-gray-500">|</span>
                <span className="truncate">
                  {modal.conversation.userName} ·{" "}
                  {modal.conversation.profileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleChatMute(modal.conversation.id, true)}
                  className={`p-1.5 rounded-full border transition-colors ${
                    isChatMuted(modal.conversation.id, true)
                      ? "border-gray-700 text-gray-400 hover:text-gray-200"
                      : "border-indigo-400/70 text-indigo-200 hover:text-indigo-100"
                  }`}
                  title={
                    isChatMuted(modal.conversation.id, true)
                      ? "채팅 알림 켜기"
                      : "채팅 알림 끄기"
                  }
                >
                  {isChatMuted(modal.conversation.id, true) ? (
                    <BellOff size={14} />
                  ) : (
                    <Bell size={14} />
                  )}
                </button>
                <button
                  onClick={() =>
                    updateModal(modal.id, { isBubbleMode: !modal.isBubbleMode })
                  }
                  className={`p-1.5 rounded transition-colors ${
                    modal.isBubbleMode
                      ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }`}
                  title={
                    modal.isBubbleMode
                      ? "로그 모드로 전환"
                      : "말풍선 모드로 전환"
                  }
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => closeModal(modal.id)}
                  className="text-gray-400 hover:text-white transition-colors text-xs px-2"
                >
                  닫기
                </button>
              </div>
            </div>

            <RealtimeChatWindow
              conversation={modal.conversation}
              isBubbleMode={modal.isBubbleMode}
              onToggleMode={() =>
                updateModal(modal.id, { isBubbleMode: !modal.isBubbleMode })
              }
              messageInput={messageInputs[modal.conversation.id] || ""}
              onMessageChange={(value) =>
                setMessageInputs((prev) => ({
                  ...prev,
                  [modal.conversation.id]: value,
                }))
              }
              onSend={() => void handleSendMessage(modal.conversation.id)}
              onKeyPress={(e) => handleKeyPress(e, modal.conversation.id)}
              onShowGift={() => setShowGiftModal(modal.conversation.id)}
              renderChatWindow={renderChatWindow}
            />

            <div
              className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(modal.id, e)}
            />
          </div>
        ))}

        {/* 선물 선택 모달 */}
        {giftConversation && (
          <GiftSelectionModal
            isOpen={!!showGiftModal}
            onClose={() => setShowGiftModal(null)}
            gifts={myGifts}
            onSelectGift={(gift) =>
              handlePrepareGift(giftConversation.id, gift)
            }
            title="선물 보내기 💝"
            subtitle={`${giftConversation.userName}님에게 보낼 선물을 선택해주세요`}
          />
        )}

        {/* 이미지 미리보기 */}
        {imagePreviewModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setImagePreviewModal(null)}
            />
            <div className="relative max-w-3xl w-full mx-4">
              <img
                src={imagePreviewModal}
                alt="미리보기"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}

        <QuantityModal
          isOpen={pendingGift !== null}
          title="선물 보내기"
          itemName={pendingGift?.gift.name || ""}
          itemEmoji={pendingGift?.gift.emoji || "🎁"}
          price={pendingGift?.gift.buy_price || 0}
          maxQuantity={pendingGift?.gift.quantity || 1}
          ownedQuantity={pendingGift?.gift.quantity || 0}
          isSending={true}
          onConfirm={(qty) => void handleConfirmSendGift(qty)}
          onCancel={() => setPendingGift(null)}
        />
      </div>
    </AdminLayout>
  );
}
