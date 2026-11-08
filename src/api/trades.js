import { request, query } from '@/lib/apiClient';

export function fetchRunningTrades(mode) {
  return request(`/api/trades/running?${query({ mode })}`);
}

export function fetchTrades({ status, limit = 50, offset = 0, mode } = {}) {
  return request(`/api/trades?${query({ status, limit, offset, mode })}`);
}
