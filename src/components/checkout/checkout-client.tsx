"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { startCheckout } from "@/lib/orders/checkout-actions";
import { formatCurrency } from "@/lib/utils";
import type { Address } from "@/lib/addresses/queries";

export function CheckoutClient({ addresses }: { addresses: Address[] }) {
  const { items, subtotal, vatTotal, grandTotal } = useCart();
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
  const [addressId, setAddressId] = useState(defaultAddress?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        addressId,
      );
      if (result?.error) setError(result.error);
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your cart is empty.{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          Continue shopping
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_18rem]">
      <div>
        <h2 className="mb-3 text-sm font-semibold">Delivery address</h2>
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm has-[:checked]:border-primary"
            >
              <input
                type="radio"
                name="addressId"
                value={address.id}
                checked={addressId === address.id}
                onChange={() => setAddressId(address.id)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{address.full_name}</span>
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.postal_code}, {address.country}
              </span>
            </label>
          ))}
        </div>
        <Link
          href="/account/addresses/new"
          className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          + Add another address
        </Link>

        <h2 className="mb-3 mt-8 text-sm font-semibold">Items</h2>
        <ul className="divide-y divide-border text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between py-2">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-md border border-border p-5">
        <h2 className="mb-4 text-sm font-semibold">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">VAT</dt>
            <dd>{formatCurrency(vatTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{formatCurrency(grandTotal)}</dd>
          </div>
        </dl>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isPending || !addressId}
          className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Redirecting to Stripe…" : "Pay with Stripe"}
        </button>
      </aside>
    </div>
  );
}
