import { useEffect, useRef, useCallback } from "react";
import { supabase, supabaseAdmin } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";

/**
 * 세션 타임아웃 훅: 미활동 시 자동 로그아웃
 * - 서버(RPC)에서 타임아웃 값을 가져옴
 * - DOM 이벤트로 사용자 활동 감지
 * - 활동 시 last_active_at DB 업데이트 (throttled)
 * - 주기적으로 타임아웃 체크 → signOut
 */
export function useSessionTimeout() {
  const { user, adminAccount, signOut } = useAuth();
  const { showAlert } = useAlert();

  const timeoutMinutesRef = useRef<number>(30);
  const lastActivityRef = useRef<number>(Date.now());
  const lastDbUpdateRef = useRef<number>(0);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSigningOutRef = useRef(false);

  // 현재 역할 결정
  const getRole = useCallback((): "admin" | "agent" | "user" => {
    if (!adminAccount) return "user";
    if ("role" in adminAccount) return "admin";
    if ("referral_code" in adminAccount) return "agent";
    return "user";
  }, [adminAccount]);

  // DB에 last_active_at 업데이트 (throttled: 2분 간격)
  const updateDbLastActive = useCallback(async () => {
    const now = Date.now();
    const THROTTLE_MS = 2 * 60 * 1000; // 2분
    if (now - lastDbUpdateRef.current < THROTTLE_MS) return;
    lastDbUpdateRef.current = now;

    try {
      const role = getRole();
      if (role === "user") {
        if (!user?.id) return;
        await supabase
          .from("user_profiles")
          .update({
            last_activity: new Date().toISOString(),
            is_online: true,
          })
          .eq("id", user.id);
      } else {
        // admin/agent → RPC로 업데이트
        await supabaseAdmin.rpc("update_admin_last_active");
      }
    } catch {
      // ignore heartbeat failures
    }
  }, [user?.id, getRole]);

  // 활동 감지 핸들러
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    void updateDbLastActive();
  }, [updateDbLastActive]);

  // 타임아웃 체크 → 자동 로그아웃
  const checkTimeout = useCallback(() => {
    if (!user) return;
    if (isSigningOutRef.current) return;

    const elapsed = Date.now() - lastActivityRef.current;
    const timeoutMs = timeoutMinutesRef.current * 60 * 1000;

    if (elapsed >= timeoutMs) {
      isSigningOutRef.current = true;
      showAlert({
        title: "세션 만료",
        message: "장시간 미활동으로 자동 로그아웃되었습니다.",
        type: "info",
      });
      void signOut();
    }
  }, [user, signOut, showAlert]);

  // RPC에서 타임아웃 값 가져오기
  useEffect(() => {
    if (!user) return;

    const fetchTimeout = async () => {
      try {
        const role = getRole();
        const client = adminAccount ? supabaseAdmin : supabase;
        const { data, error } = await client.rpc("get_session_timeout", {
          p_role: role,
        });
        if (!error && typeof data === "number" && data > 0) {
          timeoutMinutesRef.current = data;
        }
      } catch {
        // 기본값 30분 유지
      }
    };

    fetchTimeout();
  }, [user, adminAccount, getRole]);

  // DOM 이벤트 리스너 등록 + 주기적 체크
  useEffect(() => {
    if (!user) return;

    isSigningOutRef.current = false;
    lastActivityRef.current = Date.now();
    lastDbUpdateRef.current = Date.now(); // 초기화 시점에 throttle 리셋

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // 탭 전환 시 즉시 체크
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkTimeout();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 1분마다 타임아웃 체크
    checkIntervalRef.current = setInterval(checkTimeout, 60 * 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user, handleActivity, checkTimeout]);
}
