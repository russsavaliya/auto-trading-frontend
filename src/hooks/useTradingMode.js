import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const PAPER = 'paper';
export const LIVE = 'live';
const MODES = [PAPER, LIVE];

/**
 * Which environment the dashboard is currently showing.
 *
 * Held in the URL rather than in React state or localStorage, for one reason:
 * a screenshot or a pasted link has to carry it. "Is this the live number or
 * the paper one?" is the single most expensive question this dashboard can
 * leave ambiguous, and `?mode=live` in the address bar answers it without
 * anyone having to remember what they clicked.
 *
 * Anything unrecognised resolves to paper — the harmless one.
 */
export function useTradingMode() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('mode');
  const mode = MODES.includes(raw) ? raw : PAPER;

  const setMode = useCallback(
    (next) => {
      const updated = new URLSearchParams(params);
      // Paper is the default, so it stays out of the URL entirely — a clean
      // link means paper, and only live is ever spelled out.
      if (next === PAPER) updated.delete('mode');
      else updated.set('mode', next);
      setParams(updated, { replace: true });
    },
    [params, setParams]
  );

  // Every in-app link goes through this. A plain to="/report" drops the
  // query string, so tapping a tab while viewing live silently switched the
  // screen back to paper — the exact ambiguity this hook exists to prevent.
  const withMode = useCallback((path) => (mode === LIVE ? `${path}?mode=${LIVE}` : path), [mode]);

  return { mode, setMode, isLive: mode === LIVE, withMode };
}

export default useTradingMode;
