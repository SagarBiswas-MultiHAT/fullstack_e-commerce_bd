'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-panel"
        aria-label="Toggle theme"
      >
        <span className="h-4 w-4 animate-pulse rounded-full bg-muted" />
      </button>
    );
  }

  const current = theme === 'system' ? resolvedTheme : theme;

  return (
    <button
      type="button"
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-panel text-fg transition hover:scale-105"
      aria-label="Toggle dark mode"
    >
      {current === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3v2" />
          <path d="M12 19v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
          <path d="M4.93 19.07l1.41-1.41" />
          <path d="M17.66 6.34l1.41-1.41" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a1 1 0 0 1 .91 1.41A7 7 0 0 0 19.59 12a1 1 0 0 1 1.41.79z" />
        </svg>
      )}
    </button>
  );
}
