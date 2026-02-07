import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { ProfileProvider } from "@shared/app/contexts/ProfileContext";
import { ChatProfileProvider } from "@shared/app/contexts/ChatProfileContext";
import { AuthProvider, useAuth } from "@shared/app/contexts/AuthContext";
import { AlertProvider } from "@shared/app/contexts/AlertContext";
import { NotificationProvider } from "@shared/app/contexts/NotificationContext";
import { Toaster } from "sonner";
import { Header } from "@shared/app/components/Header";
import { Footer } from "@shared/app/components/Footer";
import { MainPage } from "@shared/app/pages/MainPage";
import { RealtimeMatchingPage } from "@shared/app/pages/RealtimeMatchingPage";
import { ChatRoomPage } from "@shared/app/pages/ChatRoomPage";
import { NoticePage } from "@shared/app/pages/NoticePage";
import { MiniGamePage } from "@shared/app/pages/MiniGamePage";
import { PowerballGamePage } from "@shared/app/pages/PowerballGamePage";
import { LadderGamePage } from "@shared/app/pages/LadderGamePage";
import { RankingPage } from "@shared/app/pages/RankingPage";
import { PointPage } from "@shared/app/pages/PointPage";
import { MyPage } from "@shared/app/pages/MyPage";
import { LoginPage } from "@shared/app/pages/LoginPage";
import { SignupPage } from "@shared/app/pages/SignupPage";
import { ProfileEditPage } from "@shared/app/pages/ProfileEditPage";
import { PaymentHistoryPage } from "@shared/app/pages/PaymentHistoryPage";
import { UserChatNotifications } from "@shared/app/components/UserChatNotifications";
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

function RequireUser({ children }: { children: JSX.Element }) {
  const { user, isLoading, isAdmin, isAgent } = useAuth();

  if (isLoading) return null;
  if (isAdmin || isAgent) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <AlertProvider>
      <NotificationProvider>
        <AuthProvider>
          <SessionTimeoutManager />
          <ProfileProvider>
            <ChatProfileProvider>
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
                <div className="min-h-screen bg-black">
                  <Header />
                  <UserChatNotifications />
                  <main className="max-w-[1600px] mx-auto">
                    <Routes>
                      <Route path="/" element={<MainPage />} />
                      <Route
                        path="/realtime-matching"
                        element={<RealtimeMatchingPage />}
                      />
                      <Route
                        path="/chat/:chatId"
                        element={
                          <RequireUser>
                            <ChatRoomPage />
                          </RequireUser>
                        }
                      />
                      <Route path="/notice" element={<NoticePage />} />
                      <Route path="/minigame" element={<MiniGamePage />} />
                      <Route path="/mini-game" element={<MiniGamePage />} />
                      <Route
                        path="/powerball"
                        element={<PowerballGamePage />}
                      />
                      <Route
                        path="/dice-game"
                        element={<Navigate to="/powerball" replace />}
                      />
                      <Route
                        path="/mini-game/powerball"
                        element={<PowerballGamePage />}
                      />
                      <Route
                        path="/ladder-game"
                        element={<LadderGamePage />}
                      />
                      <Route
                        path="/mini-game/ladder-game"
                        element={<LadderGamePage />}
                      />
                      <Route path="/ranking" element={<RankingPage />} />
                      <Route
                        path="/point"
                        element={
                          <RequireUser>
                            <PointPage />
                          </RequireUser>
                        }
                      />
                      <Route
                        path="/mypage"
                        element={
                          <RequireUser>
                            <MyPage />
                          </RequireUser>
                        }
                      />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route
                        path="/profile-edit"
                        element={
                          <RequireUser>
                            <ProfileEditPage />
                          </RequireUser>
                        }
                      />
                      <Route
                        path="/payment-history"
                        element={
                          <RequireUser>
                            <PaymentHistoryPage />
                          </RequireUser>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </BrowserRouter>
            </ChatProfileProvider>
          </ProfileProvider>
        </AuthProvider>
      </NotificationProvider>
    </AlertProvider>
  );
}
