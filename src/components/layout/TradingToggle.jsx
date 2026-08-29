import { useCallback, useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { fetchConfig, updateTradingEnabled } from '@/api';
import { cn } from '@/lib/cn';

const POLL_MS = 30_000;

/**
 * The header kill switch. Polls app_config.trading_enabled independently of
 * whatever page is open, since it can also be flipped directly in Supabase —
 * the button must reflect that within one poll, not just its own clicks.
 */
export function TradingToggle({ onUnauthorized }) {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetchConfig()
      .then((res) => setEnabled(res.trading_enabled))
      .catch((err) => {
        if (err.status === 401) onUnauthorized();
      });
  }, [onUnauthorized]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function handleClick() {
    if (enabled === null || busy) return;
    const next = !enabled;
    setBusy(true);
    try {
      const res = await updateTradingEnabled(next);
      setEnabled(res.trading_enabled);
    } catch (err) {
      if (err.status === 401) onUnauthorized();
    } finally {
      setBusy(false);
    }
  }

  const label = enabled === null ? 'Trading…' : enabled ? 'Trading ON' : 'Trading OFF';
  const Icon = enabled ? Pause : Play;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enabled === null || busy}
      aria-pressed={enabled === true}
      title={
        enabled === null
          ? 'Loading auto-trading status'
          : enabled
            ? 'Auto-trading is ON — click to pause new entries'
            : 'Auto-trading is OFF — click to resume'
      }
      className={cn(
        // h-9 everywhere: this is the one destructive control in the header,
        // and it has to stay a comfortable thumb target on a phone rather
        // than shrinking with the type around it.
        'group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[0.6875rem] font-semibold transition-colors',
        'sm:gap-2 sm:px-3 sm:text-xs',
        'disabled:cursor-not-allowed disabled:opacity-60',
        enabled
          ? 'border-profit-line bg-profit-soft text-profit hover:bg-profit/10'
          : 'border-loss-line bg-loss-soft text-loss hover:bg-loss/10'
      )}
    >
      {/* The dot is the at-a-glance state; the word next to it is what makes
          the state unambiguous when the two hues are hard to tell apart. */}
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 shrink-0 rounded-full sm:size-2',
          enabled ? 'bg-profit ring-profit/20 ring-[3px] sm:ring-4' : 'bg-loss ring-loss/20 ring-[3px] sm:ring-4'
        )}
      />
      {/* The kill-switch state is the most important status on the page, so
          the word stays visible even on the narrowest layout — the topbar
          title truncates instead. */}
      <span className="whitespace-nowrap">{label}</span>
      {/* Hover-revealed affordance, so it is meaningless on touch — where it
          would only steal ~20px from a header that has none to spare. */}
      {enabled !== null && (
        <Icon
          className="hidden size-3.5 opacity-0 transition-opacity group-hover:opacity-100 sm:block"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export default TradingToggle;
