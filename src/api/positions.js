import { request } from '@/lib/apiClient';

export function fetchPositions() {
  return request('/api/positions');
}
