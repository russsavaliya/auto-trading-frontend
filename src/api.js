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

async function request(path, { method = 'GET', body, password } = {}) {
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

// The correct password lives in this frontend's own env (VITE_ADMIN_PASSWORD),
// so login is just a local comparison — the same password is then sent as a
// header on every API call, and the backend independently checks it against
// its own ADMIN_PASSWORD env var before returning any data.
export function login(password) {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD;
  if (!expected) {
    throw new Error('VITE_ADMIN_PASSWORD is not set in the frontend env');
  }
  if (password !== expected) {
    throw new Error('Incorrect password');
  }
  setStoredPassword(password);
}

export function fetchPnlSummary() {
  return request('/api/pnl/summary');
}

export function fetchPnlMonthly() {
  return request('/api/pnl/monthly');
}

export function fetchRunningTrades() {
  return request('/api/trades/running');
}

export function fetchTrades({ status, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', limit);
  params.set('offset', offset);
  return request(`/api/trades?${params.toString()}`);
}

export function fetchPositions() {
  return request('/api/positions');
}
