"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ServiceRequestStatus = Database["public"]["Enums"]["service_request_status"];

export async function createServiceRequest(yachtId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/my-yacht/${yachtId}`);

  await supabase.from("service_requests").insert({
    yacht_id: yachtId,
    requested_by: user.id,
    service_type: formData.get("service_type") as string,
    preferred_date: (formData.get("preferred_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath(`/my-yacht/${yachtId}`);
  redirect(`/my-yacht/${yachtId}`);
}

// The admin UI is the only caller, but RLS (is_yacht_member OR is_ect_staff) is what actually
// stops a customer updating a request that isn't theirs — this action attempts the same update
// regardless of caller, the database decides whether it's allowed.
export async function updateServiceRequestStatus(requestId: string, formData: FormData) {
  const supabase = await createClient();
  const status = formData.get("status") as ServiceRequestStatus;

  await supabase.from("service_requests").update({ status }).eq("id", requestId);
  revalidatePath("/admin/service-requests");
}
