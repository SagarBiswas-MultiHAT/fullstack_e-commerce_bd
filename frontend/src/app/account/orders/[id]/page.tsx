'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { StatusStepper } from '@/components/StatusStepper';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order } from '@/lib/types';
import { useAuth } from '@/context/auth.context';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    apiGet<Order>(`/store/orders/${orderId}`)
      .then((payload) => {
        setOrder(payload);
      })
      .catch(() => {
        setOrder(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, isAuthenticated]);

  const subtotal = useMemo(() => {
    if (!order) {
      return 0;
    }

    return order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [order]);

  if (isLoading || loading) {
    return <p className="py-10 text-sm text-muted">Loading order details...</p>;
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Sign in required"
        description="Please login to view your order details."
        ctaLabel="Login"
        ctaHref="/auth/login"
      />
    );
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="The order ID is invalid or it is not associated with your account."
        ctaLabel="Back to account"
        ctaHref="/account"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-outline bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Order Detail</p>
            <h1 className="font-display text-3xl font-semibold text-fg">Order #{order.id.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <Link href="/account?tab=orders" className="text-sm font-medium text-fg underline">
            Back to orders
          </Link>
        </div>

        <div className="mt-6">
          <StatusStepper status={order.status} />
        </div>
      </section>

      <section className="rounded-2xl border border-outline bg-panel p-6">
        <h2 className="text-lg font-semibold text-fg">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline bg-bg-elevated p-3">
              <div>
                <p className="text-sm font-semibold text-fg">{item.product?.title ?? 'Product'}</p>
                <p className="text-xs text-muted">Quantity: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-fg">{formatCurrency(Number(item.price) * item.quantity)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-outline bg-panel p-6">
        <h2 className="text-lg font-semibold text-fg">Pricing</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>Shipping</span>
            <span>Included</span>
          </div>
          <div className="border-t border-outline pt-2 text-base font-semibold text-fg">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <a
          href="https://track.redx.com.bd"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-xl border border-outline px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg/50"
        >
          Courier tracking link
        </a>
      </section>
    </div>
  );
}
