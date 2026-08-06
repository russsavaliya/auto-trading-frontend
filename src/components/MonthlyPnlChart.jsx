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
} from 'recharts';

const GOOD = '#0ca30c';
const CRITICAL = '#e66767';

function formatMonth(key) {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { month, pnl, trades } = payload[0].payload;
  return (
    <div
      style={{
        background: '#212120',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 12.5,
        color: '#ffffff',
      }}
    >
      <div style={{ color: '#898781', marginBottom: 4 }}>{formatMonth(month)}</div>
      <div style={{ fontWeight: 600, color: pnl >= 0 ? GOOD : CRITICAL }}>
        {pnl >= 0 ? '+' : ''}
        {pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </div>
      <div style={{ color: '#c3c2b7' }}>{trades} trade{trades === 1 ? '' : 's'}</div>
    </div>
  );
}

export default function MonthlyPnlChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">No closed trades yet — the chart will fill in as trades close.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2a" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fill: '#898781', fontSize: 12 }}
          axisLine={{ stroke: '#383835' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#898781', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <ReferenceLine y={0} stroke="#383835" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="pnl" radius={[4, 4, 4, 4]} maxBarSize={36}>
          {data.map((entry) => (
            <Cell key={entry.month} fill={entry.pnl >= 0 ? GOOD : CRITICAL} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
