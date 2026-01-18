import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Phone, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import Logo from "../../imports/Logo";
import { useAlert } from "../contexts/AlertContext";
import {
  useReferralCodeValidation,
  useUserRegistration,
} from "../hooks/useSupabase";

export function SignupPage() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bank: "",
    accountNumber: "",
    accountHolder: "",
    referralCode: "",
    agree: false,
  });

  // Supabase hooks
  const { validateCode, isValidating } = useReferralCodeValidation();
  const { registerUser, isRegistering } = useUserRegistration();

  // 추천코드 검증 state
  const [referralCodeError, setReferralCodeError] = useState("");
  const [referralCodeValid, setReferralCodeValid] = useState(false);
  const [validatedAgentId, setValidatedAgentId] = useState<string | null>(null);

  const referralValidateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (referralValidateTimerRef.current) {
        window.clearTimeout(referralValidateTimerRef.current);
      }
    };
  }, []);

  // 추천코드 검증 함수 (디바운스 적용)
  const validateReferralCode = useCallback(
    async (code: string) => {
      if (!code) {
        setReferralCodeError("");
        setReferralCodeValid(false);
        setValidatedAgentId(null);
        return;
      }

      if (referralValidateTimerRef.current) {
        window.clearTimeout(referralValidateTimerRef.current);
      }

      referralValidateTimerRef.current = window.setTimeout(async () => {
        const result = await validateCode(code);
        if (result.valid) {
          setReferralCodeError("");
          setReferralCodeValid(true);
          setValidatedAgentId(result.agentId || null);
        } else {
          setReferralCodeError("존재하지 않는 추천코드입니다.");
          setReferralCodeValid(false);
          setValidatedAgentId(null);
        }
      }, 350);
    },
    [validateCode]
  );

  const validateStep1 = () => {
    const trimmedName = formData.name.trim();
    const trimmedNickname = formData.nickname.trim();
    const trimmedEmail = formData.email.trim();

    const nameRegex = /^[가-힣]{2,10}$|^[a-zA-Z\s]{2,20}$/;
    if (!nameRegex.test(trimmedName)) {
      showAlert({
        title: "입력 오류",
        message: "이름은 한글 2-10자 또는 영문 2-20자로 입력해주세요.",
        type: "warning",
      });
      return false;
    }

    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
    if (!nicknameRegex.test(trimmedNickname)) {
      showAlert({
        title: "입력 오류",
        message: "닉네임은 한글/영문/숫자 2-10자로 입력해주세요.",
        type: "warning",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showAlert({
        title: "입력 오류",
        message: "올바른 이메일 형식을 입력해주세요.",
        type: "warning",
      });
      return false;
    }

    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      showAlert({
        title: "입력 오류",
        message: "전화번호는 010-1234-5678 형식으로 입력해주세요.",
        type: "warning",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert({
        title: "입력 오류",
        message: "비밀번호가 일치하지 않습니다.",
        type: "warning",
      });
      return false;
    }
    if (formData.password.length < 6) {
      showAlert({
        title: "입력 오류",
        message: "비밀번호는 6자 이상이어야 합니다.",
        type: "warning",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const nameRegex = /^[가-힣]{2,10}$|^[a-zA-Z\s]{2,20}$/;
    const accountRegex = /^\d{10,20}$/;

    if (!formData.bank) {
      showAlert({
        title: "입력 오류",
        message: "은행을 선택해주세요.",
        type: "warning",
      });
      return false;
    }

    const normalizedAccountNumber = formData.accountNumber.replace(/-/g, "");
    if (!accountRegex.test(normalizedAccountNumber)) {
      showAlert({
        title: "입력 오류",
        message: "계좌번호는 10-20자리 숫자로 입력해주세요.",
        type: "warning",
      });
      return false;
    }

    if (!nameRegex.test(formData.accountHolder.trim())) {
      showAlert({
        title: "입력 오류",
        message: "예금주는 한글 2-10자 또는 영문 2-20자로 입력해주세요.",
        type: "warning",
      });
      return false;
    }

    if (!formData.agree) {
      showAlert({
        title: "입력 오류",
        message: "약관에 동의해주세요.",
        type: "warning",
      });
      return false;
    }
    if (formData.referralCode && !referralCodeValid) {
      showAlert({
        title: "입력 오류",
        message: "유효하지 않은 추천코드입니다.",
        type: "warning",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    let formattedValue = "";

    if (value.length <= 3) {
      formattedValue = value;
    } else if (value.length <= 7) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length <= 11) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(
        7
      )}`;
    } else {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(
        7,
        11
      )}`;
    }

    setFormData({ ...formData, phone: formattedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      handleNext();
      return;
    }

    if (!validateStep1()) return;
    if (!validateStep2()) return;

    const normalizedAccountNumber = formData.accountNumber.replace(/-/g, "");

    const result = await registerUser({
      email: formData.email.trim(),
      password: formData.password,
      name: formData.name.trim(),
      nickname: formData.nickname.trim(),
      phone: formData.phone,
      bank: formData.bank,
      accountNumber: normalizedAccountNumber,
      accountHolder: formData.accountHolder.trim(),
      referralCode: formData.referralCode || undefined,
      referredBy: validatedAgentId || undefined,
    });

    if (result.success) {
      showAlert({
        title: "회원가입 완료",
        message:
          "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.",
        type: "success",
      });
      navigate("/login");
    } else {
      showAlert({
        title: "오류",
        message: result.error || "회원가입 중 오류가 발생했습니다.",
        type: "error",
      });
    }
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
            {step === 1 && (
              <>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    이름
                  </label>
                  <div className="relative">
                    <User
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="이름을 입력하세요"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    닉네임
                  </label>
                  <div className="relative">
                    <User
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) =>
                        setFormData({ ...formData, nickname: e.target.value })
                      }
                      placeholder="닉네임을 입력하세요"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    이메일
                  </label>
                  <div className="relative">
                    <Mail
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="이메일을 입력하세요"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    휴대폰 번호
                  </label>
                  <div className="relative">
                    <Phone
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
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
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
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

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="비밀번호를 다시 입력하세요"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:outline-none focus:border-pink-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  다음
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    은행
                  </label>
                  <select
                    value={formData.bank}
                    onChange={(e) =>
                      setFormData({ ...formData, bank: e.target.value })
                    }
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

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="'-' 없이 입력하세요"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    예금주
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountHolder: e.target.value,
                      })
                    }
                    placeholder="예금주 이름을 입력하세요"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    추천 코드 (선택)
                  </label>
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFormData({ ...formData, referralCode: next });
                      setReferralCodeError("");
                      setReferralCodeValid(false);
                      setValidatedAgentId(null);
                      validateReferralCode(next);
                    }}
                    placeholder="추천 코드를 입력하세요"
                    className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none ${
                      referralCodeError
                        ? "border-red-500 focus:border-red-500"
                        : formData.referralCode && !referralCodeError
                        ? "border-green-500 focus:border-green-500"
                        : "border-gray-700 focus:border-pink-500"
                    }`}
                  />
                  {isValidating && (
                    <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      검증 중...
                    </p>
                  )}
                  {!isValidating && referralCodeError && (
                    <p className="text-red-400 text-xs mt-1.5">
                      {referralCodeError}
                    </p>
                  )}
                  {!isValidating &&
                    formData.referralCode &&
                    referralCodeValid && (
                      <p className="text-green-400 text-xs mt-1.5">
                        유효한 추천코드입니다.
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2 text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agree}
                      onChange={(e) =>
                        setFormData({ ...formData, agree: e.target.checked })
                      }
                      className="accent-pink-500 mt-1"
                    />
                    <span className="text-sm">
                      <span className="text-pink-500">[필수]</span> 만 19세
                      이상이며, 이용약관 및 개인정보처리방침에 동의합니다.
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    disabled={isRegistering || isValidating}
                    className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRegistering && (
                      <Loader2 size={20} className="animate-spin" />
                    )}
                    {isRegistering ? "가입 처리 중..." : "회원가입"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
