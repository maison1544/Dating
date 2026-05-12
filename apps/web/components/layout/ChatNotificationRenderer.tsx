import { createPortal } from "react-dom";

interface ToastNotification {
  id: string;
  message: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ChatNotificationRendererProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

export function ChatNotificationRenderer({
  notifications,
  onDismiss,
}: ChatNotificationRendererProps) {
  if (notifications.length === 0) return null;

  const content = (
    <>
      <div
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxWidth: "400px",
        }}
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              color: "white",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              animation: "chatNotifSlideIn 0.3s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {notification.message}
                </div>
                {notification.description && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {notification.description}
                  </div>
                )}
                {notification.action && (
                  <button
                    onClick={() => {
                      notification.action?.onClick();
                      onDismiss(notification.id);
                    }}
                    style={{
                      marginTop: "8px",
                      padding: "6px 12px",
                      background: "#6366f1",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => onDismiss(notification.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0",
                  marginLeft: "8px",
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes chatNotifSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
}
