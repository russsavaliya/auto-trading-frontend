import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import {
  fetchPnlSummary,
  fetchPnlDaily,
  fetchRunningTrades,
  fetchTrades,
  fetchPositions,
  fetchWebhookLogs,
} from '../api';
import Sidebar from '../components/Sidebar';
import StatTile from '../components/StatTile';
import EquityCurveChart from '../components/EquityCurveChart';
import DailyPnlChart from '../components/DailyPnlChart';
import RunningTradesTable from '../components/RunningTradesTable';
import RecentTradesTable from '../components/RecentTradesTable';
import PositionsTable from '../components/PositionsTable';
import WebhookLogsTable from '../components/WebhookLogsTable';
import { formatMoney, tone } from '../utils/format';

const REFRESH_MS = 30_000;
const CLOSED_TRADES_PAGE_SIZE = 20;

const PAGE_TITLES = {
  overview: { title: 'Overview', sub: 'Realised P&L, open positions and daily performance' },
  'closed-trades': { title: 'Closed Trades', sub: 'Full history — option premium and index level side by side' },
  'webhook-logs': { title: 'Webhook Logs', sub: 'Every TradingView call and how it was handled' },
  positions: { title: 'Positions', sub: 'Current state machine per symbol' },
};

export default function Dashboard() {
  const { logout } = useAuth();
  const [page, setPage] = useState('overview');

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

  const { title, sub } = PAGE_TITLES[page];

  // Marked-to-market exposure across everything currently open. Shown beside
  // realised P&L so the headline number is never mistaken for the whole story.
  const openPnl = (running || []).reduce(
    (sum, t) => (t.unrealized_pnl == null ? sum : sum + Number(t.unrealized_pnl)),
    0
  );
  const hasOpen = (running || []).length > 0;

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
          <div className="topbar-actions">
            {lastUpdated && (
              <span className="topbar-meta">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
              </span>
            )}
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
            <>
              {page === 'overview' && (
                <>
                  {/* Sandbox mode is not a detail — no order this bridge places
                      is ever executed, so every figure below is a mark against
                      real option prices, not a broker fill. Saying so once, at
                      the top, is cheaper than every number being ambiguous. */}
                  <div className="notice">
                    <strong>Paper trading.</strong> Upstox&rsquo;s sandbox accepts orders but never fills them, so P&amp;L
                    is marked against real traded option premiums with slippage charged on both legs — not broker fills.
                  </div>

                  <div className="stat-grid">
                    <StatTile
                      hero
                      label="Realised P&L"
                      value={summary ? formatMoney(summary.totalPnl) : '—'}
                      tone={summary ? tone(summary.totalPnl) : undefined}
                      sub={`${summary?.pricedTrades ?? 0} closed trades`}
                      hint={
                        summary?.unpricedTrades
                          ? `${summary.unpricedTrades} trade(s) excluded — premium unavailable`
                          : null
                      }
                    />
                    <StatTile
                      label="Today"
                      value={summary ? formatMoney(summary.todayPnl) : '—'}
                      tone={summary ? tone(summary.todayPnl) : undefined}
                      sub="Closed today (IST)"
                    />
                    <StatTile
                      label="Open positions"
                      value={summary?.runningTrades ?? 0}
                      sub={hasOpen ? `${formatMoney(openPnl)} unrealised` : 'Flat'}
                      tone={hasOpen ? tone(openPnl) : undefined}
                    />
                    <StatTile
                      label="Win rate"
                      value={summary ? `${summary.winRate}%` : '—'}
                      sub={`${summary?.wins ?? 0}W / ${summary?.losses ?? 0}L`}
                      hint={
                        summary?.forceClosedTrades
                          ? `${summary.forceClosedTrades} closed by the clock, not the strategy`
                          : null
                      }
                    />
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Equity curve</div>
                        <div className="panel-title-muted">Cumulative realised P&amp;L, by trading day</div>
                      </div>
                    </div>
                    <EquityCurveChart data={days} />
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">P&amp;L per day</div>
                        <div className="panel-title-muted">Above the line is profit; every bar is labelled</div>
                      </div>
                    </div>
                    <DailyPnlChart data={days} />
                  </div>

                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Open positions</div>
                        <div className="panel-title-muted">Marked to the latest traded premium · refreshes every 30s</div>
                      </div>
                    </div>
                    <RunningTradesTable trades={running} />
                  </div>
                </>
              )}

              {page === 'closed-trades' && <ClosedTradesPage onUnauthorized={logout} />}

              {page === 'webhook-logs' && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Recent webhook calls</div>
                      <div className="panel-title-muted">Latest 30 · refreshes every 30s</div>
                    </div>
                  </div>
                  <WebhookLogsTable logs={webhookLogs} />
                </div>
              )}

              {page === 'positions' && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Symbol positions</div>
                      <div className="panel-title-muted">
                        A symbol stuck off FLAT blocks every new signal for it
                      </div>
                    </div>
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
        <div>
          <div className="panel-title">Closed trades</div>
          <div className="panel-title-muted">
            Premium is what the option cost — P&amp;L comes from it. Index is where BANKNIFTY was.
          </div>
        </div>
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
