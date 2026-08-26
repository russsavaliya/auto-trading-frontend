import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Nothing to show, and that is a normal state — "Flat", "No trades yet". */
export function EmptyState({ icon: Icon, children }) {
  return (
    <div className="text-muted flex flex-col items-center gap-2 py-10 text-center text-[0.8125rem]">
      {Icon && <Icon className="text-faint size-5" strokeWidth={1.75} aria-hidden="true" />}
      <p className="max-w-sm">{children}</p>
    </div>
  );
}

export function LoadingState({ children = 'Loading…' }) {
  return (
    <div
      role="status"
      className="text-muted flex items-center justify-center gap-2.5 py-16 text-[0.8125rem]"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {children}
    </div>
  );
}

/** A request failed. Always visible, never replaces the data already on screen. */
export function ErrorBanner({ children }) {
  return (
    <div
      role="alert"
      className="border-loss-line bg-loss-soft text-loss mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[0.8125rem]"
    >
      <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Standing context the reader needs before trusting any number on the page. */
export function Callout({ tone = 'info', className, children }) {
  const tones = {
    info: 'border-brand-ring bg-brand-soft text-ink-soft',
    warn: 'border-warn-line bg-warn-soft text-ink-soft',
  };
  return (
    <div
      className={cn(
        'mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[0.8125rem] leading-relaxed',
        tones[tone] ?? tones.info,
        className
      )}
    >
      <Info
        className={cn('mt-0.5 size-4 shrink-0', tone === 'warn' ? 'text-warn' : 'text-brand')}
        aria-hidden="true"
      />
      <div>{children}</div>
    </div>
  );
}
