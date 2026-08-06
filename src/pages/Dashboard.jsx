import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { fetchPnlSummary, fetchPnlMonthly, fetchRunningTrades, fetchTrades } from '../api';
import StatTile from '../components/StatTile';
import MonthlyPnlChart from '../components/MonthlyPnlChart';
import RunningTradesTable from '../components/RunningTradesTable';
import RecentTradesTable from '../components/RecentTradesTable';

const REFRESH_MS = 30_000;

function formatCurrency(n) {
  const sign = n > 0 ? '+' : '';
  return `${sign}₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const { logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [months, setMonths] = useState(null);
  const [running, setRunning] = useState(null);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [summaryRes, monthlyRes, runningRes, recentRes] = await Promise.all([
        fetchPnlSummary(),
        fetchPnlMonthly(),
        fetchRunningTrades(),
        fetchTrades({ status: 'CLOSED', limit: 15 }),
      ]);
      setSummary(summaryRes);
      setMonths(monthlyRes.months);
      setRunning(runningRes.trades);
      setRecent(recentRes.trades);
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

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-title">
          <span className={`status-dot${error ? ' offline' : ''}`} />
          Trading Admin
        </div>
        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="content">
        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">Loading dashboard…</div>
        ) : (
          <>
            <div className="stat-grid">
              <StatTile
                label="Total P&L"
                value={summary ? formatCurrency(summary.totalPnl) : '—'}
                tone={summary && summary.totalPnl >= 0 ? 'good' : 'critical'}
                sub={`${summary?.totalClosedTrades ?? 0} closed trades`}
              />
              <StatTile
                label="Today's P&L"
                value={summary ? formatCurrency(summary.todayPnl) : '—'}
                tone={summary && summary.todayPnl >= 0 ? 'good' : 'critical'}
              />
              <StatTile
                label="Running trades"
                value={summary?.runningTrades ?? 0}
                sub="Open positions right now"
              />
              <StatTile
                label="Win rate"
                value={summary ? `${summary.winRate}%` : '—'}
                sub={`${summary?.wins ?? 0}W / ${summary?.losses ?? 0}L`}
              />
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Monthly P&L</div>
                <div className="panel-title-muted">Realized, per calendar month</div>
              </div>
              <MonthlyPnlChart data={months} />
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Running trades</div>
                <div className="panel-title-muted">Auto-refreshes every 30s</div>
              </div>
              <RunningTradesTable trades={running} />
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Recent closed trades</div>
              </div>
              <RecentTradesTable trades={recent} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
