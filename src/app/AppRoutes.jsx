import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Login from '@/pages/Login';
import Overview from '@/pages/Overview';
import Report from '@/pages/Report';
import ClosedTrades from '@/pages/ClosedTrades';
import WebhookLogsPage from '@/pages/WebhookLogsPage';
import Settings from '@/pages/Settings';

/**
 * Auth is a single gate at the layout level rather than a guard per page: if
 * the password is not held, no dashboard route may even mount, so no page can
 * fire an authenticated request on the way to being redirected.
 */
export default function AppRoutes() {
  const { authed } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={authed ? <Navigate to="/" replace /> : <Login />} />
      <Route element={authed ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Overview />} />
        <Route path="/report" element={<Report />} />
        <Route path="/closed-trades" element={<ClosedTrades />} />
        <Route path="/webhook-logs" element={<WebhookLogsPage />} />
        <Route path="/settings" element={<Settings />} />
        {/* Positions folded into Overview — it is live state and belongs
            beside the open position. Kept as a redirect so a bookmarked or
            pasted /positions link still lands somewhere sensible. */}
        <Route path="/positions" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={authed ? '/' : '/login'} replace />} />
    </Routes>
  );
}
