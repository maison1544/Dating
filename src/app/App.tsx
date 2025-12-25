import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAccountsPage } from './pages/AdminAccountsPage';
import { AdminPointsPage } from './pages/AdminPointsPage';
import { AdminNoticesPage } from './pages/AdminNoticesPage';
import { AdminChatsPage } from './pages/AdminChatsPage';
import { AdminGiftsPage } from './pages/AdminGiftsPage';
import { AdminMiniGamesPage } from './pages/AdminMiniGamesPage';
import { AgentDashboardPage } from './pages/AgentDashboardPage';
import { AgentChatsPage } from './pages/AgentChatsPage';
import { AgentMembersPage } from './pages/AgentMembersPage';
import { AgentGiftsPage } from './pages/AgentGiftsPage';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProfileProvider } from './contexts/ProfileContext';
import { ChatProfileProvider } from './contexts/ChatProfileContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MainPage } from './pages/MainPage';
import { RealtimeMatchingPage } from './pages/RealtimeMatchingPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { NoticePage } from './pages/NoticePage';
import { MiniGamePage } from './pages/MiniGamePage';
import { DiceGamePage } from './pages/DiceGamePage';
import { LadderGamePage } from './pages/LadderGamePage';
import { RankingPage } from './pages/RankingPage';
import { PointPage } from './pages/PointPage';
import { MyPage } from './pages/MyPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import { useEffect } from 'react';

function ScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return null;
}

export default function App() {
  return (
    <ProfileProvider>
      <ChatProfileProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/accounts" element={<AdminAccountsPage />} />
            <Route path="/admin/points" element={<AdminPointsPage />} />
            <Route path="/admin/notices" element={<AdminNoticesPage />} />
            <Route path="/admin/chats" element={<AdminChatsPage />} />
            <Route path="/admin/gifts" element={<AdminGiftsPage />} />
            <Route path="/admin/minigames" element={<AdminMiniGamesPage />} />
            <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
            <Route path="/agent/chats" element={<AgentChatsPage />} />
            <Route path="/agent/members" element={<AgentMembersPage />} />
            <Route path="/agent/gifts" element={<AgentGiftsPage />} />

            {/* User Routes */}
            <Route path="*" element={
              <div className="min-h-screen bg-black">
                <Header />
                <main className="max-w-[1600px] mx-auto">
                  <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/realtime-matching" element={<RealtimeMatchingPage />} />
                    <Route path="/chat/:chatId" element={<ChatRoomPage />} />
                    <Route path="/notice" element={<NoticePage />} />
                    <Route path="/mini-game" element={<MiniGamePage />} />
                    <Route path="/mini-game/dice-game" element={<DiceGamePage />} />
                    <Route path="/mini-game/ladder-game" element={<LadderGamePage />} />
                    <Route path="/accommodation" element={<RankingPage />} />
                    <Route path="/point" element={<PointPage />} />
                    <Route path="/mypage" element={<MyPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/profile-edit" element={<ProfileEditPage />} />
                    <Route path="/payment-history" element={<PaymentHistoryPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </ChatProfileProvider>
    </ProfileProvider>
  );
}