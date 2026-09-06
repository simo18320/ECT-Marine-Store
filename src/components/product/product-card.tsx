import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { STOCK_STATUS_LABEL } from "@/lib/inventory/rules";
import type { ProductListItem } from "@/lib/products/queries";

export function ProductCard({ product }: { product: ProductListItem }) {
  const status = product.availability_status;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
    >
      <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-secondary">
        {product.primary_image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primary_image.url}
            alt={product.primary_image.alt_text ?? product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-accent-foreground/30" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path
              d="M12 3c-3 4.5-6 8-6 11.5A6 6 0 0 0 12 20a6 6 0 0 0 6-5.5C18 11 15 7.5 12 3Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{product.sku}</p>
      <h3 className="mt-1 font-medium leading-snug">{product.name}</h3>
      {product.short_description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="font-heading text-lg font-medium">{formatCurrency(product.selling_price)}</span>
        <span
          className={
            status === "out_of_stock"
              ? "rounded-full bg-status-critical/10 px-2 py-0.5 text-xs font-medium text-status-critical"
              : status === "low_stock"
                ? "rounded-full bg-status-warning/10 px-2 py-0.5 text-xs font-medium text-status-warning"
                : "rounded-full bg-status-good/10 px-2 py-0.5 text-xs font-medium text-status-good"
          }
        >
          {STOCK_STATUS_LABEL[status]}
        </span>
      </div>
    </Link>
  );
}
