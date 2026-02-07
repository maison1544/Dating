import { useEffect, useRef, useCallback } from "react";
import { supabase, supabaseAdmin } from "../../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";

/**
 * 세션 타임아웃 훅: 미활동 시 자동 로그아웃
 * - 서버(RPC heartbeat_session)로 활동 기록 + 세션 유효성 검증
 * - 서버(RPC check_session_valid)로 주기적 타임아웃 검증
 * - DOM 이벤트로 사용자 활동 감지 → 서버 heartbeat (throttled)
 * - 주기적으로 서버에 세션 유효성 확인 → 만료 시 signOut
 */
export function useSessionTimeout() {
  const { user, adminAccount, signOut } = useAuth();
  const { showAlert } = useAlert();

  const timeoutMinutesRef = useRef<number>(30);
  const lastActivityRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(0);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSigningOutRef = useRef(false);

  // Supabase 클라이언트 선택
  const getClient = useCallback(() => {
    return adminAccount ? supabaseAdmin : supabase;
  }, [adminAccount]);

  // 서버에 heartbeat 전송 (throttled: 2분 간격)
  // heartbeat_session RPC가 last_active_at을 서버 시간으로 갱신하고 유효성 반환
  const sendHeartbeat = useCallback(async () => {
    const now = Date.now();
    const THROTTLE_MS = 2 * 60 * 1000; // 2분
    if (now - lastHeartbeatRef.current < THROTTLE_MS) return;
    lastHeartbeatRef.current = now;

    try {
      const client = getClient();
      const { data, error } = await client.rpc("heartbeat_session");

      if (error) return;

      // 서버에서 세션 무효 판정 시 로그아웃
      if (data && typeof data === "object" && "valid" in data) {
        const result = data as {
          valid: boolean;
          reason?: string;
          timeout_minutes?: number;
        };
        if (!result.valid && result.reason === "session_expired") {
          if (!isSigningOutRef.current) {
            isSigningOutRef.current = true;
            showAlert({
              title: "세션 만료",
              message: "장시간 미활동으로 자동 로그아웃되었습니다.",
              type: "info",
            });
            void signOut();
          }
          return;
        }
        if (result.timeout_minutes && result.timeout_minutes > 0) {
          timeoutMinutesRef.current = result.timeout_minutes;
        }
      }
    } catch {
      // ignore heartbeat failures
    }
  }, [getClient, showAlert, signOut]);

  // 활동 감지 핸들러
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    void sendHeartbeat();
  }, [sendHeartbeat]);

  // 서버 기반 타임아웃 체크 → 자동 로그아웃
  const checkTimeout = useCallback(async () => {
    if (!user) return;
    if (isSigningOutRef.current) return;

    try {
      const client = getClient();
      const { data, error } = await client.rpc("check_session_valid");

      if (error) return;

      if (data && typeof data === "object" && "valid" in data) {
        const result = data as { valid: boolean; reason?: string };
        if (!result.valid && result.reason === "session_expired") {
          isSigningOutRef.current = true;
          showAlert({
            title: "세션 만료",
            message: "장시간 미활동으로 자동 로그아웃되었습니다.",
            type: "info",
          });
          void signOut();
        }
      }
    } catch {
      // ignore check failures
    }
  }, [user, getClient, signOut, showAlert]);

  // 초기 타임아웃 값 가져오기 (서버 RPC)
  useEffect(() => {
    if (!user) return;

    const fetchTimeout = async () => {
      try {
        const client = getClient();
        const { data, error } = await client.rpc("get_session_timeout", {
          p_role: adminAccount
            ? "role" in adminAccount
              ? "admin"
              : "agent"
            : "user",
        });
        if (!error && typeof data === "number" && data > 0) {
          timeoutMinutesRef.current = data;
        }
      } catch {
        // 기본값 30분 유지
      }
    };

    fetchTimeout();
  }, [user, adminAccount, getClient]);

  // DOM 이벤트 리스너 등록 + 주기적 서버 체크
  useEffect(() => {
    if (!user) return;

    isSigningOutRef.current = false;
    lastActivityRef.current = Date.now();
    lastHeartbeatRef.current = Date.now(); // 초기화 시점에 throttle 리셋

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

    // 탭 전환 시 즉시 서버 체크
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkTimeout();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 1분마다 서버에 세션 유효성 체크
    checkIntervalRef.current = setInterval(
      () => void checkTimeout(),
      60 * 1000,
    );

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
