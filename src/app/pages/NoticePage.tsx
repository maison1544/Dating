import {
  Bell,
  Pin,
  Calendar,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export function NoticePage() {
  const [selectedNotice, setSelectedNotice] = useState<
    number | null
  >(null);

  const notices = [
    {
      id: 1,
      title: "[필독] 시크릿데이 이용 가이드",
      content:
        "시크릿데이를 처음 이용하시는 분들을 위한 가이드입니다.\n\n1. 프로필 작성: 솔직하고 매력적인 프로필을 작성해주세요.\n2. 매칭 시작: 실시간 채팅으로 마음에 드는 분과 대화를 시작하세요.\n3. 포인트 충전: 다양한 프리미엄 기능을 이용하려면 포인트를 충전하세요.\n4. 안전한 만남: 첫 만남은 공개된 장소에서 하시길 권장합니다.\n\n더 자세한 내용은 고객센터를 참고해주세요.",
      date: "2025-12-14",
      views: 15234,
      isPinned: true,
      author: "관리자",
    },
    {
      id: 2,
      title: "[이벤트] 크리스마스 특별 이벤트 안내",
      content:
        "🎄 크리스마스를 맞이하여 특별한 이벤트를 준비했습니다!\n\n✨ 이벤트 기간: 2025.12.20 ~ 2025.12.25\n\n혜택:\n- 포인트 충전 시 30% 추가 보너스\n- 크리스마스 한정 기프트 무료 증정\n- VIP 회원 50% 할인\n\n많은 참여 부탁드립니다!",
      date: "2025-12-14",
      views: 8432,
      isPinned: true,
      author: "관리자",
    },
    {
      id: 3,
      title: "[공지] 12월 정기 점검 안내",
      content:
        "안녕하세요, 시크릿데이입니다.\n\n더 나은 서비스 제공을 위해 정기 점검을 진행합니다.\n\n일시: 2025년 12월 18일 (수) 02:00 ~ 06:00 (4시간)\n\n점검 중에는 서비스 이용이 제한될 수 있습니다.\n이용에 불편을 드려 죄송합니다.\n\n감사합니다.",
      date: "2025-12-13",
      views: 5621,
      isPinned: false,
      author: "관리자",
    },
    {
      id: 4,
      title: "[업데이트] 새로운 기능이 추가되었습니다",
      content:
        "시크릿데이에 새로운 기능이 추가되었습니다!\n\n📌 업데이트 내용:\n\n1. 커플 미션 시스템 오픈\n- 커플끼리 함께 미션을 수행하고 보상을 받으세요\n\n2. 기프트 시스템 개선\n- 더 다양한 선물을 보낼 수 있습니다\n\n3. 랭킹 시스템 추가\n- 인기 회원 랭킹을 확인해보세요\n\n4. UI/UX 개선\n- 더욱 편리해진 인터페이스를 경험하세요\n\n많은 이용 부탁드립니다!",
      date: "2025-12-12",
      views: 7834,
      isPinned: false,
      author: "관리자",
    },
    {
      id: 5,
      title: "[안내] 건전한 데이팅 문화를 위한 가이드라인",
      content:
        "시크릿데이는 건전한 데이팅 문화를 지향합니다.\n\n⚠️ 금지 행위:\n- 욕설 및 비방\n- 성적인 대화 강요\n- 금전 요구\n- 개인정보 무단 유출\n- 상업적 목적의 이용\n\n위 행위 적발 시 서비스 이용이 영구 제한될 수 있습니다.\n\n모두가 안전하고 즐거운 만남을 가질 수 있도록 협조 부탁드립니다.",
      date: "2025-12-10",
      views: 4521,
      isPinned: false,
      author: "관리자",
    },
    {
      id: 6,
      title: "[공지] 포인트 환불 정책 안내",
      content:
        "포인트 환불 정책을 안내드립니다.\n\n환불 가능 조건:\n- 충전 후 7일 이내\n- 포인트를 사용하지 않은 경우\n\n환불 절차:\n1. 고객센터 문의\n2. 환불 신청서 작성\n3. 신원 확인\n4. 환불 처리 (영업일 기준 3-5일)\n\n환불 수수료: 10%\n\n자세한 내용은 이용약관을 참고해주세요.",
      date: "2025-12-08",
      views: 3245,
      isPinned: false,
      author: "관리자",
    },
    {
      id: 7,
      title: "[안내] VIP 멤버십 혜택 소개",
      content:
        "VIP 멤버십의 다양한 혜택을 소개합니다!\n\n🌟 VIP 혜택:\n- 프로필 상단 노출\n- 무제한 채팅\n- 프리미엄 필터 사용\n- 특별 배지 지급\n- 월간 무료 포인트 지급\n- 우선 고객지원\n\n월 구독료: 29,900원\n연 구독료: 299,000원 (2개월 무료)\n\nVIP가 되어 더 많은 기회를 만나보세요!",
      date: "2025-12-05",
      views: 9876,
      isPinned: false,
      author: "관리자",
    },
    {
      id: 8,
      title: "[이벤트] 친구 추천 이벤트",
      content:
        "친구를 초대하고 포인트를 받으세요!\n\n이벤트 내용:\n- 친구가 회원가입 시: 1,000P 지급\n- 친구가 첫 충전 시: 추가 2,000P 지급\n\n이벤트 기간: 상시 진행\n\n친구 초대 방법:\n1. 마이페이지에서 초대 코드 확인\n2. 친구에게 초대 코드 공유\n3. 친구가 가입 시 코드 입력\n\n많은 참여 부탁드립니다!",
      date: "2025-12-03",
      views: 5432,
      isPinned: false,
      author: "관리자",
    },
    {
      id: 9,
      title: "[공지] 개인정보 처리방침 변경 안내",
      content:
        "개인정보 처리방침이 일부 변경되었습니다.\n\n변경 내용:\n- 개인정보 보유 기간 명시\n- 제3자 제공 내역 업데이트\n- 정보주체의 권리 강화\n\n시행일: 2025년 12월 1일\n\n자세한 내용은 개인정보 처리방침 페이지에서 확인하실 수 있습니다.\n\n감사합니다.",
      date: "2025-11-30",
      views: 2134,
      isPinned: false,
      author: "관리자",
    },
    {
      id: 10,
      title: "[안내] 고객센터 운영 시간 변경",
      content:
        "고객센터 운영 시간이 변경되었습니다.\n\n기존: 평일 09:00 - 18:00\n변경: 평일 09:00 - 22:00\n\n주말 및 공휴일: 10:00 - 18:00\n\n더 나은 서비스를 제공하기 위해 운영 시간을 확대했습니다.\n\n문의사항이 있으시면 언제든지 연락 주세요!",
      date: "2025-11-28",
      views: 1876,
      isPinned: false,
      author: "관리자",
    },
  ];

  // 고정 공지와 일반 공지 분리
  const pinnedNotices = notices.filter((n) => n.isPinned);
  const regularNotices = notices.filter((n) => !n.isPinned);

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
                  onClick={() =>
                    setSelectedNotice(
                      selectedNotice === notice.id
                        ? null
                        : notice.id,
                    )
                  }
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
                          <span>{notice.date}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`text-gray-400 transition-transform flex-shrink-0 ${selectedNotice === notice.id ? "rotate-90" : ""}`}
                      size={20}
                    />
                  </div>
                  {selectedNotice === notice.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
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
                onClick={() =>
                  setSelectedNotice(
                    selectedNotice === notice.id
                      ? null
                      : notice.id,
                  )
                }
                className="bg-gray-900 border border-gray-800 rounded-lg p-5 cursor-pointer hover:border-pink-500 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                        공지
                      </span>
                    </div>
                    <h3 className="text-white mb-2">
                      {notice.title}
                    </h3>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{notice.date}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`text-gray-400 transition-transform flex-shrink-0 ${selectedNotice === notice.id ? "rotate-90" : ""}`}
                    size={20}
                  />
                </div>
                {selectedNotice === notice.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
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
            <li>
              • 시크릿데이의 모든 공지사항을 확인할 수 있습니다
            </li>
            <li>• 중요한 공지는 상단에 고정됩니다</li>
            <li>
              • 정기적으로 공지사항을 확인하여 최신 정보를
              놓치지 마세요
            </li>
            <li>
              • 문의사항은 고객센터로 연락 주시기 바랍니다
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}