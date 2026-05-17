import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Coins,
  Bell,
  MessageSquare,
  Gift,
  LogOut,
  Menu,
  X,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Logo from "@/imports/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationSettingsDropdown } from "./NotificationSettingsDropdown";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useAgentChatProfiles } from "@/hooks/useSupabase";
import { useAgentChatNotifications } from "@/hooks/useAgentChatNotifications";
import { useNotification } from "@/contexts/NotificationContext";
import { ChatNotificationRenderer } from "./ChatNotificationRenderer";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, adminAccount, isAgent, signOut, isLoading } = useAuth();
  const { activeChatId } = useNotification();
  const isLoginPath = pathname === "/admin/login" || pathname === "/agent/login";

  // 관리자 알림 훅 (입금/출금/가입 신청) - returns local notifications state
  const { notifications, dismissNotification } = useAdminNotifications();
  const { profiles: assignedDbProfiles } = useAgentChatProfiles(
    isAgent ? adminAccount?.id : undefined,
  );
  const assignedProfileIds = useMemo(() => {
    const fromProfiles = (assignedDbProfiles || [])
      .map((profile: { id?: string }) => profile.id)
      .filter(Boolean) as string[];
    const fromAccount =
      adminAccount &&
      "assigned_profile_ids" in adminAccount &&
      Array.isArray(adminAccount.assigned_profile_ids)
      ? adminAccount.assigned_profile_ids
      : [];
    return Array.from(new Set([...fromAccount, ...fromProfiles])).filter(
      Boolean,
    );
  }, [assignedDbProfiles, adminAccount]);
  const {
    notifications: chatNotifications,
    dismissNotification: dismissChatNotification,
  } = useAgentChatNotifications(
    assignedProfileIds,
    isAgent ? activeChatId : null,
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("adminSidebarCollapsed");
    return saved === "true";
  });

  const isDevBypass =
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dev") === "1";

  useEffect(() => {
    if (isLoginPath) return;
    if (isDevBypass) return;
    if (isLoading) return;
    if (!user) {
      router.push(
        pathname.startsWith("/agent")
          ? "/agent/login"
          : "/admin/login",
      );
      return;
    }
    if (!adminAccount) {
      router.push("/");
      return;
    }

    const isAdminPath = pathname.startsWith("/admin");
    const isAgentPath = pathname.startsWith("/agent");
    if (isAgent && isAdminPath) {
      router.push("/agent");
      return;
    }
    if (!isAgent && isAgentPath) {
      router.push("/admin");
    }
  }, [
    isDevBypass,
    isLoading,
    user,
    adminAccount,
    isAgent,
    router,
    pathname,
    isLoginPath,
  ]);

  useEffect(() => {
    window.localStorage.setItem(
      "adminSidebarCollapsed",
      isSidebarCollapsed.toString(),
    );
  }, [isSidebarCollapsed]);

  const handleLogout = async () => {
    await signOut();
    router.push(isAgent ? "/agent/login" : "/admin/login");
  };

  const menuItems = [
    {
      path: "/admin",
      icon: LayoutDashboard,
      label: "통계",
    },
    { path: "/admin/users", icon: Users, label: "회원 관리" },
    {
      path: "/admin/accounts",
      icon: UserCog,
      label: "관리자 계정",
    },
    {
      path: "/admin/points",
      icon: Coins,
      label: "입출금 관리",
    },
    { path: "/admin/notices", icon: Bell, label: "공지사항" },
    {
      path: "/admin/chats",
      icon: MessageSquare,
      label: "채팅 프로필 관리",
    },
    { path: "/admin/gifts", icon: Gift, label: "기프트 관리" },
    {
      path: "/admin/minigames",
      icon: Gamepad2,
      label: "미니게임 관리",
    },
  ];

  const agentMenuItems = [
    {
      path: "/agent",
      icon: LayoutDashboard,
      label: "에이전트 대시보드",
    },
    {
      path: "/agent/members",
      icon: Users,
      label: "회원 관리",
    },
    {
      path: "/agent/chats",
      icon: MessageSquare,
      label: "채팅 관리",
    },
    {
      path: "/agent/gifts",
      icon: Gift,
      label: "선물 관리",
    },
  ];

  const currentMenuItems = isAgent ? agentMenuItems : menuItems;

  if (isLoginPath) {
    return <>{children}</>;
  }

  // 로딩 중일 때 통일된 로딩 UI 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-gray-400 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/30 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-200 hover:text-indigo-400 transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href={isAgent ? "/agent" : "/admin"} className="h-12 w-[180px]">
              <Logo />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">
              {isAgent ? "에이전트 모드" : "관리자 모드"}
              {adminAccount && (
                <span className="ml-1 text-indigo-400">
                  ({adminAccount.username}
                  {adminAccount.name && ` / ${adminAccount.name}`})
                </span>
              )}
            </span>
            <NotificationSettingsDropdown
              variant={isAgent ? "agent" : "admin"}
            />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-200 hover:text-indigo-400 transition-colors"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky lg:top-0 top-16 left-0 bg-gray-900/80 backdrop-blur-sm border-r border-gray-700/30 transform transition-all duration-300 z-30 h-[calc(100vh-4rem)] lg:h-screen ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          } ${isSidebarCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
        >
          <nav className="p-4 space-y-2 relative">
            {/* Desktop Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex absolute -right-3 top-4 bg-gray-800/80 border border-gray-600/30 text-gray-400 hover:text-indigo-400 hover:bg-gray-700/80 hover:border-indigo-400/50 rounded-full p-1.5 transition-all duration-200 z-50 shadow-lg hover:shadow-indigo-500/10"
              title={isSidebarCollapsed ? "사이드바 펼치기" : "사이드바 숨기기"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>

            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isRootDashboard =
                item.path === "/admin" || item.path === "/agent";
              const isActive = isRootDashboard
                ? pathname === item.path ||
                  pathname === `${item.path}/dashboard`
                : pathname === item.path ||
                  pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-md"
                  }`}
                  title={isSidebarCollapsed ? item.label : ""}
                >
                  <Icon size={22} className={isActive ? "" : ""} />
                  <span
                    className={`${
                      isSidebarCollapsed ? "lg:hidden" : ""
                    } whitespace-nowrap`}
                  >
                    {item.label}
                  </span>

                  {/* Active Indicator */}
                  {isActive && !isSidebarCollapsed && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-white/80" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {isSidebarCollapsed && (
                    <span className="hidden lg:block absolute left-full ml-3 px-3 py-2 bg-gray-800/90 text-gray-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-gray-600/30">
                      {item.label}
                      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800/90" />
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300`}
        >
          <div
            className={`mx-auto p-4 lg:p-6 ${
              isAgent ? "max-w-7xl" : "max-w-4xl"
            }`}
          >
            {children}
          </div>
        </main>
      </div>

      <ChatNotificationRenderer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {isAgent && (
        <ChatNotificationRenderer
          notifications={chatNotifications}
          onDismiss={dismissChatNotification}
        />
      )}
    </div>
  );
}
