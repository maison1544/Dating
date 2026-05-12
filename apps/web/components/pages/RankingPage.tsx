import { Trophy, Gift, Crown, Medal, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRankings } from "@/hooks/useSupabase";
import { getPublicUrlForPath } from "@/lib/utils/storage";

export function RankingPage() {
  const { rankings: dbRankings, isLoading, error } = useRankings("monthly");
  const [imgErrorRanks, setImgErrorRanks] = useState<Record<number, boolean>>(
    {}
  );

  // DB 데이터를 UI 형식으로 변환
  const rankings = useMemo(
    () =>
      dbRankings.map((user: any) => ({
        rank: user.rank,
        name: user.nickname || user.name || "익명",
        points: user.points || 0,
        gifts: user.gifts_sent_count || 0,
        profileImage: getPublicUrlForPath("profile-images", user.profile_image),
      })),
    [dbRankings]
  );

  const getInitial = (name: string) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return "?";
    return trimmed.slice(0, 1).toUpperCase();
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900";
      case 3:
        return "bg-gradient-to-r from-orange-600 to-orange-700 text-white";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

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
        <p className="text-red-500">랭킹을 불러오는 데 실패했습니다.</p>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-4">
              🏆 이번 달 최고의 매너남
            </div>
            <h1 className="text-4xl md:text-5xl mb-4">
              <span className="text-pink-500">선물왕 랭킹</span>{" "}
              <span className="text-3xl">👑</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              가장 많은 선물을 보낸 매너있는 분들의 랭킹이에요 💝
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
            <p className="text-gray-400">아직 랭킹 데이터가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-4">
            🏆 이번 달 최고의 매너남
          </div>
          <h1 className="text-4xl md:text-5xl mb-4">
            <span className="text-pink-500">선물왕 랭킹</span>{" "}
            <span className="text-3xl">👑</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            가장 많은 선물을 보낸 매너있는 분들의 랭킹이에요 💝
            <br />
            당신도 랭킹에 올라 특별한 혜택을 받아보세요!
          </p>
        </div>

        {/* Ranking List */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden max-w-2xl mx-auto">
          <div className="bg-gray-800 px-6 py-3 flex items-center gap-2">
            <Trophy className="text-pink-500" size={20} />
            <h2 className="text-white">전체 랭킹</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {rankings.map((user) => (
              <div
                key={user.rank}
                className={`px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors ${
                  user.rank <= 3 ? "bg-gray-800/50" : ""
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(
                      user.rank
                    )}`}
                  >
                    {user.rank === 1 ? (
                      <Crown className="w-6 h-6" />
                    ) : user.rank === 2 ? (
                      <Medal className="w-6 h-6" />
                    ) : user.rank === 3 ? (
                      <Trophy className="w-5 h-5" />
                    ) : (
                      user.rank
                    )}
                  </div>
                  {user.profileImage && !imgErrorRanks[user.rank] ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border border-gray-700"
                      onError={() =>
                        setImgErrorRanks((prev) => ({
                          ...prev,
                          [user.rank]: true,
                        }))
                      }
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center text-white font-bold">
                      {getInitial(user.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white">{user.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Gift size={12} />
                        {user.gifts}개 선물
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-pink-500 font-bold">
                    {user.points.toLocaleString()} P
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Info */}
        <div className="mt-8 bg-pink-500/10 border border-pink-500/20 rounded-lg p-6">
          <h3 className="text-white mb-3 flex items-center gap-2">
            <Trophy className="text-pink-500" size={20} />
            랭킹 혜택 안내
          </h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>
              🥇 <span className="text-yellow-500 font-bold">1위</span>:
              200,000원 상당 기프트 + 다음 달 충전 20% 포인트 보너스
            </li>
            <li>
              🥈 <span className="text-gray-300 font-bold">2위</span>: 100,000원
              상당 기프트
            </li>
            <li>
              🥉 <span className="text-orange-600 font-bold">3위</span>:
              50,000원 상당 기프트
            </li>
            <li>💝 4-10위: 10,000원 상당 기프트</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
