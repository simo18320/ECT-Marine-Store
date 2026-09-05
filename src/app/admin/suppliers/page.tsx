import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { listSuppliers } from "@/lib/suppliers/queries";

const STATUS_COLOR: Record<string, string> = {
  discovered: "text-muted-foreground",
  under_review: "text-muted-foreground",
  qualified: "text-status-good",
  approved: "text-status-good",
  preferred: "text-status-good",
  blocked: "text-status-critical",
};

export default async function AdminSuppliersPage() {
  await requireStaff();
  const suppliers = await listSuppliers();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <Link href="/admin/suppliers/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          New supplier
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Quality</th>
              <th className="px-4 py-2 text-right">Reliability</th>
              <th className="px-4 py-2">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">
                  <Link href={`/admin/suppliers/${s.id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{s.country ?? "—"}</td>
                <td className={`px-4 py-2 capitalize ${STATUS_COLOR[s.status]}`}>{s.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-2 text-right">{s.quality_score ?? "—"}</td>
                <td className="px-4 py-2 text-right">{s.reliability_score ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{s.source ?? "manual"}</td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No suppliers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
