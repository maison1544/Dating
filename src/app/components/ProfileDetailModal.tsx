import { X, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "./ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { useCreateOrGetChatRoom } from "../hooks/useSupabase";
import { getPublicUrlForPath } from "../../lib/storage";

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id?: string | number;
    name: string;
    age: number;
    height?: number | null;
    weight?: number | null;
    job?: string | null;
    online: boolean;
    image?: string | null;
    bio?: string | null;
    tags?: string[];
    chatPoints?: number; // 채팅 신청 포인트
  };
  hideStartChat?: boolean;
}

export function ProfileDetailModal({
  isOpen,
  onClose,
  profile,
  hideStartChat,
}: ProfileDetailModalProps) {
  const imageUrl = getPublicUrlForPath("chat-profile-images", profile.image);

  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { user, profile: userProfile } = useAuth();
  const { showAlert } = useAlert();
  const { createOrGetRoom } = useCreateOrGetChatRoom();

  const handleStartChat = async () => {
    setShowConfirm(false);

    if (!user) {
      onClose();
      navigate("/login");
      return;
    }

    if (!userProfile?.id) {
      showAlert({
        title: "안내",
        message: "프로필 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        type: "info",
      });
      return;
    }

    if (!profile?.id) {
      showAlert({
        title: "오류",
        message: "프로필 정보를 찾을 수 없습니다.",
        type: "error",
      });
      return;
    }

    const result = await createOrGetRoom(userProfile.id, String(profile.id));

    if (!result.success || !result.room?.id) {
      showAlert({
        title: "오류",
        message: result.error || "채팅방 생성에 실패했습니다.",
        type: "error",
      });
      return;
    }

    onClose();
    navigate(`/chat/${result.room.id}`);
  };

  // 모달이 열릴 때 배경 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image */}
        <div
          className="relative w-full overflow-hidden rounded-t-lg"
          style={{ maxHeight: "50vh" }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={profile.name}
              className="w-full max-h-[50vh] object-contain bg-gray-950"
            />
          ) : (
            <div className="w-full h-[50vh] bg-gray-800" />
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-white text-2xl">{profile.name}</h2>
              {profile.online && (
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  접속중
                </div>
              )}
            </div>
            <p className="text-gray-400 mb-3">
              {profile.age}세 •{" "}
              {typeof profile.height === "number" ? `${profile.height}cm` : "-"}{" "}
              •{" "}
              {typeof profile.weight === "number" ? `${profile.weight}kg` : "-"}{" "}
              • {profile.job && profile.job.trim() ? profile.job : "-"}
            </p>

            {/* Hashtags */}
            {!!profile.tags?.length && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full border border-pink-500/30"
                  >
                    #{tag}
                  </span>
                ))}
                {profile.tags.length > 5 && (
                  <span className="text-xs text-gray-500 px-3 py-1">
                    +{profile.tags.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bio Content */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-white mb-3">나를 말하자면..</h3>
            <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
              {profile.bio || "자기소개를 작성중입니다..."}
            </p>
          </div>

          {!hideStartChat && (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              <span>
                채팅 시작하기{" "}
                {profile.chatPoints ? `(${profile.chatPoints}P)` : ""}
              </span>
            </button>
          )}

          {!hideStartChat && (
            <p className="text-gray-500 text-xs text-center mt-4">
              신규 채팅 시작 시 {profile.chatPoints || 0}P가 차감됩니다
            </p>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        title="채팅 시작"
        message={`채팅을 시작하시겠습니까? ${
          profile.chatPoints || 0
        }P가 차감됩니다 (신규 채팅 시작 시).`}
        onConfirm={() => void handleStartChat()}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
