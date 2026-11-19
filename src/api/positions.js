import { request, query } from '@/lib/apiClient';

export function fetchPositions(mode) {
  return request(`/api/positions?${query({ mode })}`);
}

/**
 * "Close now": sells whatever is open on `symbol` in `mode`, at market,
 * through the bridge. In live mode this places a real order.
 */
export function closePosition(symbol, mode) {
  return request(`/api/positions/close?${query({ mode })}`, { method: 'POST', body: { symbol } });
}
