import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  CircleCheck,
  CirclePause,
  Loader2,
  Moon,
  RefreshCw,
  TriangleAlert,
  WifiOff,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatContract, formatMoney, formatTime, tone } from '@/utils/format';
import { glossReason, logOutcome, signalLabel } from '@/utils/signals';
import { isMarketHours, isTodayIST } from '@/utils/market';

/**
 * The first thing on the Home screen: one sentence that says whether the bot
 * is working, then the three facts that back it up. Built to be read at a
 * glance on a phone by someone who has not memorised what every table means.
 *
 * The headline is a priority list, not a summary: the most urgent true thing
 * wins. Not reaching the server outranks everything (every other line would
 * be stale), and an open trade outranks "paused" because money is at stake
 * either way.
 */

const TONES = {
  profit: { box: 'bg-profit-soft border-profit-line', icon: 'bg-profit text-canvas', text: 'text-profit' },
  brand: { box: 'bg-brand-soft border-brand-ring', icon: 'bg-brand text-canvas', text: 'text-brand' },
  loss: { box: 'bg-loss-soft border-loss-line', icon: 'bg-loss text-canvas', text: 'text-loss' },
  warn: { box: 'bg-warn-soft border-warn-line', icon: 'bg-warn text-canvas', text: 'text-warn' },
  neutral: { box: 'bg-subtle border-line', icon: 'bg-ink text-canvas', text: 'text-ink' },
};

function headline({ offline, config, running, positions, isLive }) {
  if (offline)
    return { tone: 'loss', icon: WifiOff, title: "Can't reach the bot", sub: 'The server is not answering. What you see below may be old.' };
  if (!config) return { tone: 'neutral', icon: Loader2, spin: true, title: 'Checking the bot…', sub: 'Reading its settings.' };

  const open = running || [];
  if (open.length) {
    const t = open[0];
    const side = t.signal_type?.startsWith('PUT') ? 'PUT' : 'CALL';
    const contract = formatContract(t);
    const now = t.unrealized_pnl == null ? 'price updating' : `${formatMoney(t.unrealized_pnl)} right now`;
    return {
      tone: 'brand',
      icon: Zap,
      title: open.length > 1 ? `In ${open.length} trades` : 'In a trade',
      sub: [side, contract, now].filter(Boolean).join(' · '),
    };
  }

  const stuck = (positions || []).find((p) => p.state !== 'FLAT');
  if (stuck)
    return {
      tone: 'warn',
      icon: TriangleAlert,
      title: 'Bot is blocked',
      sub: `${stuck.symbol} is marked ${stuck.state} but no trade is open. New signals are ignored until this is fixed.`,
    };

  if (isLive && !config.live?.enabled)
    return { tone: 'neutral', icon: CirclePause, title: 'Live trading is off', sub: 'Real orders are switched off on the server.' };

  if (config.trading_enabled === false)
    return { tone: 'loss', icon: CirclePause, title: 'Bot is paused', sub: 'It will not open new trades. Turn it on in Settings.' };

  if (isLive && config.live?.token?.state !== 'valid')
    return { tone: 'warn', icon: TriangleAlert, title: 'Upstox not connected', sub: 'Connect in Settings before 9:15 so live trades can go out.' };

  if (!isMarketHours())
    return { tone: 'neutral', icon: Moon, title: 'Market is closed', sub: 'The bot starts again at 9:15 on the next trading day.' };

  return { tone: 'profit', icon: CircleCheck, title: 'Bot is running', sub: 'Waiting for the next signal from TradingView.' };
}

export default function BotStatusCard({
  config,
  running,
  positions,
  summary,
  webhookLogs,
  isLive,
  offline,
  lastUpdated,
  onRefresh,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const h = headline({ offline, config, running, positions, isLive });
  const t = TONES[h.tone];
  const Icon = h.icon;

  const todayNet = summary?.todayNetPnl ?? summary?.todayPnl;
  const todayTrades = summary?.todayTrades ?? 0;

  const last = webhookLogs?.[0];
  const token = config?.live?.token;

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section
      aria-label="Bot status"
      className="border-line bg-surface shadow-card rounded-card mb-5 overflow-hidden border sm:mb-6"
    >
      <div className={cn('flex items-start gap-3.5 border-b px-4 py-4 sm:px-5', t.box)}>
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', t.icon)}>
          <Icon className={cn('size-5', h.spin && 'animate-spin')} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className={cn('text-lg leading-tight font-semibold tracking-tight', t.text)}>{h.title}</h2>
          <p className="text-ink-soft mt-1 text-[0.8125rem] leading-snug">{h.sub}</p>
        </div>
      </div>

      <ul className="divide-line divide-y">
        <Row to="/report" label="Today">
          <span className={cn('tnum font-semibold', summary ? toneClass(todayNet) : 'text-muted')}>
            {summary ? formatMoney(todayNet) : '—'}
          </span>
          <span className="text-muted">
            {' · '}
            {todayTrades} {todayTrades === 1 ? 'trade' : 'trades'}
          </span>
        </Row>

        <Row to="/webhook-logs" label="Last signal">
          {last ? <LastSignal log={last} /> : <span className="text-muted">No signals yet</span>}
        </Row>

        {isLive && (
          <Row to="/settings" label="Upstox">
            {token?.state === 'valid' ? (
              <span className={cn('font-medium', token.hoursLeft < 3 ? 'text-warn' : 'text-profit')}>
                Connected · {Math.max(0, Math.floor(token.hoursLeft))}h left
              </span>
            ) : (
              <span className="text-loss font-medium">Not connected — tap to connect</span>
            )}
          </Row>
        )}
      </ul>

      <div className="border-line bg-subtle/40 flex items-center justify-between gap-3 border-t px-4 py-2 sm:px-5">
        <span className="text-faint tnum text-[0.6875rem]">
          {lastUpdated ? `Updated ${formatClock(lastUpdated.toISOString())} · refreshes every 30s` : 'Not updated yet'}
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="text-ink-soft active:bg-subtle-strong -mr-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
        >
          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} aria-hidden="true" />
          Refresh
        </button>
      </div>
    </section>
  );
}

function toneClass(n) {
  const v = tone(n);
  return v === 'good' ? 'text-profit' : v === 'critical' ? 'text-loss' : 'text-ink';
}

function Row({ to, label, children }) {
  return (
    <li>
      <Link
        to={to}
        className="active:bg-subtle hover:bg-subtle/50 flex min-h-12 items-center gap-3 px-4 py-2.5 transition-colors sm:px-5"
      >
        <span className="text-muted w-20 shrink-0 text-xs font-medium">{label}</span>
        <span className="min-w-0 flex-1 text-[0.8125rem] leading-snug">{children}</span>
        <ChevronRight className="text-faint size-4 shrink-0" aria-hidden="true" />
      </Link>
    </li>
  );
}

function LastSignal({ log }) {
  const { processed, reason } = logOutcome(log);
  const gloss = glossReason(reason);
  const when = isTodayIST(log.received_at) ? formatClock(log.received_at) : formatTime(log.received_at);

  let result;
  if (processed) result = <span className="text-profit font-medium">Trade placed</span>;
  else if (!gloss) result = <span className="text-warn">Being processed</span>;
  else result = <span className={gloss[1] ? 'text-loss' : 'text-muted'}>{gloss[0]}</span>;

  return (
    <>
      <span className="text-ink font-medium">
        {signalLabel(log.raw_payload?.signal_type)} · {when}
      </span>
      <span className="block text-xs">{result}</span>
    </>
  );
}
