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
 * Open positions, marked to the option's current traded price.
 *
 * The old version showed only the entry price, which cannot tell you the one
 * thing this table exists to answer: is the position winning right now. The
 * backend now attaches current_premium and unrealized_pnl from the same source
 * that prices paper fills, so an open trade and the closed trade it becomes
 * are valued consistently.
 *
 * Two renderings of the same rows: a table from `md`, a record list below it.
 * On the phone card the unrealised figure is promoted to the headline slot,
 * because "is this winning" is the question and it should not need a sideways
 * scroll past eight other columns to answer.
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

/** The one case where BrokerFlag renders nothing — used to skip an empty footer. */
const hasBrokerFlag = (status) => status !== 'complete';

/** Timestamp of the candle a mark came from, shown beside the mark itself. */
function MarkClock({ at }) {
  if (!at) return null;
  return (
    <InlineFlag title="Time of the candle this mark came from">{formatClock(at)}</InlineFlag>
  );
}

export default function RunningTradesTable({ trades }) {
  if (!trades || trades.length === 0) {
    return <EmptyState icon={CircleSlash}>Flat — no positions open.</EmptyState>;
  }

  return (
    <>
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
                  <MarkClock at={t.current_premium_at} />
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

      <CardList>
        {trades.map((t) => {
          const u = t.unrealized_pnl == null ? null : Number(t.unrealized_pnl);
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
                    <RecordValue value={u}>
                      {u == null ? <Dash /> : formatMoney(u)}
                    </RecordValue>
                    <span className="text-faint block text-[0.625rem] tracking-wide uppercase">
                      Unrealised
                    </span>
                  </>
                }
              />

              <RecordMeta>
                <span>Opened {formatTime(t.created_at)}</span>
                <span aria-hidden="true">·</span>
                <span>held {formatDuration(t.created_at, new Date().toISOString())}</span>
              </RecordMeta>

              <FieldGrid>
                <Field label="Entry premium">{formatPremium(t.entry_price)}</Field>
                <Field label="Now">
                  {formatPremium(t.current_premium)}
                  <MarkClock at={t.current_premium_at} />
                </Field>
                <Field label="Index at entry" dim>
                  {formatSpot(t.entry_spot)}
                </Field>
                <Field label="Qty" dim>
                  {t.quantity ?? <Dash />}
                </Field>
              </FieldGrid>

              {hasBrokerFlag(t.broker_entry_status) && (
                <RecordFooter>
                  <span className="text-faint text-[0.625rem] tracking-wide uppercase">Broker</span>
                  <BrokerFlag status={t.broker_entry_status} />
                </RecordFooter>
              )}
            </RecordCard>
          );
        })}
      </CardList>
    </>
  );
}
