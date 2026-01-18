import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect, useMemo, useRef } from "react";
import { Send, Image as ImageIcon, Gift, ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  useAgentChatProfiles,
  useAgentChatRooms,
  useGiftItems,
  useRealtimeChat,
  useSendMessage,
  useMarkMessagesAsRead,
} from "../hooks/useSupabase";
import { useAlert } from "../contexts/AlertContext";
import { getPublicUrlForPath } from "../../lib/storage";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { QuantityModal } from "../components/QuantityModal";
import { formatKST } from "../../lib/dateUtils";

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
  scrollRef?: React.RefObject<HTMLDivElement>
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
  const { messages: dbMessages } = useRealtimeChat(conversation.id);
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

      const giftLabel = msg.gift_items
        ? `${msg.gift_items.emoji || "🎁"} ${msg.gift_items.name || ""}`.trim()
        : (msg.content || msg.message || "").trim();
      const giftQuantityText = msg.gift_quantity
        ? ` x${msg.gift_quantity}`
        : "";

      const message =
        messageType === "gift"
          ? `${giftLabel}${giftQuantityText}`.trim()
          : (msg.content || msg.message || "").trim();

      return {
        id: msg.id,
        senderId: msg.sender_id,
        senderName: isMe ? conversation.profileName : conversation.userName,
        message,
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
    scrollRef
  );
}

// 선물 목록 - Supabase에서 가져옴

export function AgentChatsPage() {
  const { adminAccount } = useAuth();
  const { showAlert } = useAlert();
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(
    null
  );
  const [chatModals, setChatModals] = useState<ChatModal[]>([]);
  const [messageInputs, setMessageInputs] = useState<Record<string, string>>(
    {}
  );
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [showGiftModal, setShowGiftModal] = useState<string | null>(null);
  const [pendingGift, setPendingGift] = useState<{
    conversationId: string;
    gift: { id: string; name: string; points: number; icon: string };
  } | null>(null);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(
    null
  );

  // Supabase hooks for real data
  const { rooms: dbChatRooms, isLoading: roomsLoading } = useAgentChatRooms(
    adminAccount?.id
  );
  const { profiles: dbProfiles, updateProfileOnline } = useAgentChatProfiles(
    adminAccount?.id
  );
  const { gifts: dbGifts } = useGiftItems();
  const { sendMessage, isLoading: sendingMessage } = useSendMessage();

  void roomsLoading;

  // Transform gifts from Supabase
  const giftsList = dbGifts.map((g: any) => ({
    id: g.id,
    name: g.name,
    points: g.buy_price,
    icon: g.emoji,
  }));

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
          room.users?.profile_image
        ),
        profileName: room.chat_profiles?.name || "프로필",
        profileImage: getPublicUrlForPath(
          "chat-profile-images",
          room.chat_profiles?.image
        ),
        lastMessage: room.last_message || "",
        lastMessageTime: room.last_message_at
          ? formatKST(room.last_message_at, "datetime")
          : "",
        unreadCount: room.unread_count || 0,
        isOnline: !!room.chat_profiles?.is_online,
        messages: [],
      })),
    [dbChatRooms]
  );

  const profileStats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const roomCountByProfile = new Map<string, number>();
    const activeRoomCountByProfile = new Map<string, number>();
    (dbChatRooms || []).forEach((r: any) => {
      const pid = r.profile_id as string | undefined;
      if (!pid) return;
      roomCountByProfile.set(pid, (roomCountByProfile.get(pid) || 0) + 1);
      if (r.status === "active") {
        activeRoomCountByProfile.set(
          pid,
          (activeRoomCountByProfile.get(pid) || 0) + 1
        );
      }
    });

    return {
      todayIso,
      roomCountByProfile,
      activeRoomCountByProfile,
    };
  }, [dbChatRooms]);

  const [todayGiftStats, setTodayGiftStats] = useState<
    Record<string, { count: number; value: number }>
  >({});

  useEffect(() => {
    const fetchTodayGiftStats = async () => {
      const profileIds = (dbProfiles || []).map((p: any) => p.id);
      if (profileIds.length === 0) {
        setTodayGiftStats({});
        return;
      }

      const pageSize = 1000;
      const maxRows = 20000;
      const all: any[] = [];
      for (let from = 0; from < maxRows; from += pageSize) {
        const { data, error } = await supabase
          .from("gift_transactions")
          .select("receiver_id, quantity, points_amount, created_at")
          .eq("receiver_type", "profile")
          .eq("transaction_type", "send")
          .in("receiver_id", profileIds)
          .gte("created_at", profileStats.todayIso)
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          setTodayGiftStats({});
          showAlert({
            title: "오류",
            message: `오늘 선물 통계를 불러오지 못했습니다: ${error.message}`,
            type: "error",
          });
          return;
        }

        const rows = data || [];
        all.push(...rows);
        if (rows.length < pageSize) break;
      }

      const map: Record<string, { count: number; value: number }> = {};
      all.forEach((t: any) => {
        const pid = t.receiver_id as string | undefined;
        if (!pid) return;
        const qty = Number(t.quantity ?? 1);
        const amt = Number(t.points_amount ?? 0);
        if (!map[pid]) map[pid] = { count: 0, value: 0 };
        map[pid].count += qty;
        map[pid].value += amt;
      });
      setTodayGiftStats(map);
    };

    void fetchTodayGiftStats();
  }, [dbProfiles, profileStats.todayIso]);

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

  const handleChatClick = (conv: ChatConversation, isCtrlClick: boolean) => {
    if (isCtrlClick) {
      // Ctrl+클릭: 새 모달 추가
      // 마지막 모달의 크기를 사용하거나, 없으면 기본 크기 사용
      const lastModal = chatModals[chatModals.length - 1];
      const baseSize = lastModal ? lastModal.size : { width: 600, height: 700 };

      const newModal: ChatModal = {
        id: Date.now().toString(),
        conversation: conv,
        position: {
          x:
            window.innerWidth / 2 - baseSize.width / 2 + chatModals.length * 30,
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

  const closeModal = (modalId: string) => {
    setChatModals(chatModals.filter((m) => m.id !== modalId));
    if (activeModalId === modalId) {
      setActiveModalId(null);
    }
  };

  const updateModal = (modalId: string, updates: Partial<ChatModal>) => {
    setChatModals(
      chatModals.map((m) => (m.id === modalId ? { ...m, ...updates } : m))
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
          modal.resizeStart.width + (e.clientX - modal.resizeStart.x)
        );
        const newHeight = Math.max(
          500,
          modal.resizeStart.height + (e.clientY - modal.resizeStart.y)
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
      "text"
    );

    if (result.error) {
      showAlert({
        title: "오류",
        message: result.error.message || "메시지 전송에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handlePrepareGift = (
    conversationId: string,
    gift: { id: string; name: string; points: number; icon: string }
  ) => {
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
      const { error: rpcError } = await supabase.rpc("chat_send_gift_profile", {
        p_room_id: conversationId,
        p_gift_id: gift.id,
        p_quantity: giftQuantity,
      });

      if (rpcError) throw rpcError;

      setPendingGift(null);
      setShowGiftModal(null);
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
      (m) => m.conversation.id === conversationId
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
    scrollRef?: React.RefObject<HTMLDivElement>
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
                          <NameAvatar
                            name={conv.userName}
                            src={conv.userImage}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-white text-sm font-medium truncate">
                                {conv.userName}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {conv.lastMessageTime}
                              </p>
                            </div>
                            <p className="text-indigo-400 text-xs truncate">
                              {conv.profileName}
                            </p>
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
                    <NameAvatar
                      name={selectedChat.userName}
                      src={selectedChat.userImage}
                    />
                    <div>
                      <h3 className="text-white font-medium text-sm">
                        {selectedChat.userName}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        {selectedChat.profileName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-300 hidden sm:flex items-center gap-2">
                      <span>
                        활성방{" "}
                        {(
                          profileStats.activeRoomCountByProfile.get(
                            selectedChat.profileId
                          ) || 0
                        ).toLocaleString()}
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="text-yellow-400">
                        오늘 선물{" "}
                        {(
                          todayGiftStats[selectedChat.profileId]?.value || 0
                        ).toLocaleString()}
                        P(
                        {(
                          todayGiftStats[selectedChat.profileId]?.count || 0
                        ).toLocaleString()}
                        개)
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        const p = profilesById.get(selectedChat.profileId);
                        if (!p) return;
                        await updateProfileOnline(
                          selectedChat.profileId,
                          !(p.is_online ?? false)
                        );
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                    >
                      프로필{" "}
                      {profilesById.get(selectedChat.profileId)?.is_online
                        ? "온라인"
                        : "오프라인"}
                    </button>
                  </div>
                </div>

                <RealtimeChatWindow
                  conversation={selectedChat}
                  isBubbleMode={true}
                  onToggleMode={() => void 0}
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
              <div className="text-white text-xs font-medium truncate">
                {modal.conversation.userName} · {modal.conversation.profileName}
              </div>
              <button
                onClick={() => closeModal(modal.id)}
                className="text-gray-400 hover:text-white transition-colors text-xs px-2"
              >
                닫기
              </button>
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
        {showGiftModal && giftConversation && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowGiftModal(null)}
            />
            <div className="relative bg-gray-900 rounded-lg max-w-2xl w-full mx-4 border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">선물 보내기</h3>
                  <p className="text-gray-400 text-xs">
                    {giftConversation.userName} · {giftConversation.profileName}
                  </p>
                </div>
                <button
                  onClick={() => setShowGiftModal(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  닫기
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                {giftsList.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handlePrepareGift(giftConversation.id, gift)}
                    className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">{gift.icon}</div>
                    <p className="text-white text-sm font-medium mb-1">
                      {gift.name}
                    </p>
                    <p className="text-yellow-400 text-xs">
                      {gift.points.toLocaleString()}P
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
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
          itemEmoji={pendingGift?.gift.icon || "🎁"}
          price={pendingGift?.gift.points || 0}
          maxQuantity={99}
          isSending={true}
          onConfirm={(qty) => void handleConfirmSendGift(qty)}
          onCancel={() => setPendingGift(null)}
        />
      </div>
    </AdminLayout>
  );
}
