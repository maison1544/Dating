import { X } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";

interface StatusChangeConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  description?: ReactNode;
  summary?: ReactNode;
  reason?: string | null;
  reasonLabel?: string;
  showReasonInput?: boolean;
  reasonInputLabel?: string;
  reasonInputPlaceholder?: string;
  reasonInputValue?: string;
  onReasonInputChange?: (value: string) => void;
  onReasonInputKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  confirmLabel: string;
  confirmClassName?: string;
  cancelLabel?: string;
  showCloseButton?: boolean;
  zIndexClassName?: string;
  overlayClassName?: string;
  containerClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function StatusChangeConfirmModal({
  isOpen,
  title,
  message,
  description,
  summary,
  reason,
  reasonLabel,
  showReasonInput = false,
  reasonInputLabel,
  reasonInputPlaceholder,
  reasonInputValue,
  onReasonInputChange,
  onReasonInputKeyDown,
  confirmLabel,
  confirmClassName,
  cancelLabel = "취소",
  showCloseButton = false,
  zIndexClassName = "z-50",
  overlayClassName,
  containerClassName,
  onCancel,
  onConfirm,
}: StatusChangeConfirmModalProps) {
  if (!isOpen) return null;

  const reasonLabelText = reasonLabel ?? "정지 사유:";
  const confirmClasses = `flex-1 px-4 py-2 rounded transition-colors text-white ${
    confirmClassName ?? "bg-green-500/80 hover:bg-green-500"
  }`;

  const overlayClasses = overlayClassName ?? "bg-black/50";
  const containerClasses = `bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 ${
    containerClassName ?? ""
  }`;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${overlayClasses} ${
        zIndexClassName || "z-50"
      }`}
    >
      <div className={containerClasses}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-white text-lg">{title}</h3>
          {showCloseButton && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {summary && <div className="mb-4">{summary}</div>}

        <div className="mb-4">{message}</div>

        {reason && (
          <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded">
            <span className="text-gray-400 text-sm">{reasonLabelText} </span>
            <span className="text-white">{reason}</span>
          </div>
        )}

        {showReasonInput && (
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">
              {reasonInputLabel ?? "정지 사유 (선택)"}
            </label>
            <input
              type="text"
              value={reasonInputValue ?? ""}
              onChange={(event) => onReasonInputChange?.(event.target.value)}
              placeholder={reasonInputPlaceholder ?? "정지 사유를 입력하세요"}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              onKeyDown={onReasonInputKeyDown}
            />
          </div>
        )}

        {description && <div className="mb-4">{description}</div>}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={confirmClasses}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
