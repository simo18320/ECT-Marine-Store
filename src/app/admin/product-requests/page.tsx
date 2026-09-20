import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { updateShippingQuoteStatus } from "@/lib/shipping-quotes/actions";
import { listProductAvailabilityRequests } from "@/lib/product-requests/queries";
import { updateProductAvailabilityRequestStatus } from "@/lib/product-requests/actions";
import type { Database } from "@/types/database";

type RequestStatus = Database["public"]["Tables"]["product_availability_requests"]["Row"]["status"];
const STATUSES: RequestStatus[] = ["new", "contacted", "fulfilled", "cancelled"];

const STATUS_COLOR: Record<RequestStatus, string> = {
  new: "text-status-warning",
  contacted: "text-status-warning",
  fulfilled: "text-status-good",
  cancelled: "text-status-critical",
};

export default async function AdminProductRequestsPage() {
  await requireStaff();
  const requests = await listProductAvailabilityRequests();
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("shipping_quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-medium">Product requests</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Customers who asked to be contacted about an out-of-stock product. Update the status as
        you follow up.
      </p>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Requester</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Message</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-2">
                  {request.product ? (
                    <Link href={`/products/${request.product.slug}`} className="hover:underline">
                      {request.product.name}
                      <span className="ml-1 text-xs text-muted-foreground">{request.product.sku}</span>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">{request.name}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  <a href={`mailto:${request.email}`} className="hover:underline">
                    {request.email}
                  </a>
                  {request.phone && <div>{request.phone}</div>}
                </td>
                <td className="px-4 py-2">{request.quantity}</td>
                <td className="max-w-64 truncate px-4 py-2 text-muted-foreground">{request.message ?? "—"}</td>
                <td className="px-4 py-2">
                  <form action={updateProductAvailabilityRequestStatus.bind(null, request.id)} className="flex items-center gap-1">
                    <select
                      name="status"
                      defaultValue={request.status}
                      className={`rounded border border-input bg-card px-2 py-1 text-xs capitalize ${STATUS_COLOR[request.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="text-foreground">
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs text-primary hover:underline">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No product requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-12 text-2xl font-medium">Shipping quote requests</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Orders to destinations outside Italy — reply to the customer with the shipping cost.
      </p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Destination</th>
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(quotes ?? []).map((q) => (
              <tr key={q.id}>
                <td className="px-4 py-2">
                  <a href={`mailto:${q.email}`} className="hover:underline">
                    {q.email}
                  </a>
                </td>
                <td className="max-w-56 px-4 py-2 text-muted-foreground">{q.address_summary ?? q.country}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {(q.items as { quantity: number; name: string }[]).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  {q.message && <div className="mt-1 text-xs">“{q.message}”</div>}
                </td>
                <td className="px-4 py-2">
                  <form action={updateShippingQuoteStatus.bind(null, q.id)} className="flex items-center gap-1">
                    <select name="status" defaultValue={q.status} className="rounded border border-input bg-card px-2 py-1 text-xs capitalize">
                      {["new", "quoted", "closed"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs text-primary hover:underline">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(q.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
            {(quotes ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No quote requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
