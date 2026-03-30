'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface CustomerOrder {
  id: string;
  total: string;
  status: string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orders: CustomerOrder[];
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<CustomerDetail>(`/admin/customers/${params.id}`)
      .then((payload) => setCustomer(payload))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-slate-300">Loading customer...</p>;
  }

  if (!customer) {
    return <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-sm text-rose-200">Customer not found.</p>;
  }

  const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div className="space-y-5">
      <Link href="/admin/customers" prefetch={true} className="text-sm text-sky-300 hover:underline">
        Back to customers
      </Link>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold">{customer.name || 'Unnamed customer'}</h2>
        <p className="mt-1 text-sm text-slate-300">{customer.email}</p>
        <p className="text-sm text-slate-300">{customer.phone || 'No phone number'}</p>
        <p className="text-sm text-slate-300">Total spent: {formatCurrency(totalSpent)}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-semibold">Orders</h3>
        <div className="mt-3 space-y-2">
          {customer.orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-slate-800 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">#{order.id.slice(0, 8)}</p>
                <p className="capitalize text-slate-300">{order.status}</p>
              </div>
              <p className="text-slate-300">{formatCurrency(order.total)}</p>
              <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
