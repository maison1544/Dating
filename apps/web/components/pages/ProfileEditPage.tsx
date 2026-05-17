import { useState, useEffect } from "react";
import { User, Camera, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { supabase } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { getPublicUrlForPath } from "@/lib/utils/storage";

export function ProfileEditPage() {
  const router = useRouter();
  const { profile, user, adminAccount, updateProfile, isLoading } = useAuth();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (adminAccount) {
      router.push("/");
    }
  }, [isLoading, user, adminAccount, router]);

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
      getPublicUrlForPath("profile-images", profile.profile_image),
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
        7,
      )}`;
    } else {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(
        7,
        11,
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
      // 프로필 이미지만 변경 가능
      if (!profileImageFile) {
        showAlert({
          title: "변경 사항 없음",
          message: "프로필 이미지를 선택해주세요.",
          type: "warning",
        });
        return;
      }

      const uploadedImagePath = await uploadProfileImage(profileImageFile);

      const { error } = await updateProfile({
        profile_image: uploadedImagePath,
      });
      if (error) {
        showAlert({
          title: "오류",
          message: "프로필 이미지 수정에 실패했습니다.",
          type: "error",
        });
      } else {
        showAlert({
          title: "저장 완료",
          message: "프로필 이미지가 수정되었습니다.",
          type: "success",
        });
        router.push("/mypage");
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
    return null;
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white">기본 정보</h3>
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                수정이 필요할 경우 관리자에게 문의하세요!
              </span>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">이름</label>
              <input
                type="text"
                value={formData.name}
                disabled
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">닉네임</label>
              <input
                type="text"
                value={formData.nickname}
                disabled
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
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
                disabled
                placeholder="010-1234-5678"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Bank Info */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white">계좌 정보</h3>
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                수정이 필요할 경우 관리자에게 문의하세요!
              </span>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">은행</label>
              <input
                type="text"
                value={formData.bank || ""}
                disabled
                placeholder="은행 정보 없음"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                계좌번호
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                disabled
                placeholder="계좌번호 정보 없음"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">예금주</label>
              <input
                type="text"
                value={formData.accountHolder}
                disabled
                placeholder="예금주 정보 없음"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/mypage")}
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
