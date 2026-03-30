import Link from 'next/link';

const categories = [
  { label: 'Smartphones', href: '/products?category=smartphones' },
  { label: 'Home & Kitchen', href: '/products?category=home-kitchen' },
  { label: 'Fashion', href: '/products?category=fashion' },
  { label: 'Beauty', href: '/products?category=beauty' },
  { label: 'Sports', href: '/products?category=sports' },
  { label: 'Accessories', href: '/products?category=accessories' },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-outline bg-bg-elevated/70">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 lg:grid-cols-4 lg:px-6">
        <div>
          <p className="font-display text-2xl font-semibold text-fg">
            Bazaar<span className="text-brand">Flow</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Built for fast, trusted commerce experiences across Bangladesh with modern payment flexibility.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-fg">Categories</h3>
          <ul className="mt-3 space-y-2">
            {categories.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-sm text-muted transition hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-fg">Support</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/returns" className="transition hover:text-fg">
                Return Policy
              </Link>
            </li>
            <li>
              <Link href="/support" className="transition hover:text-fg">
                Customer Care
              </Link>
            </li>
            <li>
              <Link href="/shipping" className="transition hover:text-fg">
                Shipping Details
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-fg">Newsletter</h3>
          <p className="mt-3 text-sm text-muted">Get weekly flash deals and restock alerts.</p>
          <form className="mt-4 flex items-center gap-2">
            <input
              type="email"
              placeholder="you@email.com"
              className="h-10 w-full rounded-xl border border-outline bg-panel px-3 text-sm text-fg outline-none ring-brand/20 focus:ring"
            />
            <button
              type="submit"
              className="rounded-xl bg-fg px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Join
            </button>
          </form>
          <div className="mt-5 flex items-center gap-3">
            <span className="rounded-lg border border-outline bg-panel px-3 py-1 text-xs font-semibold text-fg">
              Stripe
            </span>
            <span className="rounded-lg border border-outline bg-panel px-3 py-1 text-xs font-semibold text-fg">
              bKash
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-outline/70 px-4 py-4 text-center text-xs text-muted lg:px-6">
        Copyright {new Date().getFullYear()} BazaarFlow. All rights reserved.
      </div>
    </footer>
  );
}
