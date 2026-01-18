import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "../../imports/Logo";
import { useAuth } from "../contexts/AuthContext";

export function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const {
    signInWithUsername,
    user,
    adminAccount,
    isAgent,
    isLoading: authLoading,
  } = useAuth();

  const isAgentLogin = routerLocation.pathname.startsWith("/agent");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!adminAccount) return;

    navigate(isAgent ? "/agent" : "/admin");
  }, [authLoading, user, adminAccount, isAgent, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await signInWithUsername(username, password);
      if (error) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-0.5">
            <div className="h-20 w-[250px] mx-auto">
              <Logo />
            </div>
          </Link>
          <p className="text-gray-400">
            {isAgentLogin ? "에이전트 페이지" : "관리자 페이지"}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/30 p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="text-indigo-400" size={28} />
            <h2 className="text-gray-100 text-2xl text-center">
              {isAgentLogin ? "에이전트 로그인" : "관리자 로그인"}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                {isAgentLogin ? "에이전트 아이디" : "관리자 아이디"}
              </label>
              <div className="relative">
                <User
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isAgentLogin ? "agent" : "admin"}
                  className="w-full bg-gray-800/60 border border-gray-600/30 rounded-lg pl-10 pr-4 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                비밀번호
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full bg-gray-800/60 border border-gray-600/30 rounded-lg pl-10 pr-12 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white py-3 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  로그인
                </>
              )}
            </button>
          </form>

          <div className="mt-5 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400/90 text-xs text-center">
              Supabase Dashboard에서 계정을 생성하세요
            </p>
            <p className="text-yellow-400/90 text-xs text-center mt-1">
              SUPABASE_SETUP.md 파일 참고
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
