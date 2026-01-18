import { useEffect, useMemo, useState, useCallback } from "react";
import { useAlert } from "../contexts/AlertContext";
import { useGameSettings, useUpdateGameSettings } from "../hooks/useSupabase";

// 저장 버튼 컴포넌트
interface SaveButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
}

function SaveButton({ onClick, isLoading, isSaving }: SaveButtonProps) {
  const [localSaving, setLocalSaving] = useState(false);

  const handleClick = async () => {
    setLocalSaving(true);
    try {
      await onClick();
    } finally {
      setLocalSaving(false);
    }
  };

  const disabled = isLoading || isSaving || localSaving;

  return (
    <button
      disabled={disabled}
      className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
        disabled
          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
          : "bg-indigo-500 hover:bg-indigo-600 text-white"
      }`}
      onClick={handleClick}
    >
      {localSaving ? "저장 중..." : "저장"}
    </button>
  );
}

export function AdminMiniGamesSettingsTab() {
  const { showAlert } = useAlert();
  const {
    settings: powerballSettings,
    isLoading: isPowerballLoading,
    refetch: refetchPowerball,
  } = useGameSettings("powerball", {
    enablePolling: false,
    enableRealtime: false,
    useAdminClient: true,
  });
  const {
    settings: ladderSettings,
    isLoading: isLadderLoading,
    refetch: refetchLadder,
  } = useGameSettings("ladder", {
    enablePolling: false,
    enableRealtime: false,
    useAdminClient: true,
  });
  const { updateGameSettings, isLoading: isSaving } = useUpdateGameSettings();

  const powerballItems = useMemo(
    () =>
      [
        { label: "일반볼-홀", betType: "normal-odd", defaultOdds: 1.95 },
        { label: "일반볼-짝", betType: "normal-even", defaultOdds: 1.95 },
        { label: "일반볼-언더", betType: "normal-under", defaultOdds: 1.95 },
        { label: "일반볼-오버", betType: "normal-over", defaultOdds: 1.95 },
        { label: "파워볼-홀", betType: "powerball-odd", defaultOdds: 1.95 },
        { label: "파워볼-짝", betType: "powerball-even", defaultOdds: 1.95 },
        { label: "파워볼-언더", betType: "powerball-under", defaultOdds: 1.95 },
        { label: "파워볼-오버", betType: "powerball-over", defaultOdds: 1.95 },
      ] as const,
    [],
  );

  const ladderItems = useMemo(
    () =>
      [
        { label: "좌출발", betType: "leftStart", defaultOdds: 1.95 },
        { label: "우출발", betType: "rightStart", defaultOdds: 1.95 },
        { label: "3줄", betType: "line3", defaultOdds: 1.95 },
        { label: "4줄", betType: "line4", defaultOdds: 1.95 },
        { label: "홀", betType: "oddEnd", defaultOdds: 1.95 },
        { label: "짝", betType: "evenEnd", defaultOdds: 1.95 },
        { label: "좌3짝", betType: "left3Even", defaultOdds: 3.8 },
        { label: "좌4홀", betType: "left4Odd", defaultOdds: 3.8 },
        { label: "우3홀", betType: "right3Odd", defaultOdds: 3.8 },
        { label: "우4짝", betType: "right4Even", defaultOdds: 3.8 },
      ] as const,
    [],
  );

  const normalizeOdds = (
    gameType: "powerball" | "ladder",
    oddsJson: any,
  ): {
    enabledByBetType: Record<string, boolean>;
    oddsByBetType: Record<string, number>;
  } => {
    const items = gameType === "ladder" ? ladderItems : powerballItems;

    const enabledByBetType: Record<string, boolean> = {};
    const oddsByBetType: Record<string, number> = {};

    items.forEach((it) => {
      enabledByBetType[it.betType] = true;
      oddsByBetType[it.betType] = it.defaultOdds;
    });

    if (!oddsJson || typeof oddsJson !== "object") {
      return { enabledByBetType, oddsByBetType };
    }

    if (oddsJson.enabled && typeof oddsJson.enabled === "object") {
      Object.entries(oddsJson.enabled).forEach(([k, v]) => {
        if (typeof v === "boolean") enabledByBetType[k] = v;
      });
    }

    if (oddsJson.odds && typeof oddsJson.odds === "object") {
      Object.entries(oddsJson.odds).forEach(([k, v]) => {
        if (typeof v === "number") oddsByBetType[k] = v;
      });
    }

    Object.entries(oddsJson).forEach(([k, v]) => {
      if (typeof v === "number") oddsByBetType[k] = v;
      if (typeof v === "object" && v && typeof (v as any).odds === "number") {
        oddsByBetType[k] = (v as any).odds;
      }
      if (
        typeof v === "object" &&
        v &&
        typeof (v as any).enabled === "boolean"
      ) {
        enabledByBetType[k] = (v as any).enabled;
      }
    });

    return { enabledByBetType, oddsByBetType };
  };

  const [powerballEnabled, setPowerballEnabled] = useState(true);
  const [ladderEnabled, setLadderEnabled] = useState(true);

  const [powerballEnabledByBetType, setPowerballEnabledByBetType] = useState<
    Record<string, boolean>
  >({});
  const [powerballOddsByBetType, setPowerballOddsByBetType] = useState<
    Record<string, number>
  >({});

  const [ladderEnabledByBetType, setLadderEnabledByBetType] = useState<
    Record<string, boolean>
  >({});
  const [ladderOddsByBetType, setLadderOddsByBetType] = useState<
    Record<string, number>
  >({});

  const [powerballMinBet, setPowerballMinBet] = useState<string>("");
  const [powerballMaxBet, setPowerballMaxBet] = useState<string>("");
  const [powerballRoundSeconds, setPowerballRoundSeconds] =
    useState<string>("");

  const [ladderMinBet, setLadderMinBet] = useState<string>("");
  const [ladderMaxBet, setLadderMaxBet] = useState<string>("");
  const [ladderRoundSeconds, setLadderRoundSeconds] = useState<string>("");

  useEffect(() => {
    const isActive = powerballSettings?.is_active ?? true;
    setPowerballEnabled(isActive);

    const normalized = normalizeOdds("powerball", powerballSettings?.odds);
    setPowerballEnabledByBetType(normalized.enabledByBetType);
    setPowerballOddsByBetType(normalized.oddsByBetType);

    setPowerballMinBet(
      powerballSettings?.min_bet != null
        ? String(powerballSettings.min_bet)
        : "",
    );
    setPowerballMaxBet(
      powerballSettings?.max_bet != null
        ? String(powerballSettings.max_bet)
        : "",
    );
    setPowerballRoundSeconds(
      powerballSettings?.betting_end_seconds != null
        ? String(powerballSettings.betting_end_seconds)
        : powerballSettings?.round_duration_seconds != null
          ? String(powerballSettings.round_duration_seconds)
          : "",
    );
  }, [powerballSettings]);

  useEffect(() => {
    const isActive = ladderSettings?.is_active ?? true;
    setLadderEnabled(isActive);

    const normalized = normalizeOdds("ladder", ladderSettings?.odds);
    setLadderEnabledByBetType(normalized.enabledByBetType);
    setLadderOddsByBetType(normalized.oddsByBetType);

    setLadderMinBet(
      ladderSettings?.min_bet != null ? String(ladderSettings.min_bet) : "",
    );
    setLadderMaxBet(
      ladderSettings?.max_bet != null ? String(ladderSettings.max_bet) : "",
    );
    setLadderRoundSeconds(
      ladderSettings?.betting_end_seconds != null
        ? String(ladderSettings.betting_end_seconds)
        : ladderSettings?.round_duration_seconds != null
          ? String(ladderSettings.round_duration_seconds)
          : "",
    );
  }, [ladderSettings]);

  const labelToBetType = (label: string): string => {
    const p = powerballItems.find((x) => x.label === label);
    if (p) return p.betType;
    return label;
  };

  const ladderLabelToBetType = (label: string): string => {
    const p = ladderItems.find((x) => x.label === label);
    if (p) return p.betType;
    return label;
  };

  const persistOddsSettings = useCallback(
    async (
      gameType: "powerball" | "ladder",
      nextIsActive: boolean,
      nextEnabledByBetType: Record<string, boolean>,
      nextOddsByBetType: Record<string, number>,
    ) => {
      const payload = {
        enabled: nextEnabledByBetType,
        odds: nextOddsByBetType,
      };

      const result = await updateGameSettings(gameType, {
        is_active: nextIsActive,
        odds: payload,
      });

      if (!result.success) {
        showAlert({
          title: "저장 실패",
          message: result.error || "설정 저장에 실패했습니다.",
          type: "error",
        });
        return false;
      }

      if (gameType === "powerball") {
        await refetchPowerball();
      } else {
        await refetchLadder();
      }

      return true;
    },
    [refetchLadder, refetchPowerball, showAlert, updateGameSettings],
  );

  const togglePowerballBetTab = (label: string) => {
    if (!powerballEnabled) return;
    const betType = labelToBetType(label);
    setPowerballEnabledByBetType((prev) => {
      const next = { ...prev, [betType]: !(prev[betType] ?? true) };
      void (async () => {
        const ok = await persistOddsSettings(
          "powerball",
          powerballEnabled,
          next,
          powerballOddsByBetType,
        );
        if (!ok) {
          setPowerballEnabledByBetType(prev);
        }
      })();
      return next;
    });
  };

  const toggleLadderBetTab = (label: string) => {
    if (!ladderEnabled) return;
    const betType = ladderLabelToBetType(label);
    setLadderEnabledByBetType((prev) => {
      const next = { ...prev, [betType]: !(prev[betType] ?? true) };
      void (async () => {
        const ok = await persistOddsSettings(
          "ladder",
          ladderEnabled,
          next,
          ladderOddsByBetType,
        );
        if (!ok) {
          setLadderEnabledByBetType(prev);
        }
      })();
      return next;
    });
  };

  // 배당 설정 저장 (is_active, odds만)
  const saveOddsSettings = async () => {
    await Promise.all([
      persistOddsSettings(
        "powerball",
        powerballEnabled,
        powerballEnabledByBetType,
        powerballOddsByBetType,
      ),
      persistOddsSettings(
        "ladder",
        ladderEnabled,
        ladderEnabledByBetType,
        ladderOddsByBetType,
      ),
    ]);
  };

  // 배팅 제한 / 회차 시간 저장
  const saveBettingLimitsAndTime = async () => {
    // 회차 시간 최소 60초 검증
    const pbSeconds = powerballRoundSeconds
      ? Number(powerballRoundSeconds)
      : null;
    const ldSeconds = ladderRoundSeconds ? Number(ladderRoundSeconds) : null;

    if (pbSeconds !== null && pbSeconds < 60) {
      showAlert({
        title: "입력 오류",
        message: "파워볼 회차 시간은 최소 60초 이상이어야 합니다.",
        type: "warning",
      });
      return;
    }
    if (ldSeconds !== null && ldSeconds < 60) {
      showAlert({
        title: "입력 오류",
        message: "사다리 회차 시간은 최소 60초 이상이어야 합니다.",
        type: "warning",
      });
      return;
    }

    const [powerballResult, ladderResult] = await Promise.all([
      updateGameSettings("powerball", {
        min_bet: powerballMinBet ? Number(powerballMinBet) : null,
        max_bet: powerballMaxBet ? Number(powerballMaxBet) : null,
        betting_end_seconds: pbSeconds,
      }),
      updateGameSettings("ladder", {
        min_bet: ladderMinBet ? Number(ladderMinBet) : null,
        max_bet: ladderMaxBet ? Number(ladderMaxBet) : null,
        betting_end_seconds: ldSeconds,
      }),
    ]);

    if (!powerballResult.success || !ladderResult.success) {
      const messages = [powerballResult, ladderResult]
        .filter((result) => !result.success)
        .map((result) => result.error)
        .filter(Boolean)
        .join(" / ");
      showAlert({
        title: "저장 실패",
        message: messages || "설정 저장에 실패했습니다.",
        type: "error",
      });
      return;
    }

    refetchPowerball();
    refetchLadder();
  };
  const isLoading = isPowerballLoading || isLadderLoading;
  const hasLoadedOnce = !!powerballSettings && !!ladderSettings;

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
                onChange={(e) => {
                  const next = e.target.checked;
                  const prev = powerballEnabled;
                  setPowerballEnabled(next);
                  void (async () => {
                    const ok = await persistOddsSettings(
                      "powerball",
                      next,
                      powerballEnabledByBetType,
                      powerballOddsByBetType,
                    );
                    if (!ok) {
                      setPowerballEnabled(prev);
                    }
                  })();
                }}
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
                onChange={(e) => {
                  const next = e.target.checked;
                  const prev = ladderEnabled;
                  setLadderEnabled(next);
                  void (async () => {
                    const ok = await persistOddsSettings(
                      "ladder",
                      next,
                      ladderEnabledByBetType,
                      ladderOddsByBetType,
                    );
                    if (!ok) {
                      setLadderEnabled(prev);
                    }
                  })();
                }}
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
            {powerballItems.map((it) => (
              <div
                key={it.label}
                className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg"
              >
                <span
                  className={`text-sm ${
                    !powerballEnabled ? "text-gray-500" : "text-white"
                  }`}
                >
                  {it.label}
                </span>
                <label
                  className={`relative inline-flex items-center ${
                    powerballEnabled ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={powerballEnabledByBetType[it.betType] ?? true}
                    disabled={!powerballEnabled}
                    onChange={() => togglePowerballBetTab(it.label)}
                  />
                  <div
                    className={`w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 ${
                      !powerballEnabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  ></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 사다리 배팅탭 */}
        <div className="mb-3">
          <div className="text-indigo-400 text-xs font-semibold mb-1.5">
            사다리 배팅탭
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ladderItems.map((it) => (
              <div
                key={it.label}
                className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg"
              >
                <span
                  className={`text-sm ${
                    !ladderEnabled ? "text-gray-500" : "text-white"
                  }`}
                >
                  {it.label}
                </span>
                <label
                  className={`relative inline-flex items-center ${
                    ladderEnabled ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={ladderEnabledByBetType[it.betType] ?? true}
                    disabled={!ladderEnabled}
                    onChange={() => toggleLadderBetTab(it.label)}
                  />
                  <div
                    className={`w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 ${
                      !ladderEnabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  ></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 배당 설정 */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
        <h3 className="text-white text-sm font-semibold mb-2">배당 설정</h3>

        {/* 파워볼 배당 */}
        <div className="mb-3">
          <div className="text-indigo-400 text-xs font-semibold mb-1.5">
            파워볼
          </div>
          <div className="flex flex-wrap gap-2">
            {powerballItems.map((it) => (
              <div
                key={it.label}
                className={`bg-gray-800 p-2 rounded-lg ${
                  !powerballEnabled ? "opacity-50" : ""
                }`}
              >
                <label
                  className={`text-xs mb-1 block ${
                    !powerballEnabled ? "text-gray-500" : "text-white"
                  }`}
                >
                  {it.label}
                  {it.label.includes("언더") && (
                    <span className="text-gray-500"> (72.5/4.5)</span>
                  )}
                  {it.label.includes("오버") && (
                    <span className="text-gray-500"> (72.5/4.5)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={String(
                    powerballOddsByBetType[it.betType] ?? it.defaultOdds,
                  )}
                  disabled={!powerballEnabled}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPowerballOddsByBetType((prev) => ({
                      ...prev,
                      [it.betType]: Number.isFinite(v) ? v : it.defaultOdds,
                    }));
                  }}
                  className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                    !powerballEnabled ? "cursor-not-allowed opacity-50" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-indigo-400 text-xs font-semibold mb-1.5">
            사다리
          </div>
          <div className="flex flex-wrap gap-2">
            {ladderItems.map((it) => (
              <div
                key={it.label}
                className={`bg-gray-800 p-2 rounded-lg ${
                  !ladderEnabled ? "opacity-50" : ""
                }`}
              >
                <label
                  className={`text-xs mb-1 block ${
                    !ladderEnabled ? "text-gray-500" : "text-white"
                  }`}
                >
                  {it.label}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={String(
                    ladderOddsByBetType[it.betType] ?? it.defaultOdds,
                  )}
                  disabled={!ladderEnabled}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setLadderOddsByBetType((prev) => ({
                      ...prev,
                      [it.betType]: Number.isFinite(v) ? v : it.defaultOdds,
                    }));
                  }}
                  className={`w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 ${
                    !ladderEnabled ? "cursor-not-allowed opacity-50" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 배당 설정 저장 버튼 */}
        <div className="flex justify-end mt-3">
          <SaveButton
            onClick={saveOddsSettings}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
        <h3 className="text-white text-sm font-semibold mb-2">
          배팅 제한 / 회차 시간
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={`bg-gray-800 p-3 rounded-lg ${
              !powerballEnabled ? "opacity-50" : ""
            }`}
          >
            <div className="text-indigo-400 text-xs font-semibold mb-2">
              파워볼
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-300">최소 배팅</label>
                <input
                  value={powerballMinBet}
                  disabled={!powerballEnabled}
                  onChange={(e) =>
                    setPowerballMinBet(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300">최대 배팅</label>
                <input
                  value={powerballMaxBet}
                  disabled={!powerballEnabled}
                  onChange={(e) =>
                    setPowerballMaxBet(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300">
                  회차 시간(초, 최소 60)
                </label>
                <input
                  type="number"
                  min={60}
                  value={powerballRoundSeconds}
                  disabled={!powerballEnabled}
                  onChange={(e) =>
                    setPowerballRoundSeconds(
                      e.target.value.replace(/[^0-9]/g, ""),
                    )
                  }
                  placeholder="60"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div
            className={`bg-gray-800 p-3 rounded-lg ${
              !ladderEnabled ? "opacity-50" : ""
            }`}
          >
            <div className="text-indigo-400 text-xs font-semibold mb-2">
              사다리
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-300">최소 배팅</label>
                <input
                  value={ladderMinBet}
                  disabled={!ladderEnabled}
                  onChange={(e) =>
                    setLadderMinBet(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300">최대 배팅</label>
                <input
                  value={ladderMaxBet}
                  disabled={!ladderEnabled}
                  onChange={(e) =>
                    setLadderMaxBet(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300">
                  회차 시간(초, 최소 60)
                </label>
                <input
                  type="number"
                  min={60}
                  value={ladderRoundSeconds}
                  disabled={!ladderEnabled}
                  onChange={(e) =>
                    setLadderRoundSeconds(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="60"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 배팅 제한 / 회차 시간 저장 버튼 */}
        <div className="flex justify-end mt-3">
          <SaveButton
            onClick={saveBettingLimitsAndTime}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
