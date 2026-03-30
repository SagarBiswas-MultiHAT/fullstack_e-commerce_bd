'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FormEvent, useState } from 'react';
import { apiPost } from '@/lib/api';

interface LoginResponse {
  requiresTwoFactorSetup: boolean;
  qrCodeUrl?: string;
}

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: { email: string; password: string; totpCode?: string } = {
        email,
        password,
      };

      if (totpCode.trim()) {
        payload.totpCode = totpCode.trim();
      }

      const response = await apiPost<LoginResponse>('/admin/auth/login', payload);

      if (response.requiresTwoFactorSetup && response.qrCodeUrl) {
        setQrCodeUrl(response.qrCodeUrl);
        return;
      }

      router.replace(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Admin Login</h1>
      <p className="mt-2 text-sm text-slate-300">Sign in to access the control panel.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-300" htmlFor="totpCode">
            TOTP Code
          </label>
          <input
            id="totpCode"
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value)}
            placeholder="Optional on first step"
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm"
          />
        </div>

        {error ? <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        {qrCodeUrl ? (
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">
            <p>Scan this setup URL in Google Authenticator:</p>
            <p className="mt-2 break-all text-xs text-sky-300">{qrCodeUrl}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-70"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-16 max-w-md text-sm text-slate-300">Loading admin login...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
