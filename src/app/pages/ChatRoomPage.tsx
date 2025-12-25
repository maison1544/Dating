import {
  ArrowLeft,
  Send,
  Gift,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProfileDetailModal } from "../components/ProfileDetailModal";

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
  timestamp: string;
  type?: "text" | "gift";
  giftEmoji?: string;
  giftName?: string;
  giftQuantity?: number;
}

interface GiftItem {
  id: number;
  name: string;
  emoji: string;
  quantity: number;
}

export function ChatRoomPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showProfileModal, setShowProfileModal] =
    useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] =
    useState<GiftItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] =
    useState(false);
  const [giftQuantity, setGiftQuantity] = useState(1);

  // 보유 선물 더미 데이터
  const myGifts: GiftItem[] = [
    { id: 1, name: "장미", emoji: "🌹", quantity: 3 },
    { id: 2, name: "초콜릿", emoji: "🍫", quantity: 5 },
    { id: 3, name: "샴페인", emoji: "🍾", quantity: 4 },
    { id: 4, name: "하트 풍선", emoji: "💝", quantity: 10 },
    { id: 5, name: "다이아 반지", emoji: "💍", quantity: 2 },
    { id: 6, name: "럭셔리 향수", emoji: "🧴", quantity: 1 },
  ];

  // 채팅방 더미 데이터
  const chatData: { [key: string]: any } = {
    "1": {
      name: "유진",
      age: 23,
      location: "강남",
      height: 168,
      weight: 50,
      job: "마케터",
      rating: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1635353775931-1a6464be72cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB3b21hbiUyMGJlYXV0eXxlbnwxfHx8fDE3NjU2NDI4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      online: true,
      tags: ["와인바", "분위기맛집", "패션"],
    },
    "2": {
      name: "민지",
      age: 22,
      location: "홍대",
      height: 162,
      weight: 49,
      job: "디자이너",
      rating: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1747707499498-7077014c4423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMG1vZGVsfGVufDF8fHx8MTc2NTY3NTUzNnww&ixlib=rb-4.1.0&q=80&w=1080",
      online: true,
      tags: ["바다산책", "맛집탐방", "순수한매력", "귀여운스타일"],
    },
    "3": {
      name: "서현",
      age: 24,
      location: "압구정",
      height: 170,
      weight: 52,
      job: "회사원",
      rating: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1693305991125-1b87c60e5578?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1NjY4ODczfDA&ixlib=rb-4.1.0&q=80&w=1080",
      online: false,
      tags: ["미술관", "전시회", "재즈바", "성숙한매력"],
    },
    "4": {
      name: "소희",
      age: 21,
      location: "서울",
      height: 165,
      weight: 48,
      job: "카페운영",
      rating: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1672390933634-6ccb1da5fa40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjU2NzU1MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      online: true,
      tags: ["영화보기", "카페투어", "힐링"],
    },
    "5": {
      name: "지은",
      age: 25,
      location: "청담",
      height: 169,
      weight: 51,
      job: "프리랜서",
      rating: 5,
      imageUrl:
        "https://images.unsplash.com/photo-1551148049-70c3165bd42a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGdpcmwlMjBmYXNoaW9ufGVufDF8fHx8MTc2NTY3NTUzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      online: true,
      tags: ["쇼핑", "인스타감성", "활발함", "새로운경험"],
    },
  };

  const currentChat = chatData[chatId || "1"];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "안녕하세요! 프로필 보고 연락드렸어요 😊",
      sender: "me",
      timestamp: "오후 2:30",
    },
    {
      id: 2,
      text: "안녕하세요~ 반가워요!",
      sender: "other",
      timestamp: "오후 2:32",
    },
    {
      id: 3,
      text: "프로필에 와인바 좋아하신다고 하셨는데, 혹시 추천하실만한 곳 있으세요?",
      sender: "me",
      timestamp: "오후 2:35",
    },
    {
      id: 4,
      text: "네! 청담에 좋은 곳 알아요. 다음에 같이 가실래요? 🍷",
      sender: "other",
      timestamp: "오후 2:38",
    },
    {
      id: 5,
      text: "🌹",
      sender: "me",
      timestamp: "오후 2:40",
      type: "gift",
      giftEmoji: "🌹",
      giftName: "장미",
      giftQuantity: 1,
    },
    {
      id: 6,
      text: "와~ 감사합니다! 💕",
      sender: "other",
      timestamp: "오후 2:41",
    },
    {
      id: 7,
      text: "오늘 저녁에 시간 괜찮으세요? 😊",
      sender: "other",
      timestamp: "오후 3:42",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: messageInput,
        sender: "me",
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMessage]);
      setMessageInput("");
    }
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
    setGiftQuantity(1);
    setShowConfirmModal(true);
  };

  const handleConfirmGift = () => {
    if (selectedGift) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: selectedGift.emoji,
        sender: "me",
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "gift",
        giftEmoji: selectedGift.emoji,
        giftName: selectedGift.name,
        giftQuantity: giftQuantity,
      };
      setMessages([...messages, newMessage]);
      setSelectedGift(null);
      setShowConfirmModal(false);
      setShowGiftModal(false);
    }
  };

  const handleCancelGift = () => {
    setSelectedGift(null);
    setShowConfirmModal(false);
  };

  if (!currentChat) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">
            채팅방을 찾을 수 없습니다
          </p>
          <button
            onClick={() => navigate("/realtime-matching")}
            className="mt-4 bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600 transition-colors"
          >
            채팅 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/realtime-matching")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <img
                src={currentChat.imageUrl}
                alt={currentChat.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              {currentChat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              )}
            </div>
            <div className="leading-none">
              <div className="text-white flex items-center gap-2">
                {currentChat.name}
              </div>
              <p className="text-gray-400 text-xs text-left p-[0px] m-[0px]">
                {currentChat.online ? "온라인" : "오프라인"}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"} mb-4`}
            >
              <div
                className={`flex items-end gap-2 max-w-[70%] ${message.sender === "me" ? "flex-row-reverse" : "flex-row"}`}
              >
                {message.sender === "other" && (
                  <img
                    src={currentChat.imageUrl}
                    alt={currentChat.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div
                  className={`flex flex-col ${message.sender === "me" ? "items-end" : "items-start"}`}
                >
                  {message.type === "gift" ? (
                    <div
                      className={`bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl px-6 py-4 ${message.sender === "me" ? "rounded-br-sm" : "rounded-bl-sm"}`}
                    >
                      <div className="text-6xl text-center">
                        {message.giftEmoji}
                      </div>
                      <p className="text-white text-xs text-center mt-2">
                        {currentChat.name}님에게 {message.giftName} {message.giftQuantity}개를 보냈습니다!
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === "me"
                          ? "bg-pink-500 text-white rounded-br-sm"
                          : "bg-gray-800 text-white rounded-bl-sm"
                      }`}
                    >
                      <p className="break-words">
                        {message.text}
                      </p>
                    </div>
                  )}
                  <span className="text-gray-500 text-xs mt-1">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
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
          <button className="text-gray-400 hover:text-pink-500 transition-colors p-2 flex-shrink-0">
            <ImageIcon size={24} />
          </button>
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
        profile={currentChat}
        hideStartChat={true}
      />

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-md mx-4 border border-gray-800 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-white text-xl">
                선물 보내기 💝
              </h2>
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
              <div className="grid grid-cols-3 gap-4">
                {myGifts.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSelectGift(gift)}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all hover:scale-105 border border-gray-700 hover:border-pink-500 flex flex-col items-center justify-center"
                  >
                    <div className="text-5xl mb-2">
                      {gift.emoji}
                    </div>
                    <p className="text-white text-sm mb-1">
                      {gift.name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {gift.quantity}개
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Gift Modal */}
      {showConfirmModal && selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-sm mx-4 border border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white text-xl">
                선물 보내기 확인
              </h2>
              <button
                onClick={handleCancelGift}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
                <div className="text-7xl mb-4">
                  {selectedGift.emoji}
                </div>
                <p className="text-white text-lg mb-2">
                  {selectedGift.name}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  보유: {selectedGift.quantity}개
                </p>

                {/* Quantity Selector */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() =>
                      setGiftQuantity(
                        Math.max(1, giftQuantity - 1),
                      )
                    }
                    disabled={giftQuantity <= 1}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      giftQuantity <= 1
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    -
                  </button>
                  <div className="bg-gray-900 px-6 py-2 rounded-lg min-w-[80px] text-center">
                    <span className="text-white text-xl">
                      {giftQuantity}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setGiftQuantity(
                        Math.min(
                          selectedGift.quantity,
                          giftQuantity + 1,
                        ),
                      )
                    }
                    disabled={
                      giftQuantity >= selectedGift.quantity
                    }
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      giftQuantity >= selectedGift.quantity
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 text-center">
                <span className="text-pink-500">
                  {currentChat.name}
                </span>
                님에게 {selectedGift.name} {giftQuantity}개를
                보내시겠어요?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelGift}
                  className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmGift}
                  className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  보내기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}