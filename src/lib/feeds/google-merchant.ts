import { withVat } from "@/lib/utils";
import { addWorkingDays, isBackorderable } from "@/lib/inventory/rules";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace). Pure: takes catalogue rows and
 * the public site URL, returns XML. Only customer-visible data goes in: nothing here can leak a
 * cost or margin, because those fields are never part of the input.
 */
export interface FeedProduct {
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  selling_price: number;
  vat_rate: number;
  availability_status: string | null;
  brand: { name: string } | null;
  category: { name: string } | null;
  images: { url: string; sort_order: number | null }[] | null;
  shipping_class: string | null;
  special_shipping_required: boolean;
  delivery_estimate: string | null;
}

const DEFAULT_BRAND = "ECT Marine";
const MAX_TITLE = 150;
const MAX_DESCRIPTION = 5000;
const MAX_EXTRA_IMAGES = 10;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // characters that are not allowed in XML 1.0 at all
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function clean(text: string | null | undefined): string {
  return (text ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut.slice(0, max - 1)).trimEnd();
}

/**
 * What a shopper can really order. Stock on hand is in_stock; a product supplied within three
 * working days is a backorder (Merchant Center then needs the date it becomes available);
 * anything else without stock is out_of_stock.
 */
export function feedAvailability(
  status: string | null,
  deliveryEstimate: string | null = null,
): "in_stock" | "out_of_stock" | "backorder" {
  if (status === "in_stock" || status === "low_stock") return "in_stock";
  return isBackorderable(deliveryEstimate) ? "backorder" : "out_of_stock";
}

export interface FeedItemResult {
  xml: string | null;
  skipped?: "no_image" | "no_price" | "quote_only";
}

export function buildItem(p: FeedProduct, baseUrl: string, now: Date = new Date()): FeedItemResult {
  const images = [...(p.images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i) => i.url);
  // Merchant Center rejects a product without an image, so it is left out rather than listed broken.
  if (images.length === 0) return { xml: null, skipped: "no_image" };
  if (!(p.selling_price > 0)) return { xml: null, skipped: "no_price" };
  // Class C/D and special-shipping products are quoted individually: they cannot be paid online,
  // and advertising a product the visitor cannot buy on the page is a Merchant Center violation.
  if (p.special_shipping_required || p.shipping_class === "C" || p.shipping_class === "D") {
    return { xml: null, skipped: "quote_only" };
  }

  const title = truncateWords(clean(p.name), MAX_TITLE);
  const description = truncateWords(clean(p.description) || clean(p.short_description) || title, MAX_DESCRIPTION);
  // Prices for Italy are VAT-inclusive, as on the storefront.
  const availability = feedAvailability(p.availability_status, p.delivery_estimate);
  const price = `${withVat(p.selling_price, p.vat_rate).toFixed(2)} EUR`;

  const lines = [
    `<g:id>${escapeXml(p.sku)}</g:id>`,
    `<g:title>${escapeXml(title)}</g:title>`,
    `<g:description>${escapeXml(description)}</g:description>`,
    `<g:link>${escapeXml(`${baseUrl}/products/${p.slug}`)}</g:link>`,
    `<g:image_link>${escapeXml(images[0])}</g:image_link>`,
    ...images.slice(1, 1 + MAX_EXTRA_IMAGES).map((url) => `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`),
    `<g:availability>${availability}</g:availability>`,
    ...(availability === "backorder"
      ? [`<g:availability_date>${addWorkingDays(now, 3).toISOString().slice(0, 10)}T00:00Z</g:availability_date>`]
      : []),
    `<g:price>${price}</g:price>`,
    `<g:condition>new</g:condition>`,
    `<g:brand>${escapeXml(p.brand?.name ?? DEFAULT_BRAND)}</g:brand>`,
    // ECT SKUs are internal codes, not manufacturer part numbers or GTINs.
    `<g:identifier_exists>no</g:identifier_exists>`,
    // Lets Merchant Center apply the right shipping rate per class (A and B have different tariffs).
    `<g:shipping_label>class-${p.shipping_class === "A" ? "A" : "B"}</g:shipping_label>`,
    ...(p.category?.name ? [`<g:product_type>${escapeXml(p.category.name)}</g:product_type>`] : []),
  ];
  return { xml: `<item>\n      ${lines.join("\n      ")}\n    </item>` };
}

export function buildFeed(products: FeedProduct[], baseUrl: string, now: Date = new Date()) {
  const items: string[] = [];
  const skipped: { sku: string; reason: string }[] = [];
  for (const p of products) {
    const r = buildItem(p, baseUrl, now);
    if (r.xml) items.push(r.xml);
    else skipped.push({ sku: p.sku, reason: r.skipped ?? "unknown" });
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ECT Marine Store</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Water, air, hygiene and maintenance products for yachts.</description>
    ${items.join("\n    ")}
  </channel>
</rss>
`;
  return { xml, count: items.length, skipped };
}
