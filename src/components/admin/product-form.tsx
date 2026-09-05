import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface ProductFormProps {
  action: (formData: FormData) => void;
  defaultValues?: Product | null;
  categories: { id: string; label: string }[];
  brands: { id: string; name: string }[];
  submitLabel: string;
}

export function ProductForm({ action, defaultValues, categories, brands, submitLabel }: ProductFormProps) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          SKU
          <input
            name="sku"
            required
            defaultValue={defaultValues?.sku ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2 font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Slug
          <input
            name="slug"
            required
            defaultValue={defaultValues?.slug ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2 font-mono"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Category
          <select
            name="category_id"
            defaultValue={defaultValues?.category_id ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Brand
          <select
            name="brand_id"
            defaultValue={defaultValues?.brand_id ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="">— None —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Short description
        <input
          name="short_description"
          defaultValue={defaultValues?.short_description ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Technical specs (JSON)
        <textarea
          name="technical_specs"
          rows={3}
          defaultValue={
            defaultValues?.technical_specs ? JSON.stringify(defaultValues.technical_specs, null, 2) : "{}"
          }
          className="rounded-md border border-input bg-card px-3 py-2 font-mono text-xs"
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Unit
          <input
            name="unit"
            defaultValue={defaultValues?.unit ?? "pcs"}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Purchase cost (€)
          <input
            name="purchase_cost"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.purchase_cost ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Selling price (€)
          <input
            name="selling_price"
            type="number"
            step="0.01"
            required
            defaultValue={defaultValues?.selling_price ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          VAT rate (%)
          <input
            name="vat_rate"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.vat_rate ?? 22}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Weight (kg)
          <input
            name="weight_kg"
            type="number"
            step="0.001"
            defaultValue={defaultValues?.weight_kg ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Replacement interval (days)
          <input
            name="replacement_interval_days"
            type="number"
            defaultValue={defaultValues?.replacement_interval_days ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Certifications (comma-separated)
        <input
          name="certifications"
          defaultValue={defaultValues?.certifications?.join(", ") ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="requires_compliance_ack"
          defaultChecked={defaultValues?.requires_compliance_ack ?? false}
        />
        Requires compliance acknowledgement at checkout (regulated/hygiene products)
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={defaultValues?.is_active ?? true} />
        Active (visible in the storefront)
      </label>

      {defaultValues?.is_bundle && (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          This is a bundle/kit. Component composition isn&rsquo;t editable here yet — manage
          <code className="mx-1">product_bundle_items</code> directly for now.
        </p>
      )}

      <button
        type="submit"
        className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
      >
        {submitLabel}
      </button>
    </form>
  );
}
