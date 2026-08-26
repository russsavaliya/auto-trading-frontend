/**
 * Recharts needs real colour strings, not utility classes — so the charts are
 * the one place that would otherwise hard-code hexes and drift away from the
 * rest of the palette. Reading the same @theme variables back keeps a single
 * source of truth in styles/index.css.
 *
 * Resolved lazily and cached: at module-evaluation time the stylesheet may not
 * have been applied yet, and getComputedStyle would return ''.
 */
const cache = new Map();

function token(name, fallback) {
  if (cache.has(name)) return cache.get(name);
  let value = fallback;
  if (typeof window !== 'undefined') {
    const read = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (read) value = read;
  }
  cache.set(name, value);
  return value;
}

/** Call inside render, never at module scope. */
export function chartColors() {
  return {
    profit: token('--color-chart-profit', '#059669'),
    loss: token('--color-chart-loss', '#e11d48'),
    brand: token('--color-brand', '#4f46e5'),
    ink: token('--color-ink', '#0c0a09'),
    muted: token('--color-muted', '#78716c'),
    faint: token('--color-faint', '#a8a29e'),
    line: token('--color-line', '#e7e5e4'),
    lineStrong: token('--color-line-strong', '#d6d3d1'),
    surface: token('--color-surface', '#ffffff'),
  };
}

/** Shared axis/grid props so both charts sit on an identical frame. */
export function axisTheme(colors) {
  return {
    tick: { fill: colors.muted, fontSize: 11.5 },
    axisLine: false,
    tickLine: false,
  };
}
