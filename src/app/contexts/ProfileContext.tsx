import { createContext, useContext, ReactNode } from 'react';

export interface Profile {
  id: number;
  name: string;
  age: number;
  location: string;
  height: number;
  weight: number;
  job: string;
  rating: number;
  online: boolean;
  imageUrl: string;
  tags: string[];
}

interface ProfileContextType {
  profiles: Profile[];
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const profiles: Profile[] = [
    {
      id: 1,
      name: '소희',
      age: 21,
      location: '서울',
      height: 165,
      weight: 48,
      job: '카페운영',
      rating: 5,
      online: true,
      imageUrl: 'https://images.unsplash.com/photo-1672390933634-6ccb1da5fa40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjU2NzU1MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['영화보기', '카페투어', '힐링']
    },
    {
      id: 2,
      name: '유진',
      age: 23,
      location: '강남',
      height: 168,
      weight: 50,
      job: '마케터',
      rating: 5,
      online: true,
      imageUrl: 'https://images.unsplash.com/photo-1635353775931-1a6464be72cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB3b21hbiUyMGJlYXV0eXxlbnwxfHx8fDE3NjU2NDI4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['와인바', '분위기맛집', '패션']
    },
    {
      id: 3,
      name: '민지',
      age: 22,
      location: '홍대',
      height: 162,
      weight: 49,
      job: '디자이너',
      rating: 5,
      online: true,
      imageUrl: 'https://images.unsplash.com/photo-1747707499498-7077014c4423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMG1vZGVsfGVufDF8fHx8MTc2NTY3NTUzNnww&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['바다산책', '맛집탐방', '순수한매력', '귀여운스타일']
    },
    {
      id: 4,
      name: '서현',
      age: 24,
      location: '압구정',
      height: 170,
      weight: 52,
      job: '회사원',
      rating: 5,
      online: true,
      imageUrl: 'https://images.unsplash.com/photo-1693305991125-1b87c60e5578?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1NjY4ODczfDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['미술관', '전시회', '재즈바', '성숙한매력']
    },
    {
      id: 5,
      name: '하은',
      age: 20,
      location: '신촌',
      height: 163,
      weight: 47,
      job: '학생',
      rating: 5,
      online: false,
      imageUrl: 'https://images.unsplash.com/photo-1706880770053-d8b2c1f1ad3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGdpcmwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjU2NzU1Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['노래방', '게임', '애교']
    },
    {
      id: 6,
      name: '지은',
      age: 25,
      location: '청담',
      height: 169,
      weight: 51,
      job: '프리랜서',
      rating: 5,
      online: true,
      imageUrl: 'https://images.unsplash.com/photo-1551148049-70c3165bd42a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGdpcmwlMjBmYXNoaW9ufGVufDF8fHx8MTc2NTY3NTUzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['쇼핑', '인스타감성', '활발함', '새로운경험']
    },
    {
      id: 7,
      name: '수아',
      age: 23,
      location: '이태원',
      height: 166,
      weight: 49,
      job: '요가강사',
      rating: 5,
      online: true,
      imageUrl: 'https://images.unsplash.com/photo-1664575602554-2f5d534b9adf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGFzaWFuJTIwYmVhdXR5fGVufDF8fHx8MTc2NTY3NTUzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['운동', '필라테스', '건강한라이프', '아침형인간']
    },
    {
      id: 8,
      name: '예은',
      age: 22,
      location: '여의도',
      height: 164,
      weight: 48,
      job: '승무원',
      rating: 5,
      online: true,
      imageUrl: 'https://images.unsplash.com/photo-1601288496920-b6154fe3626a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGJlYXV0eXxlbnwxfHx8fDE3NjU2NzU1Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['드라이브', '야경투어', '감성', '로맨틱']
    }
  ];

  return (
    <ProfileContext.Provider value={{ profiles }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
}
