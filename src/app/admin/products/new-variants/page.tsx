import { requireAdmin } from "@/lib/admin/guard";
import { listBrands, listCategoriesFlat } from "@/lib/admin/products";
import { createProductVariants } from "@/lib/admin/product-variant-actions";
import { VariantProductForm } from "@/components/admin/variant-product-form";

export default async function NewProductVariantsPage() {
  await requireAdmin();
  const [categories, brands] = await Promise.all([listCategoriesFlat(), listBrands()]);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-3xl font-medium">New product — multiple sizes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Create one filter type in several sizes/classes at once — each row below becomes its own
        product, sharing the same name, category and description.
      </p>
      <VariantProductForm action={createProductVariants} categories={categories} brands={brands} />
    </div>
  );
}
