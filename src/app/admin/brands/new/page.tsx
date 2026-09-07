import { requireAdmin } from "@/lib/admin/guard";
import { createBrand } from "@/lib/admin/brand-actions";
import { BrandForm } from "@/components/admin/brand-form";

export default async function NewBrandPage() {
  await requireAdmin();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-3xl font-medium">New brand</h1>
      <BrandForm action={createBrand} submitLabel="Create brand" />
    </div>
  );
}
