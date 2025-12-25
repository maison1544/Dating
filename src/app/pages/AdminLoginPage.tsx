import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";
import Logo from "../../imports/Logo";

export function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 간단한 관리자 로그인 체크 (실제로는 백엔드 인증 필요)
    if (email === "admin@secretday.com" && password === "admin1234") {
      localStorage.setItem("isAdmin", "true");
      localStorage.removeItem("isAgent");
      navigate("/admin/dashboard");
    } else if (email === "agent@secretday.com" && password === "agent1234") {
      localStorage.setItem("isAgent", "true");
      localStorage.removeItem("isAdmin");
      navigate("/agent/dashboard");
    } else {
      alert("계정 정보가 올바르지 않습니다.");
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
            관리자 페이지
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/30 p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="text-indigo-400" size={28} />
            <h2 className="text-gray-100 text-2xl text-center">
              관리자 로그인
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                관리자 이메일
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@secretday.com"
                  className="w-full bg-gray-800/60 border border-gray-600/30 rounded-lg pl-10 pr-4 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 transition-all"
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
                  className="w-full bg-gray-800/60 border border-gray-600/30 rounded-lg pl-10 pr-12 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white py-3 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Shield size={20} />
              로그인
            </button>
          </form>

          <div className="mt-5 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400/90 text-xs text-center">
              ⚠️ 데모용 계정: admin@secretday.com / admin1234
            </p>
            <p className="text-yellow-400/90 text-xs text-center mt-1">
              에이전트 계정: agent@secretday.com / agent1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}