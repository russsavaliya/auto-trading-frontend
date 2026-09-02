import { LayoutDashboard, Receipt, ArrowLeftRight, Webhook, SlidersHorizontal } from 'lucide-react';

/**
 * One list, read by both the desktop sidebar and the mobile tab bar, so the
 * two can never drift apart.
 *
 * Five destinations is the ceiling here: the mobile bar divides the viewport
 * into equal columns, and at 360px a sixth would leave each one under 60px —
 * narrower than the touch target the tab itself has to be. That constraint is
 * why Positions folded into Overview (it is live state, two rows, and belongs
 * beside the open position) rather than keeping a tab of its own.
 *
 * `short` is the tab-bar label: "Closed Trades" at a legible size does not fit
 * one column without wrapping to two lines.
 */
export const NAV_ITEMS = [
  { path: '/', label: 'Overview', short: 'Live', icon: LayoutDashboard },
  { path: '/report', label: 'Report', short: 'Report', icon: Receipt },
  { path: '/closed-trades', label: 'Closed Trades', short: 'Trades', icon: ArrowLeftRight },
  { path: '/webhook-logs', label: 'Webhook Logs', short: 'Logs', icon: Webhook },
  { path: '/settings', label: 'Settings', short: 'Settings', icon: SlidersHorizontal },
];

export default NAV_ITEMS;
