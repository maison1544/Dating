import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useNotification } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribe,
  getSnapshot,
  addChatNotification,
  dismissChatNotification,
} from "@/stores/chatNotificationStore";

type UserChatRoom = {
  id: string;
};

type UserChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: string;
  content: string | null;
};

export function useUserChatNotifications() {
  const router = useRouter();
  const { settings, playSound, activeChatId, openChatModalIds, isChatMuted } =
    useNotification();
  const { user, profile, adminAccount } = useAuth();
  const [userRoomIds, setUserRoomIds] = useState<Set<string>>(new Set());
  const processedMessageIdsRef = useRef<Map<string, number>>(new Map());
  const agentNameCacheRef = useRef<Map<string, string>>(new Map());
  const userDisplayNameRef = useRef<string | null>(
    profile?.nickname || profile?.name || null,
  );

  const notifications = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const settingsRef = useRef(settings);
  const playSoundRef = useRef(playSound);
  const activeChatIdRef = useRef(activeChatId);
  const openChatModalIdsRef = useRef(openChatModalIds);
  const isChatMutedRef = useRef(isChatMuted);
  const routerRef = useRef(router);
  const userRoomIdsRef = useRef(userRoomIds);
  const profileIdRef = useRef(profile?.id ?? null);

  useEffect(() => {
    settingsRef.current = settings;
    playSoundRef.current = playSound;
    activeChatIdRef.current = activeChatId;
    openChatModalIdsRef.current = openChatModalIds;
    isChatMutedRef.current = isChatMuted;
    routerRef.current = router;
    userRoomIdsRef.current = userRoomIds;
    profileIdRef.current = profile?.id ?? null;
    userDisplayNameRef.current = profile?.nickname || profile?.name || null;
  }, [
    settings,
    playSound,
    activeChatId,
    openChatModalIds,
    isChatMuted,
    router,
    userRoomIds,
    profile?.id,
    profile?.nickname,
    profile?.name,
  ]);

  // 유저의 채팅방 ID 목록 가져오기
  useEffect(() => {
    if (adminAccount) return;
    if (!user || !profile?.id) return;

    const fetchUserRooms = async () => {
      const { data } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("user_id", profile.id);

      const rooms = (data || []) as UserChatRoom[];

      if (rooms.length > 0) {
        setUserRoomIds(new Set(rooms.map((r) => r.id)));
      }
    };

    fetchUserRooms();

    // 새 채팅방 생성 시 목록 갱신
    const roomChannel = supabase
      .channel("user-rooms-watch")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_rooms",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload: { new: UserChatRoom }) => {
          const newRoom = payload.new;
          setUserRoomIds((prev) => new Set([...prev, newRoom.id]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [user, profile?.id, adminAccount]);

  useEffect(() => {
    // 일반 유저만 알림 수신 (관리자/에이전트 제외)
    if (adminAccount) return;
    if (!user || !profile?.id) return;
    if (!settings.globalEnabled) return;

    const channel = supabase
      .channel("user-chat-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload: { new: { id: string } }) => {
          const partialMessage = payload.new;

          // Realtime에서 모든 필드가 오지 않을 수 있으므로 전체 메시지 조회
          const { data: message } = await supabase
            .from("messages")
            .select("id, room_id, sender_id, sender_type, content")
            .eq("id", partialMessage.id)
            .single();

          if (!message) return;
          const typedMessage = message as UserChatMessage;

          const ensureUserRoom = async () => {
            if (userRoomIdsRef.current.has(typedMessage.room_id)) return true;
            const profileId = profileIdRef.current;
            if (!profileId) return false;
            const { data: room } = await supabase
              .from("chat_rooms")
              .select("id")
              .eq("id", typedMessage.room_id)
              .eq("user_id", profileId)
              .maybeSingle();
            if (!room) return false;
            setUserRoomIds((prev) => {
              if (prev.has(typedMessage.room_id)) return prev;
              const next = new Set(prev);
              next.add(typedMessage.room_id);
              userRoomIdsRef.current = next;
              return next;
            });
            return true;
          };

          // 유저의 채팅방이 아니면 무시
          if (!(await ensureUserRoom())) return;

          // 프로필(에이전트)이 보낸 메시지만 알림 (유저 자신이 보낸 메시지 제외)
          if (typedMessage.sender_type !== "profile") return;

          // 해당 채팅이 음소거 상태인지 확인
          if (isChatMutedRef.current(typedMessage.room_id)) return;

          // 현재 채팅창이 열려있으면 알림 발생 안함
          if (activeChatIdRef.current === typedMessage.room_id) return;

          // 해당 대화가 모달로 열려있으면 알림 발생 안함
          if (openChatModalIdsRef.current.has(typedMessage.room_id)) return;

          const resolveAgentName = async (agentId: string) => {
            if (!agentId) return "에이전트";
            const cached = agentNameCacheRef.current.get(agentId);
            if (cached) return cached;
            const { data: agentProfile } = await supabase
              .from("chat_profiles")
              .select("name")
              .eq("id", agentId)
              .maybeSingle();
            const agentName = agentProfile?.name || "에이전트";
            agentNameCacheRef.current.set(agentId, agentName);
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

          const userName = userDisplayNameRef.current || "회원";
          const agentName = await resolveAgentName(typedMessage.sender_id);

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
            action: {
              label: "확인하기",
              onClick: () => routerRef.current.push("/chat"),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.id, adminAccount, settings.globalEnabled]);

  return { notifications, dismissNotification: dismissChatNotification };
}
