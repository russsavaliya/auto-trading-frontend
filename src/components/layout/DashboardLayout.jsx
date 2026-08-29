import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPnlSummary,
  fetchPnlDaily,
  fetchRunningTrades,
  fetchPositions,
  fetchWebhookLogs,
} from '@/api';
import { ErrorBanner, LoadingState } from '@/components/ui/Feedback';
import { LogoMark } from './Logo';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

const REFRESH_MS = 30_000;

const PAGE_TITLES = {
  '/': { title: 'Overview', sub: 'Realised P&L, open positions and daily performance' },
  '/closed-trades': {
    title: 'Closed Trades',
    sub: 'Full history — option premium and index level side by side',
  },
  '/webhook-logs': { title: 'Webhook Logs', sub: 'Every TradingView call and how it was handled' },
  '/positions': { title: 'Positions', sub: 'Current state machine per symbol' },
};

/**
 * Shell shared by every route: sidebar, topbar and the polled dashboard data
 * (summary/days/running/positions/webhookLogs) that Overview, Webhook Logs
 * and Positions all read via useOutletContext. Closed Trades ignores this
 * and fetches its own paginated data — see pages/ClosedTrades.jsx.
 */
export default function DashboardLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  const [summary, setSummary] = useState(null);
  const [days, setDays] = useState(null);
  const [running, setRunning] = useState(null);
  const [positions, setPositions] = useState(null);
  const [webhookLogs, setWebhookLogs] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [summaryRes, dailyRes, runningRes, positionsRes, webhookLogsRes] = await Promise.all([
        fetchPnlSummary(),
        fetchPnlDaily(),
        fetchRunningTrades(),
        fetchPositions(),
        fetchWebhookLogs({ limit: 30 }),
      ]);
      setSummary(summaryRes);
      setDays(dailyRes.days);
      setRunning(runningRes.trades);
      setPositions(positionsRes.positions);
      setWebhookLogs(webhookLogsRes.logs);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadAll]);

  // Tapping a bottom-bar tab must land at the top of the new page. Without
  // this the browser keeps the scroll offset across routes, so switching from
  // halfway down a 20-row Closed Trades list to Overview drops you into the
  // middle of the equity chart with the stat tiles above the fold — on a
  // phone, where the tab bar makes those switches constant, it reads as the
  // app having failed to navigate at all.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const { title, sub } = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  return (
    <div className="flex min-h-dvh">
      {/* md and up */}
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          description={sub}
          lastUpdated={lastUpdated}
          offline={Boolean(error)}
          onLogout={logout}
        />

        {/* pb-nav is the fixed tab bar's height plus the home-indicator inset:
            without it the last card on every page ends up underneath the bar
            with no way to scroll it clear. */}
        <main className="pb-nav mx-auto w-full max-w-[80rem] flex-1 px-4 py-5 sm:px-6 sm:py-6 md:pb-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}

          {loading ? (
            <LoadingState>Loading dashboard…</LoadingState>
          ) : (
            <Outlet context={{ summary, days, running, positions, webhookLogs }} />
          )}

          {/* On desktop this standing caveat lives in the sidebar footer,
              visible on every page. The sidebar is not rendered on a phone, so
              without this it would appear on Overview (in the Callout) and
              nowhere else — leaving Closed Trades, Webhook Logs and Positions
              showing rupee figures with nothing on screen saying they are
              marks against a sandbox that never fills an order. */}
          <p className="text-faint mt-6 flex items-start gap-2 text-[0.6875rem] leading-relaxed md:hidden">
            <LogoMark className="size-4 shrink-0" />
            <span>
              <span className="text-muted font-semibold">Sandbox.</span> Orders are validated by
              Upstox but never filled. Every figure is a mark.
            </span>
          </p>
        </main>
      </div>

      {/* below md */}
      <MobileNav />
    </div>
  );
}
