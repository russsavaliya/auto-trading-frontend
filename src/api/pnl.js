import { request } from '@/lib/apiClient';

export function fetchPnlSummary() {
  return request('/api/pnl/summary');
}

export function fetchPnlMonthly() {
  return request('/api/pnl/monthly');
}

/** Per-trading-day P&L plus the running cumulative (the equity curve). */
export function fetchPnlDaily() {
  return request('/api/pnl/daily');
}

/**
 * Gross P&L, what it cost, and the net — plus the per-day split and the rate
 * card the charges were computed with. Backs the Report page.
 */
export function fetchPnlReport() {
  return request('/api/pnl/report');
}
