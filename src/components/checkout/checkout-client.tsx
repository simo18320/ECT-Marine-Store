"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { startCheckout } from "@/lib/orders/checkout-actions";
import { formatCurrency, withVat } from "@/lib/utils";
import type { Address } from "@/lib/addresses/queries";
import { computeShipping, type ShippingSettings } from "@/lib/orders/shipping";
import { requestShippingQuote } from "@/lib/shipping-quotes/actions";

export function CheckoutClient({
  addresses,
  shippingSettings,
}: {
  addresses: Address[];
  shippingSettings: ShippingSettings;
}) {
  const { items, subtotal, vatTotal, grandTotal } = useCart();
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0];
  const [addressId, setAddressId] = useState(defaultAddress?.id ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteSent, setQuoteSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        addressId,
        acceptedTerms,
      );
      if (result?.error) setError(result.error);
    });
  }

  const selectedAddress = addresses.find((a) => a.id === addressId);
  const shipping = computeShipping({ goodsGross: grandTotal, country: selectedAddress?.country, settings: shippingSettings });
  const totalVat = vatTotal + shipping.vat;
  const totalDue = grandTotal + shipping.net + shipping.vat;

  function handleQuote() {
    setError(null);
    startTransition(async () => {
      const result = await requestShippingQuote(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        addressId,
        quoteMessage,
      );
      if (result.error) setError(result.error);
      else setQuoteSent(true);
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
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm transition has-[:checked]:border-primary has-[:checked]:shadow-sm"
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
              <span>{formatCurrency(withVat(item.unitPrice * item.quantity, item.vatRate))}</span>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal (excl. VAT)</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping (excl. VAT)</dt>
            <dd>
              {shipping.kind === "free" ? "Free" : shipping.kind === "fee" ? formatCurrency(shipping.net) : "By quote"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">VAT</dt>
            <dd>{formatCurrency(totalVat)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-medium">Total (incl. VAT)</dt>
            <dd className="font-heading text-lg font-medium">{formatCurrency(totalDue)}</dd>
          </div>
        </dl>
        {shipping.kind === "free" && (
          <p className="mt-2 text-xs text-status-good">Free shipping in Italy on orders over {formatCurrency(shippingSettings.freeThreshold)}.</p>
        )}
        {shipping.kind === "fee" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Free shipping in Italy from {formatCurrency(shippingSettings.freeThreshold)}.
          </p>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {shipping.kind === "quote" ? (
          quoteSent ? (
            <p className="mt-4 rounded-md border border-status-good/40 bg-status-good/10 px-3 py-2 text-sm text-status-good">
              Request sent. We will email you the shipping cost and how to pay.
            </p>
          ) : (
            <div className="mt-4 text-sm">
              <p className="text-muted-foreground">
                Shipping to {selectedAddress?.country} is quoted individually — you can&rsquo;t pay online for this
                destination. Send us your order and we will reply with the shipping cost.
              </p>
              <textarea
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                rows={2}
                placeholder="Notes (optional)"
                className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2"
              />
              <button
                type="button"
                onClick={handleQuote}
                disabled={isPending || !addressId}
                className="mt-3 w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md disabled:opacity-50"
              >
                {isPending ? "Sending…" : "Request a shipping quote"}
              </button>
            </div>
          )
        ) : (
          <>
        <label className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I have read and accept the{" "}
            <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
              Terms of Sale
            </Link>{" "}
            and the information on the{" "}
            <Link href="/withdrawal" target="_blank" className="font-medium text-primary hover:underline">
              right of withdrawal
            </Link>
            .
          </span>
        </label>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isPending || !addressId || !acceptedTerms}
          className="mt-4 w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md disabled:opacity-50"
        >
          {isPending ? "Redirecting to payment…" : "Place order — obligation to pay"}
        </button>
          </>
        )}
      </aside>
    </div>
  );
}
