import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { supabaseAdmin } from "@/lib/supabase/client";
import { useNotification } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribe,
  getSnapshot,
  addChatNotification,
  dismissChatNotification,
} from "@/stores/chatNotificationStore";

type AgentChatRoom = {
  id: string;
  profile_id: string;
  user_id: string;
};

type AgentChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: string;
  content: string | null;
};

export function useAgentChatNotifications(
  assignedProfileIds: string[],
  selectedChatId: string | null,
) {
  const { settings, playSound, openChatModalIds, isChatMuted } =
    useNotification();
  const { adminAccount, isAgent } = useAuth();
  const [agentRoomIds, setAgentRoomIds] = useState<Set<string>>(new Set());
  const processedMessageIdsRef = useRef<Map<string, number>>(new Map());
  const roomInfoRef = useRef<
    Map<string, { userId: string; profileId: string }>
  >(new Map());
  const userNameCacheRef = useRef<Map<string, string>>(new Map());
  const agentNameCacheRef = useRef<Map<string, string>>(new Map());

  const notifications = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const settingsRef = useRef(settings);
  const playSoundRef = useRef(playSound);
  const openChatModalIdsRef = useRef(openChatModalIds);
  const isChatMutedRef = useRef(isChatMuted);
  const selectedChatIdRef = useRef(selectedChatId);
  const assignedProfileIdsRef = useRef(assignedProfileIds);
  const agentRoomIdsRef = useRef(agentRoomIds);

  useEffect(() => {
    settingsRef.current = settings;
    playSoundRef.current = playSound;
    openChatModalIdsRef.current = openChatModalIds;
    isChatMutedRef.current = isChatMuted;
    selectedChatIdRef.current = selectedChatId;
    assignedProfileIdsRef.current = assignedProfileIds;
    agentRoomIdsRef.current = agentRoomIds;
  }, [
    settings,
    playSound,
    openChatModalIds,
    isChatMuted,
    selectedChatId,
    assignedProfileIds,
    agentRoomIds,
  ]);

  // 에이전트에게 할당된 프로필의 채팅방 ID 목록 가져오기
  useEffect(() => {
    if (!adminAccount || !isAgent) return;
    if (assignedProfileIds.length === 0) return;

    const fetchAgentRooms = async () => {
      const { data } = await supabaseAdmin
        .from("chat_rooms")
        .select("id, profile_id, user_id")
        .in("profile_id", assignedProfileIds);

      const rooms = (data || []) as AgentChatRoom[];

      if (rooms.length > 0) {
        setAgentRoomIds(new Set(rooms.map((r) => r.id)));
        const roomMap = new Map<
          string,
          { userId: string; profileId: string }
        >();
        rooms.forEach((room) => {
          if (room?.id && room.user_id && room.profile_id) {
            roomMap.set(room.id, {
              userId: room.user_id,
              profileId: room.profile_id,
            });
          }
        });
        roomInfoRef.current = roomMap;
      }
    };

    fetchAgentRooms();

    // 새 채팅방 생성 시 목록 갱신
    const roomChannel = supabaseAdmin
      .channel("agent-rooms-watch")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_rooms",
        },
        (payload: { new: AgentChatRoom }) => {
          const newRoom = payload.new;
          if (assignedProfileIdsRef.current.includes(newRoom.profile_id)) {
            setAgentRoomIds((prev) => new Set([...prev, newRoom.id]));
            if (newRoom.id && newRoom.user_id && newRoom.profile_id) {
              roomInfoRef.current.set(newRoom.id, {
                userId: newRoom.user_id,
                profileId: newRoom.profile_id,
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(roomChannel);
    };
  }, [adminAccount, isAgent, assignedProfileIds]);

  useEffect(() => {
    // 에이전트만 알림 수신
    if (!adminAccount || !isAgent) return;
    if (!settings.globalEnabled || !settings.agentChatEnabled) return;
    if (assignedProfileIds.length === 0) return;

    const channel = supabaseAdmin
      .channel("agent-chat-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload: { new: { id: string } }) => {
          const partialMessage = payload.new as { id: string };

          // Realtime에서 모든 필드가 오지 않을 수 있으므로 전체 메시지 조회
          const { data: message } = await supabaseAdmin
            .from("messages")
            .select("id, room_id, sender_id, sender_type, content")
            .eq("id", partialMessage.id)
            .single();

          if (!message) return;
          const typedMessage = message as AgentChatMessage;

          const ensureAgentRoom = async () => {
            if (agentRoomIdsRef.current.has(typedMessage.room_id)) {
              const cached = roomInfoRef.current.get(typedMessage.room_id);
              if (cached) return cached;
            }
            const assignedIds = assignedProfileIdsRef.current;
            if (!assignedIds || assignedIds.length === 0) return false;
            const { data: room } = await supabaseAdmin
              .from("chat_rooms")
              .select("id, profile_id, user_id")
              .eq("id", typedMessage.room_id)
              .maybeSingle();
            const typedRoom = room as AgentChatRoom | null;
            if (!typedRoom || !assignedIds.includes(typedRoom.profile_id)) {
              return false;
            }
            setAgentRoomIds((prev) => {
              if (prev.has(typedMessage.room_id)) return prev;
              const next = new Set(prev);
              next.add(typedMessage.room_id);
              agentRoomIdsRef.current = next;
              return next;
            });
            if (typedRoom.id && typedRoom.user_id && typedRoom.profile_id) {
              const roomInfo = {
                userId: typedRoom.user_id,
                profileId: typedRoom.profile_id,
              };
              roomInfoRef.current.set(typedRoom.id, roomInfo);
              return roomInfo;
            }
            return false;
          };

          // 에이전트에게 할당된 프로필의 채팅방이 아니면 무시
          const roomInfo = await ensureAgentRoom();
          if (!roomInfo) return;

          // 유저가 보낸 메시지만 알림 (프로필/에이전트가 보낸 메시지 제외)
          if (typedMessage.sender_type !== "user") return;

          // 해당 채팅이 음소거 상태인지 확인
          if (isChatMutedRef.current(typedMessage.room_id, true)) return;

          // 현재 선택된 채팅이면 알림 발생 안함
          if (selectedChatIdRef.current === typedMessage.room_id) return;

          // 해당 대화가 모달로 열려있으면 알림 발생 안함
          if (openChatModalIdsRef.current.has(typedMessage.room_id)) return;

          const resolveUserName = async (userId: string) => {
            if (!userId) return "회원";
            const cached = userNameCacheRef.current.get(userId);
            if (cached) return cached;
            const { data: userProfile } = await supabaseAdmin
              .from("user_profiles")
              .select("nickname, name")
              .eq("id", userId)
              .maybeSingle();
            const displayName =
              userProfile?.nickname || userProfile?.name || "회원";
            userNameCacheRef.current.set(userId, displayName);
            return displayName;
          };

          const resolveAgentName = async (profileId: string) => {
            if (!profileId) return "프로필";
            const cached = agentNameCacheRef.current.get(profileId);
            if (cached) return cached;
            const { data: profile } = await supabaseAdmin
              .from("chat_profiles")
              .select("name")
              .eq("id", profileId)
              .maybeSingle();
            const agentName = profile?.name || "프로필";
            agentNameCacheRef.current.set(profileId, agentName);
            return agentName;
          };

          if (processedMessageIdsRef.current.has(typedMessage.id)) return;
          processedMessageIdsRef.current.set(typedMessage.id, Date.now());
          if (processedMessageIdsRef.current.size > 200) {
            const oldest = processedMessageIdsRef.current.keys().next().value;
            if (oldest) {
              processedMessageIdsRef.current.delete(oldest);
            }
          }

          const [userName, agentName] = await Promise.all([
            resolveUserName(roomInfo.userId),
            resolveAgentName(roomInfo.profileId),
          ]);

          // 소리 재생
          if (settingsRef.current.globalEnabled) {
            playSoundRef.current();
          }

          // 토스트 알림 추가
          addChatNotification({
            message: `${userName} · ${agentName}`,
            description:
              typedMessage.content && typedMessage.content.length > 30
                ? typedMessage.content.slice(0, 30) + "..."
                : typedMessage.content || "",
          });
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [
    adminAccount,
    isAgent,
    settings.globalEnabled,
    settings.agentChatEnabled,
    assignedProfileIds,
  ]);

  return { notifications, dismissNotification: dismissChatNotification };
}
