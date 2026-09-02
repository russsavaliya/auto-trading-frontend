import { cn } from '@/lib/cn';

/**
 * A labelled on/off control for the Settings page.
 *
 * Built on a real `<button role="switch">` rather than a styled checkbox: the
 * three settings this backs each cost money when they are wrong, and
 * `aria-checked` plus a visible pressed state is what lets a screen reader and
 * a glance agree on which way it is set.
 *
 * `tone="danger"` is for the kill switch. Everything else on the page is a
 * preference; that one stops the system trading, so it does not get to look
 * like the others.
 */
export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  tone = 'neutral',
  id,
}) {
  const on = checked === true;
  const unknown = checked === null || checked === undefined;

  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="text-ink block text-[0.8125rem] leading-tight font-medium"
        >
          {label}
        </label>
        {description && (
          <p className="text-muted mt-1 text-xs leading-relaxed">{description}</p>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={unknown ? 'false' : on}
        aria-label={label}
        disabled={disabled || unknown}
        onClick={() => onChange(!on)}
        className={cn(
          // 44px of tappable height around a 24px track — the track alone is
          // under the touch minimum on a phone.
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
          'transition-colors duration-150 outline-offset-2',
          'after:absolute after:-inset-y-2.5 after:-inset-x-1 after:content-[""]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          on
            ? tone === 'danger'
              ? 'bg-profit'
              : 'bg-ink'
            : tone === 'danger'
              ? 'bg-loss'
              : 'bg-line-strong'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'bg-surface pointer-events-none inline-block size-5 rounded-full shadow-sm',
            'transition-transform duration-150',
            on ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

/** A number field with units, for the two numeric settings. */
export function NumberField({ id, label, description, value, onChange, min, max, suffix, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-ink block text-[0.8125rem] leading-tight font-medium">
          {label}
        </label>
        {description && <p className="text-muted mt-1 text-xs leading-relaxed">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'border-line bg-surface text-ink tnum h-9 w-20 rounded-lg border px-2.5 text-center text-sm',
            'focus:border-brand focus:ring-brand-ring outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
        {suffix && <span className="text-muted shrink-0 text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

export default Switch;
