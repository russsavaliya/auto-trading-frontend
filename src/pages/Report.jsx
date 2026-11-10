import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Receipt, TrendingDown } from 'lucide-react';
import { fetchPnlReport } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Callout, EmptyState, ErrorBanner, LoadingState } from '@/components/ui/Feedback';
import { Table, THead, TBody, TR, TH, TD, MoneyTD } from '@/components/ui/Table';
import { FlushList, ListRow, RowMain, RowEnd } from '@/components/ui/List';
import { TooltipCard } from '@/components/charts/ChartTooltip';
import { chartColors, axisTheme, chartGeometry } from '@/lib/chartTheme';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  formatMoney,
  formatMoneyCompact,
  formatMoneyShort,
  formatDay,
  formatPercent,
  moneyClass,
  niceBounds,
} from '@/utils/format';
import { cn } from '@/lib/cn';

/**
 * The page the charge model exists to serve.
 *
 * Every other screen in this dashboard shows GROSS premium difference, which
 * is the number the strategy produces — not the number that reaches the
 * account. At ~Rs.105 a round trip against a book whose measured expectancy is
 * around -Rs.155/trade, costs are not a footnote: they are frequently larger
 * than the result they are subtracted from.
 *
 * So the three figures are always shown TOGETHER and in the same order —
 * gross, cost, net — and never one without the others. A "total profit" on its
 * own is the single most misleading thing this system could display.
 */

const COMPONENT_LABELS = {
  brokerage: 'Brokerage',
  apiFee: 'API fee',
  stt: 'STT',
  exchangeTxn: 'Exchange txn',
  gst: 'GST',
  ipft: 'IPFT',
  sebi: 'SEBI',
  stampDuty: 'Stamp duty',
};

export default function Report() {
  const { logout } = useAuth();
  const { mode, isLive, reloadKey } = useOutletContext();
  const compact = useIsMobile();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Blank the page only when the book changes. A manual refresh (reloadKey)
  // swaps the numbers in place instead of flashing "Building report…".
  useEffect(() => {
    setData(null);
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    fetchPnlReport(mode)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError('');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          logout();
          return;
        }
        setError(err.message || 'Failed to load the report');
      });
    return () => {
      cancelled = true;
    };
  }, [logout, mode, reloadKey]);

  if (error) return <ErrorBanner>{error}</ErrorBanner>;
  if (!data) return <LoadingState>Building report…</LoadingState>;

  const { totals, chargeBreakdown, days, rates } = data;
  const hasTrades = totals.tradeCount > 0;

  if (!hasTrades) {
    return (
      <Card>
        <CardBody>
          <EmptyState icon={Receipt}>
            {isLive
              ? 'No live trades yet — this environment has not placed an order.'
              : 'No closed trades yet — there is nothing to account for.'}
          </EmptyState>
        </CardBody>
      </Card>
    );
  }

  const components = Object.entries(chargeBreakdown)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const chargeMax = components.length ? components[0][1] : 1;

  // The curve is the NET running total, not the gross one the Overview chart
  // draws. Showing a gross equity curve on a page about costs would undo the
  // whole point of the page.
  const curve = days.map((d) => ({ ...d, cumulative: d.cumulativeNet }));

  return (
    <>
      {totals.estimatedChargeTrades > 0 && (
        <Callout tone="warn">
          <p>
            <strong className="text-ink font-semibold">
              Charges are estimated for {totals.estimatedChargeTrades} of {totals.tradeCount} trades.
            </strong>{' '}
            They closed before charges were saved, so today&rsquo;s rates are used for them.
          </p>
          <details className="mt-1.5">
            <summary className="text-warn cursor-pointer text-xs font-semibold select-none">
              How to fix this
            </summary>
            <p className="mt-1.5 text-xs leading-relaxed">
              Run{' '}
              <code className="bg-warn-soft rounded px-1 py-px">node scripts/backfill-charges.js --dry</code>{' '}
              to review, then <code className="bg-warn-soft rounded px-1 py-px">--commit</code> to store
              them.
            </p>
          </details>
        </Callout>
      )}

      {/* ---- The three numbers, always together --------------------------- */}
      <Summary totals={totals} />

      <Card className="mb-5 sm:mb-6">
        <dl className="divide-line grid grid-cols-3 divide-x">
          <Stat
            label="Trades"
            value={totals.tradeCount}
            hint={
              <>
                <span className="sm:hidden">{Math.round(totals.winRate)}% won</span>
                <span className="hidden sm:inline">
                  {totals.wins} won · {totals.losses} lost · {Math.round(totals.winRate)}% after charges
                </span>
              </>
            }
          />
          <Stat
            label="Avg charge"
            value={formatMoney(totals.avgChargePerTrade, { showSign: false })}
            hint="per trade"
          />
          <Stat
            label="Turnover"
            value={formatMoneyShort(totals.buyTurnover + totals.sellTurnover)}
            hint="buy + sell"
          />
        </dl>
      </Card>

      {/* ---- Where the money went ----------------------------------------- */}
      <Card className="mb-5 sm:mb-6">
        <CardHeader
          title="What the charges were"
          description="Every component, largest first"
          actions={
            <span className="text-muted tnum text-xs">
              {formatMoney(totals.charges, { showSign: false })} total
            </span>
          }
        />
        <CardBody>
          <ul className="flex flex-col gap-3">
            {components.map(([key, value]) => (
              <li key={key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-ink text-[0.8125rem] font-medium">
                    {COMPONENT_LABELS[key] || key}
                  </span>
                  <span className="text-ink-soft tnum shrink-0 text-[0.8125rem] font-semibold">
                    {formatMoney(value, { showSign: false })}
                    <span className="text-faint ml-1.5 text-[0.6875rem] font-normal">
                      {((value / totals.charges) * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
                {/* Bars are scaled to the LARGEST component, not to the total:
                    at 40% share the biggest line would otherwise fill less
                    than half the row and the ranking would be hard to read. */}
                <div className="bg-subtle mt-1.5 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-ink/70 h-full rounded-full"
                    style={{ width: `${Math.max(2, (value / chargeMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="text-muted border-line mt-4 border-t pt-3 text-xs leading-relaxed">
            Brokerage and the API fee are flat per order, so they dominate at small size — together{' '}
            {(((chargeBreakdown.brokerage + chargeBreakdown.apiFee) / totals.charges) * 100).toFixed(
              0
            )}
            % of all costs here. STT is charged on the sell leg only, at{' '}
            {formatPercent(rates.sttSellPct)} of premium.
          </p>
        </CardBody>
      </Card>

      {/* ---- Net equity curve --------------------------------------------- */}
      <Card className="mb-5 sm:mb-6">
        <CardHeader
          title="Net equity curve"
          description="Cumulative P&L after costs, by trading day"
        />
        <CardBody>
          <NetCurve data={curve} compact={compact} />
        </CardBody>
      </Card>

      {/* ---- Day by day ---------------------------------------------------- */}
      <Card>
        <CardHeader
          title="Day by day"
          description="Net is what was left after charges · newest day first"
        />
        <CardBody className="hidden md:block">
          <DayTable days={days} />
        </CardBody>
        <DayList days={days} />
      </Card>
    </>
  );
}

/**
 * Gross − charges = net, side by side on every screen size.
 *
 * Three across even on a phone: the subtraction IS the message, and stacked
 * one per row it read as three unrelated totals — you had to scroll to learn
 * that the big red number was what the green one became. The − and = sit on
 * the dividers as small chips, so the equation costs no width.
 *
 * Net gets the tinted cell; gross does not get the emphasis it used to be
 * read with. On a phone a third of the screen is ~110px, so a long figure
 * steps its type size down instead of wrapping, and paise are set smaller.
 */
function Summary({ totals }) {
  const gross = totals.grossPnl;
  const net = totals.netPnl;

  return (
    <Card className="mb-5 sm:mb-6">
      <dl className="grid grid-cols-3">
        <Figure label="Gross" amount={gross} signed hint="Before charges" />
        <Figure label="Charges" amount={totals.charges} op="−" hint={`${totals.tradeCount} trades`} />
        <Figure label="Net" amount={net} signed op="=" hint="What you keep" emphasis />
      </dl>
      {gross > 0 && <CostShare charges={totals.charges} gross={gross} />}
    </Card>
  );
}

function Figure({ label, amount, signed = false, op, hint, emphasis = false }) {
  const text = formatMoney(amount, { showSign: signed });
  const size =
    text.length <= 8
      ? 'text-lg sm:text-2xl'
      : text.length <= 10
        ? 'text-base sm:text-2xl'
        : 'text-sm sm:text-xl lg:text-2xl';

  return (
    <div
      className={cn(
        'relative min-w-0 py-4 pr-2 pl-4 sm:px-6 sm:py-5',
        op && 'border-line border-l',
        emphasis && (amount < 0 ? 'bg-loss-soft/70' : amount > 0 ? 'bg-profit-soft/70' : '')
      )}
    >
      {op && (
        <span
          aria-hidden="true"
          className="border-line bg-surface text-ink-soft shadow-card absolute top-1/2 left-0 z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs leading-none font-semibold sm:size-6 sm:text-sm"
        >
          {op}
        </span>
      )}
      <dt className="text-ink text-xs font-semibold sm:text-[0.8125rem]">{label}</dt>
      <dd
        className={cn(
          'tnum mt-1.5 leading-tight font-semibold tracking-tight whitespace-nowrap',
          size,
          signed ? moneyClass(amount) : 'text-ink'
        )}
      >
        <Amount text={text} />
      </dd>
      <dd className="text-muted mt-1 text-[0.6875rem] leading-snug sm:text-xs">{hint}</dd>
    </div>
  );
}

/** "−₹7,340" with ".19" a size smaller: the rupees are what you read first. */
function Amount({ text }) {
  const dot = text.lastIndexOf('.');
  if (dot === -1) return text;
  return (
    <>
      {text.slice(0, dot)}
      <span className="text-[0.78em]">{text.slice(dot)}</span>
    </>
  );
}

/**
 * How much of the gross profit the charges took. Past 100% the bar is simply
 * full and the figure switches to a multiple — "2,081%" is a number nobody
 * can picture; "20.8×" is.
 */
function CostShare({ charges, gross }) {
  const ratio = charges / gross;
  const over = ratio > 1;
  const pct = Math.round(ratio * 100);

  return (
    <div className="border-line border-t px-4 py-3.5 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink text-xs font-semibold">Charges vs gross profit</span>
        <span className="text-loss tnum text-sm font-semibold">
          {over ? `${ratio.toFixed(1)}×` : `${pct}%`}
        </span>
      </div>
      <div className="bg-subtle mt-2 h-2 overflow-hidden rounded-full">
        <div className="bg-loss h-full rounded-full" style={{ width: `${Math.min(1, ratio) * 100}%` }} />
      </div>
      <p className="text-muted mt-2 text-xs">
        {over
          ? 'Charges were bigger than the whole gross profit.'
          : `Charges took ${pct}% of the gross profit.`}
      </p>
    </div>
  );
}

/** One of the three counts under the summary — a cell of a single card, not a card each. */
function Stat({ label, value, hint }) {
  return (
    <div className="min-w-0 px-4 py-3.5 sm:px-6 sm:py-5">
      <dt className="text-ink text-xs font-semibold sm:text-[0.8125rem]">{label}</dt>
      <dd className="text-ink-soft tnum mt-1.5 truncate text-base leading-tight font-semibold tracking-tight sm:text-2xl">
        {value}
      </dd>
      <dd className="text-muted mt-1 text-[0.6875rem] leading-snug sm:text-xs">{hint}</dd>
    </div>
  );
}

function NetCurve({ data, compact }) {
  if (!data.length) {
    return <EmptyState icon={TrendingDown}>No closed days yet.</EmptyState>;
  }

  const c = chartColors();
  const axis = axisTheme(c, compact);
  const geo = chartGeometry(compact);
  const last = data[data.length - 1].cumulative;
  const stroke = last < 0 ? c.loss : c.profit;
  const { domain, ticks } = niceBounds(data.map((d) => d.cumulative));

  return (
    <ResponsiveContainer width="100%" height={geo.height}>
      <AreaChart data={data} margin={geo.margin}>
        <defs>
          <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          minTickGap={compact ? 40 : 24}
          {...axis}
          axisLine={{ stroke: c.line }}
        />
        <YAxis
          tickFormatter={formatMoneyCompact}
          width={geo.yAxisWidth}
          domain={domain}
          ticks={ticks}
          {...axis}
        />
        <ReferenceLine y={0} stroke={c.lineStrong} strokeDasharray="4 4" />
        <Tooltip content={<NetTooltip />} cursor={{ stroke: c.faint, strokeDasharray: '3 3' }} />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={stroke}
          strokeWidth={2}
          fill="url(#netFill)"
          isAnimationActive={false}
          dot={compact ? false : { r: 3, fill: c.surface, stroke, strokeWidth: 2 }}
          activeDot={{ r: compact ? 4.5 : 5, fill: c.surface, stroke, strokeWidth: 2.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function NetTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipCard
      heading={formatDay(d.date)}
      rows={[
        { label: 'Net (cumulative)', value: d.cumulativeNet, display: formatMoney(d.cumulativeNet) },
        { label: 'Net that day', value: d.netPnl, display: formatMoney(d.netPnl) },
        { label: 'Gross that day', value: d.grossPnl, display: formatMoney(d.grossPnl) },
        { label: 'Cost that day', value: -d.charges, display: formatMoney(-d.charges) },
      ]}
      footer={`${d.trades} trade${d.trades === 1 ? '' : 's'}`}
    />
  );
}

function DayTable({ days }) {
  const rows = [...days].reverse(); // newest first — the day you care about

  return (
    <Table>
      <THead>
        <TR className="hover:bg-transparent">
          <TH>Date</TH>
          <TH num>Trades</TH>
          <TH num>Gross</TH>
          <TH num>Charges</TH>
          <TH num>Net</TH>
          <TH num>Cumulative net</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((d) => (
          <TR key={d.date}>
            <TD nowrap className="text-ink font-medium">
              {formatDay(d.date)}
            </TD>
            <TD num dim>
              {d.trades}
            </TD>
            <MoneyTD value={d.grossPnl}>{formatMoney(d.grossPnl)}</MoneyTD>
            <TD num dim>
              {formatMoney(d.charges, { showSign: false })}
            </TD>
            <MoneyTD value={d.netPnl}>{formatMoney(d.netPnl)}</MoneyTD>
            <MoneyTD value={d.cumulativeNet}>{formatMoney(d.cumulativeNet)}</MoneyTD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

/** Phone: one row per day — net on the right, the gross and charges behind it underneath. */
function DayList({ days }) {
  const rows = [...days].reverse();

  return (
    <FlushList className="md:hidden">
      {rows.map((d) => (
        <ListRow key={d.date}>
          <RowMain
            title={<span className="text-ink text-[0.9375rem] font-semibold">{formatDay(d.date)}</span>}
            detail={`${d.trades} trade${d.trades === 1 ? '' : 's'} · gross ${formatMoney(d.grossPnl)}`}
          />
          <RowEnd
            value={formatMoney(d.netPnl)}
            detail={`${formatMoney(d.charges, { showSign: false })} charges`}
            className={moneyClass(d.netPnl)}
          />
        </ListRow>
      ))}
    </FlushList>
  );
}
