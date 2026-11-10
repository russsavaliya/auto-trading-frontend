import { ChevronRight } from 'lucide-react';
import {
  dayKeyIST,
  formatClock,
  formatContract,
  formatDayHeading,
  formatDuration,
  formatMoney,
  formatPremium,
  formatSpot,
  formatTime,
  groupByDay,
  moneyClass,
} from '@/utils/format';
import { closeReason, toNumber } from '@/utils/trades';
import { Table, THead, TBody, TR, TH, TD, MoneyTD, Dash } from '@/components/ui/Table';
import { ListGroup, ListRow, RowMain, RowEnd } from '@/components/ui/List';
import { SideBadge, ReasonBadge, SourceFlag } from '@/components/trades/TradeBadges';
import ContractLabel from '@/components/tables/ContractLabel';

/**
 * Closed-trade history, in two arrangements of the same rows.
 *
 * The premium/spot split is the point of the desktop table. Before the premium
 * migration, `entry_price` held the BANK NIFTY INDEX level and P&L was computed
 * from it — which inverts the sign on every PUT trade, because the index falls
 * while the put gains. Nine of 25 closed trades were recorded with the wrong
 * sign, and the dashboard's biggest "winner" (+₹5,375) was really a −₹27 loss.
 *
 * So the two are separate, explicitly labelled columns:
 *   Premium — what the option actually cost/returned. P&L comes from THIS.
 *   Index   — where BANKNIFTY was, i.e. what you see on the TradingView chart.
 * Never merge them back into one "price" column. The phone keeps the same
 * separation: its detail sheet shows them as two labelled rows.
 *
 * On a phone a trade is one row — side, contract, P&L, times, why it closed —
 * grouped under its day. Premiums, index levels, quantity and charges are one
 * tap away in the TradeSheet, which both layouts open through `onSelect`.
 */

const pnlOf = (t) => toNumber(t.pnl);

/** "Not priced" rather than a dash: a missing premium is a gap, not a break-even. */
function PnlText({ pnl }) {
  if (pnl === null) {
    return (
      <span className="text-muted text-[0.8125rem] font-normal" title="Premium could not be determined">
        Not priced
      </span>
    );
  }
  return formatMoney(pnl);
}

/** Desktop and tablet. Rows open the detail sheet too, for the charges and net. */
export function ClosedTradesTable({ trades, onSelect }) {
  return (
    <Table>
      <THead>
        <TR className="hover:bg-transparent">
          <TH>#</TH>
          <TH>Side</TH>
          <TH>Contract</TH>
          <TH>Entry</TH>
          <TH>Exit</TH>
          <TH>Held</TH>
          <TH num>Premium in</TH>
          <TH num>Premium out</TH>
          <TH num>Index in</TH>
          <TH num>Index out</TH>
          <TH num>Qty</TH>
          <TH num>P&amp;L</TH>
          <TH>Closed by</TH>
          <TH>
            <span className="sr-only">Details</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {trades.map((t) => {
          const pnl = pnlOf(t);
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
              <TD nowrap>{formatTime(t.closed_at)}</TD>
              <TD dim nowrap>
                {formatDuration(t.created_at, t.closed_at)}
              </TD>
              <TD num>
                {formatPremium(t.entry_price)}
                <SourceFlag source={t.entry_fill_source} />
              </TD>
              <TD num>
                {formatPremium(t.exit_price)}
                <SourceFlag source={t.exit_fill_source} />
              </TD>
              <TD num dim>
                {formatSpot(t.entry_spot)}
              </TD>
              <TD num dim>
                {formatSpot(t.exit_spot)}
              </TD>
              <TD num dim>
                {t.quantity ?? <Dash />}
              </TD>
              <MoneyTD value={pnl}>
                <PnlText pnl={pnl} />
              </MoneyTD>
              <TD>
                <ReasonBadge reason={t.closed_reason} />
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

/** Phone. One row per trade, grouped under its IST day. */
export function ClosedTradesList({ trades, onSelect }) {
  const groups = groupByDay(trades, (t) => t.created_at);

  return (
    <div className="md:hidden">
      {groups.map((g) => (
        <ListGroup key={g.key} heading={formatDayHeading(g.key)}>
          {g.items.map((t) => (
            <TradeRow key={t.id} trade={t} onSelect={onSelect} />
          ))}
        </ListGroup>
      ))}
    </div>
  );
}

function TradeRow({ trade, onSelect }) {
  const pnl = pnlOf(trade);
  const [reason] = closeReason(trade.closed_reason);
  const sameDay = dayKeyIST(trade.closed_at) === dayKeyIST(trade.created_at);
  const exit = sameDay ? formatClock(trade.closed_at) : formatTime(trade.closed_at);

  return (
    <ListRow onClick={() => onSelect(trade)}>
      <RowMain
        title={
          <>
            <SideBadge signalType={trade.signal_type} />
            <span className="text-ink tnum truncate text-[0.9375rem] font-semibold">
              {formatContract(trade) ?? trade.symbol}
            </span>
          </>
        }
        detail={`${formatClock(trade.created_at)} → ${exit} · ${formatDuration(trade.created_at, trade.closed_at)}`}
      />
      <RowEnd value={<PnlText pnl={pnl} />} detail={reason} className={moneyClass(pnl)} />
    </ListRow>
  );
}

export default ClosedTradesTable;
