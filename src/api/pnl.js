import { request, query } from '@/lib/apiClient';

export function fetchPnlSummary(mode) {
  return request(`/api/pnl/summary?${query({ mode })}`);
}

/** Per-trading-day P&L plus the running cumulative (the equity curve). */
export function fetchPnlDaily(mode) {
  return request(`/api/pnl/daily?${query({ mode })}`);
}

/**
 * Gross P&L, what it cost, and the net — plus the per-day split and the rate
 * card the charges were computed with. Backs the Report page.
 */
export function fetchPnlReport(mode) {
  return request(`/api/pnl/report?${query({ mode })}`);
}
