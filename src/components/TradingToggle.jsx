import { useCallback, useEffect, useState } from 'react';
import { fetchConfig, updateTradingEnabled } from '../api';

const POLL_MS = 30_000;

/**
 * The header kill switch. Polls app_config.trading_enabled independently of
 * whatever page is open, since it can also be flipped directly in Supabase —
 * the button must reflect that within one poll, not just its own clicks.
 */
export default function TradingToggle({ onUnauthorized }) {
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

  const label = enabled === null ? 'Trading…' : enabled ? 'Trading: ON' : 'Trading: OFF';

  return (
    <button
      type="button"
      className={`trading-toggle${enabled ? ' on' : ''}`}
      onClick={handleClick}
      disabled={enabled === null || busy}
      title={
        enabled === null
          ? 'Loading auto-trading status'
          : enabled
            ? 'Auto-trading is ON — click to pause new entries'
            : 'Auto-trading is OFF — click to resume'
      }
      aria-pressed={enabled === true}
    >
      <span className="trading-toggle-dot" aria-hidden="true" />
      {label}
    </button>
  );
}
