import { useState } from "react";

export function AdminMiniGamesSettingsTab() {
  const [powerballEnabled, setPowerballEnabled] = useState(true);
  const [ladderEnabled, setLadderEnabled] = useState(true);

  // 파워볼 배팅탭 개별 상태
  const [powerballBetTabs, setPowerballBetTabs] = useState({
    "일반볼-홀": true,
    "일반볼-짝": true,
    "일반볼-언더": true,
    "일반볼-오버": true,
    "파워볼-홀": true,
    "파워볼-짝": true,
    "파워볼-언더": true,
    "파워볼-오버": true,
  });

  // 사다리 배팅탭 개별 상태
  const [ladderBetTabs, setLadderBetTabs] = useState({
    "좌출발": true,
    "우출발": true,
    "3줄": true,
    "4줄": true,
    "홀": true,
    "짝": true,
    "좌3짝": true,
    "좌4홀": true,
    "우3홀": true,
    "우4짝": true,
  });

  const togglePowerballBetTab = (option: string) => {
    if (!powerballEnabled) return;
    setPowerballBetTabs(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev]
    }));
  };

  const toggleLadderBetTab = (option: string) => {
    if (!ladderEnabled) return;
    setLadderBetTabs(prev => ({
      ...prev,
      [option]: !prev[option as keyof typeof prev]
    }));
  };

  return (
    <div className="space-y-3">
      {/* 게임 발매 및 배팅탭 관리 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
        <h3 className="text-white text-sm font-semibold mb-2">
          게임 발매 및 배팅탭 관리
        </h3>

        {/* 게임 발매 토글 */}
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
            <span className="text-white text-sm">파워볼</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={powerballEnabled}
                onChange={(e) =>
                  setPowerballEnabled(e.target.checked)
                }
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
            <span className="text-white text-sm">사다리</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={ladderEnabled}
                onChange={(e) =>
                  setLadderEnabled(e.target.checked)
                }
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* 파워볼 배팅탭 */}
        <div className="mb-3">
          <div className="text-indigo-400 text-xs font-semibold mb-1.5">
            파워볼 배팅탭
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(powerballBetTabs).map((option) => (
              <div
                key={option}
                className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg"
              >
                <span className={`text-sm ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                  {option}
                </span>
                <label className={`relative inline-flex items-center ${powerballEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={powerballBetTabs[option as keyof typeof powerballBetTabs]}
                    disabled={!powerballEnabled}
                    onChange={() => togglePowerballBetTab(option)}
                  />
                  <div
                    className={`w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 ${!powerballEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  ></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 사다리 배팅탭 */}
        <div>
          <div className="text-purple-400 text-xs font-semibold mb-1.5">
            사다리 배팅탭
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(ladderBetTabs).map((option) => (
              <div
                key={option}
                className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg"
              >
                <span className={`text-sm ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                  {option}
                </span>
                <label className={`relative inline-flex items-center ${ladderEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={ladderBetTabs[option as keyof typeof ladderBetTabs]}
                    disabled={!ladderEnabled}
                    onChange={() => toggleLadderBetTab(option)}
                  />
                  <div
                    className={`w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 ${!ladderEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  ></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 배당 설정 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
        <h3 className="text-white text-sm font-semibold mb-2">
          배당 설정
        </h3>

        {/* 파워볼 배당 */}
        <div className="mb-3">
          <div className="text-indigo-400 text-xs font-semibold mb-1.5">
            파워볼
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                일반볼-홀
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                일반볼-짝
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                일반볼-언더 (72.5)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                일반볼-오버 (72.5)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                파워볼-홀
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                파워볼-짝
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                파워볼-언더 (4.5)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!powerballEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!powerballEnabled ? 'text-gray-500' : 'text-white'}`}>
                파워볼-오버 (4.5)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!powerballEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!powerballEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* 사다리 배당 */}
        <div>
          <div className="text-purple-400 text-xs font-semibold mb-1.5">
            사다리
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                좌출발
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                우출발
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                3줄
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                4줄
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                홀
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                짝
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="1.95"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                좌3짝
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="3.75"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                좌4홀
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="3.75"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                우3홀
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="3.75"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
            <div className={`bg-gray-800 p-2 rounded-lg ${!ladderEnabled ? 'opacity-50' : ''}`}>
              <label className={`text-xs mb-1 block ${!ladderEnabled ? 'text-gray-500' : 'text-white'}`}>
                우4짝
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue="3.75"
                disabled={!ladderEnabled}
                className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${!ladderEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
              />
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <button 
            disabled={!powerballEnabled && !ladderEnabled}
            className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
              !powerballEnabled && !ladderEnabled 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            배당 저장
          </button>
        </div>
      </div>
    </div>
  );
}
