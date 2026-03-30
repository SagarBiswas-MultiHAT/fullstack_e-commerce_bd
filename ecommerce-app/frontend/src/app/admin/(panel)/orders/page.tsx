'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

interface OrderItem {
  id: string;
  total: string;
  status: string;
  createdAt: string;
  customer?: { name: string; email: string };
}

interface OrderListResponse {
  items: OrderItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadOrders(currentStatus: string) {
    setLoading(true);
    apiGet<OrderListResponse>('/admin/orders', {
      status: currentStatus || undefined,
      page: 1,
      limit: 100,
    })
      .then((payload) => setOrders(payload.items))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders(status);
  }, [status]);

  async function updateStatus(orderId: string, nextStatus: string) {
    try {
      await apiPut(`/admin/orders/${orderId}/status`, { status: nextStatus });
      loadOrders(status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Status update failed');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-300" htmlFor="status">
          Filter status
        </label>
        <select
          id="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        >
          <option value="">All</option>
          {STATUSES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="rounded-md bg-rose-900/40 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-300">Loading orders...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-2">
                    <Link href={`/admin/orders/${order.id}`} prefetch={true} className="text-sky-300 hover:underline">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{order.customer?.name || order.customer?.email || 'N/A'}</td>
                  <td className="px-3 py-2">{formatCurrency(order.total)}</td>
                  <td className="px-3 py-2 capitalize">{order.status}</td>
                  <td className="px-3 py-2 text-slate-400">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <select
                      value={order.status}
                      onChange={(event) => updateStatus(order.id, event.target.value)}
                      className="h-8 rounded border border-slate-700 bg-slate-950 px-2 text-xs"
                    >
                      {STATUSES.map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
