"use client";

import { useActionState } from "react";
import type { Database } from "@/types/database";
import type { ProductFormState } from "@/lib/admin/product-actions";

type Product = Database["public"]["Tables"]["products"]["Row"];

const SIZE_OPTIONS = ['10"', '20"', '2.5" x 10"', '4.5" x 10" (Big Blue)', '4.5" x 20" (Big Blue)', '5"'];
const MICRON_OPTIONS = ["1", "5", "10", "20", "25", "50"];
const USE_OPTIONS = [
  "Sediment removal",
  "Carbon / taste & odor",
  "Bacteriostatic",
  "RO pre/post-filtration",
  "UV disinfection",
  "HVAC / air filtration",
  "Sanitization",
  "Testing / sampling",
];
const FILTER_TYPE_OPTIONS = [
  "Melt-blown polypropylene",
  "String-wound polypropylene",
  "Carbon block",
  "Coconut carbon block",
  "GAC (granular activated carbon)",
  "Pleated",
  "Ceramic",
  "Ion exchange",
];
const DELIVERY_ESTIMATE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— Not set (uses stock status) —" },
  { value: "ships_immediately", label: "Ships immediately" },
  { value: "ships_2_3_days", label: "Ships in 2–3 days" },
  { value: "made_to_order", label: "Made to order (1–2 weeks)" },
];

interface ProductFormProps {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  defaultValues?: Product | null;
  categories: { id: string; label: string }[];
  brands: { id: string; name: string }[];
  submitLabel: string;
}

export function ProductForm({ action, defaultValues, categories, brands, submitLabel }: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const specs = (defaultValues?.technical_specs as Record<string, unknown>) ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {defaultValues ? (
          <label className="flex flex-col gap-1 text-sm">
            SKU
            <input
              name="sku"
              required
              defaultValue={defaultValues.sku}
              className="rounded-md border border-input bg-card px-3 py-2 font-mono"
            />
          </label>
        ) : (
          <div className="flex flex-col gap-1 text-sm">
            <span>SKU</span>
            <p className="rounded-md border border-dashed border-border bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
              Assigned automatically on save
            </p>
          </div>
        )}
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          Size
          <select
            name="spec_size"
            defaultValue={typeof specs.size === "string" ? specs.size : ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="">— None —</option>
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Micron rating
          <select
            name="spec_micron"
            defaultValue={
              typeof specs.micron_rating === "number" || typeof specs.micron_rating === "string"
                ? String(specs.micron_rating)
                : ""
            }
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="">— None —</option>
            {MICRON_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} micron
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Use
          <select
            name="spec_use"
            defaultValue={typeof specs.use === "string" ? specs.use : ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="">— None —</option>
            {USE_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Filter type
          <select
            name="spec_filter_type"
            defaultValue={typeof specs.filter_type === "string" ? specs.filter_type : ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="">— None —</option>
            {FILTER_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Shipping cost (€)
          <input
            name="shipping_cost"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.shipping_cost ?? ""}
            placeholder="Leave blank for none"
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Delivery estimate
          <select
            name="delivery_estimate"
            defaultValue={defaultValues?.delivery_estimate ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            {DELIVERY_ESTIMATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
        disabled={isPending}
        className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
