"use client";

import { useId, useState } from "react";
import { useActionState } from "react";
import type { VariantFormState } from "@/lib/admin/product-variant-actions";

interface VariantProductFormProps {
  action: (prevState: VariantFormState, formData: FormData) => Promise<VariantFormState>;
  categories: { id: string; label: string }[];
  brands: { id: string; name: string }[];
}

interface VariantRow {
  key: string;
  size: string;
  filterClass: string;
  grossPrice: string;
  purchaseCost: string;
  sellingPrice: string;
  weightKg: string;
  sku: string;
}

function emptyRow(key: string): VariantRow {
  return { key, size: "", filterClass: "", grossPrice: "", purchaseCost: "", sellingPrice: "", weightKg: "", sku: "" };
}

// Mirrors the markup rule used for the aerofeel.com import batch — net cost is the resold
// gross (IVA inclusa) price divided by the standard 22% VAT, then marked up 40% for resale.
function computeFromGross(gross: string): { purchaseCost: string; sellingPrice: string } | null {
  const value = Number(gross);
  if (!gross || Number.isNaN(value) || value <= 0) return null;
  const purchaseCost = value / 1.22;
  const sellingPrice = purchaseCost * 1.4;
  return { purchaseCost: purchaseCost.toFixed(2), sellingPrice: sellingPrice.toFixed(2) };
}

export function VariantProductForm({ action, categories, brands }: VariantProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const idPrefix = useId();
  const [rows, setRows] = useState<VariantRow[]>([emptyRow(`${idPrefix}-0`), emptyRow(`${idPrefix}-1`)]);

  function updateRow(key: string, patch: Partial<VariantRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function onGrossPriceChange(key: string, gross: string) {
    const computed = computeFromGross(gross);
    updateRow(key, {
      grossPrice: gross,
      ...(computed ? { purchaseCost: computed.purchaseCost, sellingPrice: computed.sellingPrice } : {}),
    });
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(`${idPrefix}-${prev.length}-${Date.now()}`)]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.created && state.created.length > 0 && (
        <p className="rounded-md border border-status-good/40 bg-status-good/10 px-3 py-2 text-sm text-status-good">
          Created {state.created.length} product{state.created.length === 1 ? "" : "s"}: {state.created.join(", ")}
        </p>
      )}

      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Shared details
        </h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Base name
            <input
              name="base_name"
              required
              placeholder="e.g. Zehnder Comfoair Q350/450/600 Replacement Filter"
              className="rounded-md border border-input bg-card px-3 py-2"
            />
            <span className="text-xs text-muted-foreground">
              Each row below becomes its own product, named &ldquo;Base name — Size&rdquo; (or
              &ldquo;Base name — Class&rdquo; if only a filter class is set).
            </span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Category
              <select name="category_id" required className="rounded-md border border-input bg-card px-3 py-2">
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Brand
              <select name="brand_id" className="rounded-md border border-input bg-card px-3 py-2">
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
            <input name="short_description" className="rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Description
            <textarea name="description" rows={3} className="rounded-md border border-input bg-card px-3 py-2" />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Unit
              <input name="unit" defaultValue="pcs" className="rounded-md border border-input bg-card px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              VAT rate (%)
              <input
                name="vat_rate"
                type="number"
                step="0.01"
                defaultValue={22}
                className="rounded-md border border-input bg-card px-3 py-2"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sizes / variants
          </h2>
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            + Add size
          </button>
        </div>

        <input type="hidden" name="variant_count" value={rows.length} />

        <div className="flex flex-col gap-4">
          {rows.map((row, i) => (
            <div key={row.key} className="rounded-md border border-border/80 bg-secondary/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Row {i + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs">
                  Size
                  <input
                    name={`variant_size_${i}`}
                    value={row.size}
                    onChange={(e) => updateRow(row.key, { size: e.target.value })}
                    placeholder='e.g. 1 x 20 m'
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Filter class
                  <input
                    name={`variant_class_${i}`}
                    value={row.filterClass}
                    onChange={(e) => updateRow(row.key, { filterClass: e.target.value })}
                    placeholder="e.g. G4"
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Weight (kg)
                  <input
                    name={`variant_weight_${i}`}
                    type="number"
                    step="0.001"
                    value={row.weightKg}
                    onChange={(e) => updateRow(row.key, { weightKg: e.target.value })}
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  SKU
                  <input
                    name={`variant_sku_${i}`}
                    value={row.sku}
                    onChange={(e) => updateRow(row.key, { sku: e.target.value })}
                    placeholder="Auto if blank"
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-sm font-mono"
                  />
                </label>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-xs">
                  Aerofeel gross price (€, IVA incl.)
                  <input
                    type="number"
                    step="0.01"
                    value={row.grossPrice}
                    onChange={(e) => onGrossPriceChange(row.key, e.target.value)}
                    placeholder="Paste their displayed price"
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Purchase cost (€, net)
                  <input
                    name={`variant_purchase_cost_${i}`}
                    type="number"
                    step="0.01"
                    value={row.purchaseCost}
                    onChange={(e) => updateRow(row.key, { purchaseCost: e.target.value })}
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Selling price (€, net)
                  <input
                    name={`variant_selling_price_${i}`}
                    type="number"
                    step="0.01"
                    required
                    value={row.sellingPrice}
                    onChange={(e) => updateRow(row.key, { sellingPrice: e.target.value })}
                    className="rounded-md border border-input bg-card px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Fill &ldquo;Aerofeel gross price&rdquo; to auto-fill cost/selling price (net ÷ 1.22, then
          +40% margin) — both stay editable afterward.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create products"}
      </button>
    </form>
  );
}
