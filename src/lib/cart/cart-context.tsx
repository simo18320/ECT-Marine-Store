"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  unitPrice: number;
  vatRate: number;
  quantity: number;
}

const STORAGE_KEY = "ect-marine-store:cart";
const listeners = new Set<() => void>();

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

// Evaluated once per JS realm: `[]` in the server bundle, the real stored cart in the
// browser bundle — read synchronously at module load, before React ever renders.
let cartSnapshot: CartItem[] = typeof window !== "undefined" ? readStoredCart() : [];

function setCart(next: CartItem[]) {
  cartSnapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage disabled — cart just won't persist across reloads.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cartSnapshot;
}

// useSyncExternalStore requires a stable reference when nothing changed — a fresh []
// each call looks like a change every render and loops forever.
const EMPTY_CART: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

/**
 * A single global cart shared across the app, synced with localStorage via
 * useSyncExternalStore (the SSR/hydration-safe way to read a browser-only store —
 * the server snapshot is always empty, then the real cart appears after hydration).
 */
export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((i) => i.productId === item.productId);
    const next = existing
      ? current.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        )
      : [...current, { ...item, quantity }];
    setCart(next);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart(getSnapshot().filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot();
    setCart(
      quantity <= 0
        ? current.filter((i) => i.productId !== productId)
        : current.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const clear = useCallback(() => setCart([]), []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const vatTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity * (i.vatRate / 100), 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { subtotal, vatTotal, grandTotal: subtotal + vatTotal, itemCount };
  }, [items]);

  return { items, addItem, removeItem, updateQuantity, clear, ...totals };
}
