function outcomeBadge(log) {
  if (log.processed) return <span className="badge filled">SUCCESS</span>;
  if (!log.reason) return <span className="badge pending">PENDING</span>;
  return <span className="badge put">FAILED</span>;
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function WebhookLogsTable({ logs }) {
  if (!logs || logs.length === 0) {
    return <div className="empty-state">No webhook calls yet.</div>;
  }

  return (
    <table className="trades-table">
      <thead>
        <tr>
          <th>Received</th>
          <th>Signal</th>
          <th>Symbol</th>
          <th>Outcome</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => {
          const payload = log.raw_payload || {};
          const isCall = payload.signal_type?.startsWith('CALL');
          return (
            <tr key={log.id}>
              <td>{formatTime(log.received_at)}</td>
              <td>
                {payload.signal_type ? (
                  <span className={`badge ${isCall ? 'call' : 'put'}`}>{payload.signal_type}</span>
                ) : (
                  '—'
                )}
              </td>
              <td>{payload.symbol ?? '—'}</td>
              <td>{outcomeBadge(log)}</td>
              <td className="webhook-reason">{log.reason ?? '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
