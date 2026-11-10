import { cn } from '@/lib/cn';

/**
 * The shared trade-table shell — desktop and tablet only.
 *
 * Wide tables scroll inside their own card rather than pushing the page
 * sideways: every trade table here has 10+ columns and none of them can be
 * dropped without losing the reason the table exists.
 *
 * That trade-off stops working on a phone. Twelve columns inside 300px means
 * the reader is dragging a 3x-wide surface back and forth to compare two
 * numbers on the same row, with the row identity scrolled off-screen the
 * whole time. So below `md` the tables are not rendered at all — each table
 * component renders a phone list of the same records instead (rows from
 * components/ui/List.jsx, or the record cards further down this file). Same
 * data, same formatters; only the arrangement changes.
 */
export function Table({ className, children }) {
  return (
    <div className="scroll-x -mx-4 -mb-4 hidden px-4 pb-4 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5 md:block">
      <table className={cn('tnum w-full border-collapse text-[0.8125rem]', className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TR({ className, warn = false, children, ...props }) {
  return (
    <tr
      className={cn(
        'border-line border-b transition-colors last:border-b-0',
        warn ? 'bg-warn-soft hover:bg-warn-soft/70' : 'hover:bg-subtle/70',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

/** `num` right-aligns so magnitudes can be compared down a column at a glance. */
export function TH({ num = false, className, children }) {
  return (
    <th
      scope="col"
      className={cn(
        'text-muted border-line border-b px-2.5 py-2 text-[0.6875rem] font-medium tracking-wide whitespace-nowrap uppercase',
        num ? 'text-right' : 'text-left',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TD({ num = false, dim = false, nowrap = false, className, children, ...props }) {
  return (
    <td
      className={cn(
        'px-2.5 py-2.5 align-middle',
        num ? 'text-right' : 'text-left',
        dim ? 'text-muted' : 'text-ink-soft',
        nowrap && 'whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** The sign and the colour always agree, and the sign leads. */
function moneyTone(value) {
  if (value == null) return 'text-ink';
  return value > 0 ? 'text-profit' : value < 0 ? 'text-loss' : 'text-ink';
}

/** A P&L cell. */
export function MoneyTD({ value, children, className, ...props }) {
  return (
    <TD num className={cn('font-semibold', value == null ? '' : moneyTone(value), className)} {...props}>
      {children}
    </TD>
  );
}

export function Dash() {
  return <span className="text-faint">—</span>;
}

/* ==========================================================================
   Mobile record cards
   --------------------------------------------------------------------------
   A record as a small inset panel of labelled fields. The busy lists —
   trades, open positions, signals, days — moved to the row primitives in
   components/ui/List.jsx, with the full detail one tap away in a Sheet. What
   remains here serves the symbol-state card, which only appears when a
   symbol is jammed and is read field by field rather than scanned.

   The rules every card follows:
     - identity and state on the same first line, so no scroll separates them;
     - each value carries its own label, since no column header sits above;
     - fields in the same order as the desktop columns.
   ========================================================================== */

/**
 * One column on a phone, two from `sm`. The 640-767px band is a landscape
 * phone or a small tablet: still too narrow for a 12-column table, but wide
 * enough that a single column of records leaves half the card empty.
 */
export function CardList({ className, children }) {
  return (
    <ul className={cn('grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:hidden', className)}>
      {children}
    </ul>
  );
}

/** One record. `warn` mirrors the table row's warning tint. */
export function RecordCard({ warn = false, className, children }) {
  return (
    <li
      className={cn(
        'rounded-xl border p-3',
        warn ? 'border-warn-line bg-warn-soft' : 'border-line bg-subtle/45',
        className
      )}
    >
      {children}
    </li>
  );
}

/**
 * The record's first line: what it is on the left, the figure it is about on
 * the right. `trail` is deliberately not wrapped — a P&L that breaks across
 * two lines stops being scannable down the list.
 */
export function RecordHead({ lead, trail, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2">{lead}</div>
      {trail != null && <div className="shrink-0 text-right">{trail}</div>}
    </div>
  );
}

/** The timing line under the head: opened/closed, held for, received at. */
export function RecordMeta({ className, children }) {
  return (
    <p className={cn('text-muted tnum mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs', className)}>
      {children}
    </p>
  );
}

/**
 * Label-above-value pairs. Two columns at 360px is the most that keeps a
 * label like "Premium out" on one line; `cols={3}` is for short numeric
 * fields only.
 */
export function FieldGrid({ cols = 2, className, children }) {
  return (
    <dl
      className={cn(
        'border-line mt-2.5 grid gap-x-3 gap-y-2 border-t pt-2.5',
        cols === 3 ? 'grid-cols-3' : 'grid-cols-2',
        className
      )}
    >
      {children}
    </dl>
  );
}

/**
 * A name over its value. The name is set darker than the value — the
 * operator's call, and the right one: pale-grey caps were the hardest text on
 * the phone to read, and the name is what you scan for. The value keeps the
 * larger size, so it still carries the weight.
 */
export function Field({ label, dim = false, className, children }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-ink text-[0.6875rem] font-semibold">{label}</dt>
      {/* Wraps rather than truncates: a value can carry an InlineFlag after it
          ("marked", the mark's candle time), and in a ~125px column clipping
          the flag would silently drop the caveat while leaving the number
          looking authoritative. A second line is the cheaper failure. */}
      <dd
        className={cn(
          'tnum mt-0.5 text-[0.8125rem] leading-snug break-words',
          dim ? 'text-muted' : 'text-ink-soft'
        )}
      >
        {children}
      </dd>
    </div>
  );
}
