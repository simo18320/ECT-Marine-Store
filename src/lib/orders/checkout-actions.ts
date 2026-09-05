"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { toStripeUnitAmount } from "./rules";
import type Stripe from "stripe";
import {
  assertStockAvailable,
  attachStripeSession,
  CheckoutError,
  createPendingOrder,
  deleteOrder,
  priceCheckoutLines,
  type CheckoutLineInput,
} from "./service";

export interface StartCheckoutResult {
  error: string;
}

export async function startCheckout(
  items: CheckoutLineInput[],
  addressId: string,
): Promise<StartCheckoutResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  if (!addressId) return { error: "Select a delivery address before checking out." };
  if (items.length === 0) return { error: "Your cart is empty." };

  let priced;
  try {
    priced = await priceCheckoutLines(items);
    await assertStockAvailable(items);
  } catch (err) {
    return { error: err instanceof CheckoutError ? err.message : "Checkout failed. Please try again." };
  }

  const order = await createPendingOrder({ customerId: user.id, addressId, lines: priced });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      // VAT is already computed server-side per product (business-rules.md §1) and baked
      // into each line's unit_amount — disable Stripe's own tax handling so it isn't
      // charged twice.
      managed_payments: { enabled: false },
      customer_email: user.email ?? undefined,
      line_items: priced.map((line) => ({
        price_data: {
          currency: "eur",
          product_data: { name: line.name },
          unit_amount: toStripeUnitAmount(line.unitPrice, line.vatRate),
        },
        quantity: line.quantity,
      })),
      success_url: `${appUrl}/checkout/success?order=${order.orderNumber}`,
      cancel_url: `${appUrl}/cart`,
      metadata: { order_id: order.id, order_number: order.orderNumber },
    });
  } catch {
    // Don't leave an unpayable "pending" order stuck in the customer's order history.
    await deleteOrder(order.id);
    return { error: "Could not start payment. Please try again." };
  }

  if (!session.url) {
    await deleteOrder(order.id);
    return { error: "Stripe did not return a checkout URL." };
  }

  await attachStripeSession(order.id, session.id);
  redirect(session.url);
}
