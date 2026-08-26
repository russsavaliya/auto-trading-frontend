import { cn } from '@/lib/cn';

const VARIANTS = {
  call: 'bg-side-call-soft text-side-call ring-side-call/15',
  put: 'bg-side-put-soft text-side-put ring-side-put/15',
  profit: 'bg-profit-soft text-profit ring-profit/15',
  loss: 'bg-loss-soft text-loss ring-loss/15',
  warn: 'bg-warn-soft text-warn ring-warn/20',
  neutral: 'bg-subtle text-ink-soft ring-line-strong/60',
  brand: 'bg-brand-soft text-brand ring-brand/15',
};

/**
 * A short status word — a side, an outcome, a state-machine value.
 *
 * `ghost` drops the tint and keeps only the outline: used for an EXIT signal,
 * which should read as the same side as the entry it closes but with less
 * weight, so a column of them does not compete with the entries.
 */
export function Badge({ variant = 'neutral', ghost = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] leading-5 font-semibold whitespace-nowrap ring-1 ring-inset',
        VARIANTS[variant] ?? VARIANTS.neutral,
        ghost && 'bg-transparent',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * A small provenance marker sitting beside a value — "marked", "open pending",
 * the timestamp a price came from. Never the only carrier of meaning: it
 * qualifies the number next to it, it does not replace it.
 */
export function InlineFlag({ tone = 'neutral', title, className, children }) {
  return (
    <span
      title={title}
      className={cn(
        'ml-1.5 inline-block rounded px-1.5 py-px align-middle text-[0.625rem] font-medium whitespace-nowrap',
        tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-subtle text-muted',
        className
      )}
    >
      {children}
    </span>
  );
}
