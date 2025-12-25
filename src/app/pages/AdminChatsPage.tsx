import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  MapPin,
  Heart,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useChatProfiles } from "../contexts/ChatProfileContext";

interface ChatProfile {
  id: number;
  name: string;
  age: number;
  height?: number;
  weight?: number;
  job?: string;
  imageUrl: string;
  interests: string[];
  bio: string;
  isOnline: boolean;
  chatPoints: number;
}

export function AdminChatsPage() {
  const { profiles, setProfiles } = useChatProfiles();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<ChatProfile | null>(null);
  const [imagePreviewModal, setImagePreviewModal] = useState<
    string | null
  >(null);
  const [hashtagInput, setHashtagInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "online" | "offline"
  >("all");

  // 삭제 확인 팝업 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteProfile, setDeleteProfile] =
    useState<ChatProfile | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    age: 25,
    height: 0,
    weight: 0,
    job: "",
    imageUrl: "",
    interests: [] as string[],
    bio: "",
    isOnline: true,
    chatPoints: 0,
  });

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const isAnyModalOpen =
      isModalOpen ||
      showDeleteModal ||
      imagePreviewModal !== null;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, showDeleteModal, imagePreviewModal]);

  const filteredProfiles = profiles.filter((profile) => {
    // 검색어 필터
    const matchesSearch = profile.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // 상태 필터
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && profile.isOnline) ||
      (statusFilter === "offline" && !profile.isOnline);

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (profile?: ChatProfile) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        name: profile.name,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        job: profile.job || "",
        imageUrl: profile.imageUrl,
        interests: profile.interests,
        bio: profile.bio,
        isOnline: profile.isOnline,
        chatPoints: profile.chatPoints || 0,
      });
    } else {
      setEditingProfile(null);
      setFormData({
        name: "",
        age: 25,
        height: 0,
        weight: 0,
        job: "",
        imageUrl: "",
        interests: [] as string[],
        bio: "",
        isOnline: true,
        chatPoints: 0,
      });
    }
    setHashtagInput("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProfile) {
      // 수정
      setProfiles(
        profiles.map((profile) =>
          profile.id === editingProfile.id
            ? {
                ...profile,
                name: formData.name,
                age: formData.age,
                height: formData.height,
                weight: formData.weight,
                job: formData.job,
                imageUrl: formData.imageUrl,
                interests: formData.interests,
                bio: formData.bio,
                isOnline: formData.isOnline,
                chatPoints: formData.chatPoints,
              }
            : profile,
        ),
      );
    } else {
      // 새로 등록
      const newProfile: ChatProfile = {
        id: Math.max(...profiles.map((p) => p.id), 0) + 1,
        name: formData.name,
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
        job: formData.job,
        imageUrl: formData.imageUrl,
        interests: formData.interests,
        bio: formData.bio,
        isOnline: formData.isOnline,
        chatPoints: formData.chatPoints,
      };
      setProfiles([newProfile, ...profiles]);
    }

    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    setProfiles(
      profiles.filter((profile) => profile.id !== id),
    );
  };

  // 엔터키로 삭제 확인
  useEffect(() => {
    if (!showDeleteModal || !deleteProfile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleDelete(deleteProfile.id);
        setShowDeleteModal(false);
        setDeleteProfile(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteModal, deleteProfile]);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          imageUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHashtag = () => {
    if (
      hashtagInput.trim() &&
      !formData.interests.includes(hashtagInput.trim())
    ) {
      setFormData({
        ...formData,
        interests: [...formData.interests, hashtagInput.trim()],
      });
      setHashtagInput("");
    }
  };

  const handleRemoveHashtag = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(
        (_, i) => i !== index,
      ),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">
              채팅 프로필 관리
            </h1>
            <p className="text-gray-400">
              전체{" "}
              <span className="text-white font-semibold">
                {profiles.length}
              </span>
              개 • 접속중{" "}
              <span className="text-green-500 font-semibold">
                {profiles.filter((p) => p.isOnline).length}
              </span>
              명
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />새 프로필 추가
          </button>
        </div>

        {/* Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 max-w-md">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-indigo-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            전체 ({profiles.length})
          </button>
          <button
            onClick={() => setStatusFilter("online")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "online"
                ? "bg-green-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            온라인 ({profiles.filter((p) => p.isOnline).length})
          </button>
          <button
            onClick={() => setStatusFilter("offline")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === "offline"
                ? "bg-gray-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            오프라인 (
            {profiles.filter((p) => !p.isOnline).length})
          </button>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-indigo-500 transition-all group flex flex-col"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <ImageWithFallback
                  src={profile.imageUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {profile.isOnline && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                    <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                    <span>접속중</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2 flex flex-col gap-1 flex-1">
                <h3 className="text-white text-sm">
                  {profile.name}{" "}
                  <span className="text-gray-400 text-xs">
                    {profile.age}
                  </span>
                </h3>

                <div className="flex flex-wrap gap-0.5">
                  {profile.interests
                    .slice(0, 2)
                    .map((interest, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full border border-indigo-500/30 whitespace-nowrap"
                      >
                        #{interest}
                      </span>
                    ))}
                  {profile.interests.length > 2 && (
                    <span className="text-xs text-gray-500 px-1 py-0.5">
                      +{profile.interests.length - 2}
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-xs line-clamp-1">
                  {profile.bio}
                </p>

                <div className="flex gap-1 mt-auto pt-1">
                  <button
                    onClick={() => handleOpenModal(profile)}
                    className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-1.5 py-1 rounded transition-colors flex items-center justify-center gap-1 border border-indigo-500/30 text-xs"
                  >
                    <Edit size={12} />
                    수정
                  </button>
                  <button
                    onClick={() => {
                      setDeleteProfile(profile);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-1.5 py-1 rounded transition-colors flex items-center justify-center gap-1 border border-red-500/30 text-xs"
                  >
                    <Trash2 size={12} />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto scrollbar-hide">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg my-8 max-h-[calc(100vh-4rem)] flex flex-col">
            <div className="bg-gray-900 border-b border-gray-800 p-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-white text-lg">
                {editingProfile
                  ? "프로필 수정"
                  : "새 프로필 추가"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 space-y-3 overflow-y-auto flex-1 scrollbar-hide"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    나이
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    min="18"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    키 (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        height: e.target.value
                          ? parseInt(e.target.value)
                          : 0,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="키를 입력하세요"
                    min="100"
                    max="250"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    몸무게 (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: e.target.value
                          ? parseInt(e.target.value)
                          : 0,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="몸무게를 입력하세요"
                    min="30"
                    max="200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    직업
                  </label>
                  <input
                    type="text"
                    value={formData.job}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        job: e.target.value,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="직업을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    채팅 신청 포인트
                  </label>
                  <input
                    type="number"
                    value={formData.chatPoints ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        chatPoints: e.target.value
                          ? parseInt(e.target.value)
                          : 0,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="채팅 신청 포인트를 입력하세요"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  프로필 이미지
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label
                      className={`flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-dashed border-gray-700 hover:border-indigo-500 rounded px-2 py-2 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer text-xs ${formData.imageUrl ? "flex-1" : "w-full"}`}
                    >
                      <Upload size={14} />
                      <span>이미지 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            imageUrl: "",
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500 rounded px-2 py-2 text-red-400 hover:text-red-300 transition-colors text-xs"
                      >
                        <X size={14} />
                        <span>이미지 삭제</span>
                      </button>
                    )}
                  </div>
                  {formData.imageUrl && (
                    <div
                      onClick={() =>
                        setImagePreviewModal(formData.imageUrl)
                      }
                      className="relative w-20 h-28 mx-auto rounded overflow-hidden cursor-pointer group border border-gray-700 hover:border-indigo-500 transition-colors"
                    >
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon
                          size={16}
                          className="text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  해시태그
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) =>
                      setHashtagInput(e.target.value)
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddHashtag();
                      }
                    }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="해시태그를 입력하세요 (엔터키 가능)"
                  />
                  <button
                    type="button"
                    onClick={handleAddHashtag}
                    className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors whitespace-nowrap text-sm"
                  >
                    추가
                  </button>
                </div>
                {formData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30 whitespace-nowrap flex items-center gap-1.5 group hover:bg-indigo-500/30 transition-colors"
                      >
                        #{interest}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveHashtag(idx)
                          }
                          className="text-indigo-400 hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  나를 말하자면..
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bio: e.target.value,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[200px] resize-y scrollbar-hide"
                  placeholder="자기소개를 입력하세요"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={formData.isOnline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isOnline: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                />
                <label
                  htmlFor="isOnline"
                  className="text-gray-300 text-sm"
                >
                  온라인 상태로 표시
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-3 py-2 rounded transition-colors shadow-lg shadow-indigo-500/20 text-sm"
                >
                  {editingProfile ? "수정하기" : "추가하기"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors text-sm"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreviewModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setImagePreviewModal(null)}
        >
          <div className="relative w-full max-w-3xl">
            <button
              onClick={() => setImagePreviewModal(null)}
              className="absolute -top-14 right-0 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
            >
              <X size={28} />
            </button>
            <div className="w-full h-[80vh] flex items-center justify-center">
              <img
                src={imagePreviewModal}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteProfile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md">
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-white text-lg flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" />
                프로필 삭제 확인
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteProfile(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-16 h-20 rounded overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={deleteProfile.imageUrl}
                    alt={deleteProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {deleteProfile.name} ({deleteProfile.age})
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {deleteProfile.interests
                      .slice(0, 2)
                      .map((interest, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full"
                        >
                          #{interest}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-white text-center mb-2">
                  이 프로필을{" "}
                  <span className="text-red-500 font-bold">
                    삭제
                  </span>
                  하시겠습니까?
                </p>
                <p className="text-gray-400 text-sm text-center">
                  삭제된 프로필은 복구할 수 없습니다.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteProfile(null);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    handleDelete(deleteProfile.id);
                    setShowDeleteModal(false);
                    setDeleteProfile(null);
                  }}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}