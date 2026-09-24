import { requireAdmin } from "@/lib/admin/guard";
import { getStoreSettings } from "@/lib/settings/queries";
import { setRestockMode } from "@/lib/settings/actions";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-3xl font-medium">Settings</h1>

      <section className="rounded-md border border-border p-4">
        <h2 className="mb-1 text-sm font-semibold">Restock mode</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          While the catalogue is still being stocked, this replaces the &ldquo;Out of
          stock&rdquo; label shown to customers with a friendlier message everywhere it
          appears (product listings, product pages, the add-to-cart button). It doesn&rsquo;t
          change actual inventory or checkout behaviour — out-of-stock items still can&rsquo;t
          be added to the cart.
        </p>
        <form action={setRestockMode} className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="restock_mode" value="true" defaultChecked={settings.restock_mode} />
            Show restock message instead of &ldquo;Out of stock&rdquo;
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Message shown to customers
            <input
              name="restock_label"
              defaultValue={settings.restock_label}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="mt-1 self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save
          </button>
        </form>
      </section>
    </div>
  );
}
