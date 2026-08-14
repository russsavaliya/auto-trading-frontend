import { formatMoney, formatPremium, formatSpot, formatTime, formatDuration } from '../utils/format';

/**
 * Closed-trade history.
 *
 * The premium/spot split is the point of this table. Before the premium
 * migration, `entry_price` held the BANK NIFTY INDEX level and P&L was computed
 * from it — which inverts the sign on every PUT trade, because the index falls
 * while the put gains. Nine of 25 closed trades were recorded with the wrong
 * sign, and the dashboard's biggest "winner" (+₹5,375) was really a −₹27 loss.
 *
 * So the two are now shown as separate, explicitly labelled columns:
 *   Premium — what the option actually cost/returned. P&L comes from THIS.
 *   Index   — where BANKNIFTY was, i.e. what you see on the TradingView chart.
 * Never merge them back into one "price" column.
 */

function signalBadge(signalType) {
  const isCall = signalType?.startsWith('CALL');
  return <span className={`badge ${isCall ? 'call' : 'put'}`}>{isCall ? 'CALL' : 'PUT'}</span>;
}

/**
 * Why the position closed. A forced square-off is a materially different event
 * from the strategy deciding to exit — if most trades end this way, the exit
 * rule is not doing its job and the clock is running the book.
 */
function reasonBadge(reason) {
  if (!reason || reason === 'signal') return <span className="badge neutral">Signal</span>;

  // Premium-based exits are the good kind — they book a profit or cap a loss
  // instead of waiting for the lagging score. They get their own tone so a
  // glance down the column shows how often the strategy actually decided the
  // exit versus how often a risk rule had to.
  const premiumRules = {
    trailing_stop: 'Trail ↓',
    stop_loss: 'Stop loss',
    time_stop: 'Time stop',
  };
  if (premiumRules[reason]) return <span className="badge call">{premiumRules[reason]}</span>;

  const labels = {
    eod_square_off: 'EOD square-off',
    stale_overnight: 'Stale (overnight)',
    manual_close: 'Manual',
    force_flat_no_exit_order: 'Force-flat',
  };
  return <span className="badge warn">{labels[reason] || reason}</span>;
}

/**
 * A premium that came from a market mark rather than a broker fill. The Upstox
 * sandbox never executes, so in sandbox mode this is every trade — but it must
 * stay visible, because a mark is an estimate and a fill is not.
 */
function markedFlag(source) {
  if (!source || source === 'broker_fill') return null;
  const label = source.startsWith('backfilled') ? 'backfilled' : 'marked';
  return <span className="inline-flag" title={`Premium source: ${source}`}>{label}</span>;
}

export default function RecentTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return <div className="empty-state">No trades yet.</div>;
  }

  return (
    <div className="table-scroll">
      <table className="trades-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Side</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Held</th>
            <th className="num">Premium in</th>
            <th className="num">Premium out</th>
            <th className="num">Index in</th>
            <th className="num">Index out</th>
            <th className="num">Qty</th>
            <th className="num">P&amp;L</th>
            <th>Closed by</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const pnl = t.pnl == null ? null : Number(t.pnl);
            return (
              <tr key={t.id}>
                <td className="dim">{t.id}</td>
                <td>{signalBadge(t.signal_type)}</td>
                <td className="nowrap">{formatTime(t.created_at)}</td>
                <td className="nowrap">{formatTime(t.closed_at)}</td>
                <td className="dim nowrap">{formatDuration(t.created_at, t.closed_at)}</td>
                <td className="num">
                  {formatPremium(t.entry_price)}
                  {markedFlag(t.entry_fill_source)}
                </td>
                <td className="num">
                  {formatPremium(t.exit_price)}
                  {markedFlag(t.exit_fill_source)}
                </td>
                <td className="num dim">{formatSpot(t.entry_spot)}</td>
                <td className="num dim">{formatSpot(t.exit_spot)}</td>
                <td className="num dim">{t.quantity ?? '—'}</td>
                <td className={`num money ${pnl > 0 ? 'good' : pnl < 0 ? 'critical' : ''}`}>
                  {pnl == null ? <span className="dim" title="Premium could not be determined">unpriced</span> : formatMoney(pnl)}
                </td>
                <td>{reasonBadge(t.closed_reason)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
