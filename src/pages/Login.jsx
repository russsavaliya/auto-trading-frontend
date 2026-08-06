import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    try {
      login(password);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon">📈</div>
        <h1>Trading Admin</h1>
        <p className="login-sub">Enter the admin password to continue</p>
        <input
          type="password"
          autoFocus
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
