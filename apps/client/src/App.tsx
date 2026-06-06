import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import LaunchPage from './pages/LaunchPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AppLayout from './pages/AppLayout';
import OwlPage from './pages/OwlPage';
import VaultPage from './pages/VaultPage';
import DiagonAlley from './pages/DiagonAlley';
import DailyNewsPage from './pages/DailyNewsPage';
import CirclePage from './pages/CirclePage';
import HouseCupPage from './pages/HouseCupPage';
import RoomPage from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import OwlPingPage from './pages/OwlPingPage';
import StoryChatPage from './pages/StoryChatPage';
import ToastContainer from './components/ToastContainer';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return <Navigate to="/app/owl" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
      <Route path="/" element={<LaunchPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="owl" replace />} />
        <Route path="owl" element={<OwlPage />} />
        <Route path="vault" element={<VaultPage />} />
        <Route path="diagon-alley" element={<DiagonAlley />} />
        <Route path="news" element={<DailyNewsPage />} />
        <Route path="circle" element={<CirclePage />} />
        <Route path="house-cup" element={<HouseCupPage />} />
        <Route path="room" element={<RoomPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="owl-ping" element={<OwlPingPage />} />
        <Route path="story-chat" element={<StoryChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
