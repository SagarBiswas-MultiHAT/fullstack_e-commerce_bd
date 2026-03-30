'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface OrderDetail {
  id: string;
  status: string;
  total: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
  customer?: { name: string; email: string; phone: string | null };
  items: Array<{
    id: string;
    quantity: number;
    price: string;
    product?: { title: string };
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<OrderDetail>(`/admin/orders/${orderId}`)
      .then((payload) => setOrder(payload))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <p className="text-sm text-slate-300">Loading order detail...</p>;
  }

  if (!order) {
    return <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-sm text-rose-200">Order not found.</p>;
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" prefetch={true} className="text-sm text-sky-300 hover:underline">
        Back to orders
      </Link>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h2>
        <p className="mt-1 text-sm text-slate-300">Status: {order.status}</p>
        <p className="text-sm text-slate-300">Total: {formatCurrency(order.total)}</p>
        <p className="text-sm text-slate-300">Payment Method: {order.paymentMethod ?? 'N/A'}</p>
        <p className="text-sm text-slate-300">Payment Reference: {order.paymentReference ?? 'N/A'}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-semibold">Customer</h3>
        <p className="mt-2 text-sm text-slate-300">{order.customer?.name || 'N/A'}</p>
        <p className="text-sm text-slate-300">{order.customer?.email || 'N/A'}</p>
        <p className="text-sm text-slate-300">{order.customer?.phone || 'N/A'}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-base font-semibold">Items</h3>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2 text-sm">
              <p>{item.product?.title || 'Product'}</p>
              <p>
                {item.quantity} x {formatCurrency(item.price)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
