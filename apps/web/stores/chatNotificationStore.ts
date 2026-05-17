// Global notification store for chat notifications (agent/user)
// Uses module-level state to persist across HMR and component re-mounts

export interface ChatNotification {
  id: string;
  message: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  createdAt: number;
  moduleVersion: number;
}

// Module-level state - persists across HMR
let notifications: ChatNotification[] = [];
let listeners: Set<() => void> = new Set();
const timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

// Module version ID - changes on each HMR reload
// This is used to identify which module instance created a notification
const moduleVersion = Date.now();

// HMR cleanup - clear all timers when module is replaced
const hotModule = (
  globalThis as typeof globalThis & {
    module?: { hot?: { dispose: (callback: () => void) => void } };
  }
).module?.hot;

if (hotModule) {
  hotModule.dispose(() => {
    timers.forEach((timerId) => clearTimeout(timerId));
    timers.clear();
  });
}

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
export function addChatNotification(
  notification: Omit<ChatNotification, "id" | "createdAt" | "moduleVersion">,
) {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newNotification: ChatNotification = {
    ...notification,
    id,
    createdAt: Date.now(),
    moduleVersion,
  };

  notifications = [...notifications, newNotification];
  emitChange();

  // Auto-dismiss after 5 seconds with timer tracking
  const timerId = setTimeout(() => {
    timers.delete(id);
    dismissChatNotification(id, true);
  }, 5000);
  timers.set(id, timerId);
}

// Dismiss notification
export function dismissChatNotification(id: string, isAutoDismiss = false) {
  // For auto-dismiss, verify the notification exists and was created by current module
  if (isAutoDismiss) {
    const notification = notifications.find((n) => n.id === id);
    const elapsed = notification ? Date.now() - notification.createdAt : -1;
    // Skip if:
    // - notification doesn't exist (already dismissed or HMR cleared it)
    // - notification was created by a different module version (HMR issue)
    // - notification hasn't been visible long enough
    if (
      !notification ||
      notification.moduleVersion !== moduleVersion ||
      elapsed < 4500
    ) {
      return;
    }
  }

  // Clear any pending timer for this notification
  const existingTimer = timers.get(id);
  if (existingTimer) {
    clearTimeout(existingTimer);
    timers.delete(id);
  }

  const prevLength = notifications.length;
  notifications = notifications.filter((n) => n.id !== id);
  if (notifications.length !== prevLength) {
    emitChange();
  }
}

// Clear all notifications
export function clearChatNotifications() {
  // Clear all timers
  timers.forEach((timerId) => clearTimeout(timerId));
  timers.clear();
  notifications = [];
  emitChange();
}
