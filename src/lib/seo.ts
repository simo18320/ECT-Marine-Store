import { COMPANY } from "@/lib/company";
import { siteUrl } from "@/lib/site-url";

/** JSON-LD is embedded in a <script>: "<" must never appear raw or a value could close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function truncate(text: string | null | undefined, max = 155): string | undefined {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ECT Marine Store",
    legalName: COMPANY.legalName,
    url: siteUrl(),
    vatID: `IT${COMPANY.vatNumber}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.addressLine1,
      postalCode: "56127",
      addressLocality: "Pisa",
      addressRegion: "PI",
      addressCountry: "IT",
    },
  };
}

const AVAILABILITY = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
} as const;

export function productJsonLd(p: {
  name: string;
  sku: string;
  slug: string;
  description?: string;
  image?: string;
  priceInclVat: number;
  availability: keyof typeof AVAILABILITY;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    description: p.description,
    image: p.image ? [p.image] : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/products/${p.slug}`,
      priceCurrency: "EUR",
      price: p.priceInclVat.toFixed(2),
      valueAddedTaxIncluded: true,
      availability: AVAILABILITY[p.availability],
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "ECT Marine Store" },
    },
  };
}
