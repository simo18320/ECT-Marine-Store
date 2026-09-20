"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestWithdrawal, type LegalRequestState } from "@/lib/legal/actions";

export function WithdrawalForm({ orderNumber }: { orderNumber: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<LegalRequestState, FormData>(
    requestWithdrawal.bind(null, orderNumber),
    {},
  );

  if (state.success) {
    return (
      <p className="mt-8 rounded-md border border-status-good/40 bg-status-good/10 px-3 py-2 text-sm text-status-good">
        Withdrawal request received. We sent you a confirmation email and will contact you with the return instructions.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="mt-8 border-t border-border pt-4 text-sm">
        <button type="button" onClick={() => setOpen(true)} className="font-medium text-primary hover:underline">
          Withdraw from this order
        </button>
        <p className="mt-1 text-xs text-muted-foreground">
          For consumers, within 14 days of receiving the goods.{" "}
          <Link href="/withdrawal" className="underline">
            Conditions and exclusions
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-3 rounded-md border border-border p-4 text-sm">
      <p className="font-medium">Withdraw from order {orderNumber}</p>
      <p className="text-xs text-muted-foreground">
        By sending this you notify us that you withdraw from the whole order. Products made to order and
        opened sealed hygiene products are excluded, and business purchases carry no right of withdrawal.
      </p>
      {state.error && <p className="text-destructive">{state.error}</p>}
      <label className="flex flex-col gap-1">
        Notes (optional)
        <textarea name="message" rows={2} className="rounded-md border border-input bg-card px-3 py-2" />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Confirm withdrawal"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </form>
  );
}
