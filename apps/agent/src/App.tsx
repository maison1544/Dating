import { AdminLoginPage } from "@shared/app/pages/AdminLoginPage";
import { AgentDashboardPage } from "@shared/app/pages/AgentDashboardPage";
import { AgentChatsPage } from "@shared/app/pages/AgentChatsPage";
import { AgentMembersPage } from "@shared/app/pages/AgentMembersPage";
import { AgentGiftsPage } from "@shared/app/pages/AgentGiftsPage";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@shared/app/contexts/AuthContext";
import { AlertProvider } from "@shared/app/contexts/AlertContext";
import { NotificationProvider } from "@shared/app/contexts/NotificationContext";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useSessionTimeout } from "@shared/app/hooks/useSessionTimeout";

function ScrollToTop() {
  const routerLocation = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routerLocation.pathname]);

  return null;
}

function SessionTimeoutManager() {
  useSessionTimeout();
  return null;
}

export default function App() {
  return (
    <AlertProvider>
      <NotificationProvider>
        <AuthProvider>
          <SessionTimeoutManager />
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#1f2937",
                  border: "1px solid #374151",
                  color: "#f3f4f6",
                },
              }}
            />
            <ScrollToTop />
            <Routes>
              {/* Agent Routes */}
              <Route path="/agent/login" element={<AdminLoginPage />} />
              <Route path="/agent" element={<AgentDashboardPage />} />
              <Route
                path="/agent/dashboard"
                element={<AgentDashboardPage />}
              />
              <Route path="/agent/chats" element={<AgentChatsPage />} />
              <Route path="/agent/members" element={<AgentMembersPage />} />
              <Route path="/agent/gifts" element={<AgentGiftsPage />} />

              {/* Fallback */}
              <Route
                path="*"
                element={<Navigate to="/agent/login" replace />}
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </AlertProvider>
  );
}
