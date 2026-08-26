import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchTrades } from '@/api';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ErrorBanner } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import RecentTradesTable from '@/components/tables/RecentTradesTable';

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
    <>
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card>
        <CardHeader
          title="Closed trades"
          description="Premium is what the option cost — P&L comes from it. Index is where BANKNIFTY was."
          actions={
            <span className="text-muted tnum text-xs">
              {total.toLocaleString('en-IN')} total
            </span>
          }
        />
        <CardBody>
          <RecentTradesTable trades={trades} />

          {trades && trades.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrev={() => setOffset(Math.max(0, offset - CLOSED_TRADES_PAGE_SIZE))}
              onNext={() => setOffset(offset + CLOSED_TRADES_PAGE_SIZE)}
              disablePrev={offset === 0}
              disableNext={offset + CLOSED_TRADES_PAGE_SIZE >= total}
            />
          )}
        </CardBody>
      </Card>
    </>
  );
}
