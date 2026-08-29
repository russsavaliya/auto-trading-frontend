import { cn } from '@/lib/cn';

const VARIANTS = {
  // The ink fill is the single "do the thing" button — sign in, submit.
  primary:
    'bg-ink text-canvas hover:bg-ink-soft active:bg-ink disabled:bg-faint shadow-card',
  // Everything reversible: pagination, log out, clear a filter.
  secondary:
    'bg-surface text-ink-soft border border-line hover:bg-subtle hover:border-line-strong active:bg-subtle-strong',
  ghost: 'text-muted hover:bg-subtle hover:text-ink',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-[0.8125rem] gap-2',
  lg: 'h-11 w-full px-4 text-sm gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant] ?? VARIANTS.secondary,
        SIZES[size] ?? SIZES.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * A square button that holds only an icon — needs its own label for a11y.
 *
 * 36px on touch, 28px from `sm`. The small size reads correctly next to
 * compact controls with a mouse; with a thumb it is a miss waiting to happen.
 */
export function IconButton({ label, className, children, ...props }) {
  return (
    <Button
      aria-label={label}
      title={label}
      className={cn('size-9 shrink-0 rounded-full px-0 sm:size-7', className)}
      {...props}
    >
      {children}
    </Button>
  );
}
