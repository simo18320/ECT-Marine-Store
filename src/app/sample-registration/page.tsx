import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { createClient } from "@/lib/supabase/server";
import { SampleRegistrationForm } from "@/components/samples/sample-registration-form";

export default async function SampleRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/sample-registration${productId ? `?product=${productId}` : ""}`);

  const [{ data: yachts }, { data: product }] = await Promise.all([
    supabase
      .from("yachts")
      .select("id, name, equipment(id, manufacturer, model, equipment_type:equipment_types(name))")
      .order("created_at", { ascending: false }),
    productId ? supabase.from("products").select("name").eq("id", productId).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const yachtOptions = (yachts ?? []).map((y) => ({
    id: y.id,
    name: y.name,
    equipment: (y.equipment ?? []).map((eq) => ({
      id: eq.id,
      label: [eq.equipment_type?.name, eq.manufacturer, eq.model].filter(Boolean).join(" — ") || "Equipment",
    })),
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-medium">Register a sample</h1>
        <p className="mt-2 text-muted-foreground">
          Log the vessel, sampling point and conditions at the time of collection. This registers
          the sample with ECT — laboratory results are added separately once they come back.
        </p>
        <div className="mt-8">
          <SampleRegistrationForm yachts={yachtOptions} productName={product?.name ?? null} productId={productId ?? null} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
