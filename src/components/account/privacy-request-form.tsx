"use client";

import { useActionState } from "react";
import { submitPrivacyRequest, type LegalRequestState } from "@/lib/legal/actions";

const TYPES = [
  ["erasure", "Delete my data / account"],
  ["access", "Access my data"],
  ["rectification", "Correct my data"],
  ["restriction", "Restrict processing"],
  ["objection", "Object to processing"],
  ["portability", "Data portability"],
  ["other", "Other"],
];

export function PrivacyRequestForm() {
  const [state, formAction, isPending] = useActionState<LegalRequestState, FormData>(submitPrivacyRequest, {});

  if (state.success) {
    return (
      <p className="rounded-md border border-status-good/40 bg-status-good/10 px-3 py-2 text-sm text-status-good">
        Request received. We sent you a confirmation and will reply within one month.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 text-sm">
      {state.error && <p className="text-destructive">{state.error}</p>}
      <label className="flex flex-col gap-1">
        Request type
        <select name="request_type" defaultValue="erasure" className="rounded-md border border-input bg-card px-3 py-2">
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Details (optional)
        <textarea name="message" rows={2} className="rounded-md border border-input bg-card px-3 py-2" />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}
