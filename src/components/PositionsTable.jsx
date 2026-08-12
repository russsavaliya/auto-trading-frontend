import { formatTime, formatDuration } from '../utils/format';

/**
 * The state machine that gates every incoming signal.
 *
 * A symbol stuck off FLAT silently rejects every subsequent entry — no error,
 * no alert, the bot simply stops trading. That happened for real: a position
 * opened 12 Aug 14:35 never received an exit signal and blocked the symbol
 * indefinitely. So this table leads with how long the state has been held and
 * calls out anything that has sat non-FLAT for more than a session.
 */

function stateBadge(state) {
  const cls = state === 'FLAT' ? 'neutral' : state === 'IN_CALL' ? 'call' : 'put';
  return <span className={`badge ${cls}`}>{state}</span>;
}

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export default function PositionsTable({ positions }) {
  if (!positions || positions.length === 0) {
    return <div className="empty-state">No symbols tracked yet.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="trades-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>State</th>
            <th className="num">Trade</th>
            <th>Since</th>
            <th>Held for</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const heldMs = Date.now() - new Date(p.updated_at).getTime();
            const stuck = p.state !== 'FLAT' && heldMs > STALE_AFTER_MS;
            return (
              <tr key={p.symbol} className={stuck ? 'row-warn' : undefined}>
                <td>{p.symbol}</td>
                <td>{stateBadge(p.state)}</td>
                <td className="num dim">{p.current_trade_id ?? '—'}</td>
                <td className="nowrap">{formatTime(p.updated_at)}</td>
                <td className="nowrap">
                  {p.state === 'FLAT' ? (
                    <span className="dim">—</span>
                  ) : (
                    <>
                      {formatDuration(p.updated_at, new Date().toISOString())}
                      {stuck && (
                        <span className="inline-flag warn" title="Open far longer than a session — new signals for this symbol are being rejected">
                          stuck
                        </span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
