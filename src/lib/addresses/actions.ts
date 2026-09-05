"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readAddressForm(formData: FormData) {
  return {
    label: (formData.get("label") as string) || null,
    full_name: formData.get("full_name") as string,
    line1: formData.get("line1") as string,
    line2: (formData.get("line2") as string) || null,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    country: formData.get("country") as string,
    phone: (formData.get("phone") as string) || null,
  };
}

export async function createAddress(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/addresses");

  const fields = readAddressForm(formData);
  const isFirstAddress = (await supabase.from("customer_addresses").select("id", { count: "exact", head: true }).eq("customer_id", user.id)).count === 0;

  await supabase.from("customer_addresses").insert({
    ...fields,
    customer_id: user.id,
    is_default: isFirstAddress,
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function updateAddress(id: string, formData: FormData) {
  const supabase = await createClient();
  const fields = readAddressForm(formData);

  await supabase.from("customer_addresses").update(fields).eq("id", id);

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  await supabase.from("customer_addresses").delete().eq("id", id);

  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/addresses");

  // Only one default at a time: clear the flag on every other address first.
  await supabase.from("customer_addresses").update({ is_default: false }).eq("customer_id", user.id);
  await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);

  revalidatePath("/account/addresses");
}
