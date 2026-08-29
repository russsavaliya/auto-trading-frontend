import { LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { TradingToggle } from './TradingToggle';

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
export function Topbar({ title, description, lastUpdated, offline, onLogout }) {
  const stamp =
    lastUpdated &&
    lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-20 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:py-3 sm:px-6">
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
          <TradingToggle onUnauthorized={onLogout} />
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

export default Topbar;
