import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { listCategoriesFlat } from "@/lib/admin/products";
import { deleteCategory } from "@/lib/admin/category-actions";

export default async function AdminCategoriesPage() {
  const staff = await requireStaff();
  const categories = await listCategoriesFlat();
  const canEdit = staff.role === "ect_admin" || staff.role === "super_admin";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        {canEdit && (
          <Link
            href="/admin/categories/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            New category
          </Link>
        )}
      </div>

      <ul className="divide-y divide-border rounded-md border border-border">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="whitespace-pre">{category.label}</span>
            {canEdit && (
              <div className="flex gap-3">
                <Link href={`/admin/categories/${category.id}/edit`} className="text-primary hover:underline">
                  Edit
                </Link>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <button type="submit" className="text-muted-foreground hover:text-destructive">
                    Delete
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
