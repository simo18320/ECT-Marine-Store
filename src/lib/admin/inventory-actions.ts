"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "./guard";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MovementType = Database["public"]["Enums"]["inventory_movement_type"];

export async function recordMovement(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const productId = formData.get("product_id") as string;
  const movementType = formData.get("movement_type") as MovementType;
  const quantity = Number(formData.get("quantity"));
  const note = (formData.get("note") as string) || null;

  if (!productId || !quantity || quantity <= 0) {
    throw new Error("Select a product and a positive quantity.");
  }

  await supabase.from("inventory_movements").insert({
    product_id: productId,
    movement_type: movementType,
    quantity,
    note,
    created_by: staff.userId,
  });

  revalidatePath("/admin/inventory");
}

export async function updateReorderPoint(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const productId = formData.get("product_id") as string;
  const reorderPoint = Number(formData.get("reorder_point"));
  const reorderQuantity = Number(formData.get("reorder_quantity"));

  await supabase
    .from("inventory")
    .update({ reorder_point: reorderPoint, reorder_quantity: reorderQuantity })
    .eq("product_id", productId);

  revalidatePath("/admin/inventory");
}
