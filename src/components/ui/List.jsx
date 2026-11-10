import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Phone lists — the counterpart of the desktop tables.
 *
 * A record is one row, not a box of label/value pairs: what it is on the
 * left, the number it is about on the right, one quiet line of context under
 * each. Anything more lives one tap away in a Sheet. Ten boxed cards of eight
 * fields each is a page you read; a list of rows is a page you scan, and on a
 * trading screen scanning is the job.
 *
 * Markup is spans, not divs, because a tappable row is a <button>, and a
 * button may only hold phrasing content.
 */

/**
 * One inset panel of rows under an optional heading — a day of trades, a day
 * of signals. Used straight on the page, not inside a Card.
 */
export function ListGroup({ heading, aside, className, children }) {
  return (
    <section className={cn('mb-5 last:mb-0', className)}>
      {heading && (
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <h3 className="text-ink-soft text-[0.8125rem] font-semibold tracking-tight">{heading}</h3>
          {aside && <span className="text-muted tnum text-xs">{aside}</span>}
        </div>
      )}
      <ul className="border-line bg-surface shadow-card divide-line rounded-card divide-y overflow-hidden border">
        {children}
      </ul>
    </section>
  );
}

/** Rows edge to edge inside a Card that already has a header. */
export function FlushList({ className, children }) {
  return <ul className={cn('divide-line divide-y', className)}>{children}</ul>;
}

/** A row. With `onClick` the whole row is the button and a chevron says so. */
export function ListRow({ onClick, className, children }) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">{children}</span>
      {onClick && <ChevronRight className="text-faint -mr-1 size-4 shrink-0" aria-hidden="true" />}
    </>
  );

  return (
    <li>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex min-h-14 w-full items-center gap-2 px-4 py-3 text-left transition-colors',
            'hover:bg-subtle/50 active:bg-subtle',
            className
          )}
        >
          {body}
        </button>
      ) : (
        <span className={cn('flex min-h-14 items-center gap-2 px-4 py-3', className)}>{body}</span>
      )}
    </li>
  );
}

/** The left side of a row: a title line and a detail line. */
export function RowMain({ title, detail }) {
  return (
    <span className="block min-w-0 flex-1">
      <span className="flex min-w-0 items-center gap-2">{title}</span>
      {detail && <span className="text-muted tnum mt-1 block truncate text-xs">{detail}</span>}
    </span>
  );
}

/** The right side of a row: the figure, and a short word under it. */
export function RowEnd({ value, detail, className }) {
  return (
    <span className="block shrink-0 text-right">
      <span className={cn('tnum block text-[0.9375rem] leading-tight font-semibold', className)}>{value}</span>
      {detail && <span className="text-muted mt-1 block text-xs">{detail}</span>}
    </span>
  );
}
