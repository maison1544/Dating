import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/client";
import { useNotification } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribe,
  getSnapshot,
  addNotification as storeAddNotification,
  dismissNotification as storeDismissNotification,
} from "@/stores/adminNotificationStore";

const ADMIN_NOTIFIED_IDS_KEY = "adminNotifications.notifiedIds";
const MAX_STORED_NOTIFIED_IDS = 200;

type AdminPaymentNotificationRequest = {
  id: string;
  amount: number;
  status: string;
  user_id?: string | null;
  created_at?: string | null;
};

type AdminRegistrationNotificationProfile = {
  id: string;
  status: string;
  nickname?: string | null;
  name?: string | null;
  created_at?: string | null;
};

export function useAdminNotifications() {
  const router = useRouter();
  const { settings, playSound } = useNotification();
  const { adminAccount, isAgent } = useAuth();

  // Use global store for notifications - persists across HMR
  const notifications = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  // Use refs for settings to avoid stale closures
  const settingsRef = useRef(settings);
  const playSoundRef = useRef(playSound);
  const routerRef = useRef(router);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const notifiedIdsLoadedRef = useRef(false);
  const userNameCacheRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    settingsRef.current = settings;
    playSoundRef.current = playSound;
    routerRef.current = router;
  }, [settings, playSound, router]);

  const ensureNotifiedIdsLoaded = () => {
    if (notifiedIdsLoadedRef.current) return;
    notifiedIdsLoadedRef.current = true;
    try {
      const stored = localStorage.getItem(ADMIN_NOTIFIED_IDS_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach((key) => {
          if (typeof key === "string") {
            notifiedIdsRef.current.add(key);
          }
        });
      }
    } catch {
      // ignore
    }
  };

  const persistNotifiedIds = () => {
    try {
      const ids = Array.from(notifiedIdsRef.current);
      const trimmed = ids.slice(-MAX_STORED_NOTIFIED_IDS);
      if (trimmed.length !== ids.length) {
        notifiedIdsRef.current = new Set(trimmed);
      }
      localStorage.setItem(ADMIN_NOTIFIED_IDS_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // 관리자만 알림 수신 (에이전트 제외)
    if (!adminAccount || isAgent) return;
    if (!settings.globalEnabled) return;

    ensureNotifiedIdsLoaded();

    const hasNotified = (key: string) => notifiedIdsRef.current.has(key);

    const markNotified = (key: string) => {
      if (hasNotified(key)) return false;
      notifiedIdsRef.current.add(key);
      persistNotifiedIds();
      return true;
    };

    const resolveUserName = async (userId?: string | null) => {
      if (!userId) return "회원";
      const cached = userNameCacheRef.current.get(userId);
      if (cached) return cached;
      const { data: userProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("nickname, name")
        .eq("id", userId)
        .maybeSingle();
      const displayName = userProfile?.nickname || userProfile?.name || "회원";
      userNameCacheRef.current.set(userId, displayName);
      return displayName;
    };

    const notifyDeposit = async (request: AdminPaymentNotificationRequest) => {
      if (request.status !== "pending") return;
      if (!markNotified(`deposit:${request.id}`)) return;

      const amount = Math.abs(request.amount).toLocaleString();
      const displayName = await resolveUserName(request.user_id);
      if (settingsRef.current.globalEnabled) {
        playSoundRef.current();
      }
      storeAddNotification({
        message: "새로운 입금 신청",
        description: `${displayName}님이 ${amount}원 입금 신청을 하였습니다.`,
        action: {
          label: "확인하기",
          onClick: () => routerRef.current.push("/admin/points"),
        },
      });
    };

    const notifyWithdrawal = async (
      request: AdminPaymentNotificationRequest,
    ) => {
      if (request.status !== "pending") return;
      if (!markNotified(`withdrawal:${request.id}`)) return;

      const amount = Math.abs(request.amount).toLocaleString();
      const displayName = await resolveUserName(request.user_id);
      if (settingsRef.current.globalEnabled) {
        playSoundRef.current();
      }
      storeAddNotification({
        message: "새로운 출금 신청",
        description: `${displayName}님이 ${amount}원 출금 신청을 하였습니다.`,
        action: {
          label: "확인하기",
          onClick: () => routerRef.current.push("/admin/points"),
        },
      });
    };

    const notifyRegistration = (
      profile: AdminRegistrationNotificationProfile,
    ) => {
      if (profile.status !== "pending") return;
      if (!markNotified(`registration:${profile.id}`)) {
        return;
      }

      const displayName = profile.nickname || profile.name || "신규 회원";
      if (settingsRef.current.globalEnabled) {
        playSoundRef.current();
      }
      storeAddNotification({
        message: "새로운 가입 신청",
        description: `${displayName}님이 가입 신청을 하였습니다.`,
        action: {
          label: "확인하기",
          onClick: () => routerRef.current.push("/admin/users"),
        },
      });
    };

    const fetchPending = async () => {
      if (!settingsRef.current.globalEnabled) return;
      if (settingsRef.current.depositWithdrawEnabled) {
        let depositQuery = supabaseAdmin
          .from("deposit_requests")
          .select("id, amount, status, user_id, created_at")
          .eq("status", "pending");
        let withdrawalQuery = supabaseAdmin
          .from("withdrawal_requests")
          .select("id, amount, status, user_id, created_at")
          .eq("status", "pending");

        const [depositResult, withdrawalResult] = await Promise.all([
          depositQuery,
          withdrawalQuery,
        ]);

        depositResult.data?.forEach(
          (request: AdminPaymentNotificationRequest) => {
            void notifyDeposit(request);
          },
        );
        withdrawalResult.data?.forEach(
          (request: AdminPaymentNotificationRequest) => {
            void notifyWithdrawal(request);
          },
        );
      }

      if (settingsRef.current.registrationEnabled) {
        let registrationQuery = supabaseAdmin
          .from("user_profiles")
          .select("id, status, nickname, name, created_at")
          .eq("status", "pending");

        const { data: registrations, error: registrationError } =
          await registrationQuery;
        void registrationError;
        registrations?.forEach(
          (profile: AdminRegistrationNotificationProfile) =>
            notifyRegistration(profile),
        );
      }
    };

    void fetchPending();
    const channelSuffix = `${adminAccount.id}-${crypto.randomUUID()}`;

    // 입금 신청 알림 구독
    const depositChannel = supabaseAdmin
      .channel(`admin-deposit-notifications-${channelSuffix}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deposit_requests",
        },
        (payload: { new: AdminPaymentNotificationRequest }) => {
          if (!settingsRef.current.depositWithdrawEnabled) return;

          const request = payload.new;
          void notifyDeposit(request);
        },
      )
      .subscribe();

    // 출금 신청 알림 구독
    const withdrawalChannel = supabaseAdmin
      .channel(`admin-withdrawal-notifications-${channelSuffix}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "withdrawal_requests",
        },
        (payload: { new: AdminPaymentNotificationRequest }) => {
          if (!settingsRef.current.depositWithdrawEnabled) return;

          const request = payload.new;
          void notifyWithdrawal(request);
        },
      )
      .subscribe();

    // 가입 신청 알림 구독
    const registrationChannel = supabaseAdmin
      .channel(`admin-registration-notifications-${channelSuffix}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_profiles",
        },
        (payload: { new: AdminRegistrationNotificationProfile }) => {
          if (!settingsRef.current.registrationEnabled) return;

          const profile = payload.new;

          notifyRegistration(profile);
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(depositChannel);
      supabaseAdmin.removeChannel(withdrawalChannel);
      supabaseAdmin.removeChannel(registrationChannel);
    };
  }, [
    adminAccount,
    isAgent,
    settings.globalEnabled,
    settings.depositWithdrawEnabled,
    settings.registrationEnabled,
  ]);

  // Return notifications and dismiss function for rendering in AdminLayout
  return { notifications, dismissNotification: storeDismissNotification };
}
