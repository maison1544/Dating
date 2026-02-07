import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, supabaseAdmin } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";
import { useAlert } from "./AlertContext";

type UserProfile = Tables<"user_profiles">;
type AdminAccount = Tables<"admins"> | Tables<"agents">;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  adminAccount: AdminAccount | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithUsername: (
    username: string,
    password: string,
    expectedRole?: "admin" | "agent",
  ) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<UserProfile>,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<UserProfile>,
  ) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authSyncSeq = useRef(0);
  const adminAccountRef = useRef<AdminAccount | null>(null);
  const initSessionCompleted = useRef(false);
  const isManualSigningIn = useRef(false);
  const { showAlert } = useAlert();

  const isAdmin = !!(
    adminAccount &&
    "role" in adminAccount &&
    (adminAccount.role === "admin" || adminAccount.role === "super_admin")
  );
  const isAgent = !!(adminAccount && "referral_code" in adminAccount);

  useEffect(() => {
    adminAccountRef.current = adminAccount;
  }, [adminAccount]);

  const fetchOrCreateProfile = async (authUser: User) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      return null;
    }

    if (data) {
      return data;
    }

    const email = authUser.email;
    if (!email) {
      return null;
    }

    const emailPrefix = email.split("@")[0] || "user";
    const name =
      (authUser.user_metadata?.name as string | undefined) || emailPrefix;
    const nickname =
      (authUser.user_metadata?.nickname as string | undefined) || name;

    const { data: created, error: createError } = await supabase
      .from("user_profiles")
      .insert({
        id: authUser.id,
        email,
        name,
        nickname,
        phone: (authUser.user_metadata?.phone as string | undefined) || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (createError) {
      return null;
    }
    return created;
  };

  const fetchAdminAccount = async (userId: string) => {
    // Use supabaseAdmin to ensure we get the latest is_active value without RLS interference
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (adminError) {
      return null;
    }

    if (adminData) {
      return adminData;
    }

    const { data: agentData, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (agentError) {
      return null;
    }

    return agentData ?? null;
  };

  useEffect(() => {
    let cancelled = false;

    // 유저 세션 동기화 (유저 클라이언트용)
    const syncUserSession = async (nextSession: Session | null) => {
      const syncSeq = ++authSyncSeq.current;
      setIsLoading(true);

      try {
        if (!nextSession?.user) {
          if (cancelled || syncSeq !== authSyncSeq.current) return;

          setSession(null);
          setUser(null);
          setAdminAccount(null);
          setProfile(null);
          return;
        }

        const authUser = nextSession.user;

        // 관리자/에이전트 계정인지 확인
        const account = await fetchAdminAccount(authUser.id);
        if (account) {
          // 유저 클라이언트에 관리자 계정이 로그인됨 - 로그아웃 처리
          await supabase.auth.signOut();
          if (cancelled || syncSeq !== authSyncSeq.current) return;
          setSession(null);
          setUser(null);
          setAdminAccount(null);
          setProfile(null);
          return;
        }

        const userProfile = await fetchOrCreateProfile(authUser);

        if (userProfile && userProfile.status !== "active") {
          await supabase.auth.signOut();

          if (cancelled || syncSeq !== authSyncSeq.current) return;

          setSession(null);
          setUser(null);
          setAdminAccount(null);
          setProfile(null);
          return;
        }

        if (cancelled || syncSeq !== authSyncSeq.current) return;

        setSession(nextSession);
        setUser(authUser);
        setAdminAccount(null);
        setProfile(userProfile);
      } finally {
        if (!cancelled && syncSeq === authSyncSeq.current) {
          setIsLoading(false);
        }
      }
    };

    // 관리자 세션 동기화 (관리자 클라이언트용)
    const syncAdminSession = async (nextSession: Session | null) => {
      if (!nextSession?.user) {
        // 관리자 세션이 사라졌으면 상태 초기화 (signOut 후 호출 시)
        if (adminAccountRef.current) {
          setSession(null);
          setUser(null);
          setAdminAccount(null);
          setProfile(null);
          setIsLoading(false);
        }
        return;
      }

      const authUser = nextSession.user;
      const account = await fetchAdminAccount(authUser.id);

      if (account) {
        // Check if account is suspended
        if (account.is_active === false) {
          // Sign out suspended account
          await supabaseAdmin.auth.signOut();
          setSession(null);
          setUser(null);
          setAdminAccount(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        setSession(nextSession);
        setUser(authUser);
        setAdminAccount(account);
        setProfile(null);
        setIsLoading(false);
      }
    };

    // 초기 세션 가져오기 - 먼저 관리자 세션 확인, 없으면 유저 세션 확인
    const initSession = async () => {
      try {
        // 관리자 세션 확인
        const {
          data: { session: adminSession },
        } = await supabaseAdmin.auth.getSession();
        if (adminSession?.user) {
          await syncAdminSession(adminSession);
          return;
        }

        // 유저 세션 확인
        const {
          data: { session: userSession },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          await syncUserSession(userSession);
        }
      } finally {
        // 초기 세션 확인 완료 표시
        initSessionCompleted.current = true;
      }
    };

    initSession();

    // 유저 세션 변경 감지
    const {
      data: { subscription: userSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      // 초기 세션 확인이 완료되기 전에는 무시 (race condition 방지)
      if (!initSessionCompleted.current) return;
      // 관리자 세션이 활성화되어 있으면 유저 세션 변경 무시
      if (adminAccountRef.current) return;
      void syncUserSession(session);
    });

    // 관리자 세션 변경 감지
    const {
      data: { subscription: adminSubscription },
    } = supabaseAdmin.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      // signInWithUsername 실행 중에는 syncAdminSession 차단 (역할 검증 레이스컨디션 방지)
      if (isManualSigningIn.current) return;
      void syncAdminSession(session);
    });

    return () => {
      cancelled = true;
      userSubscription.unsubscribe();
      adminSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (adminAccount) return;

    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          const next = (payload as any)?.new;
          if (next && typeof next === "object") {
            const nextProfile = next as UserProfile;

            // If user status changed to suspended or rejected, sign them out immediately
            if (
              nextProfile.status === "suspended" ||
              nextProfile.status === "rejected"
            ) {
              showAlert({
                title: "세션 종료",
                message:
                  nextProfile.status === "suspended"
                    ? "계정이 정지되었습니다. 관리자에게 문의하세요."
                    : "계정이 승인거절되었습니다. 관리자에게 문의하세요.",
                type: "error",
              });
              await supabase.auth.signOut();
              return;
            }

            setProfile(nextProfile);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, adminAccount, showAlert]);

  // Heartbeat는 useSessionTimeout 훅에서 통합 처리 (유저/관리자/에이전트 모두)

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: new Error("이메일 또는 비밀번호가 올바르지 않습니다.") };
    }

    const authUser = data.user;
    if (!authUser) {
      await supabase.auth.signOut();
      return { error: new Error("로그인에 실패했습니다.") };
    }

    const account = await fetchAdminAccount(authUser.id);
    if (account) {
      await supabase.auth.signOut();
      return {
        error: new Error(
          "관리자/에이전트 계정은 관리자 로그인 페이지에서 아이디/비밀번호로 로그인해주세요.",
        ),
      };
    }

    const userProfile = await fetchOrCreateProfile(authUser);
    if (!userProfile) {
      await supabase.auth.signOut();
      return { error: new Error("로그인에 실패했습니다.") };
    }

    if (userProfile.status !== "active") {
      await supabase.auth.signOut();
      const message =
        userProfile.status === "pending"
          ? "관리자 승인 대기 중입니다. 승인 후 로그인 가능합니다."
          : userProfile.status === "suspended"
            ? "정지된 계정입니다. 관리자에게 문의하세요."
            : "로그인할 수 없는 계정 상태입니다.";
      return { error: new Error(message) };
    }

    // Record user login (last_login_at, last_login_ip) and set is_online = true
    try {
      const token = data.session?.access_token;
      if (token) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as
          | string
          | undefined;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
          | string
          | undefined;

        if (supabaseUrl && anonKey) {
          await fetch(`${supabaseUrl}/functions/v1/user-record-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: anonKey,
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });
        }
      }

      // Set is_online = true and last_active_at on login
      await supabase
        .from("user_profiles")
        .update({
          is_online: true,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);
    } catch {
      // ignore - login tracking failure should not block login
    }

    return { error: null };
  };

  // 관리자/에이전트용 아이디 로그인 (별도 supabaseAdmin 클라이언트 사용)
  const signInWithUsername = async (
    username: string,
    password: string,
    expectedRole?: "admin" | "agent",
  ) => {
    // 가드 플래그: syncAdminSession이 이 함수 실행 중 상태를 설정하지 못하게 방지
    isManualSigningIn.current = true;

    try {
      const safe = (username || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_\-\.]/g, "");

      if (!safe) {
        return {
          error: new Error("아이디 또는 비밀번호가 올바르지 않습니다."),
        };
      }

      const email = `${safe}@backoffice.local`;

      // 관리자/에이전트는 별도 supabaseAdmin 클라이언트로 로그인
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          error: new Error("아이디 또는 비밀번호가 올바르지 않습니다."),
        };
      }

      // 관리자/에이전트 세션 수동 설정
      if (data.user) {
        const account = await fetchAdminAccount(data.user.id);
        if (account) {
          // 역할 검증: expectedRole이 지정된 경우 계정 유형 확인
          if (expectedRole) {
            const isAdminAccount = "role" in account;
            const isAgentAccount = "referral_code" in account;
            if (expectedRole === "admin" && !isAdminAccount) {
              await supabaseAdmin.auth.signOut();
              setSession(null);
              setUser(null);
              setAdminAccount(null);
              setProfile(null);
              return {
                error: new Error(
                  "에이전트 계정은 에이전트 로그인 페이지를 이용해주세요.",
                ),
              };
            }
            if (expectedRole === "agent" && !isAgentAccount) {
              await supabaseAdmin.auth.signOut();
              setSession(null);
              setUser(null);
              setAdminAccount(null);
              setProfile(null);
              return {
                error: new Error(
                  "관리자 계정은 관리자 로그인 페이지를 이용해주세요.",
                ),
              };
            }
          }
          // Check if account is suspended
          if (account.is_active === false) {
            // Sign out the user immediately
            await supabaseAdmin.auth.signOut();
            return {
              error: new Error("계정이 정지되었습니다. 관리자에게 문의하세요."),
            };
          }

          setUser(data.user);
          setSession(data.session);
          setAdminAccount(account);
          setProfile(null);

          try {
            const token = data.session?.access_token;
            if (token) {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as
                | string
                | undefined;
              const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
                | string
                | undefined;

              if (supabaseUrl && anonKey) {
                await fetch(
                  `${supabaseUrl}/functions/v1/backoffice-record-login`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      apikey: anonKey,
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({}),
                  },
                );
              }
            }
          } catch {
            // ignore
          }
        }
      }

      return { error: null };
    } finally {
      isManualSigningIn.current = false;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<UserProfile>,
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: data.user.id,
          email,
          name: userData.name || "",
          nickname: userData.nickname || "",
          phone: userData.phone,
          bank: userData.bank,
          account_number: userData.account_number,
          account_holder: userData.account_holder,
          status: "pending",
        });

      if (profileError) return { error: profileError };
    }

    return { error: null };
  };

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      // 현재 계정 타입에 따라 적절한 클라이언트에서 로그아웃
      if (adminAccount) {
        // 관리자/에이전트 로그아웃
        await supabaseAdmin.auth.signOut();
        localStorage.removeItem("sb-admin-auth-token");
      } else {
        // Set is_online = false before logout (if user exists)
        if (user?.id) {
          try {
            await supabase
              .from("user_profiles")
              .update({
                is_online: false,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);
          } catch {
            // ignore - online status update failure should not block logout
          }
        }

        // 유저 로그아웃
        const { error } = await supabase.auth.signOut();
        if (error) {
          const msg = String(error.message || "");
          const isIgnorable = /auth session missing/i.test(msg);
          if (!isIgnorable) {
            showAlert({
              title: "오류",
              message: `로그아웃에 실패했습니다: ${msg}`,
              type: "error",
            });
          }
        }
        localStorage.removeItem("sb-user-auth-token");
      }
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setAdminAccount(null);
      setIsLoading(false);
    }
  }, [showAlert, adminAccount, user?.id]);

  // 유저 계정 강제 로그아웃 구독
  useEffect(() => {
    if (!user?.id) return;
    if (adminAccount) return; // 관리자/에이전트는 별도 처리

    const channel = supabase
      .channel(`force-logout:${user.id}`)
      .on("broadcast", { event: "forced_logout" }, () => {
        showAlert({
          title: "안내",
          message:
            "비밀번호가 변경되어 세션이 종료되었습니다. 다시 로그인해주세요.",
          type: "info",
        });

        void signOut();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showAlert, signOut, user?.id, adminAccount]);

  // 관리자/에이전트 계정 강제 로그아웃 구독
  useEffect(() => {
    if (!user?.id) return;
    if (!adminAccount) return; // 유저는 위에서 처리

    const channel = supabaseAdmin
      .channel(`force-logout:${user.id}`)
      .on("broadcast", { event: "forced_logout" }, () => {
        showAlert({
          title: "안내",
          message:
            "비밀번호가 변경되어 세션이 종료되었습니다. 다시 로그인해주세요.",
          type: "info",
        });

        void signOut();
      })
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [showAlert, signOut, user?.id, adminAccount]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("user_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (!error) {
      const updatedProfile = await fetchOrCreateProfile(user);
      setProfile(updatedProfile);
    }

    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      const account = await fetchAdminAccount(user.id);
      const userProfile = account ? null : await fetchOrCreateProfile(user);
      setAdminAccount(account);
      setProfile(userProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        adminAccount,
        isLoading,
        isAdmin,
        isAgent,
        signIn,
        signInWithUsername,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
