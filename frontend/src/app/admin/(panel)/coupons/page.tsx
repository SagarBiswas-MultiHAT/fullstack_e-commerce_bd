'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadCoupons() {
    setLoading(true);
    apiGet<Coupon[]>('/admin/coupons')
      .then((payload) => setCoupons(payload))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Failed to load coupons'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await apiPost('/admin/coupons', {
        code,
        type,
        value: Number(value),
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        expiresAt: expiresAt || undefined,
      });

      setCode('');
      setType('percentage');
      setValue('');
      setUsageLimit('');
      setExpiresAt('');
      loadCoupons();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to create coupon');
    }
  }

  async function toggleActive(coupon: Coupon) {
    try {
      await apiPut(`/admin/coupons/${coupon.id}`, {
        isActive: !coupon.isActive,
      });
      loadCoupons();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update coupon');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold">Create Coupon</h2>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Code"
            required
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value as 'percentage' | 'fixed')}
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
          <input
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Value"
            required
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          />
          <input
            type="number"
            min={1}
            value={usageLimit}
            onChange={(event) => setUsageLimit(event.target.value)}
            placeholder="Usage limit (optional)"
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          />
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          />
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <button type="submit" className="rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">
            Save Coupon
          </button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        {loading ? (
          <p className="p-4 text-sm text-slate-300">Loading coupons...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Usage</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-2 font-medium">{coupon.code}</td>
                  <td className="px-3 py-2 capitalize">{coupon.type}</td>
                  <td className="px-3 py-2">{coupon.value}</td>
                  <td className="px-3 py-2">
                    {coupon.usedCount}/{coupon.usageLimit ?? '∞'}
                  </td>
                  <td className="px-3 py-2">{coupon.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(coupon)}
                      className="rounded border border-slate-700 px-2 py-1 text-xs"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
