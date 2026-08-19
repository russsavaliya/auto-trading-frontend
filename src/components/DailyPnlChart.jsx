import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { formatMoney, formatMoneyCompact, formatDay, niceBounds } from '../utils/format';

const GOOD = '#0ca30c';
const CRITICAL = '#e66767';

/**
 * P&L per trading day — a diverging bar chart centred on break-even.
 *
 * COLOUR ACCESSIBILITY: green and red are ~ΔE 7 apart under deuteranopia,
 * inside the band where colour is only permissible WITH secondary encoding.
 * Two independent channels carry the sign here, so the hue is redundant:
 *   1. bar direction — profit above the zero line, loss below;
 *   2. a direct label on every bar, always signed (+₹537 / −₹4,910).
 * Do not remove either one on the grounds that "the colour already shows it".
 *
 * Day granularity is deliberate. Monthly buckets hid that a single session
 * (10 Aug: −₹4,910 across 9 trades) accounted for more than the entire net
 * loss, while the other four days roughly cancelled out.
 */
function DayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-head">{formatDay(d.date)}</div>
      <div className="chart-tooltip-row">
        <span>Day P&amp;L</span>
        <strong className={d.pnl >= 0 ? 'good' : 'critical'}>{formatMoney(d.pnl)}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>Running total</span>
        <strong className={d.cumulative >= 0 ? 'good' : 'critical'}>{formatMoney(d.cumulative)}</strong>
      </div>
      <div className="chart-tooltip-foot">
        {d.trades} trade{d.trades === 1 ? '' : 's'} · {d.wins}W / {d.losses}L
      </div>
    </div>
  );
}

/**
 * Sign-aware direct label: above the bar for a profit, below it for a loss.
 *
 * Recharts' built-in `position="top"` anchors to the rect's top edge, which for
 * a negative bar IS the zero line — so every small loss label landed on top of
 * the baseline and collided with it. Positioning from the sign instead keeps
 * the label outside the bar in both directions.
 */
function BarValueLabel({ x, y, width, height, value }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;

  // Recharts does not guarantee `height` is positive, nor that `y` is the
  // visual top — for bars below the baseline it hands back the far edge with a
  // negative height. Deriving both edges from the pair works under either
  // convention; assuming y was the top put the big loss label inside its own
  // bar instead of beneath it.
  const top = Math.min(y, y + height);
  const bottom = Math.max(y, y + height);

  return (
    <text
      x={x + width / 2}
      y={positive ? top - 7 : bottom + 15}
      textAnchor="middle"
      fill="#c3c2b7"
      fontSize={11}
      fontWeight={600}
    >
      {formatMoneyCompact(value)}
    </text>
  );
}

export default function DailyPnlChart({ data, emptyMessage = 'No closed trades yet.' }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const { domain, ticks } = niceBounds(data.map((d) => d.pnl), { padRatio: 0.22 });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 18, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2a" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fill: '#898781', fontSize: 11.5 }}
          axisLine={{ stroke: '#383835' }}
          tickLine={false}
          minTickGap={16}
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
        <ReferenceLine y={0} stroke="#c3c2b7" />
        <Tooltip content={<DayTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        {/* Animation off: this dashboard re-fetches every 30s, and replaying a
            1.5s grow-in on each refresh makes the chart unreadable exactly when
            someone is looking at it. */}
        <Bar dataKey="pnl" radius={[4, 4, 4, 4]} maxBarSize={44} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.date} fill={d.pnl >= 0 ? GOOD : CRITICAL} />
          ))}
          {/* Secondary encoding — see the accessibility note above. */}
          <LabelList dataKey="pnl" content={<BarValueLabel />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
