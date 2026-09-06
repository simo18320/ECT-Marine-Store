"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./guard";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

function readProductForm(formData: FormData) {
  const certifications = (formData.get("certifications") as string)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  let technicalSpecs: Json = {};
  const rawSpecs = (formData.get("technical_specs") as string)?.trim();
  if (rawSpecs) {
    try {
      technicalSpecs = JSON.parse(rawSpecs);
    } catch {
      // Invalid JSON — fall back to empty rather than reject the whole form; the admin can
      // fix the specs in a follow-up edit without losing everything else they entered.
      technicalSpecs = {};
    }
  }

  const categoryId = formData.get("category_id") as string;
  const brandId = formData.get("brand_id") as string;

  return {
    sku: (formData.get("sku") as string | null)?.trim() || "",
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    category_id: categoryId || null,
    brand_id: brandId || null,
    description: (formData.get("description") as string) || null,
    short_description: (formData.get("short_description") as string) || null,
    technical_specs: technicalSpecs,
    unit: (formData.get("unit") as string) || "pcs",
    purchase_cost: formData.get("purchase_cost") ? Number(formData.get("purchase_cost")) : null,
    selling_price: Number(formData.get("selling_price")),
    vat_rate: Number(formData.get("vat_rate")) || 22,
    weight_kg: formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null,
    replacement_interval_days: formData.get("replacement_interval_days")
      ? Number(formData.get("replacement_interval_days"))
      : null,
    certifications,
    requires_compliance_ack: formData.get("requires_compliance_ack") === "on",
    is_active: formData.get("is_active") === "on",
  };
}

// Existing SKUs are short hand-written codes (e.g. "ECT-SED-10-5M") that encode category/spec
// info an admin chose deliberately — auto-generation can't reproduce that, so instead it just
// hands out the next sequential ECT-#### code, leaving the manual style available on edit if
// someone wants to rename a product's code to something more descriptive later.
async function generateNextSku(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data } = await supabase.from("products").select("sku").like("sku", "ECT-%");

  const nextNumber =
    (data ?? [])
      .map((row) => /^ECT-(\d{4,})$/.exec(row.sku)?.[1])
      .filter((n): n is string => Boolean(n))
      .map(Number)
      .reduce((max, n) => Math.max(max, n), 0) + 1;

  return `ECT-${String(nextNumber).padStart(4, "0")}`;
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const fields = readProductForm(formData);
  const sku = fields.sku || (await generateNextSku(supabase));

  const { data, error } = await supabase.from("products").insert({ ...fields, sku }).select("id").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create product.");
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const fields = readProductForm(formData);

  await supabase.from("products").update(fields).eq("id", id);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  redirect("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  await supabase.from("products").update({ is_active: !isActive }).eq("id", id);
  revalidatePath("/admin/products");
}

// Permanently removes a product — used to clear out the placeholder/demo catalogue so an owner
// can start with only their real products. Images/documents/inventory rows cascade at the
// database level; a product with real order, RFQ, or installation history is protected by a
// FOREIGN KEY RESTRICT there and this surfaces that as a friendly message rather than deactivating
// it silently, since a silent fallback would hide the fact that the delete didn't happen.
export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);
  const paths = (images ?? [])
    .map((img) => img.url.split(`/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`)[1])
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("Can't delete — this product has orders, RFQs, or installation history. Deactivate it instead.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
}

const PRODUCT_IMAGES_BUCKET = "product-images";

export async function uploadProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("Choose an image file to upload.");

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  const altText = (formData.get("alt_text") as string) || null;

  await supabase.from("product_images").insert({ product_id: productId, url: publicUrl, alt_text: altText });
  revalidatePath(`/admin/products/${productId}/edit`);
}

const MAX_IMPORTED_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB — generous for a product photo, not for abuse
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Downloads a supplier/manufacturer photo server-side and re-hosts it in our own bucket, rather
// than either a manual download-then-upload round trip or hotlinking their URL directly (which
// breaks the moment they reorganize their site, and puts their bandwidth bill on every one of our
// product-page views). Admin-only — this is a server-side fetch of an admin-supplied URL, so it
// carries the same trust boundary as any other admin-only action, but is still capped and
// content-type-checked rather than accepting an arbitrary, unbounded response.
export async function importProductImageFromUrl(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const sourceUrl = (formData.get("source_url") as string)?.trim();
  if (!sourceUrl) throw new Error("Paste the supplier's image URL.");

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http/https URLs are supported.");
  }

  const response = await fetch(sourceUrl, { redirect: "follow" });
  if (!response.ok) throw new Error(`Could not download that image (HTTP ${response.status}).`);

  const contentType = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
  if (!extension) {
    throw new Error(`That URL didn't return a supported image type (got "${contentType || "unknown"}").`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMPORTED_IMAGE_BYTES) {
    throw new Error("That image is larger than 15MB — download and resize it first.");
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_IMPORTED_IMAGE_BYTES) {
    throw new Error("That image is larger than 15MB — download and resize it first.");
  }

  const path = `${productId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, bytes, { contentType });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  const altText = (formData.get("alt_text") as string) || null;

  await supabase.from("product_images").insert({ product_id: productId, url: publicUrl, alt_text: altText });
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const imageId = formData.get("id") as string;

  const { data: image } = await supabase.from("product_images").select("url").eq("id", imageId).single();

  await supabase.from("product_images").delete().eq("id", imageId);

  // Only ever remove the underlying file for an image actually stored in our bucket — a row
  // added before the URL-import path replaced plain hotlinking may still point at storage we
  // don't own, and removing an object there isn't ours to do.
  if (image?.url.includes(`/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`)) {
    const path = image.url.split(`/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`)[1];
    if (path) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function addProductDocument(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const docType = (formData.get("doc_type") as string) || "datasheet";

  await supabase.from("product_documents").insert({ product_id: productId, title, url, doc_type: docType });
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteProductDocument(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const docId = formData.get("id") as string;

  await supabase.from("product_documents").delete().eq("id", docId);
  revalidatePath(`/admin/products/${productId}/edit`);
}
