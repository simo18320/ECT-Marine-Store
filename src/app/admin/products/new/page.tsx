import { requireAdmin } from "@/lib/admin/guard";
import { listBrands, listCategoriesFlat } from "@/lib/admin/products";
import { createProduct } from "@/lib/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, brands] = await Promise.all([listCategoriesFlat(), listBrands()]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">New product</h1>
      <ProductForm action={createProduct} categories={categories} brands={brands} submitLabel="Create product" />
    </div>
  );
}
