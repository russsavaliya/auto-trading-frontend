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
