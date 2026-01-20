import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../imports/Logo";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { showAlert } = useAlert();

  // AuthContext로 로그인 상태 확인
  const isLoggedIn = !!user;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "로그아웃에 실패했습니다.";
      showAlert({
        title: "오류",
        message,
        type: "error",
      });
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return routerLocation.pathname === "/";

    const aliasGroups: Record<string, string[]> = {
      "/ranking": ["/ranking"],
      "/minigame": [
        "/minigame",
        "/mini-game",
        "/ladder-game",
        "/powerball",
        "/mini-game/ladder-game",
        "/mini-game/powerball",
      ],
    };

    const candidates = aliasGroups[path] ?? [path];
    return candidates.some(
      (candidate) =>
        routerLocation.pathname === candidate ||
        routerLocation.pathname.startsWith(candidate + "/"),
    );
  };

  // 채팅방 페이지에서는 헤더를 숨김
  if (routerLocation.pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <header className="bg-black/90 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center h-12 md:static absolute left-1/2 -translate-x-1/2 md:translate-x-0"
          >
            <div className="h-full w-[200px]">
              <Logo />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`transition-colors ${
                isActive("/")
                  ? "text-pink-400"
                  : "text-white hover:text-pink-400"
              }`}
            >
              홈
            </Link>
            <Link
              to="/realtime-matching"
              className={`transition-colors ${
                isActive("/realtime-matching")
                  ? "text-pink-400"
                  : "text-white hover:text-pink-400"
              }`}
            >
              실시간채팅
            </Link>
            <Link
              to="/notice"
              className={`transition-colors ${
                isActive("/notice")
                  ? "text-pink-400"
                  : "text-white hover:text-pink-400"
              }`}
            >
              공지사항
            </Link>
            <Link
              to="/minigame"
              className={`transition-colors ${
                isActive("/minigame")
                  ? "text-pink-400"
                  : "text-white hover:text-pink-400"
              }`}
            >
              커플미션
            </Link>
            <Link
              to="/ranking"
              className={`transition-colors ${
                isActive("/ranking")
                  ? "text-pink-400"
                  : "text-white hover:text-pink-400"
              }`}
            >
              랭킹
            </Link>
            <Link
              to="/point"
              className={`transition-colors ${
                isActive("/point")
                  ? "text-pink-400"
                  : "text-white hover:text-pink-400"
              }`}
            >
              포인트
            </Link>
            {isLoggedIn && (
              <Link
                to="/mypage"
                className={`transition-colors ${
                  isActive("/mypage")
                    ? "text-pink-400"
                    : "text-white hover:text-pink-400"
                }`}
              >
                마이페이지
              </Link>
            )}
          </nav>

          {/* Right side - Login/Logout */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
                className="text-white hover:text-pink-400 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={18} />
                로그아웃
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-pink-400 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2 relative z-10 ml-auto"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className={`transition-colors ${
                  isActive("/")
                    ? "text-pink-400"
                    : "text-white hover:text-pink-400"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                홈
              </Link>
              <Link
                to="/realtime-matching"
                className={`transition-colors ${
                  isActive("/realtime-matching")
                    ? "text-pink-400"
                    : "text-white hover:text-pink-400"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                실시간채팅
              </Link>
              <Link
                to="/notice"
                className={`transition-colors ${
                  isActive("/notice")
                    ? "text-pink-400"
                    : "text-white hover:text-pink-400"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                공지사항
              </Link>
              <Link
                to="/minigame"
                className={`transition-colors ${
                  isActive("/minigame")
                    ? "text-pink-400"
                    : "text-white hover:text-pink-400"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                커플미션
              </Link>
              <Link
                to="/ranking"
                className={`transition-colors ${
                  isActive("/ranking")
                    ? "text-pink-400"
                    : "text-white hover:text-pink-400"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                랭킹
              </Link>
              <Link
                to="/point"
                className={`transition-colors ${
                  isActive("/point")
                    ? "text-pink-400"
                    : "text-white hover:text-pink-400"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                포인트
              </Link>
              {isLoggedIn && (
                <Link
                  to="/mypage"
                  className={`transition-colors ${
                    isActive("/mypage")
                      ? "text-pink-400"
                      : "text-white hover:text-pink-400"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  마이페이지
                </Link>
              )}
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-white hover:text-pink-400 transition-colors flex items-center gap-2 text-left cursor-pointer"
                >
                  <LogOut size={18} />
                  로그아웃
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-pink-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    로그인
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
