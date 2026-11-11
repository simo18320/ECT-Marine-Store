"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "./guard";
import { createClient } from "@/lib/supabase/server";
import { isMovementKind, MOVEMENT_KINDS, removalError, resolveMovement } from "@/lib/inventory/movements";
import { isBackorderable } from "@/lib/inventory/rules";

export type MovementFormState = { error?: string; success?: string };

export async function recordMovement(_prev: MovementFormState, formData: FormData): Promise<MovementFormState> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const productId = String(formData.get("product_id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const quantity = Number(formData.get("quantity"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!productId) return { error: "Select a product." };
  if (!isMovementKind(kind)) return { error: "Select the type of movement." };
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Quantity must be a whole number greater than zero." };

  const movement = resolveMovement(kind, quantity);
  if (movement.noteRequired && !note) return { error: "Add a note explaining the reason: it is kept in the movement history." };

  const [{ data: product }, { data: inventory }] = await Promise.all([
    supabase.from("products").select("sku, delivery_estimate").eq("id", productId).maybeSingle(),
    supabase.from("inventory").select("current_stock").eq("product_id", productId).maybeSingle(),
  ]);
  if (!product) return { error: "Product not found." };

  const before = inventory?.current_stock ?? 0;
  const refusal = removalError(before, movement.delta, isBackorderable(product.delivery_estimate));
  if (refusal) return { error: refusal };

  const { error } = await supabase.from("inventory_movements").insert({
    product_id: productId,
    movement_type: movement.movementType,
    quantity: movement.storedQuantity,
    note,
    reference_type: "manual",
    created_by: staff.userId,
  });
  if (error) return { error: "Could not record the movement. Please try again." };

  revalidatePath("/admin/inventory");
  revalidatePath(`/i/${product.sku}`);
  const after = before + movement.delta;
  const sign = movement.delta > 0 ? "+" : "−";
  return { success: `${product.sku}: ${sign}${quantity} (${MOVEMENT_KINDS[kind].label.replace(/ \([+−]\)$/, "")}). Stock was ${before}, now ${after}.` };
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
