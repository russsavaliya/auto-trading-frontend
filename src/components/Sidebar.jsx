const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '▦' },
  { key: 'closed-trades', label: 'Closed Trades', icon: '☰' },
  { key: 'webhook-logs', label: 'Webhook Logs', icon: '⇄' },
  { key: 'positions', label: 'Positions', icon: '◉' },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">TV</span>
        <span className="sidebar-brand-text">Trading Admin</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item${active === item.key ? ' active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
