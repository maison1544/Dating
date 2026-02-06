import { Loader2 } from "lucide-react";

interface AdminPageLoaderProps {
  message?: string;
}

export function AdminPageLoader({
  message = "불러오는 중...",
}: AdminPageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      <span className="text-gray-400 text-sm">{message}</span>
    </div>
  );
}
