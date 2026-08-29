import { useSyncExternalStore } from 'react';

/**
 * Presentational breakpoint read, for the handful of places where a media
 * query cannot do the job in CSS alone — Recharts takes its axis width and
 * tick density as JS props, not classes, so a chart that fits a 1280px card
 * would otherwise spend a third of a 360px screen on the y-axis gutter.
 *
 * useSyncExternalStore rather than useState+useEffect: the first paint then
 * already knows the width, so a phone never renders the desktop chart for a
 * frame and reflows.
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false // SSR / pre-hydration: assume the wide layout
  );
}

/** Tailwind's `md` breakpoint, the one this dashboard switches layout at. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

export default useMediaQuery;
