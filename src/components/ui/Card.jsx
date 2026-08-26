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
 */
export function CardHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line px-5 py-4',
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
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}
