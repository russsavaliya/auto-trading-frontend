function signalBadge(signalType) {
  const isCall = signalType?.startsWith('CALL');
  return <span className={`badge ${isCall ? 'call' : 'put'}`}>{signalType}</span>;
}

function round2(n) {
  return n == null ? null : Math.round(n * 100) / 100;
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RecentTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return <div className="empty-state">No trades yet.</div>;
  }

  return (
    <table className="trades-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Signal</th>
          <th>Status</th>
          <th>Entry</th>
          <th>Exit</th>
          <th>P&amp;L</th>
          <th>Closed</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => (
          <tr key={t.id}>
            <td>{t.symbol}</td>
            <td>{signalBadge(t.signal_type)}</td>
            <td>
              <span className={`badge ${t.status === 'FAILED' ? 'put' : 'filled'}`}>{t.status}</span>
            </td>
            <td>{round2(t.entry_price) ?? '—'}</td>
            <td>{round2(t.exit_price) ?? '—'}</td>
            <td style={{ color: t.pnl > 0 ? '#0ca30c' : t.pnl < 0 ? '#e66767' : undefined }}>
              {t.pnl != null ? (t.pnl > 0 ? '+' : '') + round2(t.pnl) : '—'}
            </td>
            <td>{formatTime(t.closed_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
