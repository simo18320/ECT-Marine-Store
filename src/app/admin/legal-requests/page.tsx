import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { updateLegalRequestStatus } from "@/lib/legal/actions";

const WITHDRAWAL_STATUSES = ["new", "acknowledged", "completed", "rejected"];
const PRIVACY_STATUSES = ["new", "in_progress", "completed", "rejected"];

function StatusForm({
  kind,
  id,
  status,
  options,
}: {
  kind: "withdrawal" | "privacy";
  id: string;
  status: string;
  options: string[];
}) {
  return (
    <form action={updateLegalRequestStatus.bind(null, kind, id)} className="flex items-center gap-1">
      <select name="status" defaultValue={status} className="rounded border border-input bg-card px-2 py-1 text-xs capitalize">
        {options.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <button type="submit" className="text-xs text-primary hover:underline">
        Save
      </button>
    </form>
  );
}

export default async function AdminLegalRequestsPage() {
  await requireStaff();
  const supabase = await createClient();
  const [{ data: withdrawals }, { data: privacy }] = await Promise.all([
    supabase.from("withdrawal_requests").select("*, order:orders(order_number)").order("created_at", { ascending: false }),
    supabase.from("privacy_requests").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-3xl font-medium">Legal requests</h1>
        <p className="text-sm text-muted-foreground">
          Withdrawals from orders and GDPR requests. Privacy requests must be answered within one month.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Withdrawals</h2>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Notes</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(withdrawals ?? []).map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-2">{w.order?.order_number ?? "—"}</td>
                  <td className="max-w-64 truncate px-4 py-2 text-muted-foreground">{w.message ?? "—"}</td>
                  <td className="px-4 py-2">
                    <StatusForm kind="withdrawal" id={w.id} status={w.status} options={WITHDRAWAL_STATUSES} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{new Date(w.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
              {(withdrawals ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No withdrawal requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Privacy requests</h2>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">From</th>
                <th className="px-4 py-2">Details</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(privacy ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 capitalize">{r.request_type}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.email}</td>
                  <td className="max-w-64 truncate px-4 py-2 text-muted-foreground">{r.message ?? "—"}</td>
                  <td className="px-4 py-2">
                    <StatusForm kind="privacy" id={r.id} status={r.status} options={PRIVACY_STATUSES} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
              {(privacy ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No privacy requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
