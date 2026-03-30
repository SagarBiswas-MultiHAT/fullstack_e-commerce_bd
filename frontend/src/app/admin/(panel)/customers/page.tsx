'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  orders?: Array<{ total: string }>;
}

interface CustomerListResponse {
  items: CustomerSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminCustomersPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<CustomerListResponse>('/admin/customers', {
      q: search || undefined,
      page: 1,
      limit: 100,
    })
      .then((payload) => setCustomers(payload.items))
      .finally(() => setLoading(false));
  }, [search]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSearch(query.trim());
  }

  function computeTotalSpent(customer: CustomerSummary) {
    return (customer.orders ?? []).reduce((sum, order) => sum + Number(order.total), 0);
  }

  return (
    <div className="space-y-4">
      <form className="flex max-w-lg gap-2" onSubmit={onSubmit}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        />
        <button type="submit" className="rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-300">Loading customers...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Orders</th>
                <th className="px-3 py-2">Total Spent</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-2">
                    <p className="font-medium">{customer.name || 'Unnamed customer'}</p>
                    <p className="text-xs text-slate-400">{customer.email}</p>
                  </td>
                  <td className="px-3 py-2">{customer.totalOrders}</td>
                  <td className="px-3 py-2">{formatCurrency(computeTotalSpent(customer))}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/customers/${customer.id}`} prefetch={true} className="text-sky-300 hover:underline">
                      View
                    </Link>
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
