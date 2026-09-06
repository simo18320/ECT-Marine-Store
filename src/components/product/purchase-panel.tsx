"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import type { StockStatus } from "@/lib/inventory/rules";

interface PurchasePanelProps {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  unitPrice: number;
  vatRate: number;
  stockStatus: StockStatus;
  stockLabel: string;
  requiresComplianceAck: boolean;
}

export function PurchasePanel({
  productId,
  sku,
  name,
  slug,
  unitPrice,
  vatRate,
  stockStatus,
  stockLabel,
  requiresComplianceAck,
}: PurchasePanelProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [ackChecked, setAckChecked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const outOfStock = stockStatus === "out_of_stock";
  const canAdd = !outOfStock && (!requiresComplianceAck || ackChecked);

  function handleAddToCart() {
    addItem({ productId, sku, name, slug, unitPrice, vatRate }, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {requiresComplianceAck && (
        <label className="flex items-start gap-2 rounded-md border border-dashed border-status-warning/60 bg-status-warning/10 p-3 text-sm">
          <input
            type="checkbox"
            checked={ackChecked}
            onChange={(e) => setAckChecked(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            This is a regulated hygiene/sampling product. I confirm I understand the sample
            handling and lab submission requirements before purchasing.
          </span>
        </label>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="quantity">
          Qty
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!canAdd}
          onClick={handleAddToCart}
          className="flex-1 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? stockLabel : justAdded ? "Added to cart" : "Add to cart"}
        </button>
      </div>

      {justAdded && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="text-left text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          View cart →
        </button>
      )}
    </div>
  );
}
