import { AlertCircle, X } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-indigo-500 w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
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
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}