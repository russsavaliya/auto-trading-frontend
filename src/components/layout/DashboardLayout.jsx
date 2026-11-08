import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPnlSummary,
  fetchPnlDaily,
  fetchRunningTrades,
  fetchPositions,
  fetchWebhookLogs,
  fetchConfig,
} from '@/api';
import { ErrorBanner, LoadingState } from '@/components/ui/Feedback';
import { useTradingMode } from '@/hooks/useTradingMode';
import { LogoMark } from './Logo';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

const REFRESH_MS = 30_000;

const PAGE_TITLES = {
  '/': { title: 'Overview', sub: 'What the bridge is doing right now' },
  '/report': {
    title: 'Report',
    sub: 'Gross P&L, what it cost, and what is actually left',
  },
  '/closed-trades': {
    title: 'Closed Trades',
    sub: 'Full history — option premium and index level side by side',
  },
  '/webhook-logs': { title: 'Webhook Logs', sub: 'Every TradingView call and how it was handled' },
  '/settings': { title: 'Settings', sub: 'Trading controls and the rules that gate every entry' },
};

/**
 * Shell shared by every route: navigation, topbar and the polled dashboard
 * data that the pages read via useOutletContext.
 *
 * `config` is polled here rather than inside the header control it used to
 * back. Two screens now depend on it — the read-only status in the topbar and
 * the actual switches on Settings — and polling it in each would mean two
 * requests racing to describe the same kill switch, with no guarantee the
 * header and the page agreed on which way it was set.
 *
 * Closed Trades ignores this context and fetches its own paginated data; so
 * does Report, which is a whole-history aggregate rather than a live view.
 */
export default function DashboardLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const { mode, setMode, isLive } = useTradingMode();

  const [summary, setSummary] = useState(null);
  const [days, setDays] = useState(null);
  const [running, setRunning] = useState(null);
  const [positions, setPositions] = useState(null);
  const [webhookLogs, setWebhookLogs] = useState(null);
  const [config, setConfig] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [summaryRes, dailyRes, runningRes, positionsRes, webhookLogsRes] = await Promise.all([
        fetchPnlSummary(mode),
        fetchPnlDaily(mode),
        fetchRunningTrades(mode),
        fetchPositions(mode),
        fetchWebhookLogs({ limit: 30, mode }),
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
  }, [logout, mode]);

  /**
   * Deliberately NOT part of the Promise.all above. /api/config answers 503
   * when app_config cannot be read, and folding that into the main load would
   * blank every number on the page over a setting nobody was looking at. A
   * failed config read degrades to "unknown" — the topbar chip says so — while
   * the trade data carries on.
   */
  const loadConfig = useCallback(async () => {
    try {
      setConfig(await fetchConfig(mode));
    } catch (err) {
      if (err.status === 401) logout();
      else setConfig(null);
    }
  }, [logout, mode]);

  const refresh = useCallback(async () => {
    await Promise.all([loadAll(), loadConfig()]);
  }, [loadAll, loadConfig]);

  useEffect(() => {
    setLoading(true);
    setSummary(null);
    setDays(null);
    setRunning(null);
    setPositions(null);
    setWebhookLogs(null);
  }, [mode]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Tapping a bottom-bar tab must land at the top of the new page. Without
  // this the browser keeps the scroll offset across routes, so switching from
  // halfway down a 20-row Closed Trades list to Overview drops you into the
  // middle of the page — on a phone, where the tab bar makes those switches
  // constant, it reads as the app having failed to navigate at all.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const { title, sub } = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  return (
    <div className={cn('flex min-h-dvh', isLive && 'bg-loss-soft/40')}>
      {/* A standing band down the side of every live screen. The mode chip in
          the header says which environment this is; this is what makes it
          unmissable when you are not looking at the header. */}
      {isLive && (
        <div
          aria-hidden="true"
          className="bg-loss pointer-events-none fixed inset-y-0 left-0 z-40 w-1"
        />
      )}

      {/* md and up */}
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          description={sub}
          lastUpdated={lastUpdated}
          offline={Boolean(error)}
          tradingEnabled={config ? config.trading_enabled : null}
          mode={mode}
          onModeChange={setMode}
          liveAvailable={Boolean(config?.live?.enabled)}
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
            <Outlet
              context={{ summary, days, running, positions, webhookLogs, config, refresh, mode, isLive }}
            />
          )}

          {/* On desktop this standing caveat lives in the sidebar footer,
              visible on every page. The sidebar is not rendered on a phone, so
              without this it would appear on Overview and nowhere else —
              leaving the other screens showing rupee figures with nothing on
              screen saying they are marks against a sandbox that never fills
              an order. */}
          <p className="text-faint mt-6 flex items-start gap-2 text-[0.6875rem] leading-relaxed md:hidden">
            <LogoMark className="size-4 shrink-0" />
            {isLive ? (
              <span>
                <span className="text-loss font-semibold">Live.</span> These are real orders against
                a real account. Every figure here is money.
              </span>
            ) : (
              <span>
                <span className="text-muted font-semibold">Sandbox.</span> Orders are validated by
                Upstox but never filled. Every figure is a mark.
              </span>
            )}
          </p>
        </main>
      </div>

      {/* below md */}
      <MobileNav />
    </div>
  );
}
