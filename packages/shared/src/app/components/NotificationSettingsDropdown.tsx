import { useState, useRef, useEffect } from "react";
import { Bell, Volume2, Check } from "lucide-react";
import {
  useNotification,
  NOTIFICATION_SOUNDS,
} from "../contexts/NotificationContext";

interface NotificationSettingsDropdownProps {
  variant: "admin" | "agent";
}

export function NotificationSettingsDropdown({
  variant,
}: NotificationSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings, previewSound } = useNotification();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSoundSelect = (soundId: number) => {
    updateSettings({ selectedSoundId: soundId });
    previewSound(soundId);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          settings.globalEnabled
            ? "text-gray-300 hover:text-white hover:bg-gray-700"
            : "text-gray-500 hover:text-gray-400 hover:bg-gray-700"
        }`}
        title="알림 설정"
      >
        <Bell size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <h3 className="text-white font-semibold mb-3">알림 설정</h3>

            {/* 전체 알림 ON/OFF */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
              <span className="text-gray-300 text-sm">전체 알림</span>
              <button
                onClick={() =>
                  updateSettings({ globalEnabled: !settings.globalEnabled })
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.globalEnabled ? "bg-indigo-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.globalEnabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {variant === "admin" && (
              <>
                {/* 입금/출금 알림 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 text-sm">입금/출금 알림</span>
                  <button
                    onClick={() =>
                      updateSettings({
                        depositWithdrawEnabled:
                          !settings.depositWithdrawEnabled,
                      })
                    }
                    disabled={!settings.globalEnabled}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      settings.depositWithdrawEnabled && settings.globalEnabled
                        ? "bg-indigo-600"
                        : "bg-gray-600"
                    } ${!settings.globalEnabled ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.depositWithdrawEnabled
                          ? "right-0.5"
                          : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* 가입 신청 알림 */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                  <span className="text-gray-300 text-sm">가입 신청 알림</span>
                  <button
                    onClick={() =>
                      updateSettings({
                        registrationEnabled: !settings.registrationEnabled,
                      })
                    }
                    disabled={!settings.globalEnabled}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      settings.registrationEnabled && settings.globalEnabled
                        ? "bg-indigo-600"
                        : "bg-gray-600"
                    } ${!settings.globalEnabled ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.registrationEnabled ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </>
            )}

            {variant === "agent" && (
              <>
                {/* 채팅 알림 */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                  <span className="text-gray-300 text-sm">채팅 알림</span>
                  <button
                    onClick={() =>
                      updateSettings({
                        agentChatEnabled: !settings.agentChatEnabled,
                      })
                    }
                    disabled={!settings.globalEnabled}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      settings.agentChatEnabled && settings.globalEnabled
                        ? "bg-indigo-600"
                        : "bg-gray-600"
                    } ${!settings.globalEnabled ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.agentChatEnabled ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </>
            )}

            {/* 알림음 선택 */}
            <div className="mb-2">
              <span className="text-gray-300 text-sm block mb-2">
                알림음 선택
              </span>
              <div className="space-y-1">
                {NOTIFICATION_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundSelect(sound.id)}
                    disabled={!settings.globalEnabled}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      settings.selectedSoundId === sound.id
                        ? "bg-indigo-600/20 text-indigo-400"
                        : "hover:bg-gray-700 text-gray-300"
                    } ${!settings.globalEnabled ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} />
                      <span className="text-sm">{sound.name}</span>
                    </div>
                    {settings.selectedSoundId === sound.id && (
                      <Check size={14} className="text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
