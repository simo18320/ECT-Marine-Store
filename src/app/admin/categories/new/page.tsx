import { requireAdmin } from "@/lib/admin/guard";
import { listCategoriesFlat } from "@/lib/admin/products";
import { createCategory } from "@/lib/admin/category-actions";
import { CategoryForm } from "@/components/admin/category-form";

export default async function NewCategoryPage() {
  await requireAdmin();
  const categories = await listCategoriesFlat();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-3xl font-medium">New category</h1>
      <CategoryForm action={createCategory} categories={categories} submitLabel="Create category" />
    </div>
  );
}
