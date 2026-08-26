import { cn } from '@/lib/cn';

/**
 * The mark: three candles stepping up, the last one carrying a live dot where
 * its wick would break out — the shape of the signal this bridge trades. It is
 * drawn rather than imported so it inherits currentColor and stays sharp at
 * the 28px sidebar size and the 44px login size alike.
 */
export function LogoMark({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Trading Admin"
      className={cn('size-8', className)}
      {...props}
    >
      <rect width="32" height="32" rx="8" className="fill-ink" />
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" className="text-canvas">
        <path d="M9 22.5v-4.5" />
        <path d="M16 22.5v-8.5" />
        <path d="M23 22.5v-13" />
      </g>
      <circle cx="23" cy="7.5" r="2.5" className="fill-chart-profit" />
    </svg>
  );
}

export function Logo({ collapsed = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="size-8 shrink-0" />
      {!collapsed && (
        <span className="min-w-0">
          <span className="text-ink block text-sm leading-tight font-semibold tracking-tight">
            Trading Admin
          </span>
          <span className="text-muted block text-[0.6875rem] leading-tight">
            BANKNIFTY · paper
          </span>
        </span>
      )}
    </div>
  );
}
