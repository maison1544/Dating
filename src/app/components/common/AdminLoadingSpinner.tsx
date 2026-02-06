import { Loader2 } from "lucide-react";

interface AdminLoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function AdminLoadingSpinner({
  message = "로딩 중...",
  fullScreen = false,
}: AdminLoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {content}
    </div>
  );
}
