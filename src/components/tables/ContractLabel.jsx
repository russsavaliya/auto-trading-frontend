import { formatContract, formatExpiry } from '@/utils/format';
import { Dash } from '@/components/ui/Table';

/**
 * The option a trade actually traded: strike and side, with the expiry beside
 * it. Recorded at entry because NSE reuses instrument tokens after expiry — the
 * token alone cannot say which contract this was once the month has rolled.
 */
export default function ContractLabel({ trade }) {
  const contract = formatContract(trade);
  if (!contract) return <Dash />;
  return (
    <span className="tnum whitespace-nowrap" title={trade.trading_symbol || undefined}>
      {contract}
      {trade.expiry && <span className="text-faint ml-1.5 text-[0.6875rem]">{formatExpiry(trade.expiry)}</span>}
    </span>
  );
}
