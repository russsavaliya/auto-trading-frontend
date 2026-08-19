import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  fetchPnlSummary,
  fetchPnlDaily,
  fetchRunningTrades,
  fetchPositions,
  fetchWebhookLogs,
} from '../api';
import Sidebar from './Sidebar';
import TradingToggle from './TradingToggle';

const REFRESH_MS = 30_000;

const PAGE_TITLES = {
  '/': { title: 'Overview', sub: 'Realised P&L, open positions and daily performance' },
  '/closed-trades': { title: 'Closed Trades', sub: 'Full history — option premium and index level side by side' },
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

  const { title, sub } = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">
            <span className={`status-dot${error ? ' offline' : ''}`} />
            <div>
              <div>{title}</div>
              <div className="topbar-sub">{sub}</div>
            </div>
          </div>
          <div className="topbar-actions">
            {lastUpdated && (
              <span className="topbar-meta">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
              </span>
            )}
            <TradingToggle onUnauthorized={logout} />
            <button className="logout-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        <div className="content">
          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <div className="loading-state">Loading dashboard…</div>
          ) : (
            <Outlet context={{ summary, days, running, positions, webhookLogs }} />
          )}
        </div>
      </div>
    </div>
  );
}
