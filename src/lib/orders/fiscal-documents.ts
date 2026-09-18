import type { SupabaseClient } from "@supabase/supabase-js";
import { createIssuedDocument, isFattureInCloudConfigured } from "@/lib/fatture-in-cloud/client";
import type { Database } from "@/types/database";

type BillingAddress = Pick<
  Database["public"]["Tables"]["customer_addresses"]["Row"],
  "full_name" | "line1" | "city" | "postal_code" | "country" | "is_business" | "tax_code" | "vat_number" | "pec_email" | "sdi_code"
>;

// business-rules: codice fiscale is always required to identify the recipient; a business
// additionally needs a partita IVA plus a route the SDI can deliver to (PEC or codice
// destinatario). Missing any of that means a receipt, not an invoice — never a guess at
// fiscal data we don't have.
export function hasCompleteFiscalData(address: BillingAddress | null): boolean {
  if (!address?.tax_code) return false;
  if (!address.is_business) return true;
  return Boolean(address.vat_number) && Boolean(address.pec_email || address.sdi_code);
}

/**
 * Issues an invoice or receipt with Fatture in Cloud for a just-paid order, and records the
 * outcome on order_invoices. Called once from the Stripe webhook's pending->paid transition
 * (webhook-handlers.ts) — never blocks or throws into the caller, since a Fatture in Cloud
 * outage must not stop order fulfillment; failures are recorded for manual follow-up instead.
 */
// Fatture in Cloud validates the entity's country against its own (Italian-language) list —
// "Italy" is rejected, only "Italia" is accepted. The checkout address form's Country field is
// free text, so normalize the common English/ISO spellings customers actually type; anything
// else is passed through as-is (most non-Italian recipients won't hit this code path anyway,
// since a non-Italian business rarely has an Italian codice fiscale to trigger an invoice).
const ITALY_ALIASES = new Set(["italy", "it", "ita"]);
function normalizeCountryForFattureInCloud(country: string | null): string | undefined {
  if (!country) return undefined;
  return ITALY_ALIASES.has(country.trim().toLowerCase()) ? "Italia" : country;
}

export async function issueFiscalDocumentForOrder(admin: SupabaseClient<Database>, orderId: string): Promise<void> {
  if (!isFattureInCloudConfigured()) return;

  const { data: order } = await admin
    .from("orders")
    .select("id, billing_address:customer_addresses!orders_billing_address_id_fkey(*)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const { data: items } = await admin
    .from("order_items")
    .select("name_snapshot, quantity, unit_price, vat_rate")
    .eq("order_id", orderId);

  const billingAddress = order.billing_address;
  const documentType: "invoice" | "receipt" = hasCompleteFiscalData(billingAddress) ? "invoice" : "receipt";

  try {
    const { id: externalId } = await createIssuedDocument({
      type: documentType,
      entity: {
        name: billingAddress?.full_name ?? "Customer",
        vat_number: billingAddress?.vat_number ?? undefined,
        tax_code: billingAddress?.tax_code ?? undefined,
        address_street: billingAddress?.line1 ?? undefined,
        address_postal_code: billingAddress?.postal_code ?? undefined,
        address_city: billingAddress?.city ?? undefined,
        country: normalizeCountryForFattureInCloud(billingAddress?.country ?? null),
        certified_email: billingAddress?.pec_email ?? undefined,
        ei_code: billingAddress?.sdi_code ?? undefined,
      },
      items: (items ?? []).map((item) => ({
        name: item.name_snapshot,
        qty: item.quantity,
        net_price: item.unit_price,
        vat: { id: 0, value: item.vat_rate },
      })),
      eInvoice: documentType === "invoice",
    });

    await admin.from("order_invoices").insert({
      order_id: orderId,
      document_type: documentType,
      external_id: externalId,
      status: "issued",
    });
  } catch (err) {
    await admin.from("order_invoices").insert({
      order_id: orderId,
      document_type: documentType,
      status: "failed",
      error_message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
