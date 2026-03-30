'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { apiDelete, apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { OrderListResponse, WishlistResponse } from '@/lib/types';
import { useAuth } from '@/context/auth.context';

const tabs = ['orders', 'wishlist', 'profile', 'addresses'] as const;

type AccountTab = (typeof tabs)[number];

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-success-soft text-success';
    case 'cancelled':
      return 'bg-danger-soft text-danger';
    case 'paid':
    case 'processing':
      return 'bg-warning-soft text-warning';
    default:
      return 'bg-bg-elevated text-muted';
  }
}

function normalizeTab(tab: string): AccountTab {
  if (tabs.includes(tab as AccountTab)) {
    return tab as AccountTab;
  }

  return 'orders';
}

interface AccountClientProps {
  initialTab: string;
}

export function AccountClient({ initialTab }: AccountClientProps) {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AccountTab>(() => normalizeTab(initialTab));

  const [orders, setOrders] = useState<OrderListResponse | null>(null);
  const [wishlist, setWishlist] = useState<WishlistResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name ?? '',
    phone: currentUser?.phone ?? '',
    password: '',
  });

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    setLoadingData(true);

    Promise.all([
      apiGet<OrderListResponse>('/store/orders/my', { page: 1, limit: 12 }),
      apiGet<WishlistResponse>('/store/wishlist', { page: 1, limit: 20 }),
    ])
      .then(([orderPayload, wishlistPayload]) => {
        setOrders(orderPayload);
        setWishlist(wishlistPayload);
      })
      .catch(() => {
        setOrders({
          items: [],
          pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        });
        setWishlist({
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    setProfileForm({
      name: currentUser?.name ?? '',
      phone: currentUser?.phone ?? '',
      password: '',
    });
  }, [currentUser?.name, currentUser?.phone]);

  if (isLoading) {
    return <div className="py-10 text-sm text-muted">Loading your account...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="py-14">
        <EmptyState
          title="Please sign in"
          description="Your orders, wishlist, and profile settings are available after login."
          ctaLabel="Go to login"
          ctaHref="/auth/login"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-outline bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand">Account</p>
            <h1 className="font-display text-3xl font-semibold text-fg">Welcome back, {currentUser?.name}</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              logout().catch(() => undefined);
            }}
            className="rounded-xl border border-outline px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg/50"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={`/account?tab=${tab}`}
              onClick={() => setActiveTab(tab)}
              className={[
                'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                activeTab === tab
                  ? 'bg-fg text-bg'
                  : 'border border-outline bg-panel text-muted hover:text-fg',
              ].join(' ')}
            >
              {tab}
            </Link>
          ))}
        </div>

        {loadingData ? <p className="text-sm text-muted">Loading your data...</p> : null}

        {activeTab === 'orders' ? (
          <div className="space-y-3">
            {orders?.items.length ? (
              orders.items.map((order) => (
                <article key={order.id} className="rounded-2xl border border-outline bg-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-fg">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted">Total: {formatCurrency(order.total)}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <Link href={`/account/orders/${order.id}`} className="font-medium text-fg underline">
                        View details
                      </Link>
                      <a
                        href="https://track.redx.com.bd"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-fg underline"
                      >
                        Tracking
                      </a>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title="No orders yet"
                description="Once you place your first order, you can track it from here."
                ctaLabel="Start shopping"
                ctaHref="/products"
              />
            )}
          </div>
        ) : null}

        {activeTab === 'wishlist' ? (
          <div>
            {wishlist?.items.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlist.items
                  .filter((item) => item.product)
                  .map((item) => (
                    <div key={item.id} className="space-y-2">
                      <ProductCard product={item.product!} />
                      <button
                        type="button"
                        onClick={() => {
                          apiDelete(`/store/wishlist/${item.productId}`)
                            .then(() => {
                              setWishlist((current) => {
                                if (!current) {
                                  return current;
                                }

                                return {
                                  ...current,
                                  items: current.items.filter((entry) => entry.id !== item.id),
                                };
                              });
                            })
                            .catch(() => undefined);
                        }}
                        className="w-full rounded-xl border border-outline px-3 py-2 text-sm text-muted transition hover:border-fg/50 hover:text-fg"
                      >
                        Remove from wishlist
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyState
                title="Wishlist is empty"
                description="Save your favorite items and they will appear here."
                ctaLabel="Explore products"
                ctaHref="/products"
              />
            )}
          </div>
        ) : null}

        {activeTab === 'profile' ? (
          <div className="rounded-2xl border border-outline bg-panel p-5">
            <h2 className="text-lg font-semibold text-fg">Profile</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Full name"
                className="h-11 rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
              />
              <input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Phone"
                className="h-11 rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
              />
              <input
                type="password"
                value={profileForm.password}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="New password"
                className="sm:col-span-2 h-11 rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-fg"
              />
              <button
                type="button"
                className="sm:col-span-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg"
              >
                Save changes
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'addresses' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-outline bg-panel p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Primary</p>
              <p className="mt-2 text-sm font-semibold text-fg">Home</p>
              <p className="mt-1 text-sm text-muted">House 31, Road 8, Dhanmondi, Dhaka</p>
            </article>
            <article className="rounded-2xl border border-outline bg-panel p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Secondary</p>
              <p className="mt-2 text-sm font-semibold text-fg">Office</p>
              <p className="mt-1 text-sm text-muted">Plot 12, Sector 3, Uttara, Dhaka</p>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  );
}
