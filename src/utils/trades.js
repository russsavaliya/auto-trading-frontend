/**
 * How a trade reads in words. Shared by the trade lists, the open-position
 * rows and the detail sheet, so one trade can never be described two ways.
 */

/** 'CALL' or 'PUT' from a signal type such as "PUT_ENTRY". */
export const sideOf = (signalType) => (signalType?.startsWith('PUT') ? 'PUT' : 'CALL');

/** A numeric column that may arrive as a string, or as null when unknown. */
export const toNumber = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

/**
 * Why a position closed: [label, badge variant].
 *
 * Premium-based exits (trail, stop, time) are the risk rules doing their job
 * and get the brand tone. A forced square-off is a different kind of event —
 * if most trades end that way the clock is running the book, not the
 * strategy — so it gets the warning tone.
 */
const CLOSE_REASONS = {
  signal: ['Signal', 'neutral'],
  trailing_stop: ['Trail ↓', 'brand'],
  stop_loss: ['Stop loss', 'brand'],
  time_stop: ['Time stop', 'brand'],
  eod_square_off: ['EOD square-off', 'warn'],
  stale_overnight: ['Stale (overnight)', 'warn'],
  manual_close: ['Manual', 'warn'],
  force_flat_no_exit_order: ['Force-flat', 'warn'],
};

export function closeReason(reason) {
  return CLOSE_REASONS[reason || 'signal'] ?? [reason, 'warn'];
}

/**
 * Where a premium came from, when it was NOT a broker fill. The Upstox
 * sandbox never executes, so in paper mode every price is a mark — an
 * estimate from market data — and that must stay visible next to the number.
 */
export function priceSource(source) {
  if (!source || source === 'broker_fill') return null;
  return source.startsWith('backfilled') ? 'backfilled' : 'marked';
}
