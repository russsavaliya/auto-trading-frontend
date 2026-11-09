import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The one container every panel on the dashboard uses.
 *
 * On a #fafaf9 canvas a white card only separates from the page by a hairline
 * plus a very soft shadow — anything heavier looks muddy against warm-neutral
 * paper. Elevation is therefore fixed here rather than passed in, so no screen
 * can end up with cards at three different depths.
 */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface shadow-card overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * `title` is the panel's name; `description` is the one line that stops the
 * contents being misread (what a number is measured against, how often it
 * refreshes). `actions` sits on the right — filters, counts, controls.
 *
 * Below `sm` the header stacks and the actions take the full width instead of
 * wrapping onto a ragged second line. Two date inputs and a clear button
 * squeezed against the right edge of a 360px card is how the P&L filter used
 * to render: each control ~90px wide, none of them a real tap target.
 */
export function CardHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        'border-line flex flex-col gap-3 border-b px-4 py-3.5',
        'sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-4 sm:px-5 sm:py-4',
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-ink text-[0.9375rem] leading-tight font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-muted mt-1 text-xs leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * A card that starts closed and opens on tap — for reference material that
 * explains a setting rather than being one. On a phone, two screens of
 * rationale between the switches and the bottom of the page is what made
 * Settings read like a document instead of an app.
 *
 * Built on <details>, so it opens without JavaScript and is keyboard- and
 * screen-reader-operable for free.
 */
export function CollapsibleCard({ title, description, className, children }) {
  return (
    <details
      className={cn(
        'group rounded-card border border-line bg-surface shadow-card overflow-hidden',
        className
      )}
    >
      <summary className="active:bg-subtle hover:bg-subtle/50 flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 select-none sm:px-5 sm:py-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h2 className="text-ink text-[0.9375rem] leading-tight font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-muted mt-1 text-xs leading-relaxed">{description}</p>
          )}
        </div>
        <ChevronDown
          className="text-muted mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-line border-t">{children}</div>
    </details>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  );
}
