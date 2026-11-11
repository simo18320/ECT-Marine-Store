"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { recordMovement, type MovementFormState } from "@/lib/admin/inventory-actions";
import { MOVEMENT_KINDS, type MovementKind } from "@/lib/inventory/movements";

const field = "rounded-md border border-input bg-card px-3 py-2";

export function InventoryMovementForm({ products }: { products: { id: string; sku: string; name: string }[] }) {
  const [state, action, pending] = useActionState<MovementFormState, FormData>(recordMovement, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Submitted by hand instead of through the form `action` prop: React resets an uncontrolled form after
  // an action, which would silently put the product selector back on the first item of the list.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  // Clear the quantity and note after a successful save so the next entry starts clean.
  useEffect(() => {
    if (state.success) {
      const form = formRef.current;
      if (form) {
        (form.elements.namedItem("quantity") as HTMLInputElement).value = "";
        (form.elements.namedItem("note") as HTMLInputElement).value = "";
      }
    }
  }, [state]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex w-full flex-col gap-1 text-sm sm:w-auto">
        Product
        <select name="product_id" required className={`${field} w-full min-w-0 sm:min-w-48 sm:w-auto sm:max-w-64`}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Type
        <select name="kind" defaultValue="manual_sale" className={field}>
          {(Object.keys(MOVEMENT_KINDS) as MovementKind[]).map((k) => (
            <option key={k} value={k}>
              {MOVEMENT_KINDS[k].label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Quantity
        <input name="quantity" type="number" min={1} step={1} required className={`${field} w-24`} />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Note (required for damage and corrections)
        <input name="note" className={field} />
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {pending ? "Saving…" : "Record"}
      </button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-status-good">{state.success}</p>}
    </form>
  );
}
