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
import { formatMoney, formatMoneyCompact, formatDay, niceBounds } from '../utils/format';

const ACCENT = '#3987e5';
const CRITICAL = '#e66767';

/**
 * Cumulative realised P&L — the equity curve.
 *
 * This is the chart that answers "am I making money", which the per-month bars
 * could not: at this system's timescale a whole week of trading collapses into
 * a single bar, and a one-bar bar chart is a stat tile wearing a costume.
 *
 * Single series, so no legend is needed — the panel title names it. The line
 * takes the accent hue when the curve is above water and the loss hue when
 * below, but the y-position against the zero reference line is the real
 * encoding; colour only reinforces it.
 */
function CurveTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-head">{formatDay(d.date)}</div>
      <div className="chart-tooltip-row">
        <span>Cumulative</span>
        <strong className={d.cumulative >= 0 ? 'good' : 'critical'}>{formatMoney(d.cumulative)}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>That day</span>
        <strong className={d.pnl >= 0 ? 'good' : 'critical'}>{formatMoney(d.pnl)}</strong>
      </div>
      <div className="chart-tooltip-foot">
        {d.trades} trade{d.trades === 1 ? '' : 's'} · {d.wins}W / {d.losses}L
      </div>
    </div>
  );
}

export default function EquityCurveChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">No closed trades yet — the curve will start once trades close.</div>;
  }

  const last = data[data.length - 1].cumulative;
  const underwater = last < 0;
  const stroke = underwater ? CRITICAL : ACCENT;
  const { domain, ticks } = niceBounds(data.map((d) => d.cumulative));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2a" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fill: '#898781', fontSize: 11.5 }}
          axisLine={{ stroke: '#383835' }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={formatMoneyCompact}
          tick={{ fill: '#898781', fontSize: 11.5 }}
          axisLine={false}
          tickLine={false}
          width={58}
          domain={domain}
          ticks={ticks}
        />
        {/* Break-even. The single most important line on this chart. */}
        <ReferenceLine y={0} stroke="#c3c2b7" strokeDasharray="4 4" />
        <Tooltip content={<CurveTooltip />} cursor={{ stroke: '#898781', strokeDasharray: '3 3' }} />
        {/* Animation off — see the note in DailyPnlChart. */}
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={stroke}
          strokeWidth={2}
          fill="url(#equityFill)"
          isAnimationActive={false}
          dot={{ r: 3, fill: stroke, stroke: '#1a1a19', strokeWidth: 2 }}
          activeDot={{ r: 5, fill: stroke, stroke: '#1a1a19', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
