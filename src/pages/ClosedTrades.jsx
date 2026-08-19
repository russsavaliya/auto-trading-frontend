import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { fetchTrades } from '../api';
import RecentTradesTable from '../components/RecentTradesTable';

const CLOSED_TRADES_PAGE_SIZE = 20;

/** Its own paginated fetch — independent of the 30s dashboard-wide refresh,
 * since closed-trade history is large and shouldn't be re-fetched on a timer. */
export default function ClosedTrades() {
  const { logout } = useAuth();
  const [trades, setTrades] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchTrades({ status: 'CLOSED', limit: CLOSED_TRADES_PAGE_SIZE, offset })
      .then((res) => {
        if (cancelled) return;
        setTrades(res.trades);
        setTotal(res.total);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          logout();
          return;
        }
        setError(err.message || 'Failed to load closed trades');
      });
    return () => {
      cancelled = true;
    };
  }, [offset, logout]);

  const page = Math.floor(offset / CLOSED_TRADES_PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / CLOSED_TRADES_PAGE_SIZE));

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Closed trades</div>
          <div className="panel-title-muted">
            Premium is what the option cost — P&amp;L comes from it. Index is where BANKNIFTY was.
          </div>
        </div>
        <div className="panel-title-muted">{total} total</div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <RecentTradesTable trades={trades} />

      {trades && trades.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - CLOSED_TRADES_PAGE_SIZE))}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={offset + CLOSED_TRADES_PAGE_SIZE >= total}
            onClick={() => setOffset(offset + CLOSED_TRADES_PAGE_SIZE)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
