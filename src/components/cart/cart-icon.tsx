"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
    >
      Cart
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-accent-foreground">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
