import { Webhook } from 'lucide-react';
import { formatTime, formatSpot } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Dash,
  CardList,
  RecordCard,
  RecordHead,
  RecordMeta,
  RecordFooter,
  FieldGrid,
  Field,
} from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/Feedback';

/**
 * Every inbound TradingView call, including the ones that were refused.
 *
 * The `reason` column is the most useful thing here and used to be raw
 * snake_case. A rejection is normal and often correct — a duplicate alert, an
 * entry past the 14:45 cutoff, a signal arriving while already in a position —
 * but you can only tell "working as designed" from "silently broken" if the
 * reason is legible. So known reasons get a plain-English gloss and are
 * grouped by whether they represent a fault.
 *
 * On the phone that gloss becomes the card's footer line rather than a
 * truncated cell: it is a sentence, and a sentence clipped at 24rem in a
 * side-scrolling column is the one thing on this screen worth reading in full.
 */

const REASONS = {
  duplicate_alert_id: ['Duplicate alert', false],
  duplicate_within_window: ['Duplicate (inside dedupe window)', false],
  trading_disabled: ['Kill switch is off', false],
  entries_disabled: ['New entries paused', false],
  past_entry_cutoff: ['Refused — past the entry cutoff', false],
  market_closed: ['Refused — market closed', false],
  missing_trade_reference: ['No linked trade to exit', true],
};

function glossReason(reason) {
  if (!reason) return null;
  const exact = REASONS[reason];
  if (exact) return exact;

  // Reasons that carry detail after a prefix, e.g. "invalid_state: already IN_CALL".
  // The daily cap and the re-entry cooldown are the system working correctly,
  // not faults — they are the rules that keep trade count down, which is the
  // one intervention measured to help in every sample. They must read as
  // "skipped on purpose", never as an error.
  if (reason.startsWith('daily_cap_reached')) {
    const n = reason.match(/(\d+) of (\d+)/);
    return [n ? `Daily cap — ${n[2]} trades already taken` : 'Daily cap reached', false];
  }
  if (reason.startsWith('re_entry_cooldown')) {
    const why = reason.match(/: (\w+) on trade/);
    return [why ? `Cooling off after ${why[1].replace('_', ' ')}` : 'Re-entry cooldown', false];
  }
  if (reason.startsWith('past_entry_cutoff'))
    return [`Refused — ${reason.replace('past_entry_cutoff ', '')}`, false];
  if (reason.startsWith('invalid_state'))
    return [reason.replace('invalid_state: ', 'Wrong state — '), false];
  if (reason.startsWith('instrument_resolution_failed'))
    return ['Could not resolve the ATM contract', true];
  if (reason.startsWith('order_failed') || reason.startsWith('exit_order_failed'))
    return ['Broker rejected the order', true];
  if (reason.startsWith('unhandled_error')) return ['Unhandled error', true];
  return [reason, true];
}

function OutcomeBadge({ log }) {
  if (log.processed) return <Badge variant="profit">Traded</Badge>;
  if (!log.reason) return <Badge variant="warn">Pending</Badge>;
  const [, isFault] = glossReason(log.reason);
  return isFault ? <Badge variant="loss">Error</Badge> : <Badge variant="neutral">Skipped</Badge>;
}

function SignalBadge({ payload }) {
  if (!payload.signal_type) return <Dash />;
  const isCall = payload.signal_type.startsWith('CALL');
  const isExit = payload.signal_type.endsWith('EXIT');
  return (
    <Badge variant={isCall ? 'call' : 'put'} ghost={isExit}>
      {payload.signal_type.replace('_', ' ')}
    </Badge>
  );
}

export default function WebhookLogsTable({ logs }) {
  if (!logs || logs.length === 0) {
    return <EmptyState icon={Webhook}>No webhook calls yet.</EmptyState>;
  }

  return (
    <>
      <Table>
        <THead>
          <TR className="hover:bg-transparent">
            <TH>Received</TH>
            <TH>Signal</TH>
            <TH>Symbol</TH>
            <TH num>Index</TH>
            <TH num>Score</TH>
            <TH>Outcome</TH>
            <TH>Detail</TH>
          </TR>
        </THead>
        <TBody>
          {logs.map((log) => {
            const p = log.raw_payload || {};
            const gloss = glossReason(log.reason);
            return (
              <TR key={log.id}>
                <TD nowrap>{formatTime(log.received_at, { withSeconds: true })}</TD>
                <TD>
                  <SignalBadge payload={p} />
                </TD>
                <TD dim>{p.symbol ?? <Dash />}</TD>
                <TD num dim>
                  {formatSpot(p.price)}
                </TD>
                <TD num dim>
                  {p.score ?? <Dash />}
                </TD>
                <TD>
                  <OutcomeBadge log={log} />
                </TD>
                <TD
                  title={log.reason ?? ''}
                  className="text-muted max-w-[24rem] text-xs break-words whitespace-normal"
                >
                  {gloss ? gloss[0] : <Dash />}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>

      <CardList>
        {logs.map((log) => {
          const p = log.raw_payload || {};
          const gloss = glossReason(log.reason);
          return (
            <RecordCard key={log.id}>
              <RecordHead
                lead={<SignalBadge payload={p} />}
                trail={<OutcomeBadge log={log} />}
              />

              <RecordMeta>
                <span>{formatTime(log.received_at, { withSeconds: true })}</span>
                {p.symbol && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{p.symbol}</span>
                  </>
                )}
              </RecordMeta>

              <FieldGrid>
                <Field label="Index" dim>
                  {formatSpot(p.price)}
                </Field>
                <Field label="Score" dim>
                  {p.score ?? <Dash />}
                </Field>
              </FieldGrid>

              {gloss && (
                <RecordFooter>
                  <p title={log.reason ?? ''} className="text-muted text-xs leading-relaxed">
                    {gloss[0]}
                  </p>
                </RecordFooter>
              )}
            </RecordCard>
          );
        })}
      </CardList>
    </>
  );
}
