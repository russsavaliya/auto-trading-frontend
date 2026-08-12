import { formatTime, formatSpot } from '../utils/format';

/**
 * Every inbound TradingView call, including the ones that were refused.
 *
 * The `reason` column is the most useful thing here and used to be raw
 * snake_case. A rejection is normal and often correct — a duplicate alert, an
 * entry past the 14:45 cutoff, a signal arriving while already in a position —
 * but you can only tell "working as designed" from "silently broken" if the
 * reason is legible. So known reasons get a plain-English gloss and are
 * grouped by whether they represent a fault.
 */

const REASONS = {
  duplicate_alert_id: ['Duplicate alert', false],
  duplicate_within_window: ['Duplicate (inside dedupe window)', false],
  trading_disabled: ['Kill switch is off', false],
  entries_disabled: ['New entries paused', false],
  past_entry_cutoff: ['Refused — past the entry cutoff', false],
  market_closed: ['Refused — market closed', false],
  missing_trade_reference: ['No linked trade to exit', true],
};

function glossReason(reason) {
  if (!reason) return null;
  const exact = REASONS[reason];
  if (exact) return exact;

  // Reasons that carry detail after a prefix, e.g. "invalid_state: already IN_CALL".
  if (reason.startsWith('past_entry_cutoff')) return [`Refused — ${reason.replace('past_entry_cutoff ', '')}`, false];
  if (reason.startsWith('invalid_state')) return [reason.replace('invalid_state: ', 'Wrong state — '), false];
  if (reason.startsWith('instrument_resolution_failed')) return ['Could not resolve the ATM contract', true];
  if (reason.startsWith('order_failed') || reason.startsWith('exit_order_failed')) return ['Broker rejected the order', true];
  if (reason.startsWith('unhandled_error')) return ['Unhandled error', true];
  return [reason, true];
}

function outcomeBadge(log) {
  if (log.processed) return <span className="badge good">Traded</span>;
  if (!log.reason) return <span className="badge warn">Pending</span>;
  const [, isFault] = glossReason(log.reason);
  return isFault ? <span className="badge put">Error</span> : <span className="badge neutral">Skipped</span>;
}

export default function WebhookLogsTable({ logs }) {
  if (!logs || logs.length === 0) {
    return <div className="empty-state">No webhook calls yet.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="trades-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Signal</th>
            <th>Symbol</th>
            <th className="num">Index</th>
            <th className="num">Score</th>
            <th>Outcome</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const p = log.raw_payload || {};
            const isCall = p.signal_type?.startsWith('CALL');
            const isExit = p.signal_type?.endsWith('EXIT');
            const gloss = glossReason(log.reason);
            return (
              <tr key={log.id}>
                <td className="nowrap">{formatTime(log.received_at, { withSeconds: true })}</td>
                <td>
                  {p.signal_type ? (
                    <span className={`badge ${isCall ? 'call' : 'put'}${isExit ? ' ghost' : ''}`}>
                      {p.signal_type.replace('_', ' ')}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="dim">{p.symbol ?? '—'}</td>
                <td className="num dim">{formatSpot(p.price)}</td>
                <td className="num dim">{p.score ?? '—'}</td>
                <td>{outcomeBadge(log)}</td>
                <td className="webhook-reason" title={log.reason ?? ''}>
                  {gloss ? gloss[0] : <span className="dim">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
