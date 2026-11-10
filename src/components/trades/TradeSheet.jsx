import { TriangleAlert } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/Badge';
import { SideBadge, ReasonBadge } from '@/components/trades/TradeBadges';
import { cn } from '@/lib/cn';
import {
  dayKeyIST,
  formatClock,
  formatContract,
  formatDay,
  formatDuration,
  formatExpiry,
  formatMoney,
  formatPremium,
  formatSpot,
  formatTime,
  moneyClass,
} from '@/utils/format';
import { priceSource, toNumber } from '@/utils/trades';

/**
 * Everything about one trade, one tap away from its row.
 *
 * The list row carries only what you scan for — side, contract, P&L, time.
 * This sheet carries the rest, arranged around the question it answers: what
 * changed between entry and exit. Entry and exit therefore sit side by side,
 * one row per measure (time, option price, index), with the change printed
 * under the exit figure — the comparison is the layout, not arithmetic the
 * reader has to do.
 *
 * Works for an open trade too: the second column becomes "Now" and the P&L is
 * the current mark.
 *
 * Type rule, from the operator: a field's NAME is set darker than its value.
 * The value is still the bigger type, so it keeps the weight; the darker name
 * is what makes a column of figures quick to find your way down.
 */
export default function TradeSheet({ trade, open, onClose }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={trade ? `Trade #${trade.id}` : 'Trade'}
      header={trade && <Header trade={trade} />}
    >
      {trade && <Body trade={trade} />}
    </Sheet>
  );
}

const isOpenTrade = (t) => t.status !== 'CLOSED';

function Header({ trade }) {
  const contract = formatContract(trade);
  const line = [
    formatDay(dayKeyIST(trade.created_at)),
    trade.expiry && `Expiry ${formatExpiry(trade.expiry)}`,
    `#${trade.id}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className="flex items-center gap-2">
        <SideBadge signalType={trade.signal_type} />
        <h2 className="text-ink tnum truncate text-lg leading-tight font-semibold tracking-tight">
          {contract ?? trade.symbol}
        </h2>
        {isOpenTrade(trade) && <Badge variant="brand">Open</Badge>}
      </div>
      <p className="text-muted tnum mt-1.5 text-[0.8125rem]">{line}</p>
    </>
  );
}

function Body({ trade }) {
  const open = isOpenTrade(trade);
  const notes = [priceSource(trade.entry_fill_source), priceSource(open ? null : trade.exit_fill_source)];
  const source = notes.includes('backfilled') ? 'backfilled' : notes.includes('marked') ? 'marked' : null;

  return (
    <div className="px-5 pt-5 pb-6">
      <Result trade={trade} />
      <EntryExit trade={trade} source={source} />
      <Facts trade={trade} />

      {trade.error_message && (
        <p className="border-warn-line bg-warn-soft text-ink-soft mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed">
          <TriangleAlert className="text-warn mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{trade.error_message}</span>
        </p>
      )}

      {source && (
        <p className="text-muted mt-4 text-xs leading-relaxed">
          <span className="text-ink-soft font-medium">
            {source === 'backfilled' ? 'Backfilled' : 'Marked'}
          </span>{' '}
          {source === 'backfilled'
            ? 'prices were filled in later from market data.'
            : 'prices come from market data, not from a broker fill.'}
        </p>
      )}
    </div>
  );
}

/** The P&L, then — for a closed trade — what the charges left of it. */
function Result({ trade }) {
  const open = isOpenTrade(trade);
  const pnl = toNumber(open ? trade.unrealized_pnl : trade.pnl);
  const charges = open ? null : toNumber(trade.charges);
  const net = pnl !== null && charges !== null ? pnl - charges : null;

  return (
    <section>
      <h3 className="text-ink text-[0.8125rem] font-semibold">{open ? 'P&L right now' : 'P&L'}</h3>
      <p
        className={cn(
          'tnum mt-1 text-[2rem] leading-none font-semibold tracking-tight',
          pnl === null ? 'text-muted text-xl' : moneyClass(pnl)
        )}
      >
        {pnl === null ? 'Not priced' : formatMoney(pnl)}
      </p>

      {open ? (
        <p className="text-muted mt-2 text-xs">Charges are added when the trade closes.</p>
      ) : charges === null ? (
        <p className="text-muted mt-2 text-xs">Charges were not recorded for this trade.</p>
      ) : (
        <dl className="bg-subtle mt-4 grid grid-cols-2 rounded-xl">
          <div className="px-3.5 py-3">
            <dt className="text-ink text-xs font-semibold">Charges</dt>
            <dd className="text-ink-soft tnum mt-1 text-[0.9375rem] font-medium">
              {formatMoney(charges, { showSign: false })}
            </dd>
          </div>
          <div className="border-line border-l px-3.5 py-3">
            <dt className="text-ink text-xs font-semibold">Net P&amp;L</dt>
            <dd className={cn('tnum mt-1 text-[0.9375rem] font-semibold', moneyClass(net))}>
              {formatMoney(net)}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

/** Entry beside exit (or now), one row per measure, change under the second figure. */
function EntryExit({ trade, source }) {
  const open = isOpenTrade(trade);

  const entryPrice = toNumber(trade.entry_price);
  const exitPrice = toNumber(open ? trade.current_premium : trade.exit_price);
  const entrySpot = toNumber(trade.entry_spot);
  const exitSpot = open ? null : toNumber(trade.exit_spot);

  // The header already names the entry day, so times are clock-only — unless
  // the trade ran past midnight, when the exit has to carry its own date.
  const exitAt = open ? trade.current_premium_at : trade.closed_at;
  const sameDay = exitAt && dayKeyIST(exitAt) === dayKeyIST(trade.created_at);
  const exitTime = !exitAt ? '—' : sameDay ? formatClock(exitAt) : formatTime(exitAt);

  return (
    <section className="border-line mt-5 overflow-hidden rounded-xl border">
      <table className="tnum w-full text-[0.875rem]">
        <thead>
          <tr className="bg-subtle/70">
            <th scope="col" className="w-[38%] px-3.5 py-2.5 text-left">
              <span className="sr-only">Measure</span>
            </th>
            <th scope="col" className="text-ink px-3 py-2.5 text-right text-xs font-semibold">
              Entry
            </th>
            <th scope="col" className="text-ink px-3.5 py-2.5 text-right text-xs font-semibold">
              {open ? 'Now' : 'Exit'}
            </th>
          </tr>
        </thead>
        <tbody>
          <CompareRow label="Time" entry={formatClock(trade.created_at)} exit={exitTime} />
          <CompareRow
            label="Option price"
            note={source ? `${source} · per unit` : 'per unit'}
            entry={formatPremium(entryPrice)}
            exit={formatPremium(exitPrice)}
            change={entryPrice !== null && exitPrice !== null ? exitPrice - entryPrice : null}
            formatChange={(d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d).toFixed(2)}`}
          />
          <CompareRow
            label="BANKNIFTY"
            note="index level"
            entry={formatSpot(entrySpot)}
            exit={formatSpot(exitSpot)}
            change={entrySpot !== null && exitSpot !== null ? exitSpot - entrySpot : null}
            formatChange={(d) =>
              `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
            }
          />
        </tbody>
      </table>
    </section>
  );
}

function CompareRow({ label, note, entry, exit, change = null, formatChange }) {
  return (
    <tr className="border-line border-t">
      <th scope="row" className="px-3.5 py-3 text-left align-top">
        <span className="text-ink block text-[0.8125rem] leading-tight font-semibold">{label}</span>
        {note && <span className="text-muted mt-0.5 block text-[0.6875rem] font-normal">{note}</span>}
      </th>
      <td className="text-ink-soft px-3 py-3 text-right align-top">{entry}</td>
      <td className="text-ink-soft px-3.5 py-3 text-right align-top">
        {exit}
        {change !== null && Number.isFinite(change) && (
          <span className={cn('mt-0.5 block text-[0.6875rem] font-semibold', moneyClass(change))}>
            {formatChange(change)}
          </span>
        )}
      </td>
    </tr>
  );
}

/** The rest, as name/value rows. Rows with nothing recorded are left out, not shown as dashes. */
function Facts({ trade }) {
  const open = isOpenTrade(trade);
  const qty = toNumber(trade.quantity);
  const lotSize = toNumber(trade.lot_size);
  const lots = qty && lotSize && qty % lotSize === 0 ? qty / lotSize : null;
  const peak = toNumber(trade.peak_premium);
  const scoreIn = toNumber(trade.score_at_entry);
  const scoreOut = open ? null : toNumber(trade.score_at_exit);

  const held = formatDuration(trade.created_at, open ? new Date().toISOString() : trade.closed_at);

  const rows = [
    [open ? 'Held so far' : 'Held for', held],
    ['Quantity', qty === null ? '—' : lots ? `${qty} · ${lots} lot${lots === 1 ? '' : 's'}` : qty],
    !open && ['Closed by', <ReasonBadge key="r" reason={trade.closed_reason} />],
    peak !== null && ['Highest price', formatPremium(peak)],
    (scoreIn !== null || scoreOut !== null) && [
      'Signal score',
      scoreOut === null ? `${scoreIn} at entry` : `${scoreIn ?? '—'} → ${scoreOut}`,
    ],
    open && trade.broker_entry_status && ['Broker status', trade.broker_entry_status],
  ].filter(Boolean);

  return (
    <dl className="border-line divide-line mt-4 divide-y overflow-hidden rounded-xl border">
      {rows.map(([name, value]) => (
        <div key={name} className="flex min-h-11 items-center justify-between gap-4 px-3.5 py-2.5">
          <dt className="text-ink shrink-0 text-[0.8125rem] font-semibold">{name}</dt>
          <dd className="text-ink-soft tnum min-w-0 text-right text-[0.875rem] break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
