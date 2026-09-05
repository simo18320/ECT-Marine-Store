import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";

/**
 * Handles Stripe's `checkout.session.completed` event. Must be safe to call more than once
 * with the same session (Stripe redelivers on timeout/non-2xx) — business-rules.md §8.
 *
 * Idempotency has two independent guards:
 *  1. `payments.stripe_payment_intent_id` is unique, so the payment upsert is naturally safe
 *     to repeat.
 *  2. The order's pending → paid transition is a single atomic conditional UPDATE
 *     (`WHERE status = 'pending'`). Only the delivery that actually flips the row writes the
 *     inventory_movements rows and sends the confirmation email, so stock can never be
 *     double-decremented and the customer never gets a duplicate email, even if two
 *     deliveries for the same event arrive concurrently.
 */
export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") return; // async payment method still pending

  const orderId = session.metadata?.order_id;
  if (!orderId) return; // not a session this app created

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, status, grand_total")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  if (paymentIntentId) {
    await admin.from("payments").upsert(
      {
        order_id: order.id,
        stripe_payment_intent_id: paymentIntentId,
        status: "succeeded",
        amount: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? "eur").toUpperCase(),
        raw_event: JSON.parse(JSON.stringify(session)),
      },
      { onConflict: "stripe_payment_intent_id" },
    );
  }

  const { data: transitioned } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!transitioned) return; // already processed by an earlier delivery of this (or a retried) event

  const { data: items } = await admin
    .from("order_items")
    .select("product_id, quantity, name_snapshot, line_total")
    .eq("order_id", order.id);

  if (items && items.length > 0) {
    await admin.from("inventory_movements").insert(
      items.map((item) => ({
        product_id: item.product_id,
        movement_type: "sale" as const,
        quantity: item.quantity,
        reference_type: "order",
        reference_id: order.id,
      })),
    );
  }

  const customerEmail = session.customer_details?.email ?? session.customer_email;
  if (customerEmail) {
    await sendOrderConfirmationEmail({
      toEmail: customerEmail,
      orderNumber: order.order_number,
      grandTotal: order.grand_total,
      items: (items ?? []).map((item) => ({
        name: item.name_snapshot,
        quantity: item.quantity,
        lineTotal: item.line_total,
      })),
    });
  }
}
