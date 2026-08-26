import { CircleSlash } from 'lucide-react';
import {
  formatMoney,
  formatPremium,
  formatSpot,
  formatTime,
  formatDuration,
  formatClock,
} from '@/utils/format';
import { Badge, InlineFlag } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD, MoneyTD, Dash } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/Feedback';

/**
 * Open positions, marked to the option's current traded price.
 *
 * The old version showed only the entry price, which cannot tell you the one
 * thing this table exists to answer: is the position winning right now. The
 * backend now attaches current_premium and unrealized_pnl from the same source
 * that prices paper fills, so an open trade and the closed trade it becomes
 * are valued consistently.
 */

function SideBadge({ signalType }) {
  const isCall = signalType?.startsWith('CALL');
  return <Badge variant={isCall ? 'call' : 'put'}>{isCall ? 'CALL' : 'PUT'}</Badge>;
}

/**
 * The broker's own view, kept separate from our lifecycle status.
 *
 * Against the Upstox sandbox this reads "open pending" forever — the sandbox
 * accepts and validates orders but never executes them, so nothing is ever
 * really filled. Showing it plainly stops a paper mark being mistaken for a
 * real position.
 */
function BrokerFlag({ status }) {
  if (!status) return <InlineFlag title="No broker status recorded">no broker status</InlineFlag>;
  if (status === 'complete') return null;
  return <InlineFlag title={`Upstox order status: ${status}`}>{status}</InlineFlag>;
}

export default function RunningTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return <EmptyState icon={CircleSlash}>Flat — no positions open.</EmptyState>;
  }

  return (
    <Table>
      <THead>
        <TR className="hover:bg-transparent">
          <TH>#</TH>
          <TH>Side</TH>
          <TH>Opened</TH>
          <TH>Held</TH>
          <TH num>Qty</TH>
          <TH num>Entry premium</TH>
          <TH num>Now</TH>
          <TH num>Index at entry</TH>
          <TH num>Unrealised</TH>
          <TH>Broker</TH>
        </TR>
      </THead>
      <TBody>
        {trades.map((t) => {
          const u = t.unrealized_pnl == null ? null : Number(t.unrealized_pnl);
          return (
            <TR key={t.id}>
              <TD dim>{t.id}</TD>
              <TD>
                <SideBadge signalType={t.signal_type} />
              </TD>
              <TD nowrap>{formatTime(t.created_at)}</TD>
              <TD dim nowrap>
                {formatDuration(t.created_at, new Date().toISOString())}
              </TD>
              <TD num dim>
                {t.quantity ?? <Dash />}
              </TD>
              <TD num>{formatPremium(t.entry_price)}</TD>
              <TD num>
                {formatPremium(t.current_premium)}
                {t.current_premium_at && (
                  <InlineFlag title="Time of the candle this mark came from">
                    {formatClock(t.current_premium_at)}
                  </InlineFlag>
                )}
              </TD>
              <TD num dim>
                {formatSpot(t.entry_spot)}
              </TD>
              <MoneyTD value={u}>{u == null ? <Dash /> : formatMoney(u)}</MoneyTD>
              <TD>
                <BrokerFlag status={t.broker_entry_status} />
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
