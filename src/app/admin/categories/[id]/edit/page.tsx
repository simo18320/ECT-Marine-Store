import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { getCategory } from "@/lib/admin/categories";
import { listCategoriesFlat } from "@/lib/admin/products";
import { updateCategory } from "@/lib/admin/category-actions";
import { CategoryForm } from "@/components/admin/category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [category, categories] = await Promise.all([getCategory(id), listCategoriesFlat()]);

  if (!category) notFound();

  const updateWithId = updateCategory.bind(null, id);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Edit category</h1>
      <CategoryForm action={updateWithId} defaultValues={category} categories={categories} submitLabel="Save changes" />
    </div>
  );
}
