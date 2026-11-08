import { request, setStoredPassword } from '@/lib/apiClient';

// The backend checks the password (POST /api/login against its ADMIN_PASSWORD);
// this frontend never knows the right answer. It used to compare against
// VITE_ADMIN_PASSWORD, but every VITE_* value is compiled into the public JS
// bundle — so that published the admin password to anyone who opened the site.
// Once accepted, the same password is sent as a header on every API call.
export async function login(password) {
  try {
    // password: '' so a stale stored password is never sent alongside the attempt.
    await request('/api/login', { method: 'POST', body: { password }, password: '' });
  } catch (err) {
    throw new Error(err.status === 401 ? 'Incorrect password' : err.message);
  }
  setStoredPassword(password);
}
