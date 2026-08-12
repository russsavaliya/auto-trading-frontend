import { formatMoney, formatPremium, formatSpot, formatTime, formatDuration, formatClock } from '../utils/format';

/**
 * Open positions, marked to the option's current traded price.
 *
 * The old version showed only the entry price, which cannot tell you the one
 * thing this table exists to answer: is the position winning right now. The
 * backend now attaches current_premium and unrealized_pnl from the same source
 * that prices paper fills, so an open trade and the closed trade it becomes
 * are valued consistently.
 */

function signalBadge(signalType) {
  const isCall = signalType?.startsWith('CALL');
  return <span className={`badge ${isCall ? 'call' : 'put'}`}>{isCall ? 'CALL' : 'PUT'}</span>;
}

/**
 * The broker's own view, kept separate from our lifecycle status.
 *
 * Against the Upstox sandbox this reads "open pending" forever — the sandbox
 * accepts and validates orders but never executes them, so nothing is ever
 * really filled. Showing it plainly stops a paper mark being mistaken for a
 * real position.
 */
function brokerFlag(status) {
  if (!status) return <span className="inline-flag" title="No broker status recorded">no broker status</span>;
  if (status === 'complete') return null;
  return (
    <span className="inline-flag" title={`Upstox order status: ${status}`}>
      {status}
    </span>
  );
}

export default function RunningTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return <div className="empty-state">Flat — no positions open.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="trades-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Side</th>
            <th>Opened</th>
            <th>Held</th>
            <th className="num">Qty</th>
            <th className="num">Entry premium</th>
            <th className="num">Now</th>
            <th className="num">Index at entry</th>
            <th className="num">Unrealised</th>
            <th>Broker</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const u = t.unrealized_pnl == null ? null : Number(t.unrealized_pnl);
            return (
              <tr key={t.id}>
                <td className="dim">{t.id}</td>
                <td>{signalBadge(t.signal_type)}</td>
                <td className="nowrap">{formatTime(t.created_at)}</td>
                <td className="dim nowrap">{formatDuration(t.created_at, new Date().toISOString())}</td>
                <td className="num dim">{t.quantity ?? '—'}</td>
                <td className="num">{formatPremium(t.entry_price)}</td>
                <td className="num">
                  {formatPremium(t.current_premium)}
                  {t.current_premium_at && (
                    <span className="inline-flag" title="Time of the candle this mark came from">
                      {formatClock(t.current_premium_at)}
                    </span>
                  )}
                </td>
                <td className="num dim">{formatSpot(t.entry_spot)}</td>
                <td className={`num money ${u > 0 ? 'good' : u < 0 ? 'critical' : ''}`}>
                  {u == null ? <span className="dim">—</span> : formatMoney(u)}
                </td>
                <td>{brokerFlag(t.broker_entry_status)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
