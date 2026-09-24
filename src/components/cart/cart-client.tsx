"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { formatCurrency, withVat } from "@/lib/utils";
import { previewShipping } from "@/lib/shipping/actions";
import type { CustomerShippingView } from "@/lib/shipping/provider";

export function CartClient() {
  const { items, updateQuantity, removeItem, subtotal, vatTotal, grandTotal } = useCart();
  // Indicative shipping for Italy; the real destination is chosen at checkout. The server decides
  // (margin rules included) so the cart never promises free shipping the checkout would refuse.
  const [shipping, setShipping] = useState<CustomerShippingView | null>(null);
  const cartKey = items.map((i) => `${i.productId}:${i.quantity}`).join(",");
  useEffect(() => {
    let cancelled = false;
    if (items.length === 0) return;
    previewShipping(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      "Italia",
    ).then((view) => {
      if (!cancelled) setShipping(view);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

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
                  {formatCurrency(withVat(item.unitPrice * item.quantity, item.vatRate))}
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
                <dt className="text-muted-foreground">Subtotal (excl. VAT)</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">VAT</dt>
                <dd>{formatCurrency(vatTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-medium">Total (incl. VAT)</dt>
                <dd className="font-heading text-lg font-medium">{formatCurrency(grandTotal)}</dd>
              </div>
            </dl>
            <p
              className={`mt-3 rounded-md px-3 py-2 text-xs ${
                shipping?.kind === "free" ? "bg-status-good/10 text-status-good" : "bg-secondary text-muted-foreground"
              }`}
            >
              {shipping
                ? shipping.kind === "free"
                  ? "✓ FREE SHIPPING unlocked"
                  : shipping.kind === "quote"
                    ? "Shipping quotation required"
                    : shipping.message
                : "Shipping is calculated at checkout."}
              {shipping?.kind === "fee" && shipping.amountToFree !== null && (
                <span className="block text-[11px]">Standard shipping otherwise {formatCurrency(shipping.net)} + VAT.</span>
              )}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Final shipping is confirmed at checkout for your delivery address. Outside Italy: EU and UK online,
              other destinations by quote.
            </p>
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
