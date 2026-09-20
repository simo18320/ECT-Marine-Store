"use client";

import { useRouter } from "next/navigation";
import { formatCurrency, withVat } from "@/lib/utils";
import type { ProductVariantOption } from "@/lib/products/queries";

// Labels a sibling by whatever distinguishes it (size and/or filter class) — same convention
// the bulk "multiple sizes" admin form uses to name each row.
function variantLabel(v: ProductVariantOption): string {
  const specs = (v.technical_specs as Record<string, unknown>) ?? {};
  const parts = [specs.size, specs.filter_class].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  return parts.length > 0 ? parts.join(" ") : v.slug;
}

// A dropdown that jumps to a sibling product's own page — each size/class is still its own
// real product (own SKU, stock, URL), but this presents them as one page with a size picker,
// the way a supplier catalog with variable products (e.g. aerofeel.com) does.
export function VariantSelector({
  variants,
  currentId,
}: {
  variants: ProductVariantOption[];
  currentId: string;
}) {
  const router = useRouter();
  if (variants.length <= 1) return null;

  return (
    <label className="mt-4 flex flex-col gap-1 text-sm">
      Size
      <select
        value={currentId}
        onChange={(e) => {
          const chosen = variants.find((v) => v.id === e.target.value);
          if (chosen) router.push(`/products/${chosen.slug}`);
        }}
        className="rounded-md border border-input bg-card px-3 py-2 font-medium"
      >
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {variantLabel(v)} — {formatCurrency(withVat(v.selling_price, v.vat_rate))} incl. VAT
          </option>
        ))}
      </select>
    </label>
  );
}
