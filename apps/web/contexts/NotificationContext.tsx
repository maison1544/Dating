import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { useAppScope } from "./AppScopeContext";

// 알림음 목록
export const NOTIFICATION_SOUNDS = [
  { id: 1, name: "기본 알림", file: "/sounds/notification1.mp3" },
  { id: 2, name: "알림음 2", file: "/sounds/notification2.mp3" },
  { id: 3, name: "알림음 3", file: "/sounds/notification3.mp3" },
  { id: 4, name: "알림음 4", file: "/sounds/notification4.mp3" },
  { id: 5, name: "알림음 5", file: "/sounds/notification5.mp3" },
] as const;

// 알림 설정 타입
export interface NotificationSettings {
  // 공통
  selectedSoundId: number;
  globalEnabled: boolean;

  // 유저용
  mutedChatIds: string[]; // 개별 채팅 음소거

  // 관리자용
  depositWithdrawEnabled: boolean;
  registrationEnabled: boolean;

  // 에이전트용
  agentChatEnabled: boolean;
  agentMutedChatIds: string[]; // 개별 채팅 음소거
}

const DEFAULT_SETTINGS: NotificationSettings = {
  selectedSoundId: 1,
  globalEnabled: true,
  mutedChatIds: [],
  depositWithdrawEnabled: true,
  registrationEnabled: true,
  agentChatEnabled: true,
  agentMutedChatIds: [],
};

interface NotificationContextValue {
  settings: NotificationSettings;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  playSound: () => void;
  previewSound: (soundId: number) => void;
  // 채팅 모달 열림 상태 추적
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  // 에이전트용: 열려있는 채팅 모달 ID들
  openChatModalIds: Set<string>;
  addOpenChatModal: (conversationId: string) => void;
  removeOpenChatModal: (conversationId: string) => void;
  // 개별 채팅 음소거 토글
  toggleChatMute: (chatId: string, isAgent?: boolean) => void;
  isChatMuted: (chatId: string, isAgent?: boolean) => boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

const getNotificationStorageKey = (appScope: string) =>
  `dating:${appScope}:notification_settings`;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { appScope } = useAppScope();
  const storageKey = getNotificationStorageKey(appScope);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [openChatModalIds, setOpenChatModalIds] = useState<Set<string>>(
    new Set(),
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSoundIdRef = useRef<number | null>(null);
  const unlockListenerRef = useRef<(() => void) | null>(null);

  // 설정 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, storageKey]);

  const updateSettings = useCallback(
    (updates: Partial<NotificationSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const tryPlaySound = useCallback(async (soundId: number) => {
    const sound = NOTIFICATION_SOUNDS.find((s) => s.id === soundId);
    if (!sound) return true;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(sound.file);
      audio.volume = 0.5;
      audioRef.current = audio;
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  const registerAudioUnlock = useCallback(() => {
    if (unlockListenerRef.current) return;

    const handleUnlock = () => {
      unlockListenerRef.current = null;
      const pendingId = pendingSoundIdRef.current;
      if (!pendingId) return;
      pendingSoundIdRef.current = null;

      void (async () => {
        const played = await tryPlaySound(pendingId);
        if (!played) {
          pendingSoundIdRef.current = pendingId;
          registerAudioUnlock();
        }
      })();
    };

    unlockListenerRef.current = handleUnlock;
    window.addEventListener("pointerdown", handleUnlock, { once: true });
    window.addEventListener("keydown", handleUnlock, { once: true });
  }, [tryPlaySound]);

  useEffect(() => {
    return () => {
      if (unlockListenerRef.current) {
        window.removeEventListener("pointerdown", unlockListenerRef.current);
        window.removeEventListener("keydown", unlockListenerRef.current);
        unlockListenerRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(() => {
    if (!settings.globalEnabled) return;

    const soundId = settings.selectedSoundId;
    void (async () => {
      const played = await tryPlaySound(soundId);
      if (!played) {
        pendingSoundIdRef.current = soundId;
        registerAudioUnlock();
      }
    })();
  }, [
    registerAudioUnlock,
    settings.globalEnabled,
    settings.selectedSoundId,
    tryPlaySound,
  ]);

  const previewSound = useCallback((soundId: number) => {
    const sound = NOTIFICATION_SOUNDS.find((s) => s.id === soundId);
    if (!sound) return;

    try {
      const audio = new Audio(sound.file);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const addOpenChatModal = useCallback((conversationId: string) => {
    setOpenChatModalIds((prev) => new Set(prev).add(conversationId));
  }, []);

  const removeOpenChatModal = useCallback((conversationId: string) => {
    setOpenChatModalIds((prev) => {
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  const toggleChatMute = useCallback((chatId: string, isAgent = false) => {
    if (isAgent) {
      setSettings((prev) => {
        const muted = new Set(prev.agentMutedChatIds);
        if (muted.has(chatId)) {
          muted.delete(chatId);
        } else {
          muted.add(chatId);
        }
        return { ...prev, agentMutedChatIds: Array.from(muted) };
      });
    } else {
      setSettings((prev) => {
        const muted = new Set(prev.mutedChatIds);
        if (muted.has(chatId)) {
          muted.delete(chatId);
        } else {
          muted.add(chatId);
        }
        return { ...prev, mutedChatIds: Array.from(muted) };
      });
    }
  }, []);

  const isChatMuted = useCallback(
    (chatId: string, isAgent = false) => {
      if (isAgent) {
        return settings.agentMutedChatIds.includes(chatId);
      }
      return settings.mutedChatIds.includes(chatId);
    },
    [settings.agentMutedChatIds, settings.mutedChatIds],
  );

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      playSound,
      previewSound,
      activeChatId,
      setActiveChatId,
      openChatModalIds,
      addOpenChatModal,
      removeOpenChatModal,
      toggleChatMute,
      isChatMuted,
    }),
    [
      settings,
      updateSettings,
      playSound,
      previewSound,
      activeChatId,
      openChatModalIds,
      addOpenChatModal,
      removeOpenChatModal,
      toggleChatMute,
      isChatMuted,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return ctx;
}
