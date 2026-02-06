import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  Edit,
  Image as ImageIcon,
  Loader2,
  Plus,
  Power,
  Search,
  Upload,
  X,
} from "lucide-react";
import { AdminLayout } from "../components/AdminLayout";
import { AdminPagination } from "../components/common/AdminPagination";
import { AdminPageLoader } from "../components/common/AdminPageLoader";
import { useAdminChatProfiles, useAgents } from "../hooks/useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { supabaseAdmin } from "../../lib/supabase";
import { CsvDownloadButton } from "../components/CsvDownloadButton";
import { getTodayKST } from "../../lib/dateUtils";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { getPublicUrlForPath } from "../../lib/storage";
import { ConfirmModal } from "../components/ConfirmModal";

type OnlineFilter = "all" | "online" | "offline";

export function AdminChatsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [onlineFilter, setOnlineFilter] = useState<OnlineFilter>("all");

  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const [showToggleModal, setShowToggleModal] = useState(false);
  const [toggleTargetId, setToggleTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    name: "",
    age: 20,
    height: "",
    weight: "",
    job: "",
    bio: "",
    image: "",
    interests: [] as string[],
    chat_cost: "",
    is_online: false,
    is_active: true,
    assigned_agent_id: "",
  });

  const { adminAccount } = useAuth();

  const { profiles, isLoading, error, createProfile, updateProfile } =
    useAdminChatProfiles();

  const { agents } = useAgents();

  const filteredProfiles = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();

    // Include all profiles (active and inactive), sort inactive to end
    return (profiles || [])
      .filter((p: any) => {
        const matchesSearch =
          term.length === 0 ||
          String(p.name || "")
            .toLowerCase()
            .includes(term);

        const isOnline = !!p.is_online;
        const isActive = p.is_active !== false;
        const matchesOnline =
          onlineFilter === "all" ||
          (onlineFilter === "online"
            ? isOnline && isActive
            : !isOnline || !isActive);

        return matchesSearch && matchesOnline;
      })
      .sort((a: any, b: any) => {
        // Active profiles first, inactive at the end
        const aActive = a.is_active !== false;
        const bActive = b.is_active !== false;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
      });
  }, [onlineFilter, profiles, debouncedSearchTerm]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage, itemsPerPage]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, onlineFilter]);

  useEffect(() => {
    if (!isModalOpen && !showToggleModal && !imagePreviewModal) {
      document.body.style.overflow = "unset";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [imagePreviewModal, isModalOpen, showToggleModal]);

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const uploadChatProfileImage = async (file: File) => {
    const bucket = "chat-profile-images";
    const ext = file.name.split(".").pop() || "jpg";
    const idPart =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const filePath = `chat_profiles/${idPart}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      throw uploadError;
    }

    const slash = filePath.lastIndexOf("/");
    const prefix = slash >= 0 ? filePath.slice(0, slash) : "";
    const fileName = slash >= 0 ? filePath.slice(slash + 1) : filePath;

    let objectId: string | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(prefix, { limit: 100 });

      if (error) {
        throw error;
      }

      const match = (data || []).find((o: any) => String(o?.name) === fileName);
      const id = (match as any)?.id ? String((match as any).id) : null;
      if (id) {
        objectId = id;
        break;
      }

      await new Promise((r) => setTimeout(r, 150));
    }

    return { filePath, objectId };
  };

  const openCreateModal = () => {
    setEditingId(null);
    setImageFile(null);
    setOriginalImage("");
    setInterestInput("");
    setFormData({
      name: "",
      age: 20,
      height: "",
      weight: "",
      job: "",
      bio: "",
      image: "",
      interests: [],
      chat_cost: "",
      is_online: false,
      is_active: true,
      assigned_agent_id: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (id: string) => {
    const target: any = (profiles || []).find((p: any) => p.id === id);
    if (!target) return;

    setEditingId(id);
    setImageFile(null);
    setOriginalImage(String(target.image || ""));
    setInterestInput("");

    const interests = Array.isArray(target.interests)
      ? (target.interests as unknown as string[])
      : [];

    setFormData({
      name: target.name || "",
      age: Number(target.age || 20),
      height: target.height ? String(target.height) : "",
      weight: target.weight ? String(target.weight) : "",
      job: target.job || "",
      bio: target.bio || "",
      image: target.image || "",
      interests: interests.filter(Boolean),
      chat_cost: target.chat_cost ? String(target.chat_cost) : "",
      is_online: !!target.is_online,
      is_active: target.is_active !== false,
      assigned_agent_id: target.assigned_agent_id || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setImageFile(null);
    setOriginalImage("");
    setInterestInput("");
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  const addInterest = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    if (formData.interests.includes(normalized)) return;
    setFormData((prev) => ({
      ...prev,
      interests: [...prev.interests, normalized],
    }));
  };

  const removeInterest = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use ref for synchronous guard against rapid clicks (useState is async)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const parseOptionalInt = (value: string) => {
        const raw = (value || "").trim();
        if (!raw) return null;

        const match = raw.match(/\d+/);
        if (!match) return null;

        const parsed = Number(match[0]);
        return Number.isFinite(parsed) ? parsed : null;
      };

      const uploaded = imageFile
        ? await uploadChatProfileImage(imageFile)
        : null;
      const imageToSave = uploaded?.filePath ?? (formData.image.trim() || null);

      const isUrlLike = (value: string) =>
        /^(https?:\/\/|data:|blob:)/i.test(value);
      const didManuallyChangeImage =
        !!editingId &&
        !uploaded?.objectId &&
        formData.image.trim() !== originalImage;
      const shouldClearObjectId =
        (!uploaded?.objectId && isUrlLike(formData.image.trim())) ||
        (!uploaded?.objectId && didManuallyChangeImage);

      const payload: any = {
        name: formData.name.trim(),
        age: Number(formData.age),
        height: parseOptionalInt(formData.height),
        weight: parseOptionalInt(formData.weight),
        job: formData.job.trim() || null,
        bio: formData.bio.trim() || null,
        image: imageToSave,
        image_object_id:
          uploaded?.objectId ?? (shouldClearObjectId ? null : undefined),
        interests: formData.interests,
        chat_cost: parseOptionalInt(formData.chat_cost),
        is_online: !!formData.is_online,
        is_active: !!formData.is_active,
        assigned_agent_id: formData.assigned_agent_id || null,
        // Record admin who assigned agent (only when agent is assigned)
        assigned_by_admin_id: formData.assigned_agent_id
          ? adminAccount?.id || null
          : null,
      };

      if (editingId) {
        await updateProfile(editingId, payload);
      } else {
        await createProfile(payload);
      }
      closeModal();
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const openToggleActive = (id: string) => {
    setToggleTargetId(id);
    setShowToggleModal(true);
  };

  const confirmToggleActive = async () => {
    if (!toggleTargetId) return;
    const target = (profiles || []).find((p: any) => p.id === toggleTargetId);
    if (!target) return;

    const newActiveState = target.is_active === false;
    await updateProfile(toggleTargetId, { is_active: newActiveState });
    setShowToggleModal(false);
    setToggleTargetId(null);
  };

  const allProfiles = useMemo(() => {
    return profiles || [];
  }, [profiles]);

  const activeProfiles = useMemo(() => {
    return allProfiles.filter((p: any) => p.is_active !== false);
  }, [allProfiles]);

  const inactiveCount = useMemo(() => {
    return allProfiles.filter((p: any) => p.is_active === false).length;
  }, [allProfiles]);

  const onlineCount = useMemo(() => {
    return activeProfiles.filter((p: any) => !!p.is_online).length;
  }, [activeProfiles]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">채팅 프로필 관리</h1>
            <p className="text-gray-400">
              전체{" "}
              <span className="text-white font-semibold">
                {allProfiles.length}
              </span>
              개 • 활성{" "}
              <span className="text-green-500 font-semibold">
                {activeProfiles.length}
              </span>
              개 • 비활성{" "}
              <span className="text-gray-500 font-semibold">
                {inactiveCount}
              </span>
              개
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CsvDownloadButton
              data={filteredProfiles.map((p: any) => ({
                id: p.id,
                name: p.name,
                age: p.age,
                height: p.height,
                weight: p.weight,
                job: p.job,
                bio: p.bio,
                interests: (p.interests || []).join(", "),
                isOnline: p.is_online ? "온라인" : "오프라인",
                assignedAgent: p.agent_username || "-",
                isActive: p.is_active ? "활성" : "비활성",
              }))}
              columns={[
                { key: "id", label: "ID" },
                { key: "name", label: "이름" },
                { key: "age", label: "나이" },
                { key: "height", label: "키" },
                { key: "weight", label: "몸무게" },
                { key: "job", label: "직업" },
                { key: "bio", label: "소개" },
                { key: "interests", label: "관심사" },
                { key: "isOnline", label: "온라인상태" },
                { key: "assignedAgent", label: "담당에이전트" },
                { key: "isActive", label: "활성상태" },
              ]}
              filename={`채팅프로필_${getTodayKST()}.csv`}
            />
            <button
              onClick={openCreateModal}
              className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
            >
              <Plus size={20} />새 프로필 추가
            </button>
          </div>
        </div>

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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOnlineFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              onlineFilter === "all"
                ? "bg-indigo-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            전체 ({allProfiles.length})
          </button>
          <button
            onClick={() => setOnlineFilter("online")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              onlineFilter === "online"
                ? "bg-green-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            온라인 ({onlineCount})
          </button>
          <button
            onClick={() => setOnlineFilter("offline")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              onlineFilter === "offline"
                ? "bg-gray-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            오프라인/비활성 ({allProfiles.length - onlineCount})
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error.message}
          </div>
        )}

        {isLoading ? (
          <AdminPageLoader />
        ) : filteredProfiles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            프로필이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {paginatedProfiles.map((profile: any) => {
              const interests = Array.isArray(profile.interests)
                ? (profile.interests as unknown as string[])
                : [];
              const avatarUrl = getPublicUrlForPath(
                "chat-profile-images",
                profile.image,
              );
              const isInactive = profile.is_active === false;

              return (
                <div
                  key={profile.id}
                  className={`bg-gray-900 rounded-lg overflow-hidden border transition-all group flex flex-col ${
                    isInactive
                      ? "border-gray-700 opacity-60"
                      : "border-gray-800 hover:border-indigo-500"
                  }`}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <ImageWithFallback
                      src={avatarUrl ?? undefined}
                      alt={profile.name || ""}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isInactive ? "grayscale" : "group-hover:scale-105"
                      }`}
                    />
                    {isInactive ? (
                      <div className="absolute top-2 right-2 bg-gray-600 text-gray-300 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                        <span>비활성</span>
                      </div>
                    ) : !!profile.is_online ? (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        <span>접속중</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-2 flex flex-col gap-1 flex-1">
                    <h3 className="text-white text-sm">
                      {profile.name}{" "}
                      <span className="text-gray-400 text-xs">
                        {profile.age}
                      </span>
                    </h3>

                    <div className="flex flex-wrap gap-0.5">
                      {interests.slice(0, 2).map((interest, idx) => (
                        <span
                          key={`${profile.id}-${idx}`}
                          className="text-xs text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full border border-indigo-500/30 whitespace-nowrap"
                        >
                          #{interest}
                        </span>
                      ))}
                      {interests.length > 2 && (
                        <span className="text-xs text-gray-500 px-1 py-0.5">
                          +{interests.length - 2}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-xs line-clamp-1">
                      {profile.bio || ""}
                    </p>

                    <div className="flex gap-1 mt-auto pt-1">
                      <button
                        onClick={() => openEditModal(profile.id)}
                        className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-1.5 py-1 rounded transition-colors flex items-center justify-center gap-1 border border-indigo-500/30 text-xs"
                      >
                        <Edit size={12} />
                        수정
                      </button>
                      <button
                        onClick={() => openToggleActive(profile.id)}
                        className={`flex-1 px-1.5 py-1 rounded transition-colors flex items-center justify-center gap-1 text-xs ${
                          profile.is_active === false
                            ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                            : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                        }`}
                      >
                        <Power size={12} />
                        {profile.is_active === false ? "활성" : "비활성"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* 페이지네이션 */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto scrollbar-hide">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg my-8 max-h-[calc(100vh-4rem)] flex flex-col">
            <div className="bg-gray-900 border-b border-gray-800 p-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-white text-lg">
                {editingId ? "프로필 수정" : "새 프로필 추가"}
              </h2>
              <button
                onClick={closeModal}
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
                      setFormData((p) => ({ ...p, name: e.target.value }))
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
                      setFormData((p) => ({
                        ...p,
                        age: Number(e.target.value),
                      }))
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
                    type="text"
                    value={formData.height || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, height: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="키를 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    몸무게 (kg)
                  </label>
                  <input
                    type="text"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, weight: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="몸무게를 입력하세요"
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
                      setFormData((p) => ({ ...p, job: e.target.value }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="직업을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    채팅 신청 포인트
                  </label>
                  <input
                    type="number"
                    value={formData.chat_cost ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        chat_cost: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="채팅 신청 포인트를 입력하세요"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  담당 에이전트
                </label>
                <select
                  value={formData.assigned_agent_id}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      assigned_agent_id: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">미할당</option>
                  {(agents || []).map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  프로필 이미지
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label
                      className={`flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-750 border border-dashed border-gray-700 hover:border-indigo-500 rounded px-2 py-2 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer text-xs ${
                        formData.image || imageFile ? "flex-1" : "w-full"
                      }`}
                    >
                      <Upload size={14} />
                      <span>이미지 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] ?? null)
                        }
                        className="hidden"
                      />
                    </label>
                    {(formData.image || imageFile) && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setFormData((p) => ({ ...p, image: "" }));
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500 rounded px-2 py-2 text-red-400 hover:text-red-300 transition-colors text-xs"
                      >
                        <X size={14} />
                        <span>이미지 삭제</span>
                      </button>
                    )}
                  </div>

                  {(formData.image || imageFile) && (
                    <div
                      onClick={() => {
                        const url = imageFile
                          ? previewUrl
                          : getPublicUrlForPath(
                              "chat-profile-images",
                              formData.image,
                            );
                        if (url) setImagePreviewModal(url);
                      }}
                      className="relative w-20 h-28 mx-auto rounded overflow-hidden cursor-pointer group border border-gray-700 hover:border-indigo-500 transition-colors"
                    >
                      <img
                        src={
                          imageFile
                            ? previewUrl || ""
                            : getPublicUrlForPath(
                                "chat-profile-images",
                                formData.image,
                              ) || ""
                        }
                        alt="Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon size={16} className="text-white" />
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
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      addInterest(interestInput);
                      setInterestInput("");
                    }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="해시태그를 입력하세요 (엔터키 가능)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addInterest(interestInput);
                      setInterestInput("");
                    }}
                    className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors whitespace-nowrap text-sm"
                  >
                    추가
                  </button>
                </div>
                {formData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.interests.map((interest) => (
                      <span
                        key={interest}
                        className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30 whitespace-nowrap flex items-center gap-1.5 group hover:bg-indigo-500/30 transition-colors"
                      >
                        #{interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
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
                    setFormData((p) => ({ ...p, bio: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[200px] resize-y scrollbar-hide"
                  placeholder="자기소개를 입력하세요"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_online}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        is_online: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-gray-300 text-sm">
                    온라인 상태로 표시
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        is_active: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-gray-300 text-sm">활성</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white px-3 py-2 rounded transition-colors shadow-lg shadow-indigo-500/20 text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "수정하기" : "추가하기"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-white px-3 py-2 rounded transition-colors text-sm"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      <ConfirmModal
        isOpen={showToggleModal && !!toggleTargetId}
        title={(() => {
          const target = (profiles || []).find(
            (p: any) => p.id === toggleTargetId,
          );
          return target?.is_active === false
            ? "프로필 활성화"
            : "프로필 비활성화";
        })()}
        message={(() => {
          const target = (profiles || []).find(
            (p: any) => p.id === toggleTargetId,
          );
          const name = target?.name || "프로필";
          return target?.is_active === false
            ? `"${name}" 프로필을 활성화하시겠습니까? 활성화된 프로필은 매칭 목록에 다시 표시됩니다.`
            : `"${name}" 프로필을 비활성화하시겠습니까? 비활성화된 프로필은 매칭 목록에서 숨겨집니다.`;
        })()}
        onConfirm={confirmToggleActive}
        onCancel={() => {
          setShowToggleModal(false);
          setToggleTargetId(null);
        }}
      />
    </AdminLayout>
  );
}
