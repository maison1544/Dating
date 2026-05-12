import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
}

export function CustomAlert({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
}: CustomAlertProps) {
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const theme = (() => {
    if (type === "success") {
      return {
        border: "border-green-500",
        iconBg: "bg-green-600",
        icon: <CheckCircle2 className="w-6 h-6 text-white" />,
        button: "bg-green-600 hover:bg-green-700",
      };
    }
    if (type === "warning") {
      return {
        border: "border-yellow-500",
        iconBg: "bg-yellow-600",
        icon: <AlertTriangle className="w-6 h-6 text-white" />,
        button: "bg-yellow-600 hover:bg-yellow-700",
      };
    }
    if (type === "error") {
      return {
        border: "border-red-500",
        iconBg: "bg-red-600",
        icon: <AlertCircle className="w-6 h-6 text-white" />,
        button: "bg-red-600 hover:bg-red-700",
      };
    }
    return {
      border: "border-indigo-500",
      iconBg: "bg-indigo-600",
      icon: <AlertCircle className="w-6 h-6 text-white" />,
      button: "bg-indigo-600 hover:bg-indigo-700",
    };
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div
        className={`bg-gray-900 rounded-xl border-2 ${theme.border} w-full max-w-md`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-full ${theme.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              {theme.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-300 text-sm whitespace-pre-line">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="border-t border-gray-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${theme.button} text-white rounded-lg font-semibold transition-colors`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
