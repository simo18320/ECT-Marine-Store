"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerSample, type SampleRegistrationState } from "@/lib/samples/actions";

interface YachtOption {
  id: string;
  name: string;
  equipment: { id: string; label: string }[];
}

export function SampleRegistrationForm({
  yachts,
  productName,
  productId,
}: {
  yachts: YachtOption[];
  productName: string | null;
  productId: string | null;
}) {
  const [state, formAction, isPending] = useActionState<SampleRegistrationState, FormData>(registerSample, {});
  const [selectedYachtId, setSelectedYachtId] = useState(yachts[0]?.id ?? "");
  const selectedYacht = yachts.find((y) => y.id === selectedYachtId);
  const today = new Date().toISOString().slice(0, 10);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-status-good/40 bg-status-good/10 p-6">
        <h2 className="text-lg font-medium text-status-good">Sample registered</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Reference <span className="font-mono">{state.sampleId}</span>. Keep this with your physical
          sample and its chain-of-custody documentation until it reaches the laboratory.
        </p>
        <Link href="/my-yacht" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          ← Back to My Yacht
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {productId && <input type="hidden" name="product_id" value={productId} />}
      {productName && (
        <p className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          Registering a sample for: <span className="font-medium">{productName}</span>
        </p>
      )}
      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Vessel
          <select
            name="yacht_id"
            required
            value={selectedYachtId}
            onChange={(e) => setSelectedYachtId(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            {yachts.length === 0 && <option value="">— No vessel on file —</option>}
            {yachts.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          IMO number (optional)
          <input name="vessel_imo" className="rounded-md border border-input bg-card px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            name="sampled_at"
            type="date"
            defaultValue={today}
            required
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sampling technician
          <input name="collected_by" className="rounded-md border border-input bg-card px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          System (optional)
          <select name="equipment_id" className="rounded-md border border-input bg-card px-3 py-2">
            <option value="">— None / not equipment-specific —</option>
            {selectedYacht?.equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sampling point
          <input
            name="sample_point"
            placeholder="e.g. Galley cold tap"
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Reason for sampling
        <input
          name="reason_for_sampling"
          placeholder="e.g. Routine monitoring, Legionella investigation..."
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Water temperature (°C)
          <input
            name="water_temperature_c"
            type="number"
            step="0.1"
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Free chlorine (mg/L)
          <input
            name="free_chlorine_mg_l"
            type="number"
            step="0.01"
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          pH
          <input name="ph" type="number" step="0.1" className="rounded-md border border-input bg-card px-3 py-2" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Photos (optional)
        <input name="photos" type="file" accept="image/*" multiple className="text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Comments
        <textarea name="comments" rows={3} className="rounded-md border border-input bg-card px-3 py-2" />
      </label>

      <button
        type="submit"
        disabled={isPending || yachts.length === 0}
        className="mt-2 self-start rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Registering…" : "Register sample"}
      </button>
      {yachts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add a vessel under{" "}
          <Link href="/my-yacht/new" className="text-primary hover:underline">
            My Yacht
          </Link>{" "}
          before registering a sample.
        </p>
      )}
    </form>
  );
}
