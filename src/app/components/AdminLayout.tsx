import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Coins,
  Bell,
  MessageSquare,
  AlertTriangle,
  Gift,
  LogOut,
  Menu,
  X,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  UserCog,
} from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "../../imports/Logo";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => {
      const saved = localStorage.getItem(
        "adminSidebarCollapsed",
      );
      return saved === "true";
    },
  );

  // Check if logged in as agent
  const isAgent = localStorage.getItem("isAgent") === "true";

  useEffect(() => {
    localStorage.setItem(
      "adminSidebarCollapsed",
      isSidebarCollapsed.toString(),
    );
  }, [isSidebarCollapsed]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("isAgent");
    navigate("/admin/login");
  };

  const menuItems = [
    {
      path: "/admin/dashboard",
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
      path: "/agent/dashboard",
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
              {isSidebarOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
            <Link
              to={isAgent ? "/agent/dashboard" : "/admin/dashboard"}
              className="h-12 w-[180px]"
            >
              <Logo />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden sm:block">
              {isAgent ? "에이전트 모드" : "관리자 모드"}
            </span>
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
              onClick={() =>
                setIsSidebarCollapsed(!isSidebarCollapsed)
              }
              className="hidden lg:flex absolute -right-3 top-4 bg-gray-800/80 border border-gray-600/30 text-gray-400 hover:text-indigo-400 hover:bg-gray-700/80 hover:border-indigo-400/50 rounded-full p-1.5 transition-all duration-200 z-50 shadow-lg hover:shadow-indigo-500/10"
              title={
                isSidebarCollapsed
                  ? "사이드바 펼치기"
                  : "사이드바 숨기기"
              }
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>

            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white hover:shadow-md"
                  }`}
                  title={isSidebarCollapsed ? item.label : ""}
                >
                  <Icon
                    size={22}
                    className={isActive ? "" : ""}
                  />
                  <span
                    className={`${isSidebarCollapsed ? "lg:hidden" : ""} whitespace-nowrap`}
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
          className={`flex-1 overflow-auto transition-all duration-300`}
        >
          <div className={`mx-auto p-4 lg:p-6 ${isAgent ? 'max-w-7xl' : 'max-w-4xl'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}