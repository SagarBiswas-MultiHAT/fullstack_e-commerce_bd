'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { apiPost } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { CouponValidationResponse } from '@/lib/types';
import type { CartItem } from '@/context/cart.context';

interface CartSummaryProps {
  items: CartItem[];
  checkoutHref?: string;
}

export function CartSummary({ items, checkoutHref = '/checkout' }: CartSummaryProps) {
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isApplying, setApplying] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity, 0),
    [items],
  );

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

  return (
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
          <div className="flex items-center justify-between" data-testid="cart-summary-total">
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
        href={checkoutHref}
        prefetch={true}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-fg px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
      >
        Proceed to Checkout
      </Link>
    </aside>
  );
}
