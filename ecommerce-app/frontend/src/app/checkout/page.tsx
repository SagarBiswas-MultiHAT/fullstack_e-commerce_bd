'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { BkashCheckout } from '@/components/payments/BkashCheckout';
import { StripeCheckout } from '@/components/payments/StripeCheckout';
import { apiPost } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth } from '@/context/auth.context';
import { useCart } from '@/context/cart.context';

const steps = ['Address', 'Delivery', 'Payment', 'Confirm'];

interface AddressForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bkash'>('stripe');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isPaymentComplete, setPaymentComplete] = useState(false);

  const [address, setAddress] = useState<AddressForm>({
    fullName: '',
    phone: '',
    address: '',
    city: 'Dhaka',
    postcode: '',
  });

  const shipping = useMemo(() => {
    if (!items.length) {
      return 0;
    }

    return deliveryMethod === 'express' ? 220 : 120;
  }, [deliveryMethod, items.length]);

  const grandTotal = total + shipping;

  async function placeOrder() {
    if (!isAuthenticated) {
      setError('Please login before placing an order.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = await apiPost<{ id: string }>('/store/orders', {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        addressId: `${address.city}-${address.postcode || 'default'}`,
        paymentMethod,
      });

      setPlacedOrderId(payload.id);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order could not be placed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!items.length && !placedOrderId) {
    return (
      <div className="py-14">
        <EmptyState
          title="Checkout is empty"
          description="Add items to your cart before checkout."
          ctaLabel="Go to products"
          ctaHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-5 rounded-2xl border border-outline bg-panel p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand">Checkout</p>
          <h1 className="font-display text-3xl font-semibold text-fg">Complete Your Order</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {steps.map((label, index) => {
            const current = index + 1;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(current)}
                className={[
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                  step === current
                    ? 'border-fg bg-fg text-bg'
                    : 'border-outline bg-bg-elevated text-muted hover:text-fg',
                ].join(' ')}
              >
                {current}. {label}
              </button>
            );
          })}
        </div>

        {step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Full Name"
              value={address.fullName}
              onChange={(event) => setAddress((current) => ({ ...current, fullName: event.target.value }))}
              className="h-11 rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
            <input
              placeholder="Phone"
              value={address.phone}
              onChange={(event) => setAddress((current) => ({ ...current, phone: event.target.value }))}
              className="h-11 rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
            <input
              placeholder="City"
              value={address.city}
              onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))}
              className="h-11 rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
            <input
              placeholder="Postcode"
              value={address.postcode}
              onChange={(event) => setAddress((current) => ({ ...current, postcode: event.target.value }))}
              className="h-11 rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
            />
            <textarea
              placeholder="Address"
              value={address.address}
              onChange={(event) => setAddress((current) => ({ ...current, address: event.target.value }))}
              className="sm:col-span-2 min-h-28 rounded-xl border border-outline bg-bg-elevated px-3 py-2 text-sm text-fg"
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              className="sm:col-span-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg"
            >
              Continue to Delivery
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-outline bg-bg-elevated p-4">
              <span>
                <p className="font-semibold text-fg">Standard Delivery</p>
                <p className="text-xs text-muted">2-4 business days</p>
              </span>
              <input
                type="radio"
                name="delivery"
                checked={deliveryMethod === 'standard'}
                onChange={() => setDeliveryMethod('standard')}
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-outline bg-bg-elevated p-4">
              <span>
                <p className="font-semibold text-fg">Express Delivery</p>
                <p className="text-xs text-muted">Next day in major cities</p>
              </span>
              <input
                type="radio"
                name="delivery"
                checked={deliveryMethod === 'express'}
                onChange={() => setDeliveryMethod('express')}
              />
            </label>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg"
            >
              Continue to Payment
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-outline bg-bg-elevated p-4">
              <span>
                <p className="font-semibold text-fg">Stripe Card</p>
                <p className="text-xs text-muted">Pay with debit or credit card</p>
              </span>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-outline bg-bg-elevated p-4">
              <span>
                <p className="font-semibold text-fg">bKash</p>
                <p className="text-xs text-muted">Checkout with mobile wallet</p>
              </span>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'bkash'}
                onChange={() => setPaymentMethod('bkash')}
              />
            </label>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg"
            >
              Continue to Confirm
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-outline bg-bg-elevated p-4 text-sm text-muted">
              <p>
                Deliver to <span className="font-semibold text-fg">{address.fullName || 'Customer'}</span>
              </p>
              <p>{address.phone || 'Phone not set'}</p>
              <p>{address.address || 'Address not set'}</p>
              <p>
                {address.city} {address.postcode}
              </p>
            </div>
            {error ? <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
            {placedOrderId && isPaymentComplete ? (
              <div className="space-y-3 rounded-xl border border-success bg-success-soft p-4">
                <p className="text-sm font-semibold text-success">Order placed successfully.</p>
                {paymentReference ? (
                  <p className="text-xs text-success">Payment reference: {paymentReference}</p>
                ) : null}
                <Link href={`/account/orders/${placedOrderId}`} className="text-sm text-fg underline">
                  Track your order
                </Link>
              </div>
            ) : placedOrderId && paymentMethod === 'stripe' ? (
              <div className="space-y-3 rounded-xl border border-outline bg-bg-elevated p-4">
                <p className="text-sm text-muted">Order created. Complete payment using Stripe.</p>
                <StripeCheckout
                  orderId={placedOrderId}
                  onPaid={(reference) => {
                    setPaymentReference(reference);
                    setPaymentComplete(true);
                    clearCart();
                  }}
                  onFailed={(message) => setError(message)}
                />
              </div>
            ) : placedOrderId && paymentMethod === 'bkash' ? (
              <div className="space-y-3 rounded-xl border border-outline bg-bg-elevated p-4">
                <p className="text-sm text-muted">Order created. Continue with bKash checkout.</p>
                <BkashCheckout
                  orderId={placedOrderId}
                  onPaid={(reference) => {
                    setPaymentReference(reference);
                    setPaymentComplete(true);
                    clearCart();
                  }}
                  onFailed={(message) => setError(message)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={placeOrder}
                disabled={isSubmitting}
                className="rounded-xl bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? 'Placing order...' : 'Confirm Order'}
              </button>
            )}
          </div>
        ) : null}
      </section>

      <aside className="h-fit rounded-2xl border border-outline bg-panel p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-fg">Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Items total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>Shipping</span>
            <span>{formatCurrency(shipping)}</span>
          </div>
          <div className="border-t border-outline pt-2 text-base font-semibold text-fg">
            <div className="flex items-center justify-between">
              <span>Grand total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
