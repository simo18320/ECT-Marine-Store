"use client";

import { useActionState } from "react";
import type { DeliveryNoteFormState } from "@/lib/orders/delivery-actions";

interface GenerateDdtFormProps {
  action: (prevState: DeliveryNoteFormState, formData: FormData) => Promise<DeliveryNoteFormState>;
  defaultWeightKg: number | null;
}

export function GenerateDdtForm({ action, defaultWeightKg }: GenerateDdtFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-border p-4">
      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Causale
          <input
            name="causale"
            defaultValue="Vendita"
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Vettore (optional)
          <input
            name="carrier_name"
            placeholder="e.g. BRT, GLS, Poste"
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Colli
          <input
            name="package_count"
            type="number"
            min={1}
            defaultValue={1}
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Peso totale (kg)
          <input
            name="total_weight_kg"
            type="number"
            step="0.001"
            defaultValue={defaultWeightKg ?? ""}
            placeholder={defaultWeightKg == null ? "Not known — enter manually" : undefined}
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Note (optional)
        <input name="notes" className="rounded-md border border-input bg-card px-3 py-2 text-sm" />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Generando…" : "Genera DDT"}
      </button>
    </form>
  );
}
