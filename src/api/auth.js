import { setStoredPassword } from '@/lib/apiClient';

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
