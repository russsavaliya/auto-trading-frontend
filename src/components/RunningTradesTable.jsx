function signalBadge(signalType) {
  const isCall = signalType?.startsWith('CALL');
  return <span className={`badge ${isCall ? 'call' : 'put'}`}>{signalType}</span>;
}

function statusBadge(status) {
  const cls = status === 'FILLED' ? 'filled' : 'pending';
  return <span className={`badge ${cls}`}>{status}</span>;
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

export default function RunningTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return <div className="empty-state">No trades currently running.</div>;
  }

  return (
    <table className="trades-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Signal</th>
          <th>Status</th>
          <th>Qty</th>
          <th>Entry price</th>
          <th>Opened</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => (
          <tr key={t.id}>
            <td>{t.symbol}</td>
            <td>{signalBadge(t.signal_type)}</td>
            <td>{statusBadge(t.status)}</td>
            <td>{t.quantity ?? '—'}</td>
            <td>{t.entry_price ?? '—'}</td>
            <td>{formatTime(t.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
