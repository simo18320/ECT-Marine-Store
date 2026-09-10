"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export type DeliveryNoteFormState = { error?: string };

// Progressive numbering resets each calendar year (the common Italian convention, "12/2026") —
// computed here rather than via a DB sequence so it stays a plain, readable integer per year;
// the (year, number) unique constraint on the table is what actually prevents two concurrent
// generations from colliding, this is just the normal-path computation.
export async function generateDeliveryNote(
  orderId: string,
  _prevState: DeliveryNoteFormState,
  formData: FormData,
): Promise<DeliveryNoteFormState> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const causale = (formData.get("causale") as string) || "Vendita";
  const carrierName = (formData.get("carrier_name") as string) || null;
  const packageCount = Number(formData.get("package_count")) || 1;
  const totalWeightKg = formData.get("total_weight_kg") ? Number(formData.get("total_weight_kg")) : null;
  const notes = (formData.get("notes") as string) || null;

  const year = new Date().getFullYear();
  const { data: last } = await supabase
    .from("delivery_notes")
    .select("number")
    .eq("year", year)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNumber = (last?.number ?? 0) + 1;

  const { data, error } = await supabase
    .from("delivery_notes")
    .insert({
      order_id: orderId,
      year,
      number: nextNumber,
      causale,
      carrier_name: carrierName,
      package_count: packageCount,
      total_weight_kg: totalWeightKg,
      notes,
      created_by: staff.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "Someone else just generated a DDT at the same moment — try again." };
    }
    return { error: error?.message ?? "Could not generate the DDT." };
  }

  revalidatePath(`/admin/orders`);
  redirect(`/admin/delivery-notes/${data.id}`);
}
