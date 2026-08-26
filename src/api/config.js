import { request } from '@/lib/apiClient';

export function fetchConfig() {
  return request('/api/config');
}

export function updateTradingEnabled(enabled) {
  return request('/api/config', { method: 'PATCH', body: { trading_enabled: enabled } });
}
