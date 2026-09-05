import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleCheckoutSessionCompleted } from "@/lib/orders/webhook-handlers";

/**
 * Exercises business-rules.md §8 (idempotent payment/order transition) and §1 (a bundle sale
 * decrements each component, not the bundle product itself) against the real Supabase project,
 * end to end through the actual handler — not a mock. Uses real dev-sample products (a bundle
 * with two components, plus one standalone product) so this also regression-tests the bundle
 * decomposition fix made alongside this test.
 */
const admin = createAdminClient();

const BUNDLE_SKU = "ECT-KIT-WATER-BASIC";
const BUNDLE_QUANTITY = 2;
const STANDALONE_SKU = "ECT-UV-40GPM";
const STANDALONE_QUANTITY = 1;
const FAKE_PAYMENT_INTENT_ID = `pi_test_idempotency_${Date.now()}`;

let customerId: string;
let orderId: string;
let bundleProductId: string;
let standaloneProductId: string;
let componentProductIds: string[];
// inventory_movements rows only ever move current_stock forward via the apply_inventory_movement
// INSERT trigger — there is no reverse trigger on DELETE, so deleting the test's movement rows in
// afterAll would silently leave real dev-sample stock permanently decremented. Snapshot the real
// current_stock for every product this test touches and restore it directly, independent of
// whatever movements ended up existing.
let stockSnapshot: { productId: string; currentStock: number }[] = [];

function fakeSession(): Stripe.Checkout.Session {
  return {
    payment_status: "paid",
    metadata: { order_id: orderId },
    payment_intent: FAKE_PAYMENT_INTENT_ID,
    amount_total: 350780,
    currency: "eur",
    customer_details: null,
    customer_email: null,
  } as unknown as Stripe.Checkout.Session;
}

beforeAll(async () => {
  const { data: bundle } = await admin.from("products").select("id, selling_price, vat_rate").eq("sku", BUNDLE_SKU).single();
  const { data: standalone } = await admin.from("products").select("id, selling_price, vat_rate").eq("sku", STANDALONE_SKU).single();
  const { data: components } = await admin.from("product_bundle_items").select("component_product_id").eq("bundle_product_id", bundle!.id);
  bundleProductId = bundle!.id;
  standaloneProductId = standalone!.id;
  componentProductIds = (components ?? []).map((c) => c.component_product_id);

  const affectedProductIds = [standaloneProductId, ...componentProductIds];
  const { data: inventoryRows } = await admin
    .from("inventory")
    .select("product_id, current_stock")
    .in("product_id", affectedProductIds);
  stockSnapshot = (inventoryRows ?? []).map((row) => ({ productId: row.product_id, currentStock: row.current_stock }));

  const { data: user, error: userError } = await admin.auth.admin.createUser({
    email: `phase9-webhook-test-${Date.now()}@ect-marine-store.test`,
    password: "Test1234!",
    email_confirm: true,
  });
  if (userError || !user.user) throw new Error(userError?.message ?? "Failed to create test user.");
  customerId = user.user.id;

  const bundleLineTotal = bundle!.selling_price * BUNDLE_QUANTITY;
  const standaloneLineTotal = standalone!.selling_price * STANDALONE_QUANTITY;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: `ECT-TEST-${Date.now()}`,
      customer_id: customerId,
      status: "pending",
      currency: "EUR",
      subtotal: bundleLineTotal + standaloneLineTotal,
      grand_total: bundleLineTotal + standaloneLineTotal,
      stripe_checkout_session_id: `cs_test_${Date.now()}`,
    })
    .select("id")
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create test order.");
  orderId = order.id;

  await admin.from("order_items").insert([
    {
      order_id: orderId,
      product_id: bundleProductId,
      sku_snapshot: BUNDLE_SKU,
      name_snapshot: "ECT Water Basic Kit",
      unit_price: bundle!.selling_price,
      quantity: BUNDLE_QUANTITY,
      vat_rate: bundle!.vat_rate,
      line_total: bundleLineTotal,
    },
    {
      order_id: orderId,
      product_id: standaloneProductId,
      sku_snapshot: STANDALONE_SKU,
      name_snapshot: "UV-C Sterilizer System 40 GPM",
      unit_price: standalone!.selling_price,
      quantity: STANDALONE_QUANTITY,
      vat_rate: standalone!.vat_rate,
      line_total: standaloneLineTotal,
    },
  ]);
});

afterAll(async () => {
  await admin.from("inventory_movements").delete().eq("reference_id", orderId);
  await admin.from("payments").delete().eq("order_id", orderId);
  await admin.from("orders").delete().eq("id", orderId); // cascades order_items
  await admin.auth.admin.deleteUser(customerId);

  // Restore real dev-sample stock levels — see the stockSnapshot comment above for why this
  // can't just be "delete the movements and let the trigger sort it out".
  await Promise.all(
    stockSnapshot.map(({ productId, currentStock }) =>
      admin.from("inventory").update({ current_stock: currentStock }).eq("product_id", productId),
    ),
  );
});

describe("handleCheckoutSessionCompleted", () => {
  it("transitions the order to paid and records exactly one payment, even when delivered twice", async () => {
    await handleCheckoutSessionCompleted(fakeSession());
    await handleCheckoutSessionCompleted(fakeSession()); // Stripe redelivers on timeout/non-2xx

    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("paid");

    const { data: payments } = await admin.from("payments").select("id").eq("order_id", orderId);
    expect(payments).toHaveLength(1);
  });

  it("decrements each bundle component exactly once, not the bundle product itself", async () => {
    const { data: bundleMovements } = await admin
      .from("inventory_movements")
      .select("id")
      .eq("reference_id", orderId)
      .eq("product_id", bundleProductId);
    expect(bundleMovements).toHaveLength(0);

    for (const componentId of componentProductIds) {
      const { data: movements } = await admin
        .from("inventory_movements")
        .select("quantity")
        .eq("reference_id", orderId)
        .eq("product_id", componentId);
      expect(movements).toHaveLength(1);
      expect(movements![0].quantity).toBe(BUNDLE_QUANTITY); // component quantity (1) x items sold (2)
    }
  });

  it("decrements a standalone (non-bundle) product directly, exactly once", async () => {
    const { data: movements } = await admin
      .from("inventory_movements")
      .select("quantity")
      .eq("reference_id", orderId)
      .eq("product_id", standaloneProductId);
    expect(movements).toHaveLength(1);
    expect(movements![0].quantity).toBe(STANDALONE_QUANTITY);
  });
});
