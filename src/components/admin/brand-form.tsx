"use client";

import { useActionState } from "react";
import type { Database } from "@/types/database";
import type { BrandFormState } from "@/lib/admin/brand-actions";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

interface BrandFormProps {
  action: (prevState: BrandFormState, formData: FormData) => Promise<BrandFormState>;
  defaultValues?: Brand | null;
  submitLabel: string;
}

export function BrandForm({ action, defaultValues, submitLabel }: BrandFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          placeholder="e.g. Pentek"
          className="rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Slug
        <input
          name="slug"
          required
          defaultValue={defaultValues?.slug ?? ""}
          placeholder="pentek"
          className="rounded-md border border-input bg-card px-3 py-2 font-mono text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Website (optional)
        <input
          name="website"
          type="url"
          defaultValue={defaultValues?.website ?? ""}
          placeholder="https://www.pentek.com"
          className="rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </label>

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
