import { request, query } from '@/lib/apiClient';

export function fetchWebhookLogs({ processed, limit = 50, offset = 0 } = {}) {
  return request(`/api/webhook-logs?${query({ processed, limit, offset })}`);
}
