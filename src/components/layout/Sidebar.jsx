import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './navItems';
import { Logo, LogoMark } from './Logo';

/**
 * Desktop navigation only — below 768px this is not rendered at all and
 * MobileNav takes over.
 *
 * It used to collapse to a 64px icon rail on phones. That rail cost ~17% of a
 * 360px viewport permanently, on every screen, to show four icons with no
 * labels — while the tables next to it were the thing actually starved of
 * width. A bottom tab bar gives the same four destinations back at zero
 * horizontal cost and inside thumb reach, so the rail is gone.
 */
export function Sidebar() {
  return (
    <aside className="border-line bg-surface sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-3 py-4 md:flex">
      <div className="mb-6 px-2">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium transition-colors',
                isActive
                  ? 'bg-ink text-canvas shadow-card'
                  : 'text-muted hover:bg-subtle hover:text-ink'
              )
            }
          >
            <Icon className="size-[1.125rem] shrink-0" strokeWidth={1.9} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
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
