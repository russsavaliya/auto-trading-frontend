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
export function Topbar({ title, description, lastUpdated, offline, tradingEnabled, onLogout }) {
  const stamp =
    lastUpdated &&
    lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur-md">
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
            <h1 className="text-ink truncate text-sm leading-tight font-semibold tracking-tight sm:text-[0.9375rem]">
              {title}
            </h1>
            <p className="text-muted mt-0.5 hidden truncate text-xs sm:block">{description}</p>
            {stamp && (
              <p className="text-faint tnum mt-0.5 flex items-center gap-1 truncate text-[0.6875rem] sm:hidden">
                <RefreshCw className="size-2.5 shrink-0" aria-hidden="true" />
                {stamp} IST
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {stamp && (
            <span className="text-muted tnum hidden items-center gap-1.5 text-xs lg:inline-flex">
              <RefreshCw className="size-3" aria-hidden="true" />
              {stamp} IST
            </span>
          )}
          <TradingStatus enabled={tradingEnabled} />
          <Button
            size="md"
            onClick={onLogout}
            aria-label="Log out"
            className="size-9 shrink-0 px-0 sm:h-9 sm:w-auto sm:px-3.5"
          >
            <LogOut className="size-4 sm:size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
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
function TradingStatus({ enabled }) {
  const unknown = enabled === null || enabled === undefined;

  return (
    <Link
      to="/settings"
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

export default Topbar;
