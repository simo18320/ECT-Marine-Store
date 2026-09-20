import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Cached per request (React's cache(), not a persistent cache) so every ProductCard on a
// listing page shares one query instead of firing one each — there's exactly one settings
// row, so this is purely about not repeating the same read across a page's component tree.
export const getStoreSettings = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("restock_mode, restock_label, free_shipping_threshold, shipping_fee_italy")
    .eq("id", true)
    .single();

  return (
    data ?? { restock_mode: false, restock_label: "Coming soon", free_shipping_threshold: 100, shipping_fee_italy: 12.9 }
  );
});

export async function getShippingSettings() {
  const settings = await getStoreSettings();
  return { freeThreshold: Number(settings.free_shipping_threshold), feeItaly: Number(settings.shipping_fee_italy) };
}
