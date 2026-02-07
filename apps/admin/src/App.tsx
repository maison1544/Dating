import { AdminLoginPage } from "@shared/app/pages/AdminLoginPage";
import { AdminDashboardPage } from "@shared/app/pages/AdminDashboardPage";
import { AdminUsersPage } from "@shared/app/pages/AdminUsersPage";
import { AdminAccountsPage } from "@shared/app/pages/AdminAccountsPage";
import { AdminPointsPage } from "@shared/app/pages/AdminPointsPage";
import { AdminNoticesPage } from "@shared/app/pages/AdminNoticesPage";
import { AdminChatsPage } from "@shared/app/pages/AdminChatsPage";
import { AdminGiftsPage } from "@shared/app/pages/AdminGiftsPage";
import { AdminMiniGamesPage } from "@shared/app/pages/AdminMiniGamesPage";
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
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/accounts" element={<AdminAccountsPage />} />
              <Route path="/admin/points" element={<AdminPointsPage />} />
              <Route path="/admin/notices" element={<AdminNoticesPage />} />
              <Route path="/admin/chats" element={<AdminChatsPage />} />
              <Route path="/admin/gifts" element={<AdminGiftsPage />} />
              <Route path="/admin/minigames" element={<AdminMiniGamesPage />} />

              {/* Fallback */}
              <Route
                path="*"
                element={<Navigate to="/admin/login" replace />}
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </AlertProvider>
  );
}
