import {
  Users,
  Clock,
  MessageCircle,
  List,
} from "lucide-react";
import { ProfileCard } from "../components/ProfileCard";
import { ProfileDetailModal } from "../components/ProfileDetailModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "../contexts/ProfileContext";

export function RealtimeMatchingPage() {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] =
    useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "realtime" | "chatlist"
  >("realtime");
  const { profiles } = useProfiles();

  const activeChats = [
    {
      id: 1,
      name: "소희",
      age: 21,
      location: "서울",
      height: 165,
      weight: 48,
      job: "카페운영",
      rating: 5,
      online: true,
      imageUrl:
        "https://images.unsplash.com/photo-1672390933634-6ccb1da5fa40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjU2NzU1MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["영화보기", "카페투어", "힐링"],
      lastMessage: "오늘 저녁에 시간 괜찮으세요? 😊",
      time: "방금",
      unread: 2,
    },
    {
      id: 2,
      name: "유진",
      age: 23,
      location: "강남",
      height: 168,
      weight: 50,
      job: "마케터",
      rating: 5,
      online: true,
      imageUrl:
        "https://images.unsplash.com/photo-1635353775931-1a6464be72cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB3b21hbiUyMGJlYXV0eXxlbnwxfHx8fDE3NjU2NDI4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["와인바", "분위기맛집", "패션"],
      lastMessage: "와~ 감사합니다! 💕",
      time: "10분 전",
      unread: 0,
    },
    {
      id: 3,
      name: "민지",
      age: 22,
      location: "홍대",
      height: 162,
      weight: 49,
      job: "디자이너",
      rating: 5,
      online: true,
      imageUrl:
        "https://images.unsplash.com/photo-1747707499498-7077014c4423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMG1vZGVsfGVufDF8fHx8MTc2NTY3NTUzNnww&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["바다산책", "맛집탐방", "순수한매력", "귀여운스타일"],
      lastMessage: "네! 같이 가요~",
      time: "1시간 전",
      unread: 1,
    },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-4 animate-pulse">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></span>
            실시간 접속중
          </div>
          <h1 className="text-4xl md:text-5xl mb-4">
            <span className="text-pink-500">두근두근 채팅</span>
            <span className="text-white">으로 만나요 💕</span>
          </h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            지금 연결된 분들과{" "}
            <span className="text-pink-500 font-bold">
              실시간 프라이빗 채팅
            </span>
            을 시작해보세요 ✨
            <br />
            마음에 드는 분을 찾으셨다면 바로 대화를 나눠보세요!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("realtime")}
            className={`px-6 py-3 transition-colors flex items-center gap-2 ${
              activeTab === "realtime"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageCircle size={20} />
            <span>실시간채팅</span>
          </button>
          <button
            onClick={() => setActiveTab("chatlist")}
            className={`px-6 py-3 transition-colors flex items-center gap-2 ${
              activeTab === "chatlist"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <List size={20} />
            <span>채팅목록</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "realtime" ? (
          <>
            {/* Profile Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className="cursor-pointer"
                >
                  <ProfileCard {...profile} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {activeChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="flex items-center gap-4 p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={chat.imageUrl}
                      alt={chat.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white">
                        {chat.name}
                      </h3>
                      <span className="text-gray-400 text-sm">
                        {chat.age}세
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {chat.time}
                    </span>
                    {chat.unread > 0 && (
                      <div className="bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetailModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          profile={selectedProfile}
        />
      )}
    </div>
  );
}