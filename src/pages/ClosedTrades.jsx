import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchTrades } from '@/api';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { EmptyState, ErrorBanner, LoadingState } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { ClosedTradesTable, ClosedTradesList } from '@/components/tables/RecentTradesTable';
import TradeSheet from '@/components/trades/TradeSheet';

const CLOSED_TRADES_PAGE_SIZE = 20;

/**
 * Its own paginated fetch — independent of the 30s dashboard-wide refresh,
 * since closed-trade history is large and shouldn't be re-fetched on a timer.
 * It does follow the manual refresh in the header (`reloadKey`).
 *
 * Desktop keeps the full table inside a card. The phone drops the card: the
 * day groups are the containers there, and a card around cards only spends
 * 32px of a 360px screen on borders.
 */
export default function ClosedTrades() {
  const { logout } = useAuth();
  const { mode, reloadKey } = useOutletContext();
  const [trades, setTrades] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');

  // Kept after close (only `open` flips) so the sheet still has its content
  // while it slides away.
  const [detail, setDetail] = useState({ open: false, trade: null });
  const showTrade = useCallback((trade) => setDetail({ open: true, trade }), []);
  const hideTrade = useCallback(() => setDetail((d) => ({ ...d, open: false })), []);

  // Environment switch resets pagination: page 3 of paper is not page 3 of
  // live, and carrying the offset over lands on an empty page that reads as a
  // failure rather than as "this environment has fewer trades".
  useEffect(() => {
    setOffset(0);
    setTrades(null);
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    fetchTrades({ status: 'CLOSED', limit: CLOSED_TRADES_PAGE_SIZE, offset, mode })
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
  }, [offset, logout, mode, reloadKey]);

  const page = Math.floor(offset / CLOSED_TRADES_PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / CLOSED_TRADES_PAGE_SIZE));

  // A new page starts at its top. Without this, "Next" at the foot of a long
  // phone list loads page 2 and leaves you looking at its last rows.
  function goTo(nextOffset) {
    setOffset(nextOffset);
    window.scrollTo({ top: 0 });
  }

  const pager = trades && trades.length > 0 && (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPrev={() => goTo(Math.max(0, offset - CLOSED_TRADES_PAGE_SIZE))}
      onNext={() => goTo(offset + CLOSED_TRADES_PAGE_SIZE)}
      disablePrev={offset === 0}
      disableNext={offset + CLOSED_TRADES_PAGE_SIZE >= total}
    />
  );

  const empty = <EmptyState icon={Inbox}>No closed trades yet.</EmptyState>;

  return (
    <>
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ---- md and up: the full table -------------------------------- */}
      <Card className="hidden md:block">
        <CardHeader
          title="Closed trades"
          description="Premium is what the option cost — P&L comes from it. Index is where BANKNIFTY was. Click a trade for charges and net."
          actions={
            <span className="text-muted tnum text-xs">{total.toLocaleString('en-IN')} total</span>
          }
        />
        <CardBody>
          {trades === null ? (
            <LoadingState>Loading trades…</LoadingState>
          ) : trades.length === 0 ? (
            empty
          ) : (
            <ClosedTradesTable trades={trades} onSelect={showTrade} />
          )}
          {pager}
        </CardBody>
      </Card>

      {/* ---- Phone: day-grouped rows ---------------------------------- */}
      <div className="md:hidden">
        {trades === null ? (
          <LoadingState>Loading trades…</LoadingState>
        ) : trades.length === 0 ? (
          empty
        ) : (
          <>
            <p className="text-muted tnum mb-4 px-1 text-xs">
              {total.toLocaleString('en-IN')} trades · tap one for full details
            </p>
            <ClosedTradesList trades={trades} onSelect={showTrade} />
          </>
        )}
        {pager}
      </div>

      <TradeSheet trade={detail.trade} open={detail.open} onClose={hideTrade} />
    </>
  );
}
