// procurement.md §5: "Claude may draft the RFQ text from these structured fields." No AI
// integration exists in this codebase yet (that's Phase 8 / ai-engine.md) and procurement.md's
// own MVP note already hedges this ("depends on which search tool is wired up when Phase 7
// starts") — so, like the recommendation engine in Phase 6, this is a deterministic template for
// now, not an actual model call. It still satisfies the MVP requirement either way: the RFQ is
// never transmitted automatically, an admin always reviews and sends it themselves.
export interface RfqDraftInput {
  supplierName: string;
  productName: string;
  productSku: string;
  quantity: number;
  specification: string | null;
  destination: string | null;
  requestedDeliveryDate: string | null;
}

export function generateRfqDraftText(input: RfqDraftInput): string {
  const lines: (string | null)[] = [
    `Subject: Request for Quotation — ${input.productName} (${input.productSku})`,
    "",
    `Dear ${input.supplierName} team,`,
    "",
    "Eco Cleaning Technologies Consulting Srl would like to request a quotation for the following:",
    "",
    `- Product: ${input.productName} (SKU ${input.productSku})`,
    `- Quantity: ${input.quantity}`,
    input.specification ? `- Specification: ${input.specification}` : null,
    input.destination ? `- Delivery destination: ${input.destination}` : null,
    input.requestedDeliveryDate ? `- Requested delivery date: ${input.requestedDeliveryDate}` : null,
    "",
    "Please include unit price, MOQ, lead time, shipping cost, duties/handling (if applicable) and payment terms in your response.",
    "",
    "Best regards,",
    "Eco Cleaning Technologies Consulting Srl — Procurement",
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}
