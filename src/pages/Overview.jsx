import { useCallback, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Activity, ArrowRight, CirclePause, ListChecks, TriangleAlert, Wallet } from 'lucide-react';
import { StatTile } from '@/components/ui/StatTile';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import InstallNudge from '@/components/pwa/InstallNudge';
import { OpenTradesTable, OpenTradesList } from '@/components/tables/RunningTradesTable';
import PositionsTable from '@/components/tables/PositionsTable';
import TradeSheet from '@/components/trades/TradeSheet';
import { useTradingMode } from '@/hooks/useTradingMode';
import { cn } from '@/lib/cn';
import { formatMoney, tone } from '@/utils/format';
import { isTodayIST } from '@/utils/market';

/**
 * Home: three numbers, and whatever is open.
 *
 * There used to be a status card on top ("Market is closed", "Bot is
 * running", last signal). The operator found it said nothing the screen
 * below did not already say, so it is gone. What it used to catch is still
 * caught, each in the one place that already owns it:
 *   - server unreachable  → the red error banner + the header dot (layout);
 *   - bot paused          → the "Trading OFF" chip in the header;
 *   - a symbol jammed     → the "Bot is blocked" card below, only then;
 *   - live not ready      → one alert line, live mode only, only then.
 * Nothing on this screen is there "just in case": a card appears when it
 * has something to say and is absent otherwise.
 */
export default function Overview() {
  const { summary, running, positions, config, isLive } = useOutletContext();
  const { withMode } = useTradingMode();

  const [detail, setDetail] = useState({ open: false, trade: null });
  const showTrade = useCallback((trade) => setDetail({ open: true, trade }), []);
  const hideTrade = useCallback(() => setDetail((d) => ({ ...d, open: false })), []);

  const open = running || [];

  // Marked-to-market across everything open, so a flat-looking day with a
  // large open position is never mistaken for a quiet one.
  const marked = open.filter((t) => t.unrealized_pnl !== null && t.unrealized_pnl !== undefined);
  const openPnl = marked.reduce((sum, t) => sum + Number(t.unrealized_pnl), 0);

  // A symbol off FLAT with no open trade behind it rejects every new signal,
  // silently. During a normal open trade the symbol is off FLAT too — that is
  // not "blocked", and must not read like it.
  const openIds = new Set(open.map((t) => String(t.id)));
  const blocked = (positions || []).filter(
    (p) => p.state !== 'FLAT' && !openIds.has(String(p.current_trade_id))
  );

  // Older backends do not send the net fields; fall back to gross rather than
  // a blank tile, and say which one is on screen.
  const hasNet = summary?.todayNetPnl !== undefined && summary?.todayNetPnl !== null;
  const todayNet = hasNet ? summary.todayNetPnl : summary?.todayPnl;
  const closedToday = summary?.todayTrades ?? 0;

  // Today's trades = closed today + still open from today: the same thing the
  // daily cap counts, so the "/ 2" beside it means what it says.
  const tradesToday = closedToday + open.filter((t) => isTodayIST(t.created_at)).length;
  const cap = config ? Number(config.max_trades_per_day) : null;
  const capReached = cap > 0 && tradesToday >= cap;

  // The sheet shows the latest poll of an open trade, not the copy from when
  // it was tapped — its P&L keeps moving while the sheet is up.
  const sheetTrade = open.find((t) => t.id === detail.trade?.id) ?? detail.trade;

  return (
    <>
      <LiveAlert isLive={isLive} config={config} settingsHref={withMode('/settings')} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-3">
        <StatTile
          hero
          className="col-span-2 lg:col-span-1"
          to={withMode('/report')}
          icon={Wallet}
          label="Today's P&L"
          value={summary ? formatMoney(todayNet) : '—'}
          tone={summary ? tone(todayNet) : undefined}
          sub={
            !summary
              ? 'Loading…'
              : closedToday === 0
                ? 'No trade closed yet'
                : `${closedToday} closed` +
                  (hasNet && summary.todayCharges
                    ? ` · ${formatMoney(summary.todayCharges, { showSign: false })} charges paid`
                    : '')
          }
          hint={summary && !hasNet ? 'Before charges — see Report' : null}
        />
        <StatTile
          to={withMode('/closed-trades')}
          icon={ListChecks}
          label="Today's trades"
          value={summary ? tradesToday : '—'}
          suffix={cap > 0 ? `/ ${cap}` : null}
          sub={
            cap === null ? 'Closed and open' : cap === 0 ? 'No daily limit' : capReached ? 'Limit reached' : 'Daily limit'
          }
          subTone={capReached ? 'warn' : undefined}
        />
        <StatTile
          icon={Activity}
          label="Open positions"
          value={open.length}
          sub={
            open.length === 0
              ? 'No open trade'
              : marked.length
                ? `${formatMoney(openPnl)} right now`
                : 'Price updating'
          }
          subTone={open.length && marked.length ? tone(openPnl) : undefined}
        />
      </div>

      {blocked.length > 0 && (
        <Card className="border-warn-line mb-5 sm:mb-6">
          <CardHeader
            className="bg-warn-soft border-warn-line"
            title={
              <span className="flex items-center gap-2">
                <TriangleAlert className="text-warn size-4 shrink-0" aria-hidden="true" />
                Bot is blocked
              </span>
            }
            description={`${blocked[0].symbol} is marked ${blocked[0].state} but no trade is open. New signals are ignored until this is fixed.`}
          />
          <CardBody>
            <PositionsTable positions={blocked} />
          </CardBody>
        </Card>
      )}

      {open.length > 0 && (
        <Card className="mb-5 sm:mb-6">
          <CardHeader
            title="Open positions"
            description="Marked to the latest option price · tap a trade for details"
          />
          <CardBody className="hidden md:block">
            <OpenTradesTable trades={open} onSelect={showTrade} />
          </CardBody>
          <OpenTradesList trades={open} onSelect={showTrade} />
        </Card>
      )}

      <InstallNudge />

      <Link
        to={withMode('/report')}
        className="border-line bg-surface shadow-card hover:border-line-strong active:bg-subtle/60 rounded-card flex items-center justify-between gap-3 border px-4 py-3.5 transition-colors sm:px-5"
      >
        <span className="min-w-0">
          <span className="text-ink block text-[0.875rem] font-semibold">Full report</span>
          <span className="text-muted mt-0.5 block text-xs">
            All-time profit, charges and what is actually left
          </span>
        </span>
        <ArrowRight className="text-ink-soft size-4 shrink-0" aria-hidden="true" />
      </Link>

      <TradeSheet trade={sheetTrade} open={detail.open} onClose={hideTrade} />
    </>
  );
}

/**
 * Live mode only, and only when live cannot trade. Paper never needs it: its
 * one failure mode — paused — is already the red chip in the header.
 */
function LiveAlert({ isLive, config, settingsHref }) {
  if (!isLive || !config) return null;

  if (!config.live?.enabled) {
    return (
      <Alert tone="neutral" icon={CirclePause} title="Live trading is off">
        Real orders are switched off on the server.
      </Alert>
    );
  }

  if (config.live.token?.state !== 'valid') {
    return (
      <Alert
        tone="warn"
        icon={TriangleAlert}
        title="Upstox is not connected"
        action={
          <Link
            to={settingsHref}
            className="bg-ink text-canvas shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold active:opacity-80"
          >
            Connect
          </Link>
        }
      >
        Connect before 9:15 so live orders can go out.
      </Alert>
    );
  }

  return null;
}

function Alert({ tone: t, icon: Icon, title, action, children }) {
  return (
    <div
      role="status"
      className={cn(
        'mb-4 flex items-center gap-3 rounded-xl border px-4 py-3',
        t === 'warn' ? 'border-warn-line bg-warn-soft' : 'border-line bg-subtle'
      )}
    >
      <Icon
        className={cn('size-5 shrink-0', t === 'warn' ? 'text-warn' : 'text-ink-soft')}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="text-ink block text-[0.8125rem] font-semibold">{title}</span>
        <span className="text-ink-soft mt-0.5 block text-xs leading-snug">{children}</span>
      </span>
      {action}
    </div>
  );
}
