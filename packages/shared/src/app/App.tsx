import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminAccountsPage } from "./pages/AdminAccountsPage";
import { AdminPointsPage } from "./pages/AdminPointsPage";
import { AdminNoticesPage } from "./pages/AdminNoticesPage";
import { AdminChatsPage } from "./pages/AdminChatsPage";
import { AdminGiftsPage } from "./pages/AdminGiftsPage";
import { AdminMiniGamesPage } from "./pages/AdminMiniGamesPage";
import { AgentDashboardPage } from "./pages/AgentDashboardPage";
import { AgentChatsPage } from "./pages/AgentChatsPage";
import { AgentMembersPage } from "./pages/AgentMembersPage";
import { AgentGiftsPage } from "./pages/AgentGiftsPage";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { ProfileProvider } from "./contexts/ProfileContext";
import { ChatProfileProvider } from "./contexts/ChatProfileContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MainPage } from "./pages/MainPage";
import { RealtimeMatchingPage } from "./pages/RealtimeMatchingPage";
import { ChatRoomPage } from "./pages/ChatRoomPage";
import { NoticePage } from "./pages/NoticePage";
import { MiniGamePage } from "./pages/MiniGamePage";
import { PowerballGamePage } from "./pages/PowerballGamePage";
import { LadderGamePage } from "./pages/LadderGamePage";
import { RankingPage } from "./pages/RankingPage";
import { PointPage } from "./pages/PointPage";
import { MyPage } from "./pages/MyPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { PaymentHistoryPage } from "./pages/PaymentHistoryPage";
import { UserChatNotifications } from "./components/UserChatNotifications";
import { useEffect } from "react";
import { useSessionTimeout } from "./hooks/useSessionTimeout";

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
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isAgent) return <Navigate to="/agent" replace />;
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
                <Routes>
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route
                    path="/admin/dashboard"
                    element={<AdminDashboardPage />}
                  />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route
                    path="/admin/accounts"
                    element={<AdminAccountsPage />}
                  />
                  <Route path="/admin/points" element={<AdminPointsPage />} />
                  <Route path="/admin/notices" element={<AdminNoticesPage />} />
                  <Route path="/admin/chats" element={<AdminChatsPage />} />
                  <Route path="/admin/gifts" element={<AdminGiftsPage />} />
                  <Route
                    path="/admin/minigames"
                    element={<AdminMiniGamesPage />}
                  />

                  <Route path="/agent/login" element={<AdminLoginPage />} />
                  <Route path="/agent" element={<AgentDashboardPage />} />
                  <Route
                    path="/agent/dashboard"
                    element={<AgentDashboardPage />}
                  />
                  <Route path="/agent/chats" element={<AgentChatsPage />} />
                  <Route path="/agent/members" element={<AgentMembersPage />} />
                  <Route path="/agent/gifts" element={<AgentGiftsPage />} />

                  {/* User Routes */}
                  <Route
                    path="*"
                    element={
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
                            <Route
                              path="/minigame"
                              element={<MiniGamePage />}
                            />
                            <Route
                              path="/mini-game"
                              element={<MiniGamePage />}
                            />
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
                            <Route
                              path="*"
                              element={<Navigate to="/" replace />}
                            />
                          </Routes>
                        </main>
                        <Footer />
                      </div>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </ChatProfileProvider>
          </ProfileProvider>
        </AuthProvider>
      </NotificationProvider>
    </AlertProvider>
  );
}
