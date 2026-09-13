"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SampleRegistrationState = { error?: string; success?: boolean; sampleId?: string };

const PRODUCT_IMAGES_BUCKET = "product-images"; // reused as general-purpose photo storage for now
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export async function registerSample(
  _prevState: SampleRegistrationState,
  formData: FormData,
): Promise<SampleRegistrationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to register a sample." };

  const yachtId = formData.get("yacht_id") as string;
  if (!yachtId) return { error: "Select a vessel." };

  const productId = (formData.get("product_id") as string) || null;
  const equipmentId = (formData.get("equipment_id") as string) || null;
  const samplePoint = (formData.get("sample_point") as string)?.trim() || null;
  const sampledAt = (formData.get("sampled_at") as string) || new Date().toISOString().slice(0, 10);
  const vesselImo = (formData.get("vessel_imo") as string)?.trim() || null;
  const collectedBy = (formData.get("collected_by") as string)?.trim() || null;
  const reasonForSampling = (formData.get("reason_for_sampling") as string)?.trim() || null;
  const waterTemperature = formData.get("water_temperature_c")
    ? Number(formData.get("water_temperature_c"))
    : null;
  const freeChlorine = formData.get("free_chlorine_mg_l") ? Number(formData.get("free_chlorine_mg_l")) : null;
  const ph = formData.get("ph") ? Number(formData.get("ph")) : null;
  const comments = (formData.get("comments") as string)?.trim() || null;

  const { data: sample, error } = await supabase
    .from("water_analysis")
    .insert({
      yacht_id: yachtId,
      product_id: productId,
      equipment_id: equipmentId,
      sample_point: samplePoint,
      sampled_at: sampledAt,
      vessel_imo: vesselImo,
      collected_by: collectedBy,
      reason_for_sampling: reasonForSampling,
      water_temperature_c: waterTemperature,
      free_chlorine_mg_l: freeChlorine,
      ph,
      comments,
      parameters: {},
      status: "registered",
    })
    .select("id")
    .single();

  if (error || !sample) {
    return { error: error?.message ?? "Could not register the sample." };
  }

  await supabase.from("water_analysis_events").insert({
    water_analysis_id: sample.id,
    event_type: "sample_registered",
    actor: user.email ?? user.id,
    notes: "Registered via the ECT digital sampling form.",
  });

  const photos = formData.getAll("photos") as File[];
  for (const photo of photos) {
    if (!photo || photo.size === 0 || photo.size > MAX_PHOTO_BYTES) continue;
    const extension = photo.name.includes(".") ? photo.name.split(".").pop() : "jpg";
    const path = `samples/${sample.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) continue;
    const {
      data: { publicUrl },
    } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    await supabase.from("water_analysis_photos").insert({ water_analysis_id: sample.id, url: publicUrl });
  }

  revalidatePath("/my-yacht");
  return { success: true, sampleId: sample.id };
}
