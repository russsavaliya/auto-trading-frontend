import { useState } from 'react';
import { AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
    <div className="bg-canvas relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      {/* A single soft wash behind the card. On a near-white canvas this is
          enough to give the page a centre of gravity; a stronger gradient
          starts competing with the card's own hairline. */}
      <div
        aria-hidden="true"
        className="from-brand-soft pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b to-transparent"
      />

      <form
        onSubmit={handleSubmit}
        className="border-line bg-surface shadow-raised relative w-full max-w-sm rounded-2xl border p-8"
      >
        <LogoMark className="size-11" />

        <h1 className="text-ink mt-5 text-lg font-semibold tracking-tight">Trading Admin</h1>
        <p className="text-muted mt-1 text-[0.8125rem]">
          Enter the admin password to continue.
        </p>

        <div className="mt-6">
          <label htmlFor="password" className="text-ink-soft mb-1.5 block text-xs font-medium">
            Password
          </label>
          <div className="relative">
            <Lock
              className="text-faint pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-9"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
        </div>

        {error && (
          <p id="login-error" role="alert" className="text-loss mt-2.5 flex items-center gap-1.5 text-xs">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="mt-6">
          Sign in
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>

        <p className="text-faint mt-6 text-center text-[0.6875rem] leading-relaxed">
          Paper trading against the Upstox sandbox. No order placed here is ever executed.
        </p>
      </form>
    </div>
  );
}
