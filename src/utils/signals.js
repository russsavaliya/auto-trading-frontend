/**
 * How to read an inbound TradingView alert: what it asked for and what the
 * bridge did with it. Shared by the Signals table and the Home status card so
 * the same alert can never be described two different ways.
 *
 * A rejection is normal and often correct — a duplicate alert, an entry past
 * the 14:45 cutoff, a signal arriving while already in a position — but you
 * can only tell "working as designed" from "silently broken" if the reason is
 * legible. So known reasons get a plain-English gloss and are grouped by
 * whether they represent a fault.
 */

const REASONS = {
  duplicate_alert_id: ['Duplicate alert', false],
  duplicate_within_window: ['Duplicate (inside dedupe window)', false],
  trading_disabled: ['Bot was paused', false],
  entries_disabled: ['New entries paused', false],
  past_entry_cutoff: ['Too late in the day for a new trade', false],
  market_closed: ['Market was closed', false],
  missing_trade_reference: ['No linked trade to exit', true],
};

/** [plain-English reason, isFault] — or null when there is no reason. */
export function glossReason(reason) {
  if (!reason) return null;
  const exact = REASONS[reason];
  if (exact) return exact;

  // Reasons that carry detail after a prefix, e.g. "invalid_state: already IN_CALL".
  // The daily cap and the re-entry cooldown are the system working correctly,
  // not faults — they are the rules that keep trade count down, which is the
  // one intervention measured to help in every sample. They must read as
  // "skipped on purpose", never as an error.
  if (reason.startsWith('daily_cap_reached')) {
    const n = reason.match(/(\d+) of (\d+)/);
    return [n ? `Daily limit — ${n[2]} trades already taken` : 'Daily limit reached', false];
  }
  if (reason.startsWith('re_entry_cooldown')) {
    const why = reason.match(/: (\w+) on trade/);
    return [why ? `Cooling off after ${why[1].replace('_', ' ')}` : 'Re-entry cooldown', false];
  }
  if (reason.startsWith('past_entry_cutoff')) return ['Too late in the day for a new trade', false];
  if (reason.startsWith('invalid_state')) {
    if (reason.includes('not in position')) return ['No open trade to close', false];
    if (reason.includes('already')) return ['Already in a trade', false];
    return [reason.replace('invalid_state: ', 'Wrong state — '), false];
  }
  if (reason.startsWith('live_disabled')) return ['Live trading is switched off', false];
  if (reason.startsWith('live_no_valid_token')) return ['Upstox not connected today', true];
  if (reason.startsWith('live_not_configured')) return ['Live trading is not set up', true];
  if (reason.startsWith('instrument_resolution_failed'))
    return ['Could not find the option contract', true];
  if (reason.startsWith('order_failed') || reason.startsWith('exit_order_failed'))
    return ['Broker rejected the order', true];
  if (reason === 'invalid_secret') return ['Wrong webhook secret', true];
  if (reason.startsWith('validation_failed')) return ['Alert message was not valid', true];
  if (reason.startsWith('unhandled_error')) return ['Unexpected error', true];
  return [reason, true];
}

/**
 * The result in the environment being viewed. The API projects each mode's
 * result onto outcome_*; `processed`/`reason` are always the PAPER result, so
 * reading them directly would show paper's outcome on the live screen.
 */
export function logOutcome(log) {
  return {
    processed: log.outcome_processed ?? log.processed,
    reason: log.outcome_reason ?? log.reason,
  };
}

/** "CALL entry" / "PUT exit". */
export function signalLabel(signalType) {
  if (!signalType) return 'Signal';
  const [side, kind] = signalType.split('_');
  return `${side} ${kind === 'EXIT' ? 'exit' : 'entry'}`;
}
