"use client";

import { useState } from "react";
import type { Address } from "@/lib/addresses/queries";

interface AddressFormProps {
  action: (formData: FormData) => void;
  defaultValues?: Address | null;
  submitLabel: string;
}

export function AddressForm({ action, defaultValues, submitLabel }: AddressFormProps) {
  const [businessFieldsShown, setBusinessFieldsShown] = useState(defaultValues?.is_business ?? false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Label (optional)
        <input
          name="label"
          defaultValue={defaultValues?.label ?? ""}
          placeholder="e.g. Home, Marina office"
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Full name
        <input
          name="full_name"
          required
          defaultValue={defaultValues?.full_name ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Address line 1
        <input
          name="line1"
          required
          defaultValue={defaultValues?.line1 ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Address line 2 (optional)
        <input
          name="line2"
          defaultValue={defaultValues?.line2 ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          City
          <input
            name="city"
            required
            defaultValue={defaultValues?.city ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Postal code
          <input
            name="postal_code"
            required
            defaultValue={defaultValues?.postal_code ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Country
        <input
          name="country"
          required
          defaultValue={defaultValues?.country ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Phone (optional)
        <input
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <div className="rounded-md border border-border p-4">
        <h3 className="text-sm font-medium">Billing details</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          We&rsquo;ll issue a full electronic invoice when we have everything we need for it —
          otherwise you&rsquo;ll get a payment receipt.
        </p>

        <label className="mt-3 flex flex-col gap-1 text-sm">
          Codice fiscale
          <input
            name="tax_code"
            defaultValue={defaultValues?.tax_code ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_business"
            defaultChecked={defaultValues?.is_business ?? false}
            onChange={(e) => setBusinessFieldsShown(e.target.checked)}
          />
          Purchasing as a business
        </label>

        {businessFieldsShown && (
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Partita IVA
              <input
                name="vat_number"
                defaultValue={defaultValues?.vat_number ?? ""}
                className="rounded-md border border-input bg-card px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm">
                PEC (optional if SDI code given)
                <input
                  name="pec_email"
                  type="email"
                  defaultValue={defaultValues?.pec_email ?? ""}
                  className="rounded-md border border-input bg-card px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Codice destinatario SDI
                <input
                  name="sdi_code"
                  defaultValue={defaultValues?.sdi_code ?? ""}
                  className="rounded-md border border-input bg-card px-3 py-2"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
      >
        {submitLabel}
      </button>
    </form>
  );
}
