import { createClient } from "@supabase/supabase-js";
import { buildFeed, type FeedProduct } from "@/lib/feeds/google-merchant";
import { siteUrl } from "@/lib/site-url";

// Public catalogue data only, read with the anonymous key (same rows any visitor can see).
// Merchant Center fetches this on a schedule; one hour of caching keeps it cheap.
export const revalidate = 3600;

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("products")
    .select(
      "sku, slug, name, description, short_description, selling_price, vat_rate, availability_status, brand:brands(name), category:categories(name), images:product_images(url, sort_order), shipping_class, special_shipping_required",
    )
    .eq("is_active", true)
    .order("sku")
    .limit(5000);

  if (error || !data) return new Response("Feed temporarily unavailable", { status: 503 });

  const { xml } = buildFeed(data as unknown as FeedProduct[], siteUrl());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // A feed is for Google's fetcher, not for search results.
      "X-Robots-Tag": "noindex",
    },
  });
}
