import { requireStaff } from "@/lib/admin/guard";
import { createSupplier } from "@/lib/suppliers/service";
import { SupplierForm } from "@/components/admin/supplier-form";

export default async function NewSupplierPage() {
  await requireStaff();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-3xl font-medium">New supplier</h1>
      <SupplierForm action={createSupplier} submitLabel="Create supplier" />
    </div>
  );
}
