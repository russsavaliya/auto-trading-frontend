import { request, query } from '@/lib/apiClient';

export function fetchPositions(mode) {
  return request(`/api/positions?${query({ mode })}`);
}
