'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { apiPost } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { CouponValidationResponse } from '@/lib/types';
import { useCart } from '@/context/cart.context';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, total } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplying, setApplying] = useState(false);

  const shipping = total >= 2000 ? 0 : items.length ? 120 : 0;
  const grandTotal = Math.max(total - discount, 0) + shipping;

  async function applyCoupon() {
    if (!couponCode.trim()) {
      setCouponStatus('Enter a coupon code first.');
      return;
    }

    setApplying(true);
    setCouponStatus(null);

    try {
      const response = await apiPost<CouponValidationResponse>('/store/coupons/validate', {
        code: couponCode.trim(),
        orderAmount: total,
      });

      setDiscount(response.discountAmount);
      setCouponStatus(`Coupon applied: ${formatCurrency(response.discountAmount)} off`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to validate coupon.';
      setCouponStatus(message);
      setDiscount(0);
    } finally {
      setApplying(false);
    }
  }

  if (!items.length) {
    return (
      <div className="py-14">
        <EmptyState
          title="Your cart is empty"
          description="Add products to your cart and come back to complete checkout."
          ctaLabel="Browse products"
          ctaHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand">Cart</p>
          <h1 className="font-display text-3xl font-semibold text-fg">Shopping Cart</h1>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.productId}
              className="grid gap-4 rounded-2xl border border-outline bg-panel p-4 sm:grid-cols-[110px_1fr_auto] sm:items-center"
            >
              <Image
                src={item.image || '/images/placeholder-product.svg'}
                alt={item.title}
                width={240}
                height={180}
                className="h-24 w-full rounded-xl object-cover"
              />
              <div className="space-y-2">
                <Link href={`/products/${item.slug}`} className="text-base font-semibold text-fg hover:text-brand">
                  {item.title}
                </Link>
                <PriceDisplay price={item.price} discountPrice={item.discountPrice} />
                <div className="flex items-center gap-2">
                  <label htmlFor={`qty-${item.productId}`} className="text-xs uppercase tracking-wide text-muted">
                    Qty
                  </label>
                  <input
                    id={`qty-${item.productId}`}
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                    className="h-9 w-20 rounded-lg border border-outline bg-bg-elevated px-2 text-center text-sm text-fg"
                  />
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-3">
                <p className="text-sm font-semibold text-fg">
                  {formatCurrency((item.discountPrice ?? item.price) * item.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-danger underline-offset-4 hover:underline"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-outline bg-panel p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-fg">Order Summary</h2>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>Shipping</span>
            <span>{shipping ? formatCurrency(shipping) : 'Free'}</span>
          </div>
          <div className="mt-2 border-t border-outline pt-2 text-base font-semibold text-fg">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label htmlFor="coupon" className="text-xs uppercase tracking-wide text-muted">
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="SAVE20"
              className="h-10 w-full rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={isApplying}
              className="rounded-xl border border-outline px-3 text-sm font-semibold text-fg transition hover:border-fg/60 disabled:opacity-50"
            >
              {isApplying ? '...' : 'Validate'}
            </button>
          </div>
          {couponStatus ? <p className="text-xs text-muted">{couponStatus}</p> : null}
        </div>

        <Link
          href="/checkout"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-fg px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}
