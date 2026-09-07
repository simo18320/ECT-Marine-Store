import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { listBrandsAdmin } from "@/lib/admin/brands";
import { deleteBrand } from "@/lib/admin/brand-actions";

export default async function AdminBrandsPage() {
  const staff = await requireStaff();
  const brands = await listBrandsAdmin();
  const canEdit = staff.role === "ect_admin" || staff.role === "super_admin";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-medium">Brands</h1>
        {canEdit && (
          <Link
            href="/admin/brands/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            New brand
          </Link>
        )}
      </div>

      <ul className="divide-y divide-border rounded-md border border-border">
        {brands.map((brand) => (
          <li key={brand.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>
              {brand.name} <span className="text-muted-foreground">({brand.slug})</span>
            </span>
            {canEdit && (
              <div className="flex gap-3">
                <Link href={`/admin/brands/${brand.id}/edit`} className="text-primary hover:underline">
                  Edit
                </Link>
                <form action={deleteBrand}>
                  <input type="hidden" name="id" value={brand.id} />
                  <button type="submit" className="text-muted-foreground hover:text-destructive">
                    Delete
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
        {brands.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No brands yet.</li>}
      </ul>
    </div>
  );
}
