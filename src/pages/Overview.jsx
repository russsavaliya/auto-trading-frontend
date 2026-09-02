import { useOutletContext, Link } from 'react-router-dom';
import { Activity, ArrowRight, CalendarDays, Target } from 'lucide-react';
import { StatTile } from '@/components/ui/StatTile';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Callout } from '@/components/ui/Feedback';
import RunningTradesTable from '@/components/tables/RunningTradesTable';
import PositionsTable from '@/components/tables/PositionsTable';
import { formatMoney, tone } from '@/utils/format';

/**
 * "What is happening right now" — and deliberately nothing else.
 *
 * This page used to carry the equity curve, the per-day bar chart, the
 * all-time realised total and a date-range filter. All of that is history, not
 * live state: it answers "how am I doing" on a screen someone opens to answer
 * "what is open". It now lives on Report, where the same numbers can be shown
 * net of costs instead of gross.
 *
 * What stays is only what changes during a session: today's result, what is
 * open, and whether any symbol is jammed off FLAT.
 */
export default function Overview() {
  const { summary, running, positions } = useOutletContext();

  // Marked-to-market exposure across everything currently open. Shown beside
  // today's result so a flat-looking day with a large open position is never
  // mistaken for a quiet one.
  const openPnl = (running || []).reduce(
    (sum, t) => (t.unrealized_pnl == null ? sum : sum + Number(t.unrealized_pnl)),
    0
  );
  const hasOpen = (running || []).length > 0;
  const stuck = (positions || []).filter((p) => p.state !== 'FLAT').length;

  // Older backends do not send the net fields; fall back to gross rather than
  // rendering a blank tile, and say which one is on screen either way.
  const todayNet = summary?.todayNetPnl ?? summary?.todayPnl;
  const hasNet = summary?.todayNetPnl !== undefined && summary?.todayNetPnl !== null;

  return (
    <>
      <Callout>
        <strong className="text-ink font-semibold">Paper trading.</strong> Upstox&rsquo;s sandbox
        accepts orders but never fills them, so P&amp;L is marked against real traded option
        premiums with slippage charged on both legs — not broker fills.
      </Callout>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-3">
        <StatTile
          hero
          className="col-span-2 lg:col-span-1"
          icon={CalendarDays}
          label={hasNet ? 'Today · net' : 'Today · gross'}
          value={summary ? formatMoney(todayNet) : '—'}
          tone={summary ? tone(todayNet) : undefined}
          sub={
            summary
              ? `${summary.todayTrades ?? 0} closed today` +
                (hasNet && summary.todayCharges
                  ? ` · ${formatMoney(summary.todayCharges, { showSign: false })} costs`
                  : '')
              : 'Closed today (IST)'
          }
          hint={hasNet ? null : 'Costs not counted — see Report'}
        />
        <StatTile
          icon={Activity}
          label="Open positions"
          value={summary?.runningTrades ?? 0}
          sub={hasOpen ? `${formatMoney(openPnl)} unrealised` : 'Flat'}
          tone={hasOpen ? tone(openPnl) : undefined}
        />
        <StatTile
          icon={Target}
          label="Symbols held"
          value={stuck}
          sub={stuck ? 'Off FLAT — blocking new signals' : 'All flat'}
          tone={stuck ? 'flat' : undefined}
        />
      </div>

      <Card className="mb-5 sm:mb-6">
        <CardHeader
          title="Open positions"
          description="Marked to the latest traded premium · refreshes every 30s"
        />
        <CardBody>
          <RunningTradesTable trades={running} />
        </CardBody>
      </Card>

      <Card className="mb-5 sm:mb-6">
        <CardHeader
          title="Symbol state"
          description="A symbol stuck off FLAT blocks every new signal for it"
        />
        <CardBody>
          <PositionsTable positions={positions} />
        </CardBody>
      </Card>

      {/* The one pointer off this page. Everything historical moved to Report,
          and a reader who wants the totals should not have to hunt the nav. */}
      <Link
        to="/report"
        className="border-line bg-surface shadow-card hover:border-line-strong hover:bg-subtle/50 flex items-center justify-between gap-3 rounded-card border px-4 py-3.5 transition-colors sm:px-5"
      >
        <div className="min-w-0">
          <div className="text-ink text-[0.8125rem] font-semibold">Full report</div>
          <p className="text-muted mt-0.5 text-xs">
            All-time gross, what it cost, and what is actually left
          </p>
        </div>
        <ArrowRight className="text-muted size-4 shrink-0" aria-hidden="true" />
      </Link>
    </>
  );
}
