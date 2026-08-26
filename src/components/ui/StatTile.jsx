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
 */
export function StatTile({ label, value, tone, sub, hint, icon: Icon, hero = false }) {
  return (
    <div
      className={cn(
        'rounded-card border-line bg-surface shadow-card flex flex-col border p-5',
        hero && 'ring-line/70 ring-1'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted text-[0.6875rem] font-medium tracking-wider uppercase">
          {label}
        </span>
        {Icon && (
          <span className="bg-subtle text-muted flex size-7 items-center justify-center rounded-lg">
            <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>

      <div
        className={cn(
          'tnum mt-3 leading-none font-semibold tracking-tight',
          hero ? 'text-[2rem]' : 'text-2xl',
          TONES[tone] ?? 'text-ink'
        )}
      >
        {value}
      </div>

      {sub && <div className="text-muted mt-2 text-xs">{sub}</div>}
      {hint && <div className="text-warn mt-2 text-[0.6875rem] leading-snug">{hint}</div>}
    </div>
  );
}

export default StatTile;
