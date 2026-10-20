"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { formatCurrency, withVat } from "@/lib/utils";
import { isBackorderable } from "@/lib/inventory/rules";
import type { ProductListItem } from "@/lib/products/queries";

/** Compact card for chat results (the storefront ProductCard is a server component). */
export function ChatProductCard({ product }: { product: ProductListItem }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.availability_status === "out_of_stock" && !isBackorderable(product.delivery_estimate);
  // Regulated products need the compliance acknowledgement on their own page before purchase.
  const canQuickAdd = !outOfStock && !product.requires_compliance_ack;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
      <Link href={`/products/${product.slug}`} className="flex flex-col gap-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-secondary">
          {product.primary_image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.primary_image.url} alt={product.primary_image.alt_text ?? product.name} className="h-full w-full object-contain" />
          ) : null}
        </div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{product.sku}</span>
        <span className="font-medium leading-snug hover:text-primary">{product.name}</span>
      </Link>
      <div className="mt-auto pt-2">
        <span className="font-heading text-base font-medium">{formatCurrency(withVat(product.selling_price, product.vat_rate))}</span>
        <span className="ml-1 text-[11px] text-muted-foreground">incl. VAT</span>
        {canQuickAdd ? (
          <button
            type="button"
            onClick={() => {
              addItem({ productId: product.id, sku: product.sku, name: product.name, slug: product.slug, unitPrice: product.selling_price, vatRate: product.vat_rate });
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            className="mt-2 w-full rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
        ) : (
          <Link href={`/products/${product.slug}`} className="mt-2 block w-full rounded-full border border-border px-3 py-1.5 text-center text-xs font-medium hover:bg-secondary">
            {outOfStock ? "Out of stock — request" : "View product"}
          </Link>
        )}
      </div>
    </div>
  );
}
