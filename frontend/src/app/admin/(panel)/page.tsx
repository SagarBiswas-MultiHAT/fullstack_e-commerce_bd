'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface DashboardPayload {
  stats: {
    totalRevenueThisMonth: number;
    ordersToday: number;
    newCustomersThisWeek: number;
    lowStockCount: number;
  };
  recentOrders: Array<{
    id: string;
    total: string;
    status: string;
    createdAt: string;
    customer?: { name: string | null; email: string | null };
  }>;
}

interface AnalyticsPayload {
  revenueByDay: Array<{ date: string; revenue: number }>;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<DashboardPayload>('/admin/dashboard'),
      apiGet<AnalyticsPayload>('/admin/analytics', { range: 30 }),
    ])
      .then(([dashboardPayload, analyticsPayload]) => {
        setDashboard(dashboardPayload);
        setAnalytics(analyticsPayload);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : 'Failed to load dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-300">Loading dashboard...</p>;
  }

  if (error || !dashboard) {
    return <p className="rounded-lg bg-rose-900/40 px-4 py-3 text-sm text-rose-200">{error ?? 'Unable to load dashboard'}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Revenue (Month)</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.stats.totalRevenueThisMonth)}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Orders Today</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.stats.ordersToday}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">New Customers (7d)</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.stats.newCustomersThisWeek}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Low Stock</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.stats.lowStockCount}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Revenue (Last 30 Days)</h2>
          <Link href="/admin/analytics" prefetch={true} className="text-xs text-sky-300 hover:underline">
            View analytics
          </Link>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.revenueByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-lg font-semibold">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">Order</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-800/70">
                  <td className="py-2">
                    <Link href={`/admin/orders/${order.id}`} prefetch={true} className="text-sky-300 hover:underline">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-300">{order.customer?.name || order.customer?.email || 'Guest'}</td>
                  <td className="py-2">{formatCurrency(order.total)}</td>
                  <td className="py-2 capitalize">{order.status}</td>
                  <td className="py-2 text-slate-400">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
