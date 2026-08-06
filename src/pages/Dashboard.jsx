import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import {
  fetchPnlSummary,
  fetchPnlMonthly,
  fetchRunningTrades,
  fetchTrades,
  fetchPositions,
  fetchWebhookLogs,
} from '../api';
import Sidebar from '../components/Sidebar';
import StatTile from '../components/StatTile';
import MonthlyPnlChart from '../components/MonthlyPnlChart';
import RunningTradesTable from '../components/RunningTradesTable';
import RecentTradesTable from '../components/RecentTradesTable';
import PositionsTable from '../components/PositionsTable';
import WebhookLogsTable from '../components/WebhookLogsTable';

const REFRESH_MS = 30_000;
const CLOSED_TRADES_PAGE_SIZE = 20;

const PAGE_TITLES = {
  overview: { title: 'Overview', sub: 'P&L, running trades and monthly performance' },
  'closed-trades': { title: 'Closed Trades', sub: 'Full history of closed positions' },
  'webhook-logs': { title: 'Webhook Logs', sub: 'Every TradingView call and how it was handled' },
  positions: { title: 'Positions', sub: 'Current state per symbol' },
};

function formatCurrency(n) {
  const sign = n > 0 ? '+' : '';
  return `${sign}₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const { logout } = useAuth();
  const [page, setPage] = useState('overview');

  const [summary, setSummary] = useState(null);
  const [months, setMonths] = useState(null);
  const [running, setRunning] = useState(null);
  const [positions, setPositions] = useState(null);
  const [webhookLogs, setWebhookLogs] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [summaryRes, monthlyRes, runningRes, positionsRes, webhookLogsRes] = await Promise.all([
        fetchPnlSummary(),
        fetchPnlMonthly(),
        fetchRunningTrades(),
        fetchPositions(),
        fetchWebhookLogs({ limit: 30 }),
      ]);
      setSummary(summaryRes);
      setMonths(monthlyRes.months);
      setRunning(runningRes.trades);
      setPositions(positionsRes.positions);
      setWebhookLogs(webhookLogsRes.logs);
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

  const { title, sub } = PAGE_TITLES[page];

  return (
    <div className="layout">
      <Sidebar active={page} onNavigate={setPage} />

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">
            <span className={`status-dot${error ? ' offline' : ''}`} />
            <div>
              <div>{title}</div>
              <div className="topbar-sub">{sub}</div>
            </div>
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
              {page === 'overview' && (
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
                </>
              )}

              {page === 'closed-trades' && <ClosedTradesPage onUnauthorized={logout} />}

              {page === 'webhook-logs' && (
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">Recent webhook calls</div>
                    <div className="panel-title-muted">Latest 30 · auto-refreshes every 30s</div>
                  </div>
                  <WebhookLogsTable logs={webhookLogs} />
                </div>
              )}

              {page === 'positions' && (
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">Symbol positions</div>
                  </div>
                  <PositionsTable positions={positions} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Its own paginated fetch — independent of the 30s dashboard-wide refresh,
 * since closed-trade history is large and shouldn't be re-fetched on a timer. */
function ClosedTradesPage({ onUnauthorized }) {
  const [trades, setTrades] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchTrades({ status: 'CLOSED', limit: CLOSED_TRADES_PAGE_SIZE, offset })
      .then((res) => {
        if (cancelled) return;
        setTrades(res.trades);
        setTotal(res.total);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(err.message || 'Failed to load closed trades');
      });
    return () => {
      cancelled = true;
    };
  }, [offset, onUnauthorized]);

  const page = Math.floor(offset / CLOSED_TRADES_PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / CLOSED_TRADES_PAGE_SIZE));

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Closed trades</div>
        <div className="panel-title-muted">{total} total</div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <RecentTradesTable trades={trades} />

      {trades && trades.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - CLOSED_TRADES_PAGE_SIZE))}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={offset + CLOSED_TRADES_PAGE_SIZE >= total}
            onClick={() => setOffset(offset + CLOSED_TRADES_PAGE_SIZE)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
