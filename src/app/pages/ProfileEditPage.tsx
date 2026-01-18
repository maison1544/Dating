import { useState, useEffect } from "react";
import { User, Camera, Save, Loader2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { supabase } from "../../lib/supabase";
import { ConfirmModal } from "../components/ConfirmModal";
import { getPublicUrlForPath } from "../../lib/storage";

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { profile, user, adminAccount, updateProfile, isLoading } = useAuth();
  const { showAlert } = useAlert();

  if (!isLoading && (!user || adminAccount)) {
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }
  }, [isLoading, user, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    phone: "",
    bank: "",
    accountNumber: "",
    accountHolder: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        nickname: profile.nickname || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        bank: profile.bank || "",
        accountNumber: profile.account_number || "",
        accountHolder: profile.account_holder || "",
      });
    }
  }, [profile, user]);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setProfileImage(
      getPublicUrlForPath("profile-images", profile.profile_image)
    );
  }, [profile]);

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

  const uploadProfileImage = async (file: File) => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    const bucket = "profile-images";
    const ext = file.name.split(".").pop() || "jpg";
    const idPart =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const filePath = `${user.id}/${idPart}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        showAlert({
          title: "업로드 오류",
          message: "JPG 또는 PNG 파일만 업로드할 수 있습니다.",
          type: "warning",
        });
        return;
      }
      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) {
        showAlert({
          title: "업로드 오류",
          message: "이미지 파일은 최대 5MB까지 업로드할 수 있습니다.",
          type: "warning",
        });
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const performSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const nameRegex = /^[가-힣]{2,10}$|^[a-zA-Z\s]{2,20}$/;
      if (!nameRegex.test(formData.name.trim())) {
        showAlert({
          title: "입력 오류",
          message: "이름은 한글 2-10자 또는 영문 2-20자로 입력해주세요.",
          type: "warning",
        });
        return;
      }

      const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,10}$/;
      if (!nicknameRegex.test(formData.nickname.trim())) {
        showAlert({
          title: "입력 오류",
          message: "닉네임은 한글/영문/숫자 2-10자로 입력해주세요.",
          type: "warning",
        });
        return;
      }

      const phoneRegex = /^010-\d{4}-\d{4}$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        showAlert({
          title: "입력 오류",
          message: "전화번호는 010-1234-5678 형식으로 입력해주세요.",
          type: "warning",
        });
        return;
      }

      const normalizedAccountNumber = formData.accountNumber.replace(/-/g, "");
      const accountRegex = /^\d{10,20}$/;
      if (
        normalizedAccountNumber &&
        !accountRegex.test(normalizedAccountNumber)
      ) {
        showAlert({
          title: "입력 오류",
          message: "계좌번호는 10-20자리 숫자로 입력해주세요.",
          type: "warning",
        });
        return;
      }

      if (
        formData.accountHolder &&
        !nameRegex.test(formData.accountHolder.trim())
      ) {
        showAlert({
          title: "입력 오류",
          message: "예금주는 한글 2-10자 또는 영문 2-20자로 입력해주세요.",
          type: "warning",
        });
        return;
      }

      let uploadedImagePath: string | null = null;
      if (profileImageFile) {
        uploadedImagePath = await uploadProfileImage(profileImageFile);
      }

      const { error } = await updateProfile({
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        phone: formData.phone || null,
        bank: formData.bank || null,
        account_number: normalizedAccountNumber || null,
        account_holder: formData.accountHolder.trim() || null,
        ...(uploadedImagePath ? { profile_image: uploadedImagePath } : {}),
      });
      if (error) {
        showAlert({
          title: "오류",
          message: "프로필 수정에 실패했습니다.",
          type: "error",
        });
      } else {
        showAlert({
          title: "저장 완료",
          message: "프로필이 수정되었습니다.",
          type: "success",
        });
        navigate("/mypage");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setShowConfirm(true);
  };

  if (isLoading || isSaving || (user && !adminAccount && !profile)) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user || adminAccount || !profile) {
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-white mb-2">프로필 수정</h1>
          <p className="text-gray-400">회원 정보를 수정하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <label className="text-white mb-4 block">프로필 이미지</label>
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
                <p className="text-gray-400 text-sm">JPG, PNG 파일</p>
                <p className="text-gray-500 text-xs">최대 5MB</p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
            <h3 className="text-white mb-4">기본 정보</h3>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">닉네임</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nickname: e.target.value,
                  })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">이메일</label>
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
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Bank Info */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
            <h3 className="text-white mb-4">계좌 정보</h3>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">은행</label>
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
                <option value="">은행을 선택하세요</option>
                <option value="KB국민은행">KB국민은행</option>
                <option value="신한은행">신한은행</option>
                <option value="하나은행">하나은행</option>
                <option value="우리은행">우리은행</option>
                <option value="NH농협은행">NH농협은행</option>
                <option value="한국산업은행">한국산업은행</option>
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
              <label className="text-gray-400 text-sm mb-2 block">예금주</label>
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
              disabled={isSaving}
              className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              <span>{isSaving ? "저장 중..." : "저장하기"}</span>
            </button>
          </div>
        </form>

        <ConfirmModal
          isOpen={showConfirm}
          title="프로필 수정"
          message="프로필을 수정하시겠습니까?"
          onConfirm={() => {
            setShowConfirm(false);
            void performSave();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
}
