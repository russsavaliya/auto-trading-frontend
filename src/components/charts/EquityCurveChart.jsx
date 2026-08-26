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
import { TrendingUp } from 'lucide-react';
import {
  formatMoney,
  formatMoneyCompact,
  formatDay,
  formatTradeCount,
  niceBounds,
} from '@/utils/format';
import { chartColors, axisTheme } from '@/lib/chartTheme';
import { EmptyState } from '@/components/ui/Feedback';
import { TooltipCard } from './ChartTooltip';

/**
 * Cumulative realised P&L — the equity curve.
 *
 * This is the chart that answers "am I making money", which the per-month bars
 * could not: at this system's timescale a whole week of trading collapses into
 * a single bar, and a one-bar bar chart is a stat tile wearing a costume.
 *
 * Single series, so no legend is needed — the card title names it. The line
 * takes the profit hue when the curve is above water and the loss hue when
 * below, but the y-position against the zero reference line is the real
 * encoding; colour only reinforces it.
 */
function CurveTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TooltipCard
      heading={formatDay(d.date)}
      rows={[
        { label: 'Cumulative', value: d.cumulative, display: formatMoney(d.cumulative) },
        { label: 'That day', value: d.pnl, display: formatMoney(d.pnl) },
      ]}
      footer={formatTradeCount(d)}
    />
  );
}

export default function EquityCurveChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState icon={TrendingUp}>
        No closed trades yet — the curve will start once trades close.
      </EmptyState>
    );
  }

  const c = chartColors();
  const axis = axisTheme(c);
  const last = data[data.length - 1].cumulative;
  const stroke = last < 0 ? c.loss : c.profit;
  const { domain, ticks } = niceBounds(data.map((d) => d.cumulative));

  return (
    <ResponsiveContainer width="100%" height={264}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.line} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          minTickGap={24}
          {...axis}
          axisLine={{ stroke: c.line }}
        />
        <YAxis
          tickFormatter={formatMoneyCompact}
          width={58}
          domain={domain}
          ticks={ticks}
          {...axis}
        />
        {/* Break-even. The single most important line on this chart. */}
        <ReferenceLine y={0} stroke={c.lineStrong} strokeDasharray="4 4" />
        <Tooltip content={<CurveTooltip />} cursor={{ stroke: c.faint, strokeDasharray: '3 3' }} />
        {/* Animation off — see the note in DailyPnlChart. */}
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={stroke}
          strokeWidth={2}
          fill="url(#equityFill)"
          isAnimationActive={false}
          dot={{ r: 3, fill: c.surface, stroke, strokeWidth: 2 }}
          activeDot={{ r: 5, fill: c.surface, stroke, strokeWidth: 2.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
