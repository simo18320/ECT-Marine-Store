import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { listCustomers } from "@/lib/admin/customers";

export default async function AdminCustomersPage() {
  await requireStaff();
  const customers = await listCustomers();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-medium">Customers</h1>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-2">
                  <Link href={`/admin/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                    {customer.full_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{customer.email}</td>
                <td className="px-4 py-2 capitalize">{customer.account_type}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(customer.created_at).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
