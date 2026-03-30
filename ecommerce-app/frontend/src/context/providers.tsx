'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { AuthProvider } from './auth.context';
import { CartProvider } from './cart.context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
