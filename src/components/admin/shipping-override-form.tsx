"use client";

import { useActionState } from "react";
import { overrideOrderShipping, type ShippingAdminState } from "@/lib/shipping/admin-actions";

export function ShippingOverrideForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(overrideOrderShipping.bind(null, orderId), {} as ShippingAdminState);
  return (
    <form action={action} className="mt-4 grid gap-2 rounded-md border border-dashed border-border p-3 text-sm sm:grid-cols-[8rem_1fr_auto]">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Shipping price (€ net)
        <input name="override_price" type="number" step="0.01" min="0" required className="rounded-md border border-input bg-card px-2 py-1.5 text-sm text-foreground" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Reason (required, audited)
        <input name="override_reason" required minLength={3} className="rounded-md border border-input bg-card px-2 py-1.5 text-sm text-foreground" />
      </label>
      <button type="submit" disabled={pending} className="self-end rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50">
        {pending ? "Saving…" : "Override"}
      </button>
      {state.error && <p className="text-xs text-destructive sm:col-span-3">{state.error}</p>}
      {state.success && <p className="text-xs text-status-good sm:col-span-3">Override recorded. Note: this does not change what Stripe already charged.</p>}
    </form>
  );
}
