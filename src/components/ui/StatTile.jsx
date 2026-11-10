import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

const TONES = {
  good: 'text-profit',
  critical: 'text-loss',
  flat: 'text-ink',
};

const SUB_TONES = {
  good: 'text-profit',
  critical: 'text-loss',
  warn: 'text-warn',
};

/**
 * One headline number.
 *
 * The label sits in a darker ink than the old uppercase micro-label: it is
 * what the eye uses to find the right tile, and pale-grey caps at 10px were
 * the hardest thing on the Home screen to read in daylight.
 *
 * `suffix` qualifies the value in a lighter, smaller face — "2 / 2" for a
 * count against its limit. `to` makes the whole tile a link to the screen
 * that explains the number. `hero` enlarges the one figure a screen leads
 * with. `hint` is a caveat in the warning tone that must not be missed.
 */
export function StatTile({
  label,
  value,
  suffix,
  tone,
  sub,
  subTone,
  hint,
  icon: Icon,
  to,
  hero = false,
  className,
}) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-ink-soft text-[0.8125rem] leading-tight font-semibold">{label}</span>
        {Icon && (
          <span className="bg-subtle text-ink-soft flex size-7 shrink-0 items-center justify-center rounded-lg">
            <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </span>

      <span className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            'tnum leading-none font-semibold tracking-tight',
            hero ? 'text-[2rem]' : 'text-[1.625rem] sm:text-[1.75rem]',
            TONES[tone] ?? 'text-ink'
          )}
        >
          {value}
        </span>
        {suffix && <span className="text-muted tnum text-sm font-medium">{suffix}</span>}
      </span>

      {sub && (
        <span className={cn('tnum mt-2 block text-xs', SUB_TONES[subTone] ?? 'text-muted')}>{sub}</span>
      )}
      {hint && <span className="text-warn mt-1.5 block text-[0.6875rem] leading-snug">{hint}</span>}
    </>
  );

  const shell = cn(
    'rounded-card border-line bg-surface shadow-card flex flex-col border p-4 sm:p-5',
    to && 'hover:border-line-strong active:bg-subtle/60 transition-colors',
    className
  );

  return to ? (
    <Link to={to} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

export default StatTile;
