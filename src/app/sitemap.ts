import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/site-url";

// Regenerated at most hourly; reads only public catalogue data with the anonymous key.
export const revalidate = 3600;

const STATIC_PATHS = ["/shop", "/find-product", "/terms", "/privacy", "/withdrawal", "/company-info"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...STATIC_PATHS.map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true).limit(5000),
    supabase.from("categories").select("slug").limit(1000),
  ]);

  for (const c of categories ?? []) {
    entries.push({ url: `${base}/categories/${c.slug}`, changeFrequency: "weekly", priority: 0.7 });
  }
  for (const p of products ?? []) {
    entries.push({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly", priority: 0.8 });
  }
  return entries;
}
