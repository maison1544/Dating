import { useUserChatNotifications } from "../hooks/useUserChatNotifications";
import { ChatNotificationRenderer } from "./ChatNotificationRenderer";

export function UserChatNotifications() {
  const { notifications, dismissNotification } = useUserChatNotifications();

  return (
    <ChatNotificationRenderer
      notifications={notifications}
      onDismiss={dismissNotification}
    />
  );
}
