'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { SearchProductItem, SearchProductsResponse } from '@/lib/types';

interface SearchBarProps {
  defaultValue?: string;
  className?: string;
}

export function SearchBar({ defaultValue = '', className }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [results, setResults] = useState<SearchProductItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const placeholder = useMemo(() => 'Search phones, fashion, accessories, and more', []);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    window.addEventListener('mousedown', onDocumentMouseDown);
    return () => {
      window.removeEventListener('mousedown', onDocumentMouseDown);
    };
  }, []);

  useEffect(() => {
    const query = value.trim();

    if (!query) {
      setResults([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(() => {
      apiGet<SearchProductsResponse>('/store/search', {
        q: query,
        page: 1,
        limit: 5,
      })
        .then((response) => {
          if (cancelled) {
            return;
          }

          setResults(response.items);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          setResults([]);
          setOpen(true);
          setActiveIndex(-1);
        })
        .finally(() => {
          if (cancelled) {
            return;
          }

          setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  function goToSearchPage(queryText: string) {
    const trimmed = queryText.trim();
    setOpen(false);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  function goToProduct(slug: string) {
    setOpen(false);
    router.push(`/products/${slug}`);
  }

  const showDropdown = isOpen && Boolean(value.trim());
  const queryText = value.trim();

  return (
    <div ref={rootRef} className={`relative w-full ${className ?? ''}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            goToProduct(results[activeIndex].slug);
            return;
          }

          goToSearchPage(queryText);
        }}
        className="relative flex w-full items-center"
      >
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => {
            if (queryText) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setActiveIndex(-1);
              return;
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => {
                if (results.length === 0) {
                  return -1;
                }

                return current >= results.length - 1 ? 0 : current + 1;
              });
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => {
                if (results.length === 0) {
                  return -1;
                }

                return current <= 0 ? results.length - 1 : current - 1;
              });
            }

            if (event.key === 'Enter' && activeIndex >= 0 && activeIndex < results.length) {
              event.preventDefault();
              goToProduct(results[activeIndex].slug);
            }
          }}
          placeholder={placeholder}
          className="h-11 w-full rounded-full border border-outline bg-panel pl-11 pr-4 text-sm text-fg outline-none ring-brand/20 transition placeholder:text-muted focus:ring"
        />
        <span className="pointer-events-none absolute left-4 text-muted">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
        </span>
      </form>

      {showDropdown ? (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-outline bg-panel shadow-soft">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-outline border-t-fg" />
              Searching...
            </div>
          ) : null}

          {!isLoading && results.length ? (
            <ul className="max-h-80 overflow-auto py-2">
              {results.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goToProduct(item.slug)}
                    className={[
                      'grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 px-3 py-2 text-left transition',
                      activeIndex === index ? 'bg-bg-elevated' : 'hover:bg-bg-elevated',
                    ].join(' ')}
                  >
                    <Image
                      src={item.images[0] ?? '/images/placeholder-product.svg'}
                      alt={item.title}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{item.title}</p>
                      <p className="text-xs text-muted">{item.category?.name ?? 'Uncategorized'}</p>
                    </div>
                    <p className="text-xs font-semibold text-fg">
                      {formatCurrency(Number(item.discountPrice ?? item.price))}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {!isLoading && !results.length ? (
            <p className="px-4 py-3 text-sm text-muted">No matching products found.</p>
          ) : null}

          <div className="border-t border-outline/70 bg-bg-elevated/60 px-4 py-2">
            <Link
              href={queryText ? `/search?q=${encodeURIComponent(queryText)}` : '/search'}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-fg transition hover:text-brand"
            >
              View all results for "{queryText}" {'->'}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
