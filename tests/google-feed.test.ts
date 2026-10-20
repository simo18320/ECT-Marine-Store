import { describe, expect, it } from "vitest";
import { buildFeed, buildItem, escapeXml, feedAvailability, type FeedProduct } from "@/lib/feeds/google-merchant";

const base = "https://example.com";
const product = (over: Partial<FeedProduct> = {}): FeedProduct => ({
  sku: "ECT-0001",
  slug: "sediment-filter",
  name: 'Sediment Filter 10" & more',
  description: "A <b>filter</b>\r\nfor water",
  short_description: null,
  selling_price: 10,
  vat_rate: 22,
  availability_status: "in_stock",
  brand: { name: "Ionicore" },
  category: { name: "Sediment Filters" },
  images: [{ url: "https://img/2.jpg", sort_order: 2 }, { url: "https://img/1.jpg", sort_order: 1 }],
  shipping_class: "A",
  special_shipping_required: false,
  delivery_estimate: null,
  ...over,
});

describe("Google Merchant feed", () => {
  it("prices VAT-inclusive in EUR and uses the first image by sort order", () => {
    const xml = buildItem(product(), base).xml!;
    expect(xml).toContain("<g:price>12.20 EUR</g:price>");
    expect(xml).toContain("<g:image_link>https://img/1.jpg</g:image_link>");
    expect(xml).toContain("<g:additional_image_link>https://img/2.jpg</g:additional_image_link>");
    expect(xml).toContain("<g:link>https://example.com/products/sediment-filter</g:link>");
  });

  it("escapes XML and strips HTML from titles and descriptions", () => {
    const xml = buildItem(product(), base).xml!;
    expect(xml).toContain("<g:title>Sediment Filter 10&quot; &amp; more</g:title>");
    expect(xml).toContain("<g:description>A filter for water</g:description>");
    expect(escapeXml("a<b>&\u0001")).toBe("a&lt;b&gt;&amp;");
  });

  it("skips products Merchant Center would reject", () => {
    expect(buildItem(product({ images: [] }), base).skipped).toBe("no_image");
    expect(buildItem(product({ images: null }), base).skipped).toBe("no_image");
    expect(buildItem(product({ selling_price: 0 }), base).skipped).toBe("no_price");
  });

  it("leaves out quote-only products and labels the rest by shipping class", () => {
    expect(buildItem(product({ shipping_class: "C" }), base).skipped).toBe("quote_only");
    expect(buildItem(product({ shipping_class: "D" }), base).skipped).toBe("quote_only");
    expect(buildItem(product({ special_shipping_required: true }), base).skipped).toBe("quote_only");
    expect(buildItem(product({ shipping_class: "A" }), base).xml).toContain("<g:shipping_label>class-A</g:shipping_label>");
    expect(buildItem(product({ shipping_class: "B" }), base).xml).toContain("<g:shipping_label>class-B</g:shipping_label>");
    // a product with no class is priced as class B at checkout
    expect(buildItem(product({ shipping_class: null }), base).xml).toContain("class-B");
  });

  it("falls back for missing brand and description, and caps long titles", () => {
    const xml = buildItem(product({ brand: null, description: null, name: "Word ".repeat(60) }), base).xml!;
    expect(xml).toContain("<g:brand>ECT Marine</g:brand>");
    const title = /<g:title>([^<]*)<\/g:title>/.exec(xml)![1];
    expect(title.length).toBeLessThanOrEqual(150);
    expect(xml).toContain("<g:description>Word");
  });

  it("treats anything but a positive stock status as out of stock", () => {
    expect(feedAvailability("in_stock")).toBe("in_stock");
    expect(feedAvailability("low_stock")).toBe("in_stock");
    expect(feedAvailability("out_of_stock")).toBe("out_of_stock");
    expect(feedAvailability(null)).toBe("out_of_stock");
  });

  it("lists not-stocked products with a 3-working-day lead time as backorder with a date", () => {
    // Wednesday 2026-10-21 + 3 working days = Monday 2026-10-26 (weekend skipped)
    const now = new Date("2026-10-21T10:00:00Z");
    const xml = buildItem(product({ availability_status: null, delivery_estimate: "available_3_working_days" }), base, now).xml!;
    expect(xml).toContain("<g:availability>backorder</g:availability>");
    expect(xml).toContain("<g:availability_date>2026-10-26T00:00Z</g:availability_date>");
    // other estimates are only labels: still out of stock
    expect(feedAvailability(null, "ships_2_3_days")).toBe("out_of_stock");
    // in stock wins over the lead-time flag
    expect(feedAvailability("in_stock", "available_3_working_days")).toBe("in_stock");
  });

  it("builds a feed with counts and the skipped list", () => {
    const r = buildFeed([product(), product({ sku: "ECT-0002", images: [] })], base);
    expect(r.count).toBe(1);
    expect(r.skipped).toEqual([{ sku: "ECT-0002", reason: "no_image" }]);
    expect(r.xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
  });

  it("never includes cost or margin fields", () => {
    const xml = buildFeed([product()], base).xml;
    expect(xml).not.toMatch(/cost|margin|purchase/i);
  });
});
