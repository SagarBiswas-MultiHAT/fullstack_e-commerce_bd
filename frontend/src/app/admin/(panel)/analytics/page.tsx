'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface AnalyticsPayload {
  revenueByDay: Array<{ date: string; revenue: number }>;
  topProducts: Array<{ productId: string; title: string; quantitySold: number; revenue: number }>;
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  kpis: {
    conversionRate: number;
    averageOrderValue: number;
    returnRate: number;
  };
}

const PIE_COLORS = ['#38BDF8', '#10B981', '#F97316', '#A855F7', '#F43F5E', '#EAB308'];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30');
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<AnalyticsPayload>('/admin/analytics', { range: Number(range) })
      .then((payload) => setAnalytics(payload))
      .finally(() => setLoading(false));
  }, [range]);

  const topProducts = useMemo(() => analytics?.topProducts ?? [], [analytics]);

  if (loading) {
    return <p className="text-sm text-slate-300">Loading analytics...</p>;
  }

  if (!analytics) {
    return <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-sm text-rose-200">Analytics unavailable.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <label htmlFor="range" className="text-sm text-slate-300">
          Range
        </label>
        <select
          id="range"
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Conversion Rate</p>
          <p className="mt-1 text-2xl font-semibold">{analytics.kpis.conversionRate}%</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Avg. Order Value</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(analytics.kpis.averageOrderValue)}</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase text-slate-400">Return Rate</p>
          <p className="mt-1 text-2xl font-semibold">{analytics.kpis.returnRate}%</p>
        </article>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-semibold">Revenue by Day</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.revenueByDay}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#CBD5E1' }} />
              <YAxis tick={{ fill: '#CBD5E1' }} />
              <Tooltip
                contentStyle={{
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#38BDF8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-base font-semibold">Top Products</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={{ fill: '#CBD5E1' }} interval={0} angle={-15} height={70} />
                <YAxis tick={{ fill: '#CBD5E1' }} />
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                  }}
                />
                <Legend />
                <Bar dataKey="quantitySold" fill="#10B981" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-base font-semibold">Order Status</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.orderStatusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  fill="#8884d8"
                  label
                >
                  {analytics.orderStatusBreakdown.map((entry, index) => (
                    <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
