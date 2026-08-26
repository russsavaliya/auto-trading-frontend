import { LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { TradingToggle } from './TradingToggle';

/**
 * `offline` is driven by whether the last poll threw, not by navigator.onLine —
 * what matters to the operator is whether THIS dashboard is still hearing from
 * the bridge, which a browser-level connectivity flag would not catch.
 */
export function Topbar({ title, description, lastUpdated, offline, onLogout }) {
  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-10 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            title={offline ? 'Last refresh failed' : 'Live'}
            className={cn(
              'size-2 shrink-0 rounded-full',
              offline ? 'bg-loss ring-loss/20 ring-4' : 'bg-profit ring-profit/20 ring-4'
            )}
          />
          <div className="min-w-0">
            <h1 className="text-ink truncate text-[0.9375rem] leading-tight font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted mt-0.5 hidden truncate text-xs sm:block">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="text-muted tnum hidden items-center gap-1.5 text-xs lg:inline-flex">
              <RefreshCw className="size-3" aria-hidden="true" />
              {lastUpdated.toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour12: false,
              })}{' '}
              IST
            </span>
          )}
          <TradingToggle onUnauthorized={onLogout} />
          <Button size="md" onClick={onLogout} aria-label="Log out">
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
