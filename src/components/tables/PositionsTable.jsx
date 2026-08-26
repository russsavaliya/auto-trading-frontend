import { Target } from 'lucide-react';
import { formatTime, formatDuration } from '@/utils/format';
import { Badge, InlineFlag } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD, Dash } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/Feedback';

/**
 * The state machine that gates every incoming signal.
 *
 * A symbol stuck off FLAT silently rejects every subsequent entry — no error,
 * no alert, the bot simply stops trading. That happened for real: a position
 * opened 12 Aug 14:35 never received an exit signal and blocked the symbol
 * indefinitely. So this table leads with how long the state has been held and
 * calls out anything that has sat non-FLAT for more than a session.
 */

function StateBadge({ state }) {
  const variant = state === 'FLAT' ? 'neutral' : state === 'IN_CALL' ? 'call' : 'put';
  return <Badge variant={variant}>{state}</Badge>;
}

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export default function PositionsTable({ positions }) {
  if (!positions || positions.length === 0) {
    return <EmptyState icon={Target}>No symbols tracked yet.</EmptyState>;
  }

  return (
    <Table>
      <THead>
        <TR className="hover:bg-transparent">
          <TH>Symbol</TH>
          <TH>State</TH>
          <TH num>Trade</TH>
          <TH>Since</TH>
          <TH>Held for</TH>
        </TR>
      </THead>
      <TBody>
        {positions.map((p) => {
          const heldMs = Date.now() - new Date(p.updated_at).getTime();
          const stuck = p.state !== 'FLAT' && heldMs > STALE_AFTER_MS;
          return (
            <TR key={p.symbol} warn={stuck}>
              <TD className="text-ink font-medium">{p.symbol}</TD>
              <TD>
                <StateBadge state={p.state} />
              </TD>
              <TD num dim>
                {p.current_trade_id ?? <Dash />}
              </TD>
              <TD nowrap>{formatTime(p.updated_at)}</TD>
              <TD nowrap>
                {p.state === 'FLAT' ? (
                  <Dash />
                ) : (
                  <>
                    {formatDuration(p.updated_at, new Date().toISOString())}
                    {stuck && (
                      <InlineFlag
                        tone="warn"
                        title="Open far longer than a session — new signals for this symbol are being rejected"
                      >
                        stuck
                      </InlineFlag>
                    )}
                  </>
                )}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
