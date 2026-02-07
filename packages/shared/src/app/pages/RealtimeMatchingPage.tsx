import { MessageCircle, List, Loader2 } from "lucide-react";
import { ProfileCard } from "../components/ProfileCard";
import { ProfileDetailModal } from "../components/ProfileDetailModal";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "../contexts/ProfileContext";
import { useChatRoomsWithProfiles } from "../hooks/useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { getPublicUrlForPath } from "../../lib/storage";
import { formatKST } from "../../lib/dateUtils";

export function RealtimeMatchingPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"realtime" | "chatlist">(
    "realtime",
  );
  const {
    profiles,
    isLoading: profilesLoading,
    error: profilesError,
  } = useProfiles();

  // Supabase에서 실제 채팅방 데이터 조회
  const {
    rooms: chatRooms,
    isLoading: roomsLoading,
    error: roomsError,
  } = useChatRoomsWithProfiles(profile?.id);

  // 활성화된 모든 프로필 표시 (온라인 상태는 마크만 표시)
  const activeProfiles = useMemo(() => profiles, [profiles]);

  // 채팅방 데이터를 UI 형식으로 변환
  const activeChats = useMemo(
    () =>
      (chatRooms || [])
        .map((room: any) => {
          const chatProfile = room.chat_profiles;
          const lastMessageTime = room.last_message_at
            ? formatKST(room.last_message_at, "datetime")
            : "";

          return {
            id: room.id,
            profileName: chatProfile?.name || "알 수 없음",
            profileAge:
              typeof chatProfile?.age === "number" ? chatProfile.age : null,
            online: !!chatProfile?.is_online,
            imageUrl: getPublicUrlForPath(
              "chat-profile-images",
              chatProfile?.image ?? null,
            ),
            lastMessage: room.last_message || "새 대화를 시작해보세요!",
            time: lastMessageTime,
            unread: room.unread_count || 0,
          };
        })
        .filter((row: any) => !!row.id),
    [chatRooms],
  );

  const getInitial = (name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "?";
    return trimmed.slice(0, 1).toUpperCase();
  };

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
            {profilesLoading ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : profilesError ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <p className="text-red-500">
                  프로필을 불러오는 데 실패했습니다.
                </p>
              </div>
            ) : activeProfiles.length === 0 ? (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <p className="text-gray-400">
                  현재 활성화된 프로필이 없습니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {activeProfiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProfile(p)}
                    className="cursor-pointer"
                  >
                    <ProfileCard {...p} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            {!profile?.id ? (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <p className="text-gray-400 mb-4">
                  채팅 목록은 로그인 후 이용할 수 있습니다.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  로그인하기
                </button>
              </div>
            ) : roomsLoading ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : roomsError ? (
              <div className="min-h-[260px] flex items-center justify-center">
                <p className="text-red-500">
                  채팅 목록을 불러오는 데 실패했습니다.
                </p>
              </div>
            ) : activeChats.length === 0 ? (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                <p className="text-gray-400">활성 채팅방이 없습니다.</p>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {activeChats.map((chat: any) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="flex items-center gap-4 p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      {chat.imageUrl ? (
                        <img
                          src={chat.imageUrl}
                          alt={chat.profileName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold">
                          {getInitial(chat.profileName)}
                        </div>
                      )}
                      {chat.online && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white">{chat.profileName}</h3>
                        {typeof chat.profileAge === "number" && (
                          <span className="text-gray-400 text-sm">
                            {chat.profileAge}세
                          </span>
                        )}
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
            )}
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
