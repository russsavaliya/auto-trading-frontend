import { useEffect, useState } from 'react';
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
import { Receipt, TrendingDown, Wallet } from 'lucide-react';
import { fetchPnlReport } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Callout, EmptyState, ErrorBanner, LoadingState } from '@/components/ui/Feedback';
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  MoneyTD,
  CardList,
  RecordCard,
  RecordHead,
  RecordValue,
  RecordMeta,
  FieldGrid,
  Field,
} from '@/components/ui/Table';
import { TooltipCard } from '@/components/charts/ChartTooltip';
import { chartColors, axisTheme, chartGeometry } from '@/lib/chartTheme';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  formatMoney,
  formatMoneyCompact,
  formatDay,
  formatPercent,
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
  const compact = useIsMobile();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchPnlReport()
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
  }, [logout]);

  if (error) return <ErrorBanner>{error}</ErrorBanner>;
  if (!data) return <LoadingState>Building report…</LoadingState>;

  const { totals, chargeBreakdown, days, rates } = data;
  const hasTrades = totals.tradeCount > 0;

  if (!hasTrades) {
    return (
      <Card>
        <CardBody>
          <EmptyState icon={Receipt}>
            No closed trades yet — there is nothing to account for.
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
          <strong className="text-ink font-semibold">
            {totals.estimatedChargeTrades} of {totals.tradeCount} trades
          </strong>{' '}
          closed before charge recording existed, so their cost is recomputed here at{' '}
          <em>today&rsquo;s</em> rates rather than the rates that actually applied. Run{' '}
          <code className="bg-warn-soft rounded px-1 py-px text-[0.75rem]">
            node scripts/backfill-charges.js --dry
          </code>{' '}
          to review, then <code className="bg-warn-soft rounded px-1 py-px text-[0.75rem]">--commit</code>{' '}
          to store them.
        </Callout>
      )}

      {/* ---- The three numbers, always together --------------------------- */}
      <Waterfall totals={totals} />

      <div className="mb-5 grid gap-4 sm:mb-6 sm:grid-cols-3">
        <MetricTile
          label="Trades"
          value={totals.tradeCount}
          sub={`${totals.wins}W / ${totals.losses}L on net · ${totals.winRate}% win rate`}
        />
        <MetricTile
          label="Avg cost per trade"
          value={formatMoney(totals.avgChargePerTrade, { showSign: false })}
          sub="Round trip, both legs"
        />
        <MetricTile
          label="Total turnover"
          value={formatMoney(totals.buyTurnover + totals.sellTurnover, { showSign: false })}
          sub="Premium traded, buy + sell"
        />
      </div>

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
                  <span className="text-ink-soft text-[0.8125rem]">
                    {COMPONENT_LABELS[key] || key}
                  </span>
                  <span className="text-ink tnum shrink-0 text-[0.8125rem] font-semibold">
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
        <CardHeader title="Day by day" description="Gross, cost and net for every trading day" />
        <CardBody>
          <DayTable days={days} />
        </CardBody>
      </Card>
    </>
  );
}

/**
 * Gross minus cost equals net, laid out so the subtraction is the visual.
 *
 * The net figure is the one sized as the headline. Gross is deliberately NOT
 * given equal weight — it is the intermediate number, and this page exists
 * because it was previously being read as the result.
 */
function Waterfall({ totals }) {
  const net = totals.netPnl;
  const eaten = totals.grossPnl > 0 ? Math.min(1, totals.charges / totals.grossPnl) : 1;

  return (
    <Card className="mb-5 sm:mb-6">
      <CardBody className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1.2fr] sm:items-center sm:gap-3">
          <Figure
            icon={Wallet}
            label="Gross P&L"
            value={formatMoney(totals.grossPnl)}
            tone={totals.grossPnl >= 0 ? 'profit' : 'loss'}
            hint="Premium difference only"
          />
          <Operator>−</Operator>
          <Figure
            icon={Receipt}
            label="Charges"
            value={formatMoney(totals.charges, { showSign: false })}
            tone="muted"
            hint={`${totals.tradeCount} round trips`}
          />
          <Operator>=</Operator>
          <Figure
            icon={TrendingDown}
            label="Net P&L"
            value={formatMoney(net)}
            tone={net >= 0 ? 'profit' : 'loss'}
            hint="What actually reaches the account"
            hero
          />
        </div>

        {totals.grossPnl > 0 && (
          <div className="border-line mt-5 border-t pt-4">
            <div className="text-muted mb-1.5 flex items-baseline justify-between text-xs">
              <span>Share of gross profit eaten by costs</span>
              <span className="text-ink tnum font-semibold">{(eaten * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-subtle h-2 overflow-hidden rounded-full">
              <div className="bg-loss h-full rounded-full" style={{ width: `${eaten * 100}%` }} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Figure({ icon: Icon, label, value, tone, hint, hero = false }) {
  const TONES = { profit: 'text-profit', loss: 'text-loss', muted: 'text-ink' };
  return (
    <div className={cn('min-w-0', hero && 'sm:border-line sm:border-l sm:pl-4')}>
      <div className="text-muted flex items-center gap-1.5 text-[0.6875rem] font-medium tracking-wide uppercase">
        {Icon && <Icon className="size-3 shrink-0" aria-hidden="true" />}
        {label}
      </div>
      <div
        className={cn(
          'tnum mt-1.5 leading-none font-semibold tracking-tight',
          hero ? 'text-[1.75rem] sm:text-[2rem]' : 'text-xl sm:text-2xl',
          TONES[tone] ?? 'text-ink'
        )}
      >
        {value}
      </div>
      {hint && <div className="text-faint mt-1.5 text-[0.6875rem]">{hint}</div>}
    </div>
  );
}

/** The − and = signs. Hidden on mobile, where the figures simply stack. */
function Operator({ children }) {
  return (
    <div className="text-faint hidden text-lg font-light sm:block" aria-hidden="true">
      {children}
    </div>
  );
}

function MetricTile({ label, value, sub }) {
  return (
    <div className="rounded-card border-line bg-surface shadow-card border p-4 sm:p-5">
      <div className="text-muted text-[0.625rem] font-medium tracking-wide uppercase sm:text-[0.6875rem]">
        {label}
      </div>
      <div className="text-ink tnum mt-2 text-xl leading-none font-semibold tracking-tight sm:text-2xl">
        {value}
      </div>
      <div className="text-muted mt-1.5 text-[0.6875rem] sm:text-xs">{sub}</div>
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
    <>
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

      <CardList>
        {rows.map((d) => (
          <RecordCard key={d.date}>
            <RecordHead
              lead={<span className="text-ink text-[0.8125rem] font-semibold">{formatDay(d.date)}</span>}
              trail={
                <>
                  <RecordValue value={d.netPnl}>{formatMoney(d.netPnl)}</RecordValue>
                  <span className="text-faint block text-[0.625rem] tracking-wide uppercase">
                    Net
                  </span>
                </>
              }
            />
            <RecordMeta>
              <span>
                {d.trades} trade{d.trades === 1 ? '' : 's'}
              </span>
            </RecordMeta>
            <FieldGrid cols={3}>
              <Field label="Gross">{formatMoney(d.grossPnl)}</Field>
              <Field label="Charges" dim>
                {formatMoney(d.charges, { showSign: false })}
              </Field>
              <Field label="Cumulative">{formatMoney(d.cumulativeNet)}</Field>
            </FieldGrid>
          </RecordCard>
        ))}
      </CardList>
    </>
  );
}
