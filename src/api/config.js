import { request } from '@/lib/apiClient';

/**
 * The whole Settings payload in one call — kill switch, daily cap, cooldown,
 * and the charge rate card. One endpoint rather than one per setting so the
 * page can never render a half-applied state.
 */
export function fetchConfig() {
  return request('/api/config');
}

/**
 * Partial update. The server replies with the config as it now actually is,
 * read back from the database — so callers should render the RESPONSE, never
 * the value they just sent.
 */
export function updateConfig(patch) {
  return request('/api/config', { method: 'PATCH', body: patch });
}

/** Kept as its own name because the kill switch is used on its own. */
export function updateTradingEnabled(enabled) {
  return updateConfig({ trading_enabled: enabled });
}
