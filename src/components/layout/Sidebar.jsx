import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Webhook, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo, LogoMark } from './Logo';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/closed-trades', label: 'Closed Trades', icon: ArrowLeftRight },
  { path: '/webhook-logs', label: 'Webhook Logs', icon: Webhook },
  { path: '/positions', label: 'Positions', icon: Target },
];

/**
 * Below 768px the sidebar collapses to an icon rail. The nav LABEL needs its
 * own element so it can be hidden there — as a bare text node it could not be
 * targeted, and every item wrapped onto two lines inside a 64px column and
 * spilled over the content. `title`/`aria-label` keep the name reachable once
 * only the icon is visible.
 */
export function Sidebar() {
  return (
    <aside className="border-line bg-surface sticky top-0 flex h-dvh w-16 shrink-0 flex-col border-r px-2 py-4 md:w-60 md:px-3">
      <div className="mb-6 px-1 md:px-2">
        <Logo collapsed className="justify-center md:hidden" />
        <Logo className="hidden md:flex" />
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium transition-colors',
                'justify-center md:justify-start',
                isActive
                  ? 'bg-ink text-canvas shadow-card'
                  : 'text-muted hover:bg-subtle hover:text-ink'
              )
            }
          >
            <Icon className="size-[1.125rem] shrink-0" strokeWidth={1.9} aria-hidden="true" />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto hidden md:block">
        <div className="border-line bg-subtle/60 rounded-xl border p-3">
          <div className="flex items-center gap-2">
            <LogoMark className="size-5" />
            <span className="text-ink text-[0.6875rem] font-semibold">Sandbox</span>
          </div>
          <p className="text-muted mt-1.5 text-[0.6875rem] leading-relaxed">
            Orders are validated by Upstox but never filled. Every figure is a mark.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
