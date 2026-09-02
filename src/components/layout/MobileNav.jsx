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
      className="border-line bg-surface/92 pb-safe fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-lg md:hidden"
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
                  // 3.5rem of content + the safe-area pad clears the 44px
                  // minimum comfortably, and the whole column is the target —
                  // not just the icon.
                  'relative flex h-14 flex-col items-center justify-center gap-1 transition-colors',
                  'active:bg-subtle',
                  isActive ? 'text-ink' : 'text-muted'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* The active marker is a bar at the top edge of the tab,
                      not a filled pill: at this size a fill would swallow the
                      label, and the bar reads as "this column" from the
                      corner of the eye. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 top-0 h-0.5 rounded-full transition-opacity',
                      isActive ? 'bg-ink opacity-100' : 'opacity-0'
                    )}
                  />
                  <Icon
                    className="size-[1.25rem] shrink-0"
                    strokeWidth={isActive ? 2.3 : 1.8}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'text-[0.625rem] leading-none tracking-tight',
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
