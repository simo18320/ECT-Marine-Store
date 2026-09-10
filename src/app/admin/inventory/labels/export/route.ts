import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function specValue(specs: unknown, key: string): string {
  const s = (specs as Record<string, unknown>) ?? {};
  const v = s[key];
  return v == null ? "" : String(v);
}

// P-touch Editor's "connect database" / mail-merge feature reads a CSV, maps each column to a
// text/barcode/QR object on the label template, and prints one label per row — so this needs
// one row per physical unit (matching the quantity logic on the print pages), not one per
// product, and the QR column must hold the literal string a QR object should encode.
export async function GET() {
  await requireStaff();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, sku, name, selling_price, technical_specs, inventory(current_stock)")
    .eq("is_active", true)
    .order("sku");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const header = ["SKU", "Nome", "Dimensione", "Micron", "Prezzo", "QR"];
  const rows: string[] = [header.map(csvField).join(",")];

  for (const product of products ?? []) {
    const quantity = product.inventory?.current_stock ?? 0;
    if (quantity <= 0) continue;

    const row = [
      product.sku,
      product.name,
      specValue(product.technical_specs, "size"),
      specValue(product.technical_specs, "micron_rating"),
      product.selling_price.toFixed(2),
      `${appUrl}/admin/products/${product.id}/edit`,
    ]
      .map(csvField)
      .join(",");

    for (let i = 0; i < quantity; i++) rows.push(row);
  }

  const csv = "﻿" + rows.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="etichette-inventario.csv"',
    },
  });
}
