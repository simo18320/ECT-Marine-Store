import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { ProductCard } from "@/components/product/product-card";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { getProductBySlug } from "@/lib/products/queries";
import { STOCK_STATUS_LABEL } from "@/lib/inventory/rules";
import { formatCurrency } from "@/lib/utils";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stockStatus = product.availability_status;
  const specs = Object.entries((product.technical_specs as Record<string, unknown>) ?? {});

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
          <div className="flex aspect-square items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground">
            {product.images[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt_text ?? product.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              "No image available"
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{product.sku}</p>
            <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
            {product.short_description && (
              <p className="mt-2 text-muted-foreground">{product.short_description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold">{formatCurrency(product.selling_price)}</span>
              <span className="text-sm text-muted-foreground">excl. VAT ({product.vat_rate}%)</span>
            </div>
            <p
              className={
                stockStatus === "out_of_stock"
                  ? "mt-1 text-sm font-medium text-status-critical"
                  : stockStatus === "low_stock"
                    ? "mt-1 text-sm font-medium text-status-warning"
                    : "mt-1 text-sm font-medium text-status-good"
              }
            >
              {STOCK_STATUS_LABEL[stockStatus]}
            </p>

            <div className="mt-6">
              <PurchasePanel
                productId={product.id}
                sku={product.sku}
                name={product.name}
                slug={product.slug}
                unitPrice={product.selling_price}
                vatRate={product.vat_rate}
                stockStatus={stockStatus}
                requiresComplianceAck={product.requires_compliance_ack}
              />
            </div>

            {product.is_bundle && product.bundle_items.length > 0 && (
              <div className="mt-8 rounded-md border border-border p-4">
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
            <h2 className="mb-3 text-lg font-semibold">Technical specifications</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-2 rounded-md border border-border p-4 sm:grid-cols-2">
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
            <h2 className="mb-2 text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
        )}

        {product.recommendations.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-4 text-lg font-semibold">Recommended with this product</h2>
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
    </>
  );
}
