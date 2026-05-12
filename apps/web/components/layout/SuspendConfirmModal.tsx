import type { KeyboardEvent, ReactNode } from "react";
import { StatusChangeConfirmModal } from "./StatusChangeConfirmModal";

interface SuspendConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  isSuspending: boolean;
  reason?: string | null;
  reasonLabel?: string;
  reasonInputValue?: string;
  onReasonInputChange?: (value: string) => void;
  onReasonInputKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  confirmLabel?: string;
  confirmClassName?: string;
  cancelLabel?: string;
  zIndexClassName?: string;
  hideReasonInput?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SuspendConfirmModal({
  isOpen,
  title,
  message,
  isSuspending,
  reason,
  reasonLabel,
  reasonInputValue,
  onReasonInputChange,
  onReasonInputKeyDown,
  confirmLabel,
  confirmClassName,
  cancelLabel,
  zIndexClassName,
  hideReasonInput = false,
  onCancel,
  onConfirm,
}: SuspendConfirmModalProps) {
  const confirmText = confirmLabel ?? (isSuspending ? "정지하기" : "확인");
  const confirmClasses =
    confirmClassName ??
    (isSuspending
      ? "bg-red-500 hover:bg-red-600"
      : "bg-green-500 hover:bg-green-600");

  const shouldShowReasonInput = isSuspending && !hideReasonInput;

  return (
    <StatusChangeConfirmModal
      isOpen={isOpen}
      title={title}
      message={message}
      reason={!isSuspending ? reason : null}
      reasonLabel={reasonLabel}
      showReasonInput={shouldShowReasonInput}
      reasonInputValue={shouldShowReasonInput ? reasonInputValue : undefined}
      onReasonInputChange={
        shouldShowReasonInput ? onReasonInputChange : undefined
      }
      onReasonInputKeyDown={
        shouldShowReasonInput ? onReasonInputKeyDown : undefined
      }
      confirmLabel={confirmText}
      confirmClassName={confirmClasses}
      cancelLabel={cancelLabel}
      zIndexClassName={zIndexClassName}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
