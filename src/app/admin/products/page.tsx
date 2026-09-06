import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { listProductsAdmin } from "@/lib/admin/products";
import { toggleProductActive } from "@/lib/admin/product-actions";
import { formatCurrency } from "@/lib/utils";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export default async function AdminProductsPage() {
  const staff = await requireStaff();
  const products = await listProductsAdmin();
  const canEdit = staff.role === "ect_admin" || staff.role === "super_admin";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-medium">Products</h1>
        {canEdit && (
          <Link
            href="/admin/products/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            New product
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-2 font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{product.category?.name ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{product.brand?.name ?? "—"}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(product.selling_price)}</td>
                <td className="px-4 py-2">
                  <span className={product.is_active ? "text-status-good" : "text-muted-foreground"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    {canEdit && (
                      <Link href={`/admin/products/${product.id}/edit`} className="text-primary hover:underline">
                        Edit
                      </Link>
                    )}
                    {canEdit && (
                      <form action={toggleProductActive}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="is_active" value={String(product.is_active)} />
                        <button type="submit" className="text-muted-foreground hover:text-foreground">
                          {product.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    )}
                    {canEdit && <DeleteProductButton productId={product.id} productName={product.name} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
