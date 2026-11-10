import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/**
 * `offline` is driven by whether the last poll threw, not by navigator.onLine —
 * what matters to the operator is whether THIS dashboard is still hearing from
 * the bridge, which a browser-level connectivity flag would not catch.
 *
 * The sub-line under the title carries different things at different widths,
 * because what is scarce changes. On a phone the description is a luxury but
 * "is this number stale?" is not — a mark you are about to act on is only as
 * good as its timestamp — so the sub-line shows the last refresh there. From
 * `sm` the description returns and the timestamp moves to its own slot on the
 * right, where there is finally room for both.
 */
export function Topbar({
  title,
  shortTitle,
  description,
  lastUpdated,
  onRefresh,
  offline,
  tradingEnabled,
  mode,
  onModeChange,
  liveAvailable,
  settingsHref = '/settings',
  onLogout,
}) {
  const stamp =
    lastUpdated &&
    lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });

  return (
    <header className="border-line bg-canvas/85 pt-safe sticky top-0 z-20 border-b backdrop-blur-md select-none">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <span
            title={offline ? 'Last refresh failed' : 'Live'}
            className={cn(
              'size-2 shrink-0 rounded-full',
              offline ? 'bg-loss ring-loss/20 ring-4' : 'bg-profit ring-profit/20 ring-4'
            )}
          />
          <div className="min-w-0">
            <h1 className="text-ink truncate text-[1.0625rem] leading-tight font-semibold tracking-tight sm:text-[0.9375rem]">
              {shortTitle ? (
                <>
                  <span className="sm:hidden">{shortTitle}</span>
                  <span className="hidden sm:inline">{title}</span>
                </>
              ) : (
                title
              )}
            </h1>
            <p className="text-muted mt-0.5 hidden truncate text-xs sm:block">{description}</p>
            {stamp && <RefreshStamp stamp={stamp} onRefresh={onRefresh} className="sm:hidden" />}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ModeSwitch mode={mode} onChange={onModeChange} liveAvailable={liveAvailable} />
          {stamp && (
            <RefreshStamp stamp={stamp} onRefresh={onRefresh} large className="hidden lg:inline-flex" />
          )}
          <TradingStatus enabled={tradingEnabled} href={settingsHref} />
          {/* Phone: Log out lives at the bottom of Settings, where apps keep
              it — a header slot is too valuable, and too easy to hit by
              accident, for an action nobody needs mid-session. */}
          <Button
            size="md"
            onClick={onLogout}
            aria-label="Log out"
            className="hidden h-9 shrink-0 px-3.5 sm:inline-flex"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * The last-refresh time, which is also the refresh button. The Home status
 * card used to carry a separate Refresh button; with the card gone the time
 * stamp is the natural place for it — it is the thing that changes when you
 * press it, and it is on every screen. The spinner runs for at least 600ms so
 * a fast reply still visibly happened.
 */
function RefreshStamp({ stamp, onRefresh, large = false, className }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy || !onRefresh) return;
    setBusy(true);
    try {
      await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 600))]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      title="Refresh now"
      aria-label={`Refresh now. Last updated ${stamp} IST`}
      className={cn(
        'text-muted hover:text-ink active:text-ink tnum items-center rounded-md transition-colors disabled:opacity-100',
        large
          ? 'hover:bg-subtle -mx-1 gap-1.5 px-2 py-1 text-xs'
          : 'mt-px -mb-1 -ml-1.5 flex gap-1 px-1.5 py-1 text-[0.6875rem]',
        className
      )}
    >
      <RefreshCw
        className={cn('shrink-0', large ? 'size-3' : 'size-2.5', busy && 'animate-spin')}
        aria-hidden="true"
      />
      {stamp} IST
    </button>
  );
}

/**
 * Read-only. The switch itself now lives on Settings — but the STATE stays
 * here, on every screen, because "the bot silently stopped trading" is the
 * failure this dashboard exists to make impossible to miss, and a kill switch
 * you have to navigate to in order to see is one you will eventually forget to
 * check. Tapping it goes to Settings, where it can actually be changed.
 *
 * `null` means the config read failed. That is shown as its own state rather
 * than defaulting to OFF, because guessing wrong in either direction is worse
 * than saying so: a false "OFF" starts a panic, a false "ON" hides an outage.
 */
function TradingStatus({ enabled, href }) {
  const unknown = enabled === null || enabled === undefined;

  return (
    <Link
      to={href}
      title={
        unknown
          ? 'Could not read the trading status — open Settings'
          : enabled
            ? 'Auto-trading is ON — open Settings to pause'
            : 'Auto-trading is OFF — open Settings to resume'
      }
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[0.6875rem] font-semibold transition-colors',
        'sm:gap-2 sm:px-3 sm:text-xs',
        unknown
          ? 'border-line bg-subtle text-muted hover:bg-subtle-strong'
          : enabled
            ? 'border-profit-line bg-profit-soft text-profit hover:bg-profit/10'
            : 'border-loss-line bg-loss-soft text-loss hover:bg-loss/10'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 shrink-0 rounded-full sm:size-2',
          unknown
            ? 'bg-faint ring-faint/20 ring-[3px] sm:ring-4'
            : enabled
              ? 'bg-profit ring-profit/20 ring-[3px] sm:ring-4'
              : 'bg-loss ring-loss/20 ring-[3px] sm:ring-4'
        )}
      />
      <span className="whitespace-nowrap">
        {unknown ? 'Trading —' : enabled ? 'Trading ON' : 'Trading OFF'}
      </span>
    </Link>
  );
}

/**
 * Paper / Live.
 *
 * A segmented control rather than a toggle, because a toggle has an implied
 * "off" and neither of these is off — they are two environments that both
 * exist and both hold positions. The selected half is filled so the current
 * environment reads from across the room, and live fills in the loss hue: on
 * this dashboard that colour has meant "real consequence" everywhere else, and
 * it should not start meaning something softer here.
 *
 * Live stays clickable even when it is not configured. Hiding it would answer
 * "why can I not see my live trades?" with silence; showing an empty live
 * environment with a Settings prompt answers it properly.
 */
function ModeSwitch({ mode, onChange, liveAvailable }) {
  const isLive = mode === 'live';

  return (
    <div
      role="group"
      aria-label="Trading environment"
      className="border-line bg-subtle flex shrink-0 items-center rounded-full border p-0.5"
    >
      <button
        type="button"
        onClick={() => onChange('paper')}
        aria-pressed={!isLive}
        title="Paper — Upstox sandbox, nothing is really filled"
        className={cn(
          'rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors sm:px-3 sm:text-xs',
          !isLive ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
        )}
      >
        Paper
      </button>
      <button
        type="button"
        onClick={() => onChange('live')}
        aria-pressed={isLive}
        title={
          liveAvailable
            ? 'Live — real orders, real money'
            : 'Live is not switched on yet — open Settings'
        }
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors sm:px-3 sm:text-xs',
          isLive ? 'bg-loss text-canvas shadow-card' : 'text-muted hover:text-ink'
        )}
      >
        Live
        {/* A dot only when live is actually wired up, so "configured" and
            "merely selectable" never look the same. */}
        {liveAvailable && (
          <span
            aria-hidden="true"
            className={cn('size-1.5 rounded-full', isLive ? 'bg-canvas/70' : 'bg-loss')}
          />
        )}
      </button>
    </div>
  );
}

export default Topbar;
