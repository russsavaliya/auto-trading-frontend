import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: '▦' },
  { path: '/closed-trades', label: 'Closed Trades', icon: '☰' },
  { path: '/webhook-logs', label: 'Webhook Logs', icon: '⇄' },
  { path: '/positions', label: 'Positions', icon: '◉' },
];

export default function Sidebar() {
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
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            title={item.label}
            aria-label={item.label}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="sidebar-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
