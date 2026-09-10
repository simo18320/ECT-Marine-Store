"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { formatCurrency } from "@/lib/utils";

export function CartClient() {
  const { items, updateQuantity, removeItem, subtotal, vatTotal, grandTotal } = useCart();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-medium">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Your cart is empty.{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Continue shopping
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_18rem]">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <Link href={`/products/${item.slug}`} className="font-medium hover:text-primary">
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                />
                <span className="w-20 text-right text-sm font-medium">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Order summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">VAT</dt>
                <dd>{formatCurrency(vatTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-medium">Total</dt>
                <dd className="font-heading text-lg font-medium">{formatCurrency(grandTotal)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-5 block w-full rounded-full bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
