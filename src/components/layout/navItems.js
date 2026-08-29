import { LayoutDashboard, ArrowLeftRight, Webhook, Target } from 'lucide-react';

/**
 * One list, read by both the desktop sidebar and the mobile tab bar, so the
 * two can never drift apart.
 *
 * `short` exists only for the tab bar: a 360px screen divides into four ~85px
 * columns, and "Closed Trades" at a legible size does not fit one without
 * wrapping to two lines and pushing the bar taller than the icons need.
 */
export const NAV_ITEMS = [
  { path: '/', label: 'Overview', short: 'Overview', icon: LayoutDashboard },
  { path: '/closed-trades', label: 'Closed Trades', short: 'Trades', icon: ArrowLeftRight },
  { path: '/webhook-logs', label: 'Webhook Logs', short: 'Webhooks', icon: Webhook },
  { path: '/positions', label: 'Positions', short: 'Positions', icon: Target },
];

export default NAV_ITEMS;
