import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/Overview';
import ClosedTrades from './pages/ClosedTrades';
import WebhookLogsPage from './pages/WebhookLogsPage';
import PositionsPage from './pages/PositionsPage';

function Root() {
  const { authed } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />
      <Route element={authed ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Overview />} />
        <Route path="/closed-trades" element={<ClosedTrades />} />
        <Route path="/webhook-logs" element={<WebhookLogsPage />} />
        <Route path="/positions" element={<PositionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={authed ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
