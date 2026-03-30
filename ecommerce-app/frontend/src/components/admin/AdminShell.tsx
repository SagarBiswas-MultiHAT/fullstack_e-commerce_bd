'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { apiPost } from '@/lib/api';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/settings', label: 'Settings' },
];

function inferTitle(pathname: string) {
  const exact = links.find((item) => item.href === pathname);
  if (exact) {
    return exact.label;
  }

  if (pathname.startsWith('/admin/orders/')) {
    return 'Order Detail';
  }

  if (pathname.startsWith('/admin/customers/')) {
    return 'Customer Detail';
  }

  return 'Admin Panel';
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggingOut, setLoggingOut] = useState(false);

  const pageTitle = useMemo(() => inferTitle(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside
          className={[
            'border-r border-slate-800 bg-slate-900/80 transition-all',
            collapsed ? 'w-[84px]' : 'w-[280px]',
          ].join(' ')}
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
            <p className={['font-semibold tracking-wide', collapsed ? 'hidden' : 'block'].join(' ')}>
              BazaarFlow Admin
            </p>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="rounded-md border border-slate-700 px-2 py-1 text-xs"
            >
              {collapsed ? '>>' : '<<'}
            </button>
          </div>

          <nav className="space-y-1 p-3">
            {links.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={[
                    'block rounded-lg px-3 py-2 text-sm transition',
                    active
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    collapsed ? 'text-center' : '',
                  ].join(' ')}
                  title={collapsed ? item.label : undefined}
                >
                  {collapsed ? item.label.slice(0, 2) : item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4 backdrop-blur">
            <h1 className="text-xl font-semibold">{pageTitle}</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-300">Admin</p>
              <button
                type="button"
                onClick={() => {
                  setLoggingOut(true);
                  apiPost('/admin/auth/logout', {})
                    .finally(() => {
                      router.replace('/admin/login');
                    });
                }}
                disabled={isLoggingOut}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-60"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
