import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './navItems';

/**
 * The phone's primary navigation: a fixed bottom tab bar, below `md` only.
 *
 * Bottom rather than a hamburger drawer because all five destinations are
 * peers that an operator switches between constantly while watching a live
 * book — a drawer would put two taps and an animation in front of every one
 * of those switches. Five is the most this bar can hold at 360px and still
 * give each tab a real touch target, which is why navItems.js caps it there.
 *
 * The bar is translucent with a blur for the same reason the topbar is: the
 * page keeps scrolling underneath, and a solid slab would read as the page
 * having ended when it has not.
 */
export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="border-line bg-surface/92 pb-safe fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-lg select-none md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ path, short, label, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  // 4rem of content + the safe-area pad clears the 44px
                  // minimum comfortably, and the whole column is the target —
                  // not just the icon.
                  'group flex h-16 flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'text-ink' : 'text-muted'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* The active tab's icon sits in a filled pill — the
                      convention every phone's own apps use, so "where am I"
                      needs no reading at all. The label stays outside the
                      pill, where a fill would otherwise swallow it. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-7 w-14 items-center justify-center rounded-full transition-colors',
                      isActive ? 'bg-ink text-canvas' : 'group-active:bg-subtle'
                    )}
                  >
                    <Icon className="size-[1.125rem] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span
                    className={cn(
                      'text-[0.6875rem] leading-none tracking-tight',
                      isActive ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {short}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default MobileNav;
