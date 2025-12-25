import { X, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface ProfileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id?: number;
    name: string;
    age: number;
    location?: string;
    height: number;
    weight: number;
    job: string;
    rating: number;
    online: boolean;
    imageUrl: string;
    bio?: string;
    tags?: string[];
    chatPoints?: number; // 채팅 신청 포인트
  };
  hideStartChat?: boolean;
}

export function ProfileDetailModal({ isOpen, onClose, profile, hideStartChat }: ProfileDetailModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  // 모달이 열릴 때 배경 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const bioTexts: { [key: string]: string } = {
    '소희': `안녕하세요~ 오빠들! 저는 소희예요 💕

처음 뵙는 분들한테는 좀 수줍음을 타는 편인데, 친해지면 엄청 잘 웃고 재밌어요 ㅎㅎ

카페에서 달달한 거 마시면서 이야기 나누는 거 좋아하고, 영화 보는 것도 좋아해요! 특히 로맨스 영화 보면서 같이 설레고 싶어요~

저랑 대화하다 보면 시간 가는 줄 모를 거예요! 오빠가 먼저 말 걸어주시면 제가 더 편하게 다가갈 수 있을 것 같아요 🥰`,
    '유진': `오빠~ 유진이에요 😏

난 솔직히 말하는 스타일이야. 맘에 드는 사람한테는 확 끌리는 편이거든?

퇴근하고 조용한 바에서 와인 한 잔 하면서 이야기 나누는 거 어때? 분위기 있는 거 좋아해~

근데 나 은근 질투도 많아ㅋㅋ 오빠가 다른 여자한테 한눈팔면 삐질 수도 있어. 그래도 나한테 잘하면 나도 오빠한테 진짜 잘해줄 자신 있어 💋

심심하면 연락해, 기다리고 있을게~`,
    '민지': `안녕하세요, 민지라고 해요 ☺️

저는 아직 어려서 그런지 연애 경험이 많지는 않아요... 그래서 좀 서툴 수도 있는데 이해해주실 거죠?

바다 보면서 산책하는 거 진짜 좋아하고, 맛있는 거 먹으러 다니는 것도 좋아해요! 오빠가 맛집 많이 알려주시면 좋겠어요 ㅎㅎ

저 진짜 순수하고 착하다는 말 많이 들어요~ 오빠한테도 그런 모습 보여드리고 싶어요. 제가 오빠 옆에 있으면 힐링될 거예요 💗`,
    '서현': `안녕하세요, 서현입니다 ✨

저는 좀 차분하고 성숙한 편이에요. 깊이 있는 대화 나누는 걸 좋아하고, 감성적인 것들에 관심이 많아요.

미술관이나 전시회 가는 것도 좋아하고, 재즈 바에서 음악 들으면서 와인 마시는 것도 좋아해요~ 

센스 있고 배려심 많은 분이라면 금방 친해질 수 있을 것 같아요. 저한테 관심 있으시면 언제든 연락 주세요 💕`,
    '하은': `오빠~ 하은이에요 🌸

저 진짜 귀엽다는 소리 자주 들어요 ㅎㅎ 애교도 많고 밝은 성격이라 같이 있으면 재밌을 거예요!

노래방 가서 신나게 노래 부르는 것도 좋아하고, 맛있는 디저트 카페 탐방하는 것도 좋아해요~

오빠가 저한테 잘해주시면 저도 진짜 많이 의지하고 좋아할 거예요. 귀여운 여자 좋아하시면 저한테 연락 주세요 💗`,
    '지은': `안녕하세요, 지은이라고 합니다 😊

저는 패션에 관심이 많아서 쇼핑하는 걸 좋아해요! 오빠랑 같이 쇼핑 가서 옷도 골라주고 싶어요~

사진 찍는 것도 좋아해서 인스타 감성 카페나 예쁜 곳 가는 거 좋아해요. 같이 인생샷 남기면 좋을 것 같아요!

활발하고 에너지 넘치는 스타일이에요. 지루한 거 싫어하고 늘 새로운 거 경험하고 싶어 하는 편이에요 ✨`,
    '수아': `안녕하세요! 수아예요 💪

저는 운동을 정말 좋아해요! 요가, 필라테스, 헬스 다 해요~ 건강한 몸과 마음이 가장 중요하다고 생각해요!

아침 일찍 일어나서 러닝하는 것도 좋아하고, 건강한 음식 만들어 먹는 것도 좋아해요.

같이 운동하면서 건강하게 데이트할 수 있는 분을 만나고 싶어요! 💕`,
    '예은': `녕하세요, 예은이에요 🌙

저는 밤에 드라이브하면서 야경 보는 거 진짜 좋아해요! 로맨틱한 분위기를 사랑하는 감성파예요~

감성 있는 음악 들으면서 이야기 나누는 거 좋아하고, 분위기 좋은 레스토랑이나 루프탑 바 가는 것도 좋아해요.

오빠랑 같이 특별한 추억 많이 만들고 싶어요 ✨`
  };

  const defaultTags = ['영화보기', '산책하기', '운동'];

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
        <div className="relative w-full overflow-hidden rounded-t-lg" style={{ maxHeight: '50vh' }}>
          <img
            src={profile.imageUrl}
            alt={profile.name}
            className="w-full max-h-[50vh] object-contain bg-gray-950"
          />
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
            <p className="text-gray-400 mb-3">{profile.age}세 • {profile.height}cm • {profile.weight}kg • {profile.job}</p>
            
            {/* Hashtags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(profile.tags || defaultTags).slice(0, 5).map((tag, index) => (
                <span key={index} className="text-xs bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full border border-pink-500/30">
                  #{tag}
                </span>
              ))}
              {(profile.tags || defaultTags).length > 5 && (
                <span className="text-xs text-gray-500 px-3 py-1">
                  +{(profile.tags || defaultTags).length - 5}
                </span>
              )}
            </div>
          </div>

          {/* Bio Content */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-white mb-3">나를 말하자면..</h3>
            <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
              {bioTexts[profile.name] || '자기소개를 작성중입니다...'}
            </p>
          </div>

          {!hideStartChat && (
            <button 
              onClick={() => setShowConfirm(true)}
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              <span>채팅 시작하기 {profile.chatPoints ? `(${profile.chatPoints}P)` : ''}</span>
            </button>
          )}

          {!hideStartChat && (
            <p className="text-gray-500 text-xs text-center mt-4">
              채팅 시작 시 {profile.chatPoints || 0}P가 차감됩니다
            </p>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        title="채팅 시작"
        message={`채팅을 시작하시겠습니까? ${profile.chatPoints || 0}P가 차감됩니다.`}
        onConfirm={() => {
          setShowConfirm(false);
          alert('채팅 기능은 준비중입니다.');
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}