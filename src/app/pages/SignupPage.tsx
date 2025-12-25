import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Phone, Tag } from 'lucide-react';
import { useState } from 'react';
import Logo from '../../imports/Logo';

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bank: '',
    accountNumber: '',
    accountHolder: '',
    referralCode: '',
    agree: false,
  });

  // 추천코드 검증 state
  const [referralCodeError, setReferralCodeError] = useState('');

  // 유효한 추천코드 목록 (더미 데이터)
  const validReferralCodes = ['AGENT001', 'AGENT002', 'PARTNER123', 'VIP2024'];

  // 추천코드 검증 함수
  const validateReferralCode = (code: string) => {
    if (!code) {
      setReferralCodeError('');
      return;
    }
    
    if (!validReferralCodes.includes(code.toUpperCase())) {
      setReferralCodeError('존재하지 않는 추천코드입니다.');
    } else {
      setReferralCodeError('');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    let formattedValue = '';
    
    if (value.length <= 3) {
      formattedValue = value;
    } else if (value.length <= 7) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length <= 11) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    } else {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
    }
    
    setFormData({ ...formData, phone: formattedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!formData.agree) {
      alert('약관에 동의해주세요.');
      return;
    }
    // 회원가입 로직
    alert('회원가입 기능은 준비중입니다.');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-0.5">
            <div className="h-20 w-[250px] mx-auto">
              <Logo />
            </div>
          </Link>
          <p className="text-gray-400">새로운 만남을 시작하세요</p>
        </div>

        {/* Signup Form */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h2 className="text-white text-2xl mb-6 text-center">회원가입</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">이름</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">닉네임</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="닉네임을 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">이메일</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="이메일을 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">휴대폰 번호</label>
              <div className="relative">
                <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="'-' 없이 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">비밀번호</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            {/* Confirm Password */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">비밀번호 확인</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:outline-none focus:border-pink-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Bank */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">은행</label>
              <select
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                required
              >
                <option value="">은행 선택</option>
                <option value="국민은행">국민은행</option>
                <option value="신한은행">신한은행</option>
                <option value="우리은행">우리은행</option>
                <option value="하나은행">하나은행</option>
                <option value="농협은행">농협은행</option>
                <option value="기업은행">기업은행</option>
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">계좌번호</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="'-' 없이 입력하세요"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                required
              />
            </div>

            {/* Account Holder */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">예금주</label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                placeholder="예금주 이름을 입력하세요"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                required
              />
            </div>

            {/* Referral Code */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">추천 코드 (선택)</label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => {
                  setFormData({ ...formData, referralCode: e.target.value });
                  validateReferralCode(e.target.value);
                }}
                placeholder="추천 코드를 입력하세요"
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none ${
                  referralCodeError
                    ? 'border-red-500 focus:border-red-500'
                    : formData.referralCode && !referralCodeError
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-gray-700 focus:border-pink-500'
                }`}
              />
              {referralCodeError && (
                <p className="text-red-400 text-xs mt-1.5">{referralCodeError}</p>
              )}
              {formData.referralCode && !referralCodeError && (
                <p className="text-green-400 text-xs mt-1.5">유효한 추천코드입니다.</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-gray-400 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.agree}
                  onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                  className="accent-pink-500 mt-1"
                />
                <span className="text-sm">
                  <span className="text-pink-500">[필수]</span> 만 19세 이상이며, 이용약관 및 개인정보처리방침에 동의합니다.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              회원가입
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}