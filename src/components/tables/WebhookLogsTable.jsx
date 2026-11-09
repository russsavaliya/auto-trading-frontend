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
import { glossReason, logOutcome } from '@/utils/signals';

/**
 * Every inbound TradingView call, including the ones that were refused.
 *
 * The plain-English reading of each outcome lives in utils/signals.js, shared
 * with the Home status card. Outcomes are read through logOutcome() so the
 * live screen shows the LIVE result of each alert, not paper's.
 *
 * On the phone that gloss becomes the card's footer line rather than a
 * truncated cell: it is a sentence, and a sentence clipped at 24rem in a
 * side-scrolling column is the one thing on this screen worth reading in full.
 */

function OutcomeBadge({ log }) {
  const { processed, reason } = logOutcome(log);
  if (processed) return <Badge variant="profit">Traded</Badge>;
  if (!reason) return <Badge variant="warn">Pending</Badge>;
  const [, isFault] = glossReason(reason);
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
            const { reason } = logOutcome(log);
            const gloss = glossReason(reason);
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
                  title={reason ?? ''}
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
          const { reason } = logOutcome(log);
          const gloss = glossReason(reason);
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
                  <p title={reason ?? ''} className="text-muted text-xs leading-relaxed">
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
