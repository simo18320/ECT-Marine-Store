import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { ProductCard } from "@/components/product/product-card";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { getProductBySlug } from "@/lib/products/queries";
import { STOCK_STATUS_LABEL } from "@/lib/inventory/rules";
import { getStoreSettings } from "@/lib/settings/queries";
import { formatCurrency } from "@/lib/utils";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stockStatus = product.availability_status;
  const specs = Object.entries((product.technical_specs as Record<string, unknown>) ?? {});

  const settings = stockStatus === "out_of_stock" ? await getStoreSettings() : null;
  const stockLabel = settings?.restock_mode ? settings.restock_label : STOCK_STATUS_LABEL[stockStatus];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {product.category && (
            <span className="flex items-center gap-1">
              <span>/</span>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
                {product.category.name}
              </Link>
            </span>
          )}
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            {product.images[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt_text ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg viewBox="0 0 24 24" className="h-16 w-16 text-accent-foreground/30" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path
                  d="M12 3c-3 4.5-6 8-6 11.5A6 6 0 0 0 12 20a6 6 0 0 0 6-5.5C18 11 15 7.5 12 3Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{product.sku}</p>
            <h1 className="mt-1 text-3xl font-medium">{product.name}</h1>
            {product.short_description && (
              <p className="mt-2 text-muted-foreground">{product.short_description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-heading text-3xl font-medium">{formatCurrency(product.selling_price)}</span>
              <span className="text-sm text-muted-foreground">excl. VAT ({product.vat_rate}%)</span>
            </div>
            <span
              className={
                stockStatus === "out_of_stock"
                  ? "mt-2 inline-block rounded-full bg-status-critical/10 px-3 py-1 text-xs font-medium text-status-critical"
                  : stockStatus === "low_stock"
                    ? "mt-2 inline-block rounded-full bg-status-warning/10 px-3 py-1 text-xs font-medium text-status-warning"
                    : "mt-2 inline-block rounded-full bg-status-good/10 px-3 py-1 text-xs font-medium text-status-good"
              }
            >
              {stockLabel}
            </span>

            <div className="mt-6">
              <PurchasePanel
                productId={product.id}
                sku={product.sku}
                name={product.name}
                slug={product.slug}
                unitPrice={product.selling_price}
                vatRate={product.vat_rate}
                stockStatus={stockStatus}
                stockLabel={stockLabel}
                requiresComplianceAck={product.requires_compliance_ack}
              />
            </div>

            {product.is_bundle && product.bundle_items.length > 0 && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-2 text-sm font-semibold">What&rsquo;s in this kit</h2>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {product.bundle_items.map(
                    (item) =>
                      item.component_product && (
                        <li key={item.id}>
                          {item.quantity}× {item.component_product.name}
                        </li>
                      ),
                  )}
                </ul>
              </div>
            )}

            {product.compatibility.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold">Compatible equipment</h2>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {product.compatibility.map((c) => (
                    <li key={c.id}>
                      {c.equipment_type?.name ?? "Equipment"}
                      {c.connection_type ? ` — ${c.connection_type}` : ""}
                      {c.source === "ect_verified" && (
                        <span className="ml-2 text-xs text-status-good">ECT verified</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {specs.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-3 text-xl font-medium">Technical specifications</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-2 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
              {specs.map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-border/60 py-1 text-sm">
                  <dt className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{String(val)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {product.description && (
          <div className="mt-10 max-w-3xl">
            <h2 className="mb-2 text-xl font-medium">Description</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
        )}

        {product.recommendations.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-4 text-xl font-medium">Recommended with this product</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {product.recommendations.map(
                (rec) =>
                  rec.recommended_product && (
                    <ProductCard key={rec.id} product={rec.recommended_product} />
                  ),
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
