const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const SESSION_KEY = 'admin_password';

export function getStoredPassword() {
  return sessionStorage.getItem(SESSION_KEY);
}

export function setStoredPassword(password) {
  sessionStorage.setItem(SESSION_KEY, password);
}

export function clearStoredPassword() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * The single transport for every call in src/api/. Nothing else in the app
 * should touch `fetch` — a 401 has to clear the stored password everywhere it
 * happens, and that only holds if there is exactly one place it can happen.
 */
export async function request(path, { method = 'GET', body, password } = {}) {
  const pwd = password ?? getStoredPassword();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(pwd ? { 'x-admin-password': pwd } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearStoredPassword();
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

/** Builds a query string, dropping keys whose value is undefined. */
export function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, value);
  }
  return search.toString();
}
