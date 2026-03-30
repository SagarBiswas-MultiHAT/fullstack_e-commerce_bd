'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CartSummary } from '@/components/CartSummary';
import { EmptyState } from '@/components/EmptyState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/context/cart.context';

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();

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

      <CartSummary items={items} />
    </div>
  );
}
