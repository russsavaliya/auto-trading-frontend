function stateBadge(state) {
  const cls = state === 'FLAT' ? 'pending' : state === 'IN_CALL' ? 'call' : 'put';
  return <span className={`badge ${cls}`}>{state}</span>;
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

export default function PositionsTable({ positions }) {
  if (!positions || positions.length === 0) {
    return <div className="empty-state">No symbols tracked yet.</div>;
  }

  return (
    <table className="trades-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>State</th>
          <th>Current trade</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => (
          <tr key={p.symbol}>
            <td>{p.symbol}</td>
            <td>{stateBadge(p.state)}</td>
            <td>{p.current_trade_id ?? '—'}</td>
            <td>{formatTime(p.updated_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
