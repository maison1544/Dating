interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Green dot indicator for online status
 * Used next to user avatars in chat lists
 */
export function OnlineStatusIndicator({
  isOnline,
  size = "sm",
  className = "",
}: OnlineStatusIndicatorProps) {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`absolute bottom-0 right-0 ${sizeClasses[size]} bg-green-500 border-2 border-gray-900 rounded-full ${className}`}
    />
  );
}

interface OnlineStatusTextProps {
  isOnline: boolean;
  className?: string;
}

/**
 * Text display for online/offline status
 * Used in admin page user details and chat log mode
 */
export function OnlineStatusText({
  isOnline,
  className = "",
}: OnlineStatusTextProps) {
  return (
    <span
      className={`${isOnline ? "text-green-500" : "text-gray-500"} ${className}`}
    >
      {isOnline ? "● 온라인" : "○ 오프라인"}
    </span>
  );
}

/**
 * Helper function to check if user is online based on last_active_at
 * User is considered online if:
 * 1. is_online flag is true AND
 * 2. last_active_at is within the last 5 minutes
 */
export function checkIsUserOnline(user: {
  is_online?: boolean;
  last_active_at?: string | null;
}): boolean {
  if (!user?.is_online) return false;
  if (!user?.last_active_at) return false;

  const lastActive = new Date(user.last_active_at).getTime();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return lastActive > fiveMinutesAgo;
}
