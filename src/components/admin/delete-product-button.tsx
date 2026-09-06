"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/lib/admin/product-actions";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete "${productName}" permanently? This can't be undone.`)) return;
        const formData = new FormData();
        formData.set("id", productId);
        startTransition(() => {
          deleteProduct(formData).catch((err) => alert(err instanceof Error ? err.message : "Could not delete product."));
        });
      }}
      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
