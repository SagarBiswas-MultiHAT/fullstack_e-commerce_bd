'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '@/lib/types';

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  discountPrice: number | null;
  quantity: number;
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  total: number;
}

const CART_KEY = 'commerce_cart_v1';

const CartContext = createContext<CartContextValue | undefined>(undefined);

function normalizeCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    image: product.images[0] ?? '/images/placeholder-product.svg',
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    quantity,
    stock: product.stock,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      }
    } catch {
      window.localStorage.removeItem(CART_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: Product, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((item) => item.productId === product.id);
        if (!existing) {
          return [...current, normalizeCartItem(product, Math.max(1, quantity))];
        }

        return current.map((item) => {
          if (item.productId !== product.id) {
            return item;
          }

          const nextQuantity = Math.min(item.quantity + quantity, Math.max(product.stock, 1));
          return {
            ...item,
            quantity: nextQuantity,
            stock: product.stock,
          };
        });
      });
    };

    const removeItem = (productId: string) => {
      setItems((current) => current.filter((item) => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
      setItems((current) =>
        current.map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          const nextQuantity = Math.min(Math.max(1, quantity), Math.max(item.stock, 1));
          return {
            ...item,
            quantity: nextQuantity,
          };
        }),
      );
    };

    const clearCart = () => {
      setItems([]);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = items.reduce((sum, item) => {
      const unitPrice = item.discountPrice ?? item.price;
      return sum + unitPrice * item.quantity;
    }, 0);

    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      total,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}
