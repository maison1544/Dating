import { ArrowLeft, Send, Gift, X, Loader2, Bell, BellOff } from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { QuantityModal } from "@/components/layout/QuantityModal";
import { ProfileDetailModal } from "@/components/layout/ProfileDetailModal";
import {
  ChatImageUpload,
  ChatImageMessage,
} from "@/components/layout/ChatImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useNotification } from "@/contexts/NotificationContext";
import {
  useRealtimeChat,
  useSendMessage,
  useMarkMessagesAsRead,
  useUserGifts,
  useGiftItems,
} from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase/client";
import { getPublicUrlForPath } from "@/lib/utils/storage";
import { formatKST } from "@/lib/utils/dateUtils";

interface GiftItem {
  id: number | string;
  name: string;
  emoji: string;
  quantity: number;
  gift_id?: string;
  buy_price?: number;
}

export function ChatRoomPage() {
  const navigate = useRouter();
  const { chatId } = useParams(); // chatId는 room_id (UUID)
  const {
    user,
    profile,
    adminAccount,
    isAgent,
    isLoading: authLoading,
  } = useAuth();
  const { showAlert } = useAlert();
  const { setActiveChatId, toggleChatMute, isChatMuted } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // UI State
  const [messageInput, setMessageInput] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isSendingGift, setIsSendingGift] = useState(false);
  const [imgErrorPartner, setImgErrorPartner] = useState(false);

  // Supabase Realtime Hooks
  const { messages: dbMessages, isLoading: messagesLoading } =
    useRealtimeChat(chatId);
  const { sendMessage, isLoading: sendingMessage } = useSendMessage();
  const { markAsRead } = useMarkMessagesAsRead();
  const { userGifts, refetch: refetchUserGifts } = useUserGifts(profile?.id);
  useGiftItems();

  // 내 선물 목록 (Supabase에서 조회)
  const myGifts: GiftItem[] = useMemo(
    () =>
      (userGifts || [])
        .map((ug: any) => {
          const gift = ug.gifts;
          return {
            id: ug.id,
            gift_id: ug.gift_id,
            name: gift?.name,
            emoji: gift?.emoji,
            buy_price: Number(gift?.buy_price ?? 0),
            quantity: Number(ug.quantity ?? 0),
          };
        })
        .filter((g: any) => !!g.gift_id && !!g.name && g.quantity > 0),
    [userGifts],
  );

  const getInitial = (name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "?";
    return trimmed.slice(0, 1).toUpperCase();
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
  }, [authLoading, user, adminAccount, isAgent, navigate]);

  useEffect(() => {
    if (!chatId) return;
    setActiveChatId(chatId);
    return () => {
      setActiveChatId(null);
    };
  }, [chatId, setActiveChatId]);

  // 채팅방 정보 및 상대방 프로필 로드
  useEffect(() => {
    const loadRoomData = async () => {
      if (!chatId || !profile?.id) {
        setChatPartner(null);
        setIsLoadingRoom(false);
        return;
      }
      setIsLoadingRoom(true);

      setImgErrorPartner(false);

      const { data: room, error } = await supabase
        .from("chat_rooms")
        .select(
          `
          *,
          chat_profiles:profile_id (
            id, name, age, image, is_online, job, height, weight, interests, bio
          )
        `,
        )
        .eq("id", chatId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (error) {
        setIsLoadingRoom(false);
        showAlert({
          title: "오류",
          message: `채팅방 로드에 실패했습니다: ${error.message}`,
          type: "error",
        });
        return;
      }

      if (room?.chat_profiles) {
        setChatPartner({
          id: room.chat_profiles.id,
          name: room.chat_profiles.name,
          age: room.chat_profiles.age,
          height: room.chat_profiles.height ?? null,
          weight: room.chat_profiles.weight ?? null,
          job: room.chat_profiles.job ?? null,
          image: (room.chat_profiles as any).image ?? null,
          online: !!room.chat_profiles.is_online,
          tags: Array.isArray(room.chat_profiles.interests)
            ? (room.chat_profiles.interests as any[])
            : [],
          bio: room.chat_profiles.bio,
        });
      }
      setIsLoadingRoom(false);
    };

    loadRoomData();
  }, [chatId, profile?.id, showAlert]);

  // 메시지 읽음 처리
  useEffect(() => {
    if (chatId && profile?.id) {
      markAsRead(chatId, profile.id);
    }
  }, [chatId, profile?.id, dbMessages.length]);

  // 메시지를 UI 형식으로 변환
  const messages = dbMessages.map((msg: any) => {
    const isMe =
      msg.sender_type === "user" &&
      !!profile?.id &&
      String(msg.sender_id) === String(profile.id);

    const rawGiftLabel = String(msg.content || msg.message || "").trim();
    const giftParts = rawGiftLabel.split(/\s+/).filter(Boolean);
    const fallbackGiftEmoji = giftParts.length >= 2 ? giftParts[0] : "🎁";
    const fallbackGiftName =
      giftParts.length >= 2 ? giftParts.slice(1).join(" ") : rawGiftLabel;

    return {
      id: msg.id,
      text: msg.content,
      sender: isMe ? "me" : "other",
      timestamp: msg.created_at ? formatKST(msg.created_at, "datetime") : "",
      type: msg.message_type || "text",
      giftEmoji: msg.gift_items?.emoji ?? fallbackGiftEmoji,
      giftName: msg.gift_items?.name ?? fallbackGiftName,
      giftQuantity: msg.gift_quantity,
    };
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송 핸들러 (Supabase)
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !chatId || !profile?.id || sendingMessage)
      return;

    const content = messageInput.trim();
    setMessageInput("");

    await sendMessage(chatId, profile.id, "user", content, "text");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendGift = () => {
    setShowGiftModal(true);
  };

  const handleSelectGift = (gift: GiftItem) => {
    setSelectedGift(gift);
    setShowGiftModal(false);
    setShowConfirmModal(true);
  };

  // 선물 전송 핸들러 (Supabase)
  const handleConfirmGift = async (quantity: number) => {
    if (!selectedGift || !chatId || !profile?.id || !chatPartner) return;
    if (isSendingGift) return;

    const giftId = selectedGift.gift_id;
    if (!giftId) {
      showAlert({
        title: "오류",
        message: "선물 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    if (quantity <= 0) {
      showAlert({
        title: "입력 오류",
        message: "수량을 확인해주세요.",
        type: "warning",
      });
      return;
    }

    if (quantity > selectedGift.quantity) {
      showAlert({
        title: "잔량 부족",
        message: "보유한 선물 수량이 부족합니다.",
        type: "warning",
      });
      return;
    }

    setIsSendingGift(true);

    try {
      const { error: rpcError } = await supabase.rpc("chat_send_gift_user", {
        p_room_id: chatId,
        p_gift_id: giftId,
        p_quantity: quantity,
      });

      if (rpcError) throw rpcError;

      await refetchUserGifts();

      setSelectedGift(null);
      setShowConfirmModal(false);
      setShowGiftModal(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "선물 전송에 실패했습니다.";
      showAlert({ title: "오류", message, type: "error" });
      await refetchUserGifts();
    } finally {
      setIsSendingGift(false);
    }
  };

  const handleCancelGift = () => {
    setSelectedGift(null);
    setShowConfirmModal(false);
    setShowGiftModal(true);
  };

  if (authLoading || isLoadingRoom || (user && !adminAccount && !profile)) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">채팅방을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user || adminAccount || !profile?.id) {
    if (!user) return <>{typeof window !== "undefined" && router.push("/login" replace />;
    return <>{typeof window !== "undefined" && router.push("/" replace />;
  }

  if (!chatPartner) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">채팅방을 찾을 수 없습니다</p>
          <button
            onClick={() => router.push("/realtime-matching")}
            className="mt-4 bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600 transition-colors"
          >
            채팅 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const partnerImageUrl = getPublicUrlForPath(
    "chat-profile-images",
    chatPartner.image,
  );

  const isChatNotificationMuted = chatId ? isChatMuted(chatId) : false;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/realtime-matching")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              {partnerImageUrl && !imgErrorPartner ? (
                <img
                  src={partnerImageUrl}
                  alt={chatPartner.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={() => setImgErrorPartner(true)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold">
                  {getInitial(chatPartner.name)}
                </div>
              )}
              {chatPartner.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              )}
            </div>
            <div className="leading-none">
              <div className="text-white flex items-center gap-2">
                {chatPartner.name}
              </div>
              <p className="text-gray-400 text-xs text-left p-[0px] m-[0px]">
                {chatPartner.online ? "온라인" : "오프라인"}
              </p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => chatId && toggleChatMute(chatId)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              isChatNotificationMuted
                ? "border-gray-700 text-gray-400 hover:text-gray-200"
                : "border-pink-500/70 text-pink-300 hover:text-pink-200"
            }`}
            title={
              isChatNotificationMuted ? "채팅 알림 켜기" : "채팅 알림 끄기"
            }
          >
            {isChatNotificationMuted ? (
              <BellOff size={14} />
            ) : (
              <Bell size={14} />
            )}
            <span className="hidden sm:inline">
              {isChatNotificationMuted ? "알림 끔" : "알림 켬"}
            </span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="max-w-4xl mx-auto">
          {messagesLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "me" ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[70%] ${
                    message.sender === "me" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {message.sender === "other" &&
                    (partnerImageUrl && !imgErrorPartner ? (
                      <img
                        src={partnerImageUrl}
                        alt={chatPartner.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={() => setImgErrorPartner(true)}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
                        {getInitial(chatPartner.name)}
                      </div>
                    ))}
                  <div
                    className={`flex flex-col ${
                      message.sender === "me" ? "items-end" : "items-start"
                    }`}
                  >
                    {message.type === "gift" ? (
                      <div
                        className={`bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl px-6 py-4 ${
                          message.sender === "me"
                            ? "rounded-br-sm"
                            : "rounded-bl-sm"
                        }`}
                      >
                        <div className="text-6xl text-center">
                          {message.giftEmoji}
                        </div>
                        <p className="text-white text-xs text-center mt-2">
                          {message.sender === "me"
                            ? `${chatPartner.name}님에게 ${message.giftName} ${message.giftQuantity}개를 보냈습니다!`
                            : `${chatPartner.name}님이 ${message.giftName} ${message.giftQuantity}개를 보냈습니다!`}
                        </p>
                      </div>
                    ) : message.type === "image" ? (
                      <ChatImageMessage
                        imageUrl={message.text}
                        isMe={message.sender === "me"}
                      />
                    ) : (
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.sender === "me"
                            ? "bg-pink-500 text-white rounded-br-sm"
                            : "bg-gray-800 text-white rounded-bl-sm"
                        }`}
                      >
                        <p className="break-words">{message.text}</p>
                      </div>
                    )}
                    <span className="text-gray-500 text-xs mt-1">
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button
            onClick={handleSendGift}
            className="text-gray-400 hover:text-pink-500 transition-colors p-2 flex-shrink-0"
          >
            <Gift size={24} />
          </button>
          <ChatImageUpload
            roomId={chatId || ""}
            senderType="user"
            onImageSent={() => {}}
            onError={(err) =>
              showAlert({ title: "오류", message: err, type: "error" })
            }
            size={24}
            className="text-gray-400 hover:text-pink-500 transition-colors p-2 flex-shrink-0"
          />
          <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 focus-within:border-pink-500 transition-colors">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full bg-transparent text-white px-4 py-3 resize-none focus:outline-none"
              rows={1}
              style={{ maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className={`p-3 rounded-lg flex-shrink-0 transition-colors ${
              messageInput.trim()
                ? "bg-pink-500 text-white hover:bg-pink-600"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Profile Detail Modal */}
      <ProfileDetailModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={chatPartner}
        hideStartChat={true}
      />

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-md mx-4 border border-gray-800 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-white text-xl">선물 보내기 💝</h2>
              <button
                onClick={() => setShowGiftModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <p className="text-gray-400 text-sm mb-4 text-center">
                보낼 선물을 선택해주세요
              </p>
              {myGifts.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm">
                    보유한 선물이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {myGifts.map((gift) => (
                    <button
                      key={gift.id}
                      onClick={() => handleSelectGift(gift)}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all hover:scale-105 border border-gray-700 hover:border-pink-500 flex flex-col items-center justify-center"
                    >
                      <div className="text-5xl mb-2">{gift.emoji}</div>
                      <p className="text-white text-sm mb-1">{gift.name}</p>
                      <p className="text-gray-400 text-xs">{gift.quantity}개</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Gift Modal */}
      <QuantityModal
        isOpen={showConfirmModal && !!selectedGift}
        title="선물 보내기"
        itemName={selectedGift?.name ?? ""}
        itemEmoji={selectedGift?.emoji ?? ""}
        price={Number(selectedGift?.buy_price ?? 0)}
        maxQuantity={Number(selectedGift?.quantity ?? 0)}
        isSending={true}
        ownedQuantity={Number(selectedGift?.quantity ?? 0)}
        onCancel={handleCancelGift}
        onConfirm={(quantity) => {
          void handleConfirmGift(quantity);
        }}
      />
    </div>
  );
}
