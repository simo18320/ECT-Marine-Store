import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { getBrand } from "@/lib/admin/brands";
import { updateBrand } from "@/lib/admin/brand-actions";
import { BrandForm } from "@/components/admin/brand-form";

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const brand = await getBrand(id);

  if (!brand) notFound();

  const updateWithId = updateBrand.bind(null, id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-3xl font-medium">Edit brand</h1>
      <BrandForm action={updateWithId} defaultValues={brand} submitLabel="Save changes" />
    </div>
  );
}
