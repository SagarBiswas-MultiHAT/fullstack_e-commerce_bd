'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth.context';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/account');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-outline bg-panel p-7 shadow-soft">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-brand">Welcome Back</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-fg">Login to your account</h1>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitting(true);
          setError(null);

          login(email, password)
            .then(() => {
              router.push('/account');
            })
            .catch((err) => {
              setError(err instanceof Error ? err.message : 'Login failed.');
            })
            .finally(() => {
              setSubmitting(false);
            });
        }}
      >
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs uppercase tracking-wide text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-11 w-full rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs uppercase tracking-wide text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11 w-full rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
          />
        </div>

        {error ? <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-fg px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        <p className="text-center text-xs uppercase tracking-wide text-muted">Or continue with</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="rounded-xl border border-outline px-3 py-2 text-sm text-fg">
            Google (Soon)
          </button>
          <button type="button" className="rounded-xl border border-outline px-3 py-2 text-sm text-fg">
            Facebook (Soon)
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link href="/auth/register" className="font-medium text-fg underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
