import { createAdminClient } from "@/lib/supabase/admin";
import { computeOrderTotals, generateOrderNumber } from "./rules";

export interface CheckoutLineInput {
  productId: string;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  vatRate: number;
  quantity: number;
  lineTotal: number;
}

export class CheckoutError extends Error {}

/**
 * Prices checkout lines from the database, never the client-supplied cart — a tampered
 * localStorage price must never reach an order or a Stripe charge (business-rules.md §1).
 * Runs via the admin client because pricing/stock is core order-processing logic, not a
 * customer data read the customer's own RLS-scoped session is meant to serve.
 */
export async function priceCheckoutLines(lines: CheckoutLineInput[]): Promise<PricedLine[]> {
  if (lines.length === 0) throw new CheckoutError("Cart is empty.");

  const admin = createAdminClient();
  const productIds = lines.map((l) => l.productId);
  const { data: products, error } = await admin
    .from("products")
    .select("id, sku, name, selling_price, vat_rate, is_active")
    .in("id", productIds);

  if (error || !products) throw new CheckoutError("Could not load product pricing.");

  const bySku = new Map(products.map((p) => [p.id, p]));

  return lines.map((line) => {
    const product = bySku.get(line.productId);
    if (!product || !product.is_active) {
      throw new CheckoutError(`A product in your cart is no longer available.`);
    }
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.selling_price,
      vatRate: product.vat_rate,
      quantity: line.quantity,
      lineTotal: Math.round(product.selling_price * line.quantity * 100) / 100,
    };
  });
}

/** Throws if any line requests more than is currently available (business-rules.md §2). */
export async function assertStockAvailable(lines: CheckoutLineInput[]): Promise<void> {
  const admin = createAdminClient();
  const { data: inventory, error } = await admin
    .from("inventory")
    .select("product_id, current_stock, reserved_stock")
    .in(
      "product_id",
      lines.map((l) => l.productId),
    );

  if (error) throw new CheckoutError("Could not verify stock availability.");

  const byProduct = new Map((inventory ?? []).map((i) => [i.product_id, i]));

  for (const line of lines) {
    const stock = byProduct.get(line.productId);
    const available = stock ? stock.current_stock - stock.reserved_stock : 0;
    if (available < line.quantity) {
      throw new CheckoutError(`Not enough stock available for one of the items in your cart.`);
    }
  }
}

export interface CreatePendingOrderInput {
  customerId: string;
  addressId: string;
  lines: PricedLine[];
}

export interface PendingOrder {
  id: string;
  orderNumber: string;
  grandTotal: number;
}

export async function createPendingOrder({
  customerId,
  addressId,
  lines,
}: CreatePendingOrderInput): Promise<PendingOrder> {
  const admin = createAdminClient();
  const totals = computeOrderTotals(lines);
  const orderNumber = generateOrderNumber();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      status: "pending",
      subtotal: totals.subtotal,
      vat_total: totals.vatTotal,
      grand_total: totals.grandTotal,
      shipping_address_id: addressId,
      billing_address_id: addressId,
    })
    .select("id, order_number, grand_total")
    .single();

  if (orderError || !order) throw new CheckoutError("Could not create the order.");

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map((line) => ({
      order_id: order.id,
      product_id: line.productId,
      sku_snapshot: line.sku,
      name_snapshot: line.name,
      unit_price: line.unitPrice,
      quantity: line.quantity,
      vat_rate: line.vatRate,
      line_total: line.lineTotal,
    })),
  );

  if (itemsError) throw new CheckoutError("Could not save order items.");

  return { id: order.id, orderNumber: order.order_number, grandTotal: order.grand_total };
}

/**
 * If Stripe session creation fails after the order row is already created, the order must
 * not linger forever as an unpayable "pending" row in the customer's order history.
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("order_items").delete().eq("order_id", orderId);
  await admin.from("orders").delete().eq("id", orderId);
}

export async function attachStripeSession(orderId: string, sessionId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("orders").update({ stripe_checkout_session_id: sessionId }).eq("id", orderId);
}
