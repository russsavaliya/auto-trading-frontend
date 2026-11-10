import { Badge, InlineFlag } from '@/components/ui/Badge';
import { closeReason, priceSource, sideOf } from '@/utils/trades';

/** CALL / PUT. Indigo and orange, never green and red — those mean profit and loss here. */
export function SideBadge({ signalType, className }) {
  const side = sideOf(signalType);
  return (
    <Badge variant={side === 'CALL' ? 'call' : 'put'} className={className}>
      {side}
    </Badge>
  );
}

/** Why the position closed, in the tone utils/trades.js gives that reason. */
export function ReasonBadge({ reason }) {
  const [label, variant] = closeReason(reason);
  return <Badge variant={variant}>{label}</Badge>;
}

/** "marked" / "backfilled" beside a premium that was not a broker fill. */
export function SourceFlag({ source }) {
  const label = priceSource(source);
  if (!label) return null;
  return <InlineFlag title={`Premium source: ${source}`}>{label}</InlineFlag>;
}
