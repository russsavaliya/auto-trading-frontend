import { cn } from '@/lib/cn';

/**
 * The shared trade-table shell.
 *
 * Wide tables scroll inside their own card rather than pushing the page
 * sideways — every trade table here has 10+ columns and none of them can be
 * dropped without losing the reason the table exists.
 */
export function Table({ className, children }) {
  return (
    <div className="scroll-x -mx-5 -mb-5 px-5 pb-5">
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

/** A P&L cell: the sign and the colour always agree, and the sign leads. */
export function MoneyTD({ value, children, className, ...props }) {
  const tone = value == null ? '' : value > 0 ? 'text-profit' : value < 0 ? 'text-loss' : 'text-ink';
  return (
    <TD num className={cn('font-semibold', tone, className)} {...props}>
      {children}
    </TD>
  );
}

export function Dash() {
  return <span className="text-faint">—</span>;
}
