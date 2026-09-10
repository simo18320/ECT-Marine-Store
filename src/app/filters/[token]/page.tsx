import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { createClient } from "@/lib/supabase/server";
import { getFilterByToken, getFilterProductForPurchase } from "@/lib/filters/queries";
import { getAvailabilityLabel, parseAvailabilityStatus } from "@/lib/inventory/rules";
import { getStoreSettings } from "@/lib/settings/queries";
import { PurchasePanel } from "@/components/product/purchase-panel";
import {
  computeFilterReplacementStatus,
  REPLACEMENT_STATUS_COLOR,
  REPLACEMENT_STATUS_LABEL,
} from "@/lib/maintenance/rules";

export default async function FilterQrPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/filters/${token}`);

  const filter = await getFilterByToken(token);
  const product = filter ? await getFilterProductForPurchase(filter.product_id) : null;
  const stockStatus = product ? parseAvailabilityStatus(product.availability_status) : "out_of_stock";
  const settings = product ? await getStoreSettings() : null;
  const stockLabel =
    product && settings
      ? getAvailabilityLabel(stockStatus, product.delivery_estimate, settings.restock_mode, settings.restock_label)
      : "";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {!filter ? (
          <>
            <h1 className="text-3xl font-medium">Not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This QR code doesn&rsquo;t match any filter you have access to.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{filter.yacht?.name}</p>
            <h1 className="text-3xl font-medium">{filter.product?.name ?? filter.filter_type ?? "Filter"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{filter.product?.sku}</p>

            {(() => {
              const { status, dueDate } = computeFilterReplacementStatus(
                filter.installation_date,
                filter.replacement_interval_days,
              );
              return (
                <div className="mt-6 rounded-md border border-border p-4">
                  <p className={`font-medium ${REPLACEMENT_STATUS_COLOR[status]}`}>
                    {REPLACEMENT_STATUS_LABEL[status]}
                  </p>
                  {dueDate && (
                    <p className="text-sm text-muted-foreground">
                      Replace by: {dueDate.toLocaleDateString("en-GB")}
                    </p>
                  )}
                </div>
              );
            })()}

            <dl className="mt-6 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Location</dt>
              <dd>{filter.location ?? "—"}</dd>
              <dt className="text-muted-foreground">Installed</dt>
              <dd>{filter.installation_date ?? "—"}</dd>
            </dl>

            {product && (
              <div className="mt-8 rounded-md border border-border p-4">
                <h2 className="mb-1 text-sm font-semibold">Order a replacement</h2>
                <p className="mb-3 text-sm text-muted-foreground">{stockLabel}</p>
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
                <Link
                  href={`/products/${product.slug}`}
                  className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground"
                >
                  View full product details →
                </Link>
              </div>
            )}

            {filter.yacht && (
              <Link
                href={`/my-yacht/${filter.yacht.id}/filters/${filter.id}/edit`}
                className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
              >
                Edit this record →
              </Link>
            )}
          </>
        )}
      </main>
    </>
  );
}
