"use client";

import { useActionState, useState } from "react";
import { requestProductAvailability, type AvailabilityRequestState } from "@/lib/product-requests/actions";

export function AvailabilityRequestForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<AvailabilityRequestState, FormData>(
    requestProductAvailability,
    {},
  );

  if (state.success) {
    return (
      <p className="rounded-md border border-status-good/40 bg-status-good/10 px-3 py-2 text-sm text-status-good">
        Thanks — we&rsquo;ll get back to you as soon as this product is available.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-input bg-card px-6 py-2.5 text-sm font-medium hover:border-primary"
      >
        Request this product
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
      <input type="hidden" name="product_id" value={productId} />
      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" required className="rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required className="rounded-md border border-input bg-background px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Phone (optional)
          <input name="phone" className="rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Quantity
          <input
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Message (optional)
        <textarea name="message" rows={2} className="rounded-md border border-input bg-background px-3 py-2" />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </form>
  );
}
