import { cn } from '@/lib/cn';

/** Shared tooltip chrome, so both charts read identically on hover. */
export function TooltipCard({ heading, rows, footer }) {
  return (
    <div className="border-line bg-surface shadow-pop min-w-44 rounded-xl border px-3 py-2.5 text-xs">
      <div className="text-ink mb-2 font-semibold">{heading}</div>
      {rows.map((row) => (
        <div key={row.label} className="mt-1 flex items-baseline justify-between gap-6">
          <span className="text-muted">{row.label}</span>
          <strong
            className={cn(
              'tnum font-semibold',
              row.value >= 0 ? 'text-profit' : 'text-loss'
            )}
          >
            {row.display}
          </strong>
        </div>
      ))}
      {footer && (
        <div className="border-line text-muted mt-2 border-t pt-2 text-[0.6875rem]">{footer}</div>
      )}
    </div>
  );
}
