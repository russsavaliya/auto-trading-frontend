import { Webhook } from 'lucide-react';
import { formatClock, formatDayHeading, formatSpot, formatTime, groupByDay } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD, Dash } from '@/components/ui/Table';
import { ListGroup } from '@/components/ui/List';
import { EmptyState } from '@/components/ui/Feedback';
import { glossReason, logOutcome } from '@/utils/signals';

/**
 * Every inbound TradingView call, including the ones that were refused.
 *
 * The plain-English reading of each outcome lives in utils/signals.js, shared
 * with the Home status card. Outcomes are read through logOutcome() so the
 * live screen shows the LIVE result of each alert, not paper's.
 *
 * On the phone each alert is one row under its day: what it asked for and
 * when on the first line with the outcome opposite, then the plain-English
 * reason in full — it is a sentence, and the one thing on this screen worth
 * reading whole — then the index and score in small type.
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
    </>
  );
}

/** Phone: alerts grouped under their IST day, one row each. */
export function WebhookLogsList({ logs }) {
  if (!logs || logs.length === 0) {
    return <EmptyState icon={Webhook}>No signals yet.</EmptyState>;
  }

  return (
    <div className="md:hidden">
      {groupByDay(logs, (l) => l.received_at).map((g) => (
        <ListGroup key={g.key} heading={formatDayHeading(g.key)}>
          {g.items.map((log) => (
            <SignalRow key={log.id} log={log} />
          ))}
        </ListGroup>
      ))}
    </div>
  );
}

function SignalRow({ log }) {
  const p = log.raw_payload || {};
  const { reason } = logOutcome(log);
  const gloss = glossReason(reason);
  const facts = [
    p.price != null && `Index ${formatSpot(p.price)}`,
    p.score != null && `Score ${p.score}`,
  ].filter(Boolean);

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <SignalBadge payload={p} />
          <span className="text-ink-soft tnum text-[0.8125rem] font-medium">
            {formatClock(log.received_at)}
          </span>
        </span>
        <OutcomeBadge log={log} />
      </div>
      {gloss && (
        <p title={reason ?? ''} className="text-ink mt-1.5 text-[0.8125rem] leading-snug">
          {gloss[0]}
        </p>
      )}
      {facts.length > 0 && <p className="text-muted tnum mt-1 text-xs">{facts.join(' · ')}</p>}
    </li>
  );
}
