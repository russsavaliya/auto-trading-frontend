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
          // The label needs its own element so the narrow-screen rail can hide
          // it. As a bare text node it could not be targeted by CSS, so at
          // <=720px the labels stayed in a 64px-wide sidebar, wrapped onto two
          // lines each and spilled over the content. `title` keeps the name
          // reachable once only the icon is visible.
          <button
            key={item.key}
            className={`sidebar-nav-item${active === item.key ? ' active' : ''}`}
            onClick={() => onNavigate(item.key)}
            title={item.label}
            aria-label={item.label}
            aria-current={active === item.key ? 'page' : undefined}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
