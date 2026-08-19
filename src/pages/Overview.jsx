import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatTile from '../components/StatTile';
import EquityCurveChart from '../components/EquityCurveChart';
import DailyPnlChart from '../components/DailyPnlChart';
import RunningTradesTable from '../components/RunningTradesTable';
import { formatMoney, tone } from '../utils/format';

export default function Overview() {
  const { summary, days, running } = useOutletContext();

  // Date keys from /api/pnl/daily are 'YYYY-MM-DD', same shape as a native
  // date input's value, so a plain string comparison is a valid range filter.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const hasDateFilter = Boolean(dateFrom || dateTo);

  const filteredDays = useMemo(() => {
    if (!days || !hasDateFilter) return days;
    return days.filter((d) => (!dateFrom || d.date >= dateFrom) && (!dateTo || d.date <= dateTo));
  }, [days, dateFrom, dateTo, hasDateFilter]);

  // Marked-to-market exposure across everything currently open. Shown beside
  // realised P&L so the headline number is never mistaken for the whole story.
  const openPnl = (running || []).reduce(
    (sum, t) => (t.unrealized_pnl == null ? sum : sum + Number(t.unrealized_pnl)),
    0
  );
  const hasOpen = (running || []).length > 0;

  return (
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
            <div className="panel-title">Open positions</div>
            <div className="panel-title-muted">Marked to the latest traded premium · refreshes every 30s</div>
          </div>
        </div>
        <RunningTradesTable trades={running} />
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
          <div className="date-filter">
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />
            <span className="date-filter-sep">–</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />
            {hasDateFilter && (
              <button
                type="button"
                className="date-filter-clear"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                title="Clear date filter"
                aria-label="Clear date filter"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <DailyPnlChart
          data={filteredDays}
          emptyMessage={hasDateFilter ? 'No closed trades in this date range.' : undefined}
        />
      </div>
    </>
  );
}
