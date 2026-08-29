import { Inbox } from 'lucide-react';
import { formatMoney, formatPremium, formatSpot, formatTime, formatDuration } from '@/utils/format';
import { Badge, InlineFlag } from '@/components/ui/Badge';
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  MoneyTD,
  Dash,
  CardList,
  RecordCard,
  RecordHead,
  RecordValue,
  RecordMeta,
  RecordFooter,
  FieldGrid,
  Field,
} from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/Feedback';

/**
 * Closed-trade history.
 *
 * The premium/spot split is the point of this table. Before the premium
 * migration, `entry_price` held the BANK NIFTY INDEX level and P&L was computed
 * from it — which inverts the sign on every PUT trade, because the index falls
 * while the put gains. Nine of 25 closed trades were recorded with the wrong
 * sign, and the dashboard's biggest "winner" (+₹5,375) was really a −₹27 loss.
 *
 * So the two are now shown as separate, explicitly labelled columns:
 *   Premium — what the option actually cost/returned. P&L comes from THIS.
 *   Index   — where BANKNIFTY was, i.e. what you see on the TradingView chart.
 * Never merge them back into one "price" column.
 *
 * That separation is exactly what a phone must not lose, so the mobile card
 * keeps premium and index as two clearly labelled pairs — never one "price"
 * line — even though it costs a row of height to do so.
 */

function SideBadge({ signalType }) {
  const isCall = signalType?.startsWith('CALL');
  return <Badge variant={isCall ? 'call' : 'put'}>{isCall ? 'CALL' : 'PUT'}</Badge>;
}

/**
 * Why the position closed. A forced square-off is a materially different event
 * from the strategy deciding to exit — if most trades end this way, the exit
 * rule is not doing its job and the clock is running the book.
 */
function ReasonBadge({ reason }) {
  if (!reason || reason === 'signal') return <Badge variant="neutral">Signal</Badge>;

  // Premium-based exits are the good kind — they book a profit or cap a loss
  // instead of waiting for the lagging score. They get their own tone so a
  // glance down the column shows how often the strategy actually decided the
  // exit versus how often a risk rule had to.
  const premiumRules = {
    trailing_stop: 'Trail ↓',
    stop_loss: 'Stop loss',
    time_stop: 'Time stop',
  };
  if (premiumRules[reason]) return <Badge variant="brand">{premiumRules[reason]}</Badge>;

  const labels = {
    eod_square_off: 'EOD square-off',
    stale_overnight: 'Stale (overnight)',
    manual_close: 'Manual',
    force_flat_no_exit_order: 'Force-flat',
  };
  return <Badge variant="warn">{labels[reason] || reason}</Badge>;
}

/**
 * A premium that came from a market mark rather than a broker fill. The Upstox
 * sandbox never executes, so in sandbox mode this is every trade — but it must
 * stay visible, because a mark is an estimate and a fill is not.
 */
function MarkedFlag({ source }) {
  if (!source || source === 'broker_fill') return null;
  const label = source.startsWith('backfilled') ? 'backfilled' : 'marked';
  return <InlineFlag title={`Premium source: ${source}`}>{label}</InlineFlag>;
}

/** The P&L figure, or the explicit "could not be priced" state, in either layout. */
function PnlFigure({ pnl }) {
  if (pnl == null) {
    return (
      <span
        className="text-faint text-[0.8125rem] font-normal"
        title="Premium could not be determined"
      >
        unpriced
      </span>
    );
  }
  return formatMoney(pnl);
}

export default function RecentTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return <EmptyState icon={Inbox}>No trades yet.</EmptyState>;
  }

  return (
    <>
      <Table>
        <THead>
          <TR className="hover:bg-transparent">
            <TH>#</TH>
            <TH>Side</TH>
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
          </TR>
        </THead>
        <TBody>
          {trades.map((t) => {
            const pnl = t.pnl == null ? null : Number(t.pnl);
            return (
              <TR key={t.id}>
                <TD dim>{t.id}</TD>
                <TD>
                  <SideBadge signalType={t.signal_type} />
                </TD>
                <TD nowrap>{formatTime(t.created_at)}</TD>
                <TD nowrap>{formatTime(t.closed_at)}</TD>
                <TD dim nowrap>
                  {formatDuration(t.created_at, t.closed_at)}
                </TD>
                <TD num>
                  {formatPremium(t.entry_price)}
                  <MarkedFlag source={t.entry_fill_source} />
                </TD>
                <TD num>
                  {formatPremium(t.exit_price)}
                  <MarkedFlag source={t.exit_fill_source} />
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
                  <PnlFigure pnl={pnl} />
                </MoneyTD>
                <TD>
                  <ReasonBadge reason={t.closed_reason} />
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>

      <CardList>
        {trades.map((t) => {
          const pnl = t.pnl == null ? null : Number(t.pnl);
          return (
            <RecordCard key={t.id}>
              <RecordHead
                lead={
                  <>
                    <SideBadge signalType={t.signal_type} />
                    <span className="text-muted tnum text-xs">#{t.id}</span>
                  </>
                }
                trail={
                  <>
                    <RecordValue value={pnl}>
                      <PnlFigure pnl={pnl} />
                    </RecordValue>
                    <span className="text-faint block text-[0.625rem] tracking-wide uppercase">
                      P&amp;L
                    </span>
                  </>
                }
              />

              <RecordMeta>
                <span>{formatTime(t.created_at)}</span>
                <span aria-hidden="true">→</span>
                <span>{formatTime(t.closed_at)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(t.created_at, t.closed_at)}</span>
              </RecordMeta>

              <FieldGrid>
                <Field label="Premium in">
                  {formatPremium(t.entry_price)}
                  <MarkedFlag source={t.entry_fill_source} />
                </Field>
                <Field label="Premium out">
                  {formatPremium(t.exit_price)}
                  <MarkedFlag source={t.exit_fill_source} />
                </Field>
                <Field label="Index in" dim>
                  {formatSpot(t.entry_spot)}
                </Field>
                <Field label="Index out" dim>
                  {formatSpot(t.exit_spot)}
                </Field>
              </FieldGrid>

              <RecordFooter>
                <span className="text-faint text-[0.625rem] tracking-wide uppercase">
                  Closed by
                </span>
                <ReasonBadge reason={t.closed_reason} />
                <span className="text-muted tnum ml-auto text-[0.6875rem]">
                  Qty {t.quantity ?? '—'}
                </span>
              </RecordFooter>
            </RecordCard>
          );
        })}
      </CardList>
    </>
  );
}
