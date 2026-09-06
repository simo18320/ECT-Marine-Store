import { requireStaff } from "@/lib/admin/guard";
import { listServiceRequests } from "@/lib/service-requests/queries";
import { updateServiceRequestStatus } from "@/lib/service-requests/actions";
import { serviceTypeLabel } from "@/lib/service-requests/types";
import type { Database } from "@/types/database";

type ServiceRequestStatus = Database["public"]["Enums"]["service_request_status"];
const STATUSES: ServiceRequestStatus[] = ["new", "scheduled", "in_progress", "completed", "cancelled"];

const STATUS_COLOR: Record<ServiceRequestStatus, string> = {
  new: "text-status-warning",
  scheduled: "text-status-warning",
  in_progress: "text-status-warning",
  completed: "text-status-good",
  cancelled: "text-status-critical",
};

export default async function AdminServiceRequestsPage() {
  await requireStaff();
  const requests = await listServiceRequests();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-medium">Service requests</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Water and air analysis bookings from customers. Update the status as you schedule and
        complete each one.
      </p>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Yacht</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Preferred date</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-2">{request.yacht?.name ?? "—"}</td>
                <td className="px-4 py-2">{serviceTypeLabel(request.service_type)}</td>
                <td className="px-4 py-2 text-muted-foreground">{request.preferred_date ?? "—"}</td>
                <td className="max-w-64 truncate px-4 py-2 text-muted-foreground">{request.notes ?? "—"}</td>
                <td className="px-4 py-2">
                  <form action={updateServiceRequestStatus.bind(null, request.id)} className="flex items-center gap-1">
                    <select
                      name="status"
                      defaultValue={request.status}
                      className={`rounded border border-input bg-card px-2 py-1 text-xs capitalize ${STATUS_COLOR[request.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="text-foreground">
                          {s.replace(/_/g, " ")}
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
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No service requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
