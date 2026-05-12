// Global notification store for admin notifications
// Uses module-level state to persist across HMR and component re-mounts

export interface AdminNotification {
  id: string;
  message: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

// Module-level state - persists across HMR
let notifications: AdminNotification[] = [];
let listeners: Set<() => void> = new Set();

// Subscribe function for useSyncExternalStore
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Get current snapshot
export function getSnapshot() {
  return notifications;
}

// Notify all listeners
function emitChange() {
  listeners.forEach((listener) => listener());
}

// Add notification
export function addNotification(
  notification: Omit<AdminNotification, "id" | "createdAt">,
) {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newNotification: AdminNotification = {
    ...notification,
    id,
    createdAt: Date.now(),
  };

  notifications = [...notifications, newNotification];
  emitChange();
}

// Dismiss notification
export function dismissNotification(id: string) {
  const prevLength = notifications.length;
  notifications = notifications.filter((n) => n.id !== id);
  if (notifications.length !== prevLength) {
    emitChange();
  }
}

// Clear all notifications
export function clearNotifications() {
  notifications = [];
  emitChange();
}
