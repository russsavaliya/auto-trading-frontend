import { cn } from '@/lib/cn';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        // text-base on mobile stops iOS zooming the viewport on focus.
        'border-line bg-surface text-ink placeholder:text-faint w-full rounded-lg border px-3.5 py-2.5 text-base sm:text-sm',
        'focus:border-brand focus:ring-brand-ring transition-shadow outline-none focus:ring-2',
        className
      )}
      {...props}
    />
  );
}

/**
 * h-9 below `sm` is not decoration: a 26px-tall date field is under the 44px
 * touch minimum, and iOS additionally zooms the whole page in when a focused
 * control's text is under 16px — so the type steps up with the box. From `sm`
 * it returns to the compact size the card header was designed around.
 */
export function DateInput({ className, ...props }) {
  return (
    <input
      type="date"
      className={cn(
        'border-line bg-surface text-ink-soft h-9 rounded-lg border px-2.5 text-[0.8125rem]',
        'sm:h-auto sm:py-1.5 sm:text-xs',
        'focus:border-brand focus:ring-brand-ring outline-none focus:ring-2',
        className
      )}
      {...props}
    />
  );
}
