import { useState } from "react";
import { User, Camera, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProfileEditPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "회원님",
    nickname: "user123",
    email: "example@email.com",
    phone: "010-1234-5678",
    bank: "국민은행",
    accountNumber: "1234567890",
    accountHolder: "홍길동",
  });

  const [profileImage, setProfileImage] = useState<
    string | null
  >(null);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.confirm("프로필을 수정하시겠습니까?")) {
      alert("프로필이 수정되었습니다.");
      navigate("/mypage");
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-white mb-2">
            프로필 수정
          </h1>
          <p className="text-gray-400">
            회원 정보를 수정하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <label className="text-white mb-4 block">
              프로필 이미지
            </label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-pink-500/20 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-pink-500" size={40} />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-pink-500 p-2 rounded-full cursor-pointer hover:bg-pink-600 transition-colors">
                  <Camera size={16} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="text-gray-400 text-sm">
                  JPG, PNG 파일
                </p>
                <p className="text-gray-500 text-xs">
                  최대 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
            <h3 className="text-white mb-4">기본 정보</h3>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                이름
              </label>
              <input
                type="text"
                value={formData.name}
                disabled
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                닉네임
              </label>
              <input
                type="text"
                value={formData.nickname}
                disabled
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                휴대폰 번호
              </label>
              <input
                type="tel"
                value={formData.phone}
                disabled
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Bank Info */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
            <h3 className="text-white mb-4">계좌 정보</h3>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                은행
              </label>
              <select
                value={formData.bank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank: e.target.value,
                  })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="KB국민은행">KB국민은행</option>
                <option value="신한은행">신한은행</option>
                <option value="하나은행">하나은행</option>
                <option value="우리은행">우리은행</option>
                <option value="NH농협은행">NH농협은행</option>
                <option value="한국산업은행">
                  한국산업은행
                </option>
                <option value="IBK기업은행">IBK기업은행</option>
                <option value="카카오뱅크">카카오뱅크</option>
                <option value="케이뱅크">케이뱅크</option>
                <option value="토스뱅크">토스뱅크</option>
                <option value="부산은행">부산은행</option>
                <option value="경남은행">경남은행</option>
                <option value="대구은행">대구은행</option>
                <option value="광주은행">광주은행</option>
                <option value="전북은행">전북은행</option>
                <option value="제주은행">제주은행</option>
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/mypage")}
              className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}