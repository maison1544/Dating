import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { useBettingRoundBetCount, useGameSettings } from "../hooks/useSupabase";

export function MiniGamePage() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { showAlert } = useAlert();
  const {
    betCount: ladderBetCount,
    isLoading: ladderCountLoading,
    error: ladderCountError,
  } = useBettingRoundBetCount("ladder");
  const {
    betCount: powerballBetCount,
    isLoading: powerballCountLoading,
    error: powerballCountError,
  } = useBettingRoundBetCount("powerball");

  // 게임 설정 조회 (is_active 확인용)
  const { settings: ladderSettings } = useGameSettings("ladder", {
    enableRealtime: true,
  });
  const { settings: powerballSettings } = useGameSettings("powerball", {
    enableRealtime: true,
  });

  const points = useMemo(() => {
    if (!user) return 0;
    return Number(profile?.points ?? 0);
  }, [profile?.points, user]);

  // is_active가 false인 게임은 목록에서 제외
  const games = useMemo(() => {
    const allGames = [
      {
        id: 1,
        name: "사다리 게임",
        reward: "최대 3000P",
        players: ladderCountLoading || ladderCountError ? null : ladderBetCount,
        path: "/ladder-game",
        type: "ladder" as const,
        isActive: ladderSettings?.is_active ?? true,
      },
      {
        id: 2,
        name: "파워볼",
        reward: "최대 5000P",
        players:
          powerballCountLoading || powerballCountError
            ? null
            : powerballBetCount,
        path: "/powerball",
        type: "powerball" as const,
        isActive: powerballSettings?.is_active ?? true,
      },
    ];
    // is_active가 false인 게임은 필터링하여 제외
    return allGames.filter((game) => game.isActive);
  }, [
    ladderBetCount,
    ladderCountLoading,
    ladderCountError,
    ladderSettings?.is_active,
    powerballBetCount,
    powerballCountLoading,
    powerballCountError,
    powerballSettings?.is_active,
  ]);

  const handlePlay = (game: (typeof games)[0]) => {
    if (game.path) {
      navigate(game.path);
    } else {
      showAlert({
        title: "안내",
        message: "게임 경로를 찾을 수 없습니다.",
        type: "info",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-4">
            🎮 매일 무료 플레이
          </div>
          <h1 className="text-4xl md:text-5xl mb-4">
            <span className="text-pink-500">커플미션</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            재미있는 커플미션으로 포인트를 획득하세요
            <br />
            획득한 포인트는 서비스 이용에 사용할 수 있습니다
          </p>
        </div>

        {/* My Points */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="text-pink-500" size={32} />
              <div>
                <p className="text-gray-400 text-sm">보유 포인트</p>
                <p className="text-white text-2xl">
                  {authLoading ? "-" : `${points.toLocaleString()} P`}
                </p>
              </div>
            </div>
            <button
              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors text-sm"
              onClick={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                navigate("/point");
              }}
            >
              {user ? "충전하기" : "로그인"}
            </button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {games.map((game) => {
            return (
              <div
                key={game.id}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-pink-500 transition-all group text-center"
              >
                <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform relative">
                  {game.type === "ladder" ? (
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="40"
                        stroke="#ff7f00"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="24"
                        y1="8"
                        x2="24"
                        y2="40"
                        stroke="#ff7f00"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="36"
                        y1="8"
                        x2="36"
                        y2="40"
                        stroke="#ff7f00"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="12"
                        y1="14"
                        x2="24"
                        y2="14"
                        stroke="#ff7f00"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="24"
                        y1="20"
                        x2="36"
                        y2="20"
                        stroke="#ff7f00"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="12"
                        y1="26"
                        x2="24"
                        y2="26"
                        stroke="#ff7f00"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1="24"
                        y1="32"
                        x2="36"
                        y2="32"
                        stroke="#ff7f00"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <div className="relative w-12 h-12">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-500 border-2 border-white"></div>
                      <div className="absolute top-2 left-0 w-5 h-5 rounded-full bg-blue-500 border-2 border-white"></div>
                      <div className="absolute top-2 right-0 w-5 h-5 rounded-full bg-yellow-400 border-2 border-white"></div>
                      <div className="absolute bottom-2 left-2 w-5 h-5 rounded-full bg-green-500 border-2 border-white"></div>
                      <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-purple-500 border-2 border-white"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-orange-500 border-2 border-white"></div>
                    </div>
                  )}
                </div>
                <h3 className="text-white text-lg mb-2">{game.name}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {typeof game.players === "number"
                    ? `${game.players}명 플레이 중`
                    : "플레이 중"}
                </p>
                <button
                  className="w-full bg-pink-500 text-white py-2 rounded hover:bg-pink-600 transition-colors"
                  onClick={() => handlePlay(game)}
                >
                  플레이하기
                </button>
              </div>
            );
          })}
        </div>

        {/* Notice */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-white mb-4">게임 이용 안내</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• 한번 체결된 배팅은 취소가 불가능합니다</li>
            <li>• 획득한 포인트는 즉시 사용 가능</li>
            <li>• 공정한 게임을 위해 부정 행위는 제재됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
