import { ChevronRight } from 'lucide-react';
import {
  formatClock,
  formatContract,
  formatDuration,
  formatMoney,
  formatPremium,
  formatSpot,
  formatTime,
  moneyClass,
} from '@/utils/format';
import { toNumber } from '@/utils/trades';
import { InlineFlag } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD, MoneyTD, Dash } from '@/components/ui/Table';
import { FlushList, ListRow, RowMain, RowEnd } from '@/components/ui/List';
import { SideBadge } from '@/components/trades/TradeBadges';
import ContractLabel from '@/components/tables/ContractLabel';

/**
 * Open positions, marked to the option's current traded price.
 *
 * The old version showed only the entry price, which cannot tell you the one
 * thing this table exists to answer: is the position winning right now. The
 * backend attaches current_premium and unrealized_pnl from the same source
 * that prices paper fills, so an open trade and the closed trade it becomes
 * are valued consistently.
 *
 * Two arrangements of the same rows: a table from `md`, flush rows below it.
 * On the phone row the unrealised figure is the headline and the entry →
 * now premium sits under it; tapping opens the full detail sheet.
 */

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

/** Timestamp of the candle a mark came from, shown beside the mark itself. */
function MarkClock({ at }) {
  if (!at) return null;
  return <InlineFlag title="Time of the candle this mark came from">{formatClock(at)}</InlineFlag>;
}

const heldSoFar = (t) => formatDuration(t.created_at, new Date().toISOString());

/** Desktop and tablet. */
export function OpenTradesTable({ trades, onSelect }) {
  return (
    <Table>
      <THead>
        <TR className="hover:bg-transparent">
          <TH>#</TH>
          <TH>Side</TH>
          <TH>Contract</TH>
          <TH>Opened</TH>
          <TH>Held</TH>
          <TH num>Qty</TH>
          <TH num>Entry premium</TH>
          <TH num>Now</TH>
          <TH num>Index at entry</TH>
          <TH num>Unrealised</TH>
          <TH>Broker</TH>
          <TH>
            <span className="sr-only">Details</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {trades.map((t) => {
          const u = toNumber(t.unrealized_pnl);
          return (
            <TR key={t.id} onClick={() => onSelect(t)} className="cursor-pointer">
              <TD dim>{t.id}</TD>
              <TD>
                <SideBadge signalType={t.signal_type} />
              </TD>
              <TD>
                <ContractLabel trade={t} />
              </TD>
              <TD nowrap>{formatTime(t.created_at)}</TD>
              <TD dim nowrap>
                {heldSoFar(t)}
              </TD>
              <TD num dim>
                {t.quantity ?? <Dash />}
              </TD>
              <TD num>{formatPremium(t.entry_price)}</TD>
              <TD num>
                {formatPremium(t.current_premium)}
                <MarkClock at={t.current_premium_at} />
              </TD>
              <TD num dim>
                {formatSpot(t.entry_spot)}
              </TD>
              <MoneyTD value={u}>{u === null ? <Dash /> : formatMoney(u)}</MoneyTD>
              <TD>
                <BrokerFlag status={t.broker_entry_status} />
              </TD>
              <TD className="w-9 py-1.5 pr-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(t);
                  }}
                  aria-label={`Details for trade #${t.id}`}
                  className="text-faint hover:bg-subtle hover:text-ink flex size-7 items-center justify-center rounded-md transition-colors"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}

/** Phone: rows edge to edge inside the Open positions card. */
export function OpenTradesList({ trades, onSelect }) {
  return (
    <FlushList className="md:hidden">
      {trades.map((t) => {
        const u = toNumber(t.unrealized_pnl);
        return (
          <ListRow key={t.id} onClick={() => onSelect(t)}>
            <RowMain
              title={
                <>
                  <SideBadge signalType={t.signal_type} />
                  <span className="text-ink tnum truncate text-[0.9375rem] font-semibold">
                    {formatContract(t) ?? t.symbol}
                  </span>
                </>
              }
              detail={`Since ${formatClock(t.created_at)} · ${heldSoFar(t)}`}
            />
            <RowEnd
              value={u === null ? 'Updating' : formatMoney(u)}
              detail={`${formatPremium(t.entry_price)} → ${formatPremium(t.current_premium)}`}
              className={u === null ? 'text-muted' : moneyClass(u)}
            />
          </ListRow>
        );
      })}
    </FlushList>
  );
}

export default OpenTradesTable;
