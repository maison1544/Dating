import { Bell, Pin, Calendar, ChevronRight, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotices } from "../hooks/useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { formatKST } from "../../lib/dateUtils";
import { supabase } from "../../lib/supabase";

export function NoticePage() {
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);
  const { adminAccount, isLoading: isAuthLoading } = useAuth();
  const viewedNoticeIdsRef = useRef<Set<string>>(new Set());
  const { notices, isLoading, error } = useNotices();

  // 고정 공지와 일반 공지 분리
  const pinnedNotices = notices.filter((n) => n.is_pinned);
  const regularNotices = notices.filter((n) => !n.is_pinned);

  // 날짜 포맷 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return formatKST(dateString, "date");
  };

  const resolveAuthorLabel = (notice: any) => {
    const adminName = notice?.admins?.name;
    if (typeof adminName === "string" && adminName.trim()) return adminName;
    return "관리자";
  };

  const incrementNoticeView = useCallback(
    async (noticeId: string) => {
      if (isAuthLoading) return;
      if (adminAccount) return;
      if (viewedNoticeIdsRef.current.has(noticeId)) return;
      viewedNoticeIdsRef.current.add(noticeId);

      const { error: rpcError } = await supabase.rpc("increment_notice_view", {
        p_notice_id: noticeId,
      });

      if (rpcError) {
        viewedNoticeIdsRef.current.delete(noticeId);
      }
    },
    [adminAccount, isAuthLoading],
  );

  const toggleNotice = useCallback((noticeId: string) => {
    setSelectedNotice((prev) => {
      return prev === noticeId ? null : noticeId;
    });
  }, []);

  useEffect(() => {
    if (!selectedNotice) return;
    void incrementNoticeView(selectedNotice);
  }, [incrementNoticeView, selectedNotice]);

  // 공지사항이 없을 때
  if (notices.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">등록된 공지사항이 없습니다.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <p className="text-red-500">공지사항을 불러오는 데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-4 items-center gap-2">
            <Bell className="text-pink-500" size={16} />
            중요한 소식을 확인하세요
          </div>
          <h1 className="text-4xl md:text-5xl mb-4">
            <span className="text-pink-500">공지사항</span> 📢
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            시크릿데이의 새로운 소식과 공지사항을 확인하세요
          </p>
        </div>

        {/* Pinned Notices */}
        {pinnedNotices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Pin className="text-pink-500" size={20} />
              <h2 className="text-white text-xl">고정 공지</h2>
            </div>
            <div className="space-y-3">
              {pinnedNotices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => toggleNotice(notice.id)}
                  className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/50 rounded-lg p-5 cursor-pointer hover:border-pink-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded">
                          공지
                        </span>
                        <span className="text-yellow-500 text-xs flex items-center gap-1">
                          <Pin size={12} />
                          고정
                        </span>
                      </div>
                      <h3 className="text-white mb-2 text-lg">
                        {notice.title}
                      </h3>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{formatDate(notice.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`text-gray-400 transition-transform flex-shrink-0 ${
                        selectedNotice === notice.id ? "rotate-90" : ""
                      }`}
                      size={20}
                    />
                  </div>
                  {selectedNotice === notice.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotice(null);
                          }}
                          className="text-gray-400 hover:text-white transition-colors"
                          aria-label="닫기"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                        {notice.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Notices */}
        <div>
          <h2 className="text-white text-xl mb-4">전체 공지</h2>
          <div className="space-y-3">
            {regularNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => toggleNotice(notice.id)}
                className="bg-gray-900 border border-gray-800 rounded-lg p-5 cursor-pointer hover:border-pink-500 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                        공지
                      </span>
                    </div>
                    <h3 className="text-white mb-2">{notice.title}</h3>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(notice.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`text-gray-400 transition-transform flex-shrink-0 ${
                      selectedNotice === notice.id ? "rotate-90" : ""
                    }`}
                    size={20}
                  />
                </div>
                {selectedNotice === notice.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-end mb-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotice(null);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="닫기"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                      {notice.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notice Info */}
        <div className="mt-12 bg-pink-500/10 border border-pink-500/20 rounded-lg p-6">
          <h3 className="text-white mb-3 flex items-center gap-2">
            <Bell size={20} className="text-pink-500" />
            공지사항 안내
          </h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• 시크릿데이의 모든 공지사항을 확인할 수 있습니다</li>
            <li>• 중요한 공지는 상단에 고정됩니다</li>
            <li>• 정기적으로 공지사항을 확인하여 최신 정보를 놓치지 마세요</li>
            <li>• 문의사항은 고객센터로 연락 주시기 바랍니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
