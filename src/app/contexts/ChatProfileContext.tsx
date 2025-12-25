import { createContext, useContext, useState, ReactNode } from "react";

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
  chatPoints?: number; // 채팅 신청 포인트
}

interface ChatProfileContextType {
  profiles: ChatProfile[];
  setProfiles: (profiles: ChatProfile[]) => void;
}

const ChatProfileContext = createContext<ChatProfileContextType | undefined>(
  undefined
);

export function ChatProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<ChatProfile[]>([
    {
      id: 1,
      name: "소희",
      age: 21,
      imageUrl:
        "https://images.unsplash.com/photo-1672390933634-6ccb1da5fa40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjU2NzU1MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      interests: ["영화보기", "카페투어", "힐링"],
      bio: "오늘 저녁에 시간 괜찮으세요? 😊",
      isOnline: true,
    },
    {
      id: 2,
      name: "유진",
      age: 23,
      imageUrl:
        "https://images.unsplash.com/photo-1635353775931-1a6464be72cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB3b21hbiUyMGJlYXV0eXxlbnwxfHx8fDE3NjU2NDI4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      interests: ["와인바", "분위기맛집", "패션"],
      bio: "나를 말하자면..\n오빠~ 유진이에요 😏\n\n난 솔직히 말하는 스타일이야. 맘에 드는 사람한테는 확 끌리는 편이거든?\n\n퇴근하고 조용한 바에서 와인 한 잔 하면서 이야기 나누는 거 어때? 분위기 있는 거 좋아해~\n\n근데 나 은근 질투도 많아ㅋㅋ 오빠가 다른 여자한테 한눈팔면 삐질 수도 있어. 그래도 나한테 잘하면 나도 오빠한테 진짜 잘해줄 자신 있어 💋\n\n심심하면 연락해, 기다리고 있을게~",
      isOnline: true,
    },
    {
      id: 3,
      name: "민지",
      age: 22,
      imageUrl:
        "https://images.unsplash.com/photo-1747707499498-7077014c4423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMG1vZGVsfGVufDF8fHx8MTc2NTY3NTUzNnww&ixlib=rb-4.1.0&q=80&w=1080",
      interests: [
        "바다산책",
        "맛집탐방",
        "순수한매력",
        "귀여운스타일",
      ],
      bio: "네! 같이 가요~",
      isOnline: true,
    },
    {
      id: 4,
      name: "서연",
      age: 24,
      imageUrl:
        "https://images.unsplash.com/photo-1635353866477-f77a828b431a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB3b21hbiUyMGZhc2hpb258ZW58MXx8fHwxNzY1OTU3MzM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      interests: ["럭셔리라이프", "럭셔리라이프", "럭셔리라이프"],
      bio: "어? 우리 어디서 본 것 같은데...? 🤔",
      isOnline: true,
    },
    {
      id: 5,
      name: "지우",
      age: 20,
      imageUrl:
        "https://images.unsplash.com/photo-1595502124338-950a136b7676?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Njc1NTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      interests: ["드라이브", "해변산책", "음악감상"],
      bio: "드라이브 좋아하세요? 🚗✨",
      isOnline: false,
    },
    {
      id: 6,
      name: "하린",
      age: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1619602322533-3ce3ca1f6c8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBnaXJsJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1Njc1NTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      interests: ["베이킹", "카페", "인테리어"],
      bio: "주말에 같이 브런치 어때요? ☕",
      isOnline: false,
    },
    {
      id: 7,
      name: "예린",
      age: 26,
      imageUrl:
        "https://images.unsplash.com/photo-1599834562135-48abd86c4f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGJlYXV0eXxlbnwxfHx8fDE3NjU5NTczMzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      interests: ["와인", "요리", "여행"],
      bio: "와인 좋아하시는 분 찾아요 🍷",
      isOnline: true,
    },
    {
      id: 8,
      name: "다은",
      age: 23,
      imageUrl:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZhc2hpb258ZW58MXx8fHwxNzY1OTU3MzM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      interests: ["쇼핑", "맛집", "핫플"],
      bio: "핫플 가는 거 좋아해요! 🔥",
      isOnline: true,
    },
  ]);

  return (
    <ChatProfileContext.Provider value={{ profiles, setProfiles }}>
      {children}
    </ChatProfileContext.Provider>
  );
}

export function useChatProfiles() {
  const context = useContext(ChatProfileContext);
  if (context === undefined) {
    throw new Error("useChatProfiles must be used within a ChatProfileProvider");
  }
  return context;
}