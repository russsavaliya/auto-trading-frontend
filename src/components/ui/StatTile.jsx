import { cn } from '@/lib/cn';

const TONES = {
  good: 'text-profit',
  critical: 'text-loss',
  flat: 'text-ink',
};

/**
 * A single headline number.
 *
 * `hero` enlarges the value for the one figure a screen leads with. `hint`
 * renders a caveat in the warning tone — for things the reader must not miss
 * when reading the number above it, such as trades excluded from a total
 * because their premium could not be determined.
 *
 * Sizing is deliberately not uniform across breakpoints. Four of these stacked
 * one-per-row filled a whole phone screen with four numbers and pushed the
 * open-positions table below two scrolls of whitespace, so on mobile they pair
 * up two-across; the label then has ~125px to live in, which is why it is a
 * step smaller, tracks tighter and is allowed to wrap onto a second line
 * rather than collide with the icon.
 */
export function StatTile({ label, value, tone, sub, hint, icon: Icon, hero = false, className }) {
  return (
    <div
      className={cn(
        'rounded-card border-line bg-surface shadow-card flex flex-col border p-4 sm:p-5',
        hero && 'ring-line/70 ring-1',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
        <span className="text-muted text-[0.625rem] leading-tight font-medium tracking-wide uppercase sm:text-[0.6875rem] sm:tracking-wider">
          {label}
        </span>
        {Icon && (
          <span className="bg-subtle text-muted flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-7">
            <Icon className="size-3 sm:size-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>

      <div
        className={cn(
          'tnum mt-2.5 leading-none font-semibold tracking-tight sm:mt-3',
          hero ? 'text-[1.625rem] sm:text-[2rem]' : 'text-xl sm:text-2xl',
          TONES[tone] ?? 'text-ink'
        )}
      >
        {value}
      </div>

      {sub && <div className="text-muted mt-1.5 text-[0.6875rem] sm:mt-2 sm:text-xs">{sub}</div>}
      {hint && (
        <div className="text-warn mt-1.5 text-[0.625rem] leading-snug sm:mt-2 sm:text-[0.6875rem]">
          {hint}
        </div>
      )}
    </div>
  );
}

export default StatTile;
