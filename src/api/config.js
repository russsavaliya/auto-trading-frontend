import { request, query } from '@/lib/apiClient';

/**
 * Settings for ONE environment, plus the live connection status — which is
 * returned whichever mode is asked for, because the Settings page shows one
 * Upstox panel regardless of which environment is being viewed.
 */
export function fetchConfig(mode) {
  return request(`/api/config?${query({ mode })}`);
}

/**
 * Partial update. The server replies with the config as it now actually is,
 * read back from the database — so callers should render the RESPONSE, never
 * the value they just sent.
 */
export function updateConfig(patch, mode) {
  return request(`/api/config?${query({ mode })}`, { method: 'PATCH', body: patch });
}

/** Starts the daily Upstox reconnect. Returns the URL to open. */
export function beginUpstoxLogin() {
  return request('/api/upstox/login', { method: 'POST' });
}
