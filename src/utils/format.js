/**
 * Shared formatting. Every number and time on the dashboard goes through here
 * so the same value can never render two different ways on two screens.
 */

// NSE trades in IST and every cutoff in the backend is expressed in IST, so
// the dashboard must show IST too — regardless of where the browser is.
// `toLocaleString('en-IN')` alone does NOT do this: 'en-IN' is a locale (digit
// grouping, month names), not a timezone. Without an explicit timeZone the
// laptop's own zone wins, and a machine set to anything but IST silently shows
// every entry and exit at the wrong time.
const IST = 'Asia/Kolkata';

/**
 * Signed rupees, e.g. "+₹443" / "−₹4,910".
 *
 * The sign goes BEFORE the currency symbol. Interpolating a raw negative number
 * after "₹" produces "₹-4,910", which reads as a currency symbol followed by
 * junk. Uses a real minus sign (−, U+2212) rather than a hyphen so it lines up
 * with the "+" in a tabular-nums column.
 *
 * The explicit sign is also an accessibility requirement, not decoration: P&L
 * is coloured green/red, and those two hues are ~4x below the separation
 * threshold for red-green colourblindness. The sign is what actually carries
 * profit-vs-loss; the colour only reinforces it.
 */
export function formatMoney(n, { showSign = true } = {}) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  const sign = v > 0 ? (showSign ? '+' : '') : v < 0 ? '−' : '';
  return `${sign}₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** Compact rupees for chart axes: "−₹4.9k". */
export function formatMoneyCompact(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return `${sign}₹${Math.round(abs)}`;
}

/** Option premium per unit — always 2dp, never signed. */
export function formatPremium(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return Number(n).toFixed(2);
}

/** Index level — whole points are enough at BANKNIFTY's scale. */
export function formatSpot(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/** "12 Aug, 14:35" in IST. */
export function formatTime(iso, { withSeconds = false } = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  });
}

/** "14:35" in IST — for when the day is already established by context. */
export function formatClock(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "2026-08-10" -> "Mon 10 Aug". Parsed as IST noon so the day cannot drift. */
export function formatDay(dateKey) {
  const d = new Date(`${dateKey}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('en-IN', { timeZone: IST, weekday: 'short', day: '2-digit', month: 'short' });
}

/** "2026-08" -> "Aug 26". */
export function formatMonth(monthKey) {
  const [y, m] = monthKey.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return monthKey;
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

/** How long a position was held, e.g. "35m" / "2h 10m". */
export function formatDuration(fromIso, toIso) {
  if (!fromIso || !toIso) return '—';
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const tone = (n) => (n > 0 ? 'good' : n < 0 ? 'critical' : 'flat');

/**
 * A rounded y-axis domain and matching ticks for a chart that straddles zero.
 *
 * Letting Recharts auto-scale a padded domain produced ticks at arbitrary
 * values — the break-even line on the daily chart came out labelled "₹10",
 * which reads as if zero were somewhere else. On a P&L chart the zero tick is
 * the most important label on the axis, so the bounds are snapped to a round
 * step and the ticks are generated from it, which guarantees an exact 0.
 *
 * `padRatio` leaves headroom so direct labels above/below the extreme bars are
 * not clipped.
 */
export function niceBounds(values, { padRatio = 0.2, maxTicks = 6 } = {}) {
  const nums = values.filter((v) => Number.isFinite(v));
  const max = Math.max(...nums, 0);
  const min = Math.min(...nums, 0);
  const span = Math.max(Math.abs(max), Math.abs(min)) || 1;

  // Half-decade step: 1000-ish spans snap to 500, 100-ish to 50, and so on.
  const step = Math.pow(10, Math.floor(Math.log10(span))) / 2;
  const pad = span * padRatio;
  const lo = Math.floor((min - pad) / step) * step;
  const hi = Math.ceil((max + pad) / step) * step;

  let tickStep = step;
  while ((hi - lo) / tickStep > maxTicks) tickStep *= 2;

  const ticks = [];
  for (let v = lo; v <= hi + tickStep / 1000; v += tickStep) {
    ticks.push(Number(v.toPrecision(12)));
  }

  return { domain: [lo, hi], ticks };
}
