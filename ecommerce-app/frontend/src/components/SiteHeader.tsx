'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth.context';
import { useCart } from '@/context/cart.context';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';

function IconButton({ children, label, href }: { children: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-panel text-fg transition hover:-translate-y-0.5 hover:border-fg/60"
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-outline/80 bg-bg/90 backdrop-blur-lg">
      <div className="mx-auto flex w-[85%] items-center gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="shrink-0 rounded-xl px-2 py-1 transition hover:bg-bg-elevated">
          <p className="font-display text-xl font-semibold text-fg">
            Bazaar<span className="text-brand">Flow</span>
          </p>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <div className="relative">
            <IconButton label="Cart" href="/cart">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
                <path d="M3 4h2l2.5 11h10L20 7H7.4" />
              </svg>
            </IconButton>
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
                {itemCount}
              </span>
            ) : null}
          </div>

          <IconButton label="Wishlist" href="/account?tab=wishlist">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12.1 20.3l-1.1-1C5.1 14 2 11.2 2 7.9A4.9 4.9 0 0 1 6.9 3c1.9 0 3.7.9 4.8 2.4A6.2 6.2 0 0 1 16.5 3 4.9 4.9 0 0 1 21.4 7.9c0 3.3-3.1 6.1-8.9 11.4l-.4.4z" />
            </svg>
          </IconButton>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-panel text-fg transition hover:border-fg/60"
              aria-label="User menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </button>
            {isMenuOpen ? (
              <div className="absolute right-0 top-12 w-56 rounded-2xl border border-outline bg-panel p-2 shadow-xl">
                {isAuthenticated ? (
                  <>
                    <div className="rounded-xl px-3 py-2">
                      <p className="text-sm font-semibold text-fg">{currentUser?.name ?? 'Signed in'}</p>
                      <p className="text-xs text-muted">{currentUser?.email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="block rounded-xl px-3 py-2 text-sm text-fg transition hover:bg-bg-elevated"
                    >
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout().finally(() => setMenuOpen(false));
                      }}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-danger transition hover:bg-danger-soft"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="block rounded-xl px-3 py-2 text-sm text-fg transition hover:bg-bg-elevated"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      className="mt-1 block rounded-xl px-3 py-2 text-sm text-fg transition hover:bg-bg-elevated"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto block w-[85%] px-4 pb-3 md:hidden lg:px-6">
        <SearchBar defaultValue={pathname.startsWith('/search') ? '' : ''} />
      </div>
    </header>
  );
}
