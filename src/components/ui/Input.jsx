import { cn } from '@/lib/cn';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'border-line bg-surface text-ink placeholder:text-faint w-full rounded-lg border px-3.5 py-2.5 text-sm',
        'focus:border-brand focus:ring-brand-ring transition-shadow outline-none focus:ring-2',
        className
      )}
      {...props}
    />
  );
}

export function DateInput({ className, ...props }) {
  return (
    <input
      type="date"
      className={cn(
        'border-line bg-surface text-ink-soft rounded-lg border px-2.5 py-1.5 text-xs',
        'focus:border-brand focus:ring-brand-ring outline-none focus:ring-2',
        className
      )}
      {...props}
    />
  );
}
