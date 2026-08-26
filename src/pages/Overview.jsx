import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, CalendarDays, LineChart, Percent, Wallet, X } from 'lucide-react';
import { StatTile } from '@/components/ui/StatTile';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Callout } from '@/components/ui/Feedback';
import { DateInput } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/Button';
import EquityCurveChart from '@/components/charts/EquityCurveChart';
import DailyPnlChart from '@/components/charts/DailyPnlChart';
import RunningTradesTable from '@/components/tables/RunningTradesTable';
import { formatMoney, tone } from '@/utils/format';

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
      <Callout>
        <strong className="text-ink font-semibold">Paper trading.</strong> Upstox&rsquo;s sandbox
        accepts orders but never fills them, so P&amp;L is marked against real traded option
        premiums with slippage charged on both legs — not broker fills.
      </Callout>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          hero
          icon={Wallet}
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
          icon={CalendarDays}
          label="Today"
          value={summary ? formatMoney(summary.todayPnl) : '—'}
          tone={summary ? tone(summary.todayPnl) : undefined}
          sub="Closed today (IST)"
        />
        <StatTile
          icon={Activity}
          label="Open positions"
          value={summary?.runningTrades ?? 0}
          sub={hasOpen ? `${formatMoney(openPnl)} unrealised` : 'Flat'}
          tone={hasOpen ? tone(openPnl) : undefined}
        />
        <StatTile
          icon={Percent}
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

      <Card className="mb-6">
        <CardHeader
          title="Open positions"
          description="Marked to the latest traded premium · refreshes every 30s"
        />
        <CardBody>
          <RunningTradesTable trades={running} />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader
          title="Equity curve"
          description="Cumulative realised P&L, by trading day"
          actions={
            <span className="text-faint hidden items-center gap-1.5 text-xs sm:inline-flex">
              <LineChart className="size-3.5" aria-hidden="true" />
              Cumulative
            </span>
          }
        />
        <CardBody>
          <EquityCurveChart data={days} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="P&L per day"
          description="Above the line is profit; every bar is labelled"
          actions={
            <div className="flex items-center gap-1.5">
              <DateInput
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="From date"
              />
              <span className="text-faint text-xs">–</span>
              <DateInput
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="To date"
              />
              {hasDateFilter && (
                <IconButton
                  label="Clear date filter"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </IconButton>
              )}
            </div>
          }
        />
        <CardBody>
          <DailyPnlChart
            data={filteredDays}
            emptyMessage={hasDateFilter ? 'No closed trades in this date range.' : undefined}
          />
        </CardBody>
      </Card>
    </>
  );
}
