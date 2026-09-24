import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { loadRateTable, loadShippingSettings } from "@/lib/shipping/data";
import { ShippingRatesForm, ShippingSettingsForm } from "@/components/admin/shipping-forms";

export default async function AdminShippingPage() {
  await requireAdmin();
  const [{ paymentProvider, ...settings }, rates] = await Promise.all([loadShippingSettings(), loadRateTable()]);

  return (
    <div className="max-w-4xl">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-3xl font-medium">Shipping &amp; margin</h1>
        <Link href="/admin/shipping/analytics" className="text-sm text-primary hover:underline">
          Profitability analytics →
        </Link>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Free shipping is never granted from the order value alone: the order must reach the target <em>and</em> keep
        the minimum net margin after product cost, shipping, payment fees and packaging. All figures here are internal
        and never shown to customers.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">Global settings</h2>
        <ShippingSettingsForm settings={settings} provider={paymentProvider} />
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-medium">Rates by zone and class</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Customer charge is what the customer pays (excl. 22% VAT). ECT cost is what the carrier bills you — set it
          lower than the charge to see the real subsidy on free-shipping orders. A mixed cart uses its highest class.
          Quotation rows cannot be paid online: the customer sends a request.
        </p>
        <ShippingRatesForm rates={rates} />
      </section>
    </div>
  );
}
