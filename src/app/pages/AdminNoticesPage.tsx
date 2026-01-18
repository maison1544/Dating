import { AdminLayout } from "../components/AdminLayout";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Pin, PinOff, X } from "lucide-react";
import { useAdminNotices } from "../hooks/useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { formatKST } from "../../lib/dateUtils";

interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  is_pinned: boolean;
}

export function AdminNoticesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const { adminAccount } = useAuth();

  // 삭제 확인 팝업 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<Notice | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_pinned: false,
  });

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    const isAnyModalOpen = isModalOpen || showDeleteModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, showDeleteModal]);

  // Supabase에서 공지사항 데이터 조회
  const {
    notices: dbNotices,
    isLoading,
    error,
    createNotice,
    updateNotice,
    deleteNotice: deleteNoticeFromDB,
  } = useAdminNotices();

  // DB 데이터를 UI 형식으로 변환
  const notices: Notice[] = dbNotices.map((n: any) => ({
    id: n.id,
    title: n.title || "",
    content: n.content || "",
    author: n.author || "관리자",
    created_at: n.created_at,
    is_pinned: n.is_pinned || false,
  }));

  const filteredNotices = notices.filter(
    (notice) =>
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return formatKST(dateString, "datetime") || dateString;
  };

  const handleOpenModal = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        is_pinned: notice.is_pinned,
      });
    } else {
      setEditingNotice(null);
      setFormData({
        title: "",
        content: "",
        is_pinned: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNotice(null);
    setFormData({
      title: "",
      content: "",
      is_pinned: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingNotice) {
      // 수정
      await updateNotice(editingNotice.id, {
        title: formData.title,
        content: formData.content,
        is_pinned: formData.is_pinned,
      });
    } else {
      // 새로 등록
      await createNotice({
        title: formData.title,
        content: formData.content,
        author_id: adminAccount?.id ?? null,
        is_pinned: formData.is_pinned,
      });
    }

    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    await deleteNoticeFromDB(id);
  };

  const togglePin = async (id: string) => {
    const notice = notices.find((n) => n.id === id);
    if (notice) {
      await updateNotice(id, { is_pinned: !notice.is_pinned });
    }
  };

  // 엔터키로 삭제 확인
  useEffect(() => {
    if (!showDeleteModal || !deleteNotice) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleDelete(deleteNotice.id);
        setShowDeleteModal(false);
        setDeleteNotice(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteModal, deleteNotice]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl mb-2">공지사항 관리</h1>
            <p className="text-gray-400">
              <span className="text-gray-300">
                전체 {filteredNotices.length}개
              </span>{" "}
              <span className="text-gray-500">|</span>{" "}
              <span className="text-green-400">
                고정 {notices.filter((n) => n.is_pinned).length}개
              </span>
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-fit shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />새 공지사항 작성
          </button>
        </div>

        {/* Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="제목 또는 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Notices Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {error && (
            <div className="p-4 text-red-400 border-b border-gray-800">
              {error.message}
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-gray-400">불러오는 중...</div>
          ) : filteredNotices.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              공지사항이 없습니다.
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[45%]" />
                  <col className="w-[15%]" />
                  <col className="w-[10%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                      제목
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                      작성자
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                      고정
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                      작성일
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredNotices.map((notice) => (
                    <tr
                      key={notice.id}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {notice.is_pinned && (
                            <Pin
                              className="text-indigo-400 flex-shrink-0"
                              size={16}
                            />
                          )}
                          <p className="text-white truncate">{notice.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {notice.author}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePin(notice.id)}
                          className={`p-2 rounded transition-colors ${
                            notice.is_pinned
                              ? "text-indigo-400 hover:bg-gray-700"
                              : "text-gray-400 hover:bg-gray-700 hover:text-indigo-400"
                          }`}
                          title={notice.is_pinned ? "고정 해제" : "고정"}
                        >
                          {notice.is_pinned ? (
                            <Pin size={16} />
                          ) : (
                            <PinOff size={16} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300 text-sm">
                        {formatDate(notice.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(notice)}
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                            title="수정"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteNotice(notice);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-500"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl">
                {editingNotice ? "공지사항 수정" : "새 공지사항 작성"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: e.target.value,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 min-h-[200px] resize-y"
                  placeholder="공지사항 내용을 입력하세요"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_pinned: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="is_pinned" className="text-gray-300">
                  상단 고정
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {editingNotice ? "수정하기" : "등록하기"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteNotice && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-white text-xl">공지사항 삭제 확인</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                "{deleteNotice.title}" 공지사항을 삭제하시겠습니까?
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(deleteNotice.id);
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-500/20"
                >
                  삭제하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
