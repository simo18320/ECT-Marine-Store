import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { STOCK_STATUS_LABEL } from "@/lib/inventory/rules";
import type { ProductListItem } from "@/lib/products/queries";

export function ProductCard({ product }: { product: ProductListItem }) {
  const status = product.availability_status;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-md"
    >
      <div className="mb-3 flex aspect-square items-center justify-center rounded-md bg-secondary text-xs text-muted-foreground">
        {product.primary_image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primary_image.url}
            alt={product.primary_image.alt_text ?? product.name}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          "No image"
        )}
      </div>
      <p className="text-xs text-muted-foreground">{product.sku}</p>
      <h3 className="mt-1 font-medium leading-snug">{product.name}</h3>
      {product.short_description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="font-semibold">{formatCurrency(product.selling_price)}</span>
        <span
          className={
            status === "out_of_stock"
              ? "text-xs font-medium text-status-critical"
              : status === "low_stock"
                ? "text-xs font-medium text-status-warning"
                : "text-xs font-medium text-status-good"
          }
        >
          {STOCK_STATUS_LABEL[status]}
        </span>
      </div>
    </Link>
  );
}
