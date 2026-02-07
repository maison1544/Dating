import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import Logo from "../../imports/Logo";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showTestAccountInfo = (() => {
    try {
      const url = new URL(import.meta.env.VITE_SUPABASE_URL);
      return url.hostname === "localhost" || url.hostname === "127.0.0.1";
    } catch {
      return false;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    if (!trimmedPassword) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(trimmedEmail, trimmedPassword);
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-0.5">
            <div className="h-20 w-[250px] mx-auto">
              <Logo />
            </div>
          </Link>
          <p className="text-gray-400">특별한 만남을 시작하세요</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h2 className="text-white text-2xl mb-6 text-center">로그인</h2>

          {/* Test Account Info */}
          {showTestAccountInfo && (
            <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <p className="text-indigo-400 text-xs text-center mb-1">
                테스트 계정
              </p>
              <p className="text-white text-xs text-center">
                test@secretday.com / test1234
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">이메일</label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  required
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:outline-none focus:border-pink-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading ? "로그인 중..." : "로그인"}
            </button>

            {/* Signup Button */}
            <Link to="/signup">
              <button
                type="button"
                className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
              >
                회원가입
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
