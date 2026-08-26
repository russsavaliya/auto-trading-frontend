import { request, query } from '@/lib/apiClient';

export function fetchRunningTrades() {
  return request('/api/trades/running');
}

export function fetchTrades({ status, limit = 50, offset = 0 } = {}) {
  return request(`/api/trades?${query({ status, limit, offset })}`);
}
