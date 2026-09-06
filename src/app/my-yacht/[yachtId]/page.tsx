import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { getYachtWithRegister } from "@/lib/yachts/queries";
import { deleteEquipment } from "@/lib/equipment/actions";
import { deleteFilter } from "@/lib/filters/actions";
import {
  computeEquipmentReplacementStatus,
  computeFilterReplacementStatus,
  REPLACEMENT_STATUS_COLOR,
  REPLACEMENT_STATUS_LABEL,
} from "@/lib/maintenance/rules";
import { listServiceRequestsForYacht } from "@/lib/service-requests/queries";
import { serviceTypeLabel } from "@/lib/service-requests/types";

const SERVICE_REQUEST_STATUS_LABEL: Record<string, string> = {
  new: "Requested",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function YachtDashboardPage({ params }: { params: Promise<{ yachtId: string }> }) {
  const { yachtId } = await params;
  const result = await getYachtWithRegister(yachtId);
  if (!result) notFound();
  const { yacht, equipment, filters } = result;
  const serviceRequests = await listServiceRequestsForYacht(yachtId);

  const deleteEquipmentForYacht = deleteEquipment.bind(null, yachtId);
  const deleteFilterForYacht = deleteFilter.bind(null, yachtId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link href="/my-yacht" className="text-sm text-muted-foreground hover:text-foreground">
          ← All yachts
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-medium">{yacht.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[yacht.yacht_type, yacht.length_m ? `${yacht.length_m}m` : null, yacht.build_year, yacht.flag]
                .filter(Boolean)
                .join(" · ") || "No details yet"}
            </p>
          </div>
          <Link
            href={`/my-yacht/${yachtId}/edit`}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Edit yacht
          </Link>
        </div>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Equipment register</h2>
            <Link href={`/my-yacht/${yachtId}/equipment/new`} className="text-sm font-medium text-primary hover:underline">
              + Add equipment
            </Link>
          </div>

          {equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground">No equipment registered yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {equipment.map((item) => {
                const { status } = computeEquipmentReplacementStatus(item);
                return (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {item.equipment_type?.name ?? "Equipment"}
                        {item.manufacturer ? ` — ${item.manufacturer}` : ""} {item.model ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.location ?? "No location"} · {item.serial_number ?? "No serial"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium ${REPLACEMENT_STATUS_COLOR[status]}`}>
                        {REPLACEMENT_STATUS_LABEL[status]}
                      </span>
                      <Link
                        href={`/my-yacht/${yachtId}/equipment/${item.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteEquipmentForYacht}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="text-muted-foreground hover:text-destructive">
                          Remove
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filter register</h2>
            <Link href={`/my-yacht/${yachtId}/filters/new`} className="text-sm font-medium text-primary hover:underline">
              + Add filter
            </Link>
          </div>

          {filters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No filters registered yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {filters.map((filter) => {
                const { status } = computeFilterReplacementStatus(
                  filter.installation_date,
                  filter.replacement_interval_days,
                );
                return (
                  <li key={filter.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{filter.product?.name ?? filter.filter_type ?? "Filter"}</p>
                      <p className="text-xs text-muted-foreground">
                        {filter.location ?? "No location"} · {filter.product?.sku ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium ${REPLACEMENT_STATUS_COLOR[status]}`}>
                        {REPLACEMENT_STATUS_LABEL[status]}
                      </span>
                      <Link href={`/my-yacht/${yachtId}/filters/${filter.id}/edit`} className="text-primary hover:underline">
                        Edit
                      </Link>
                      <form action={deleteFilterForYacht}>
                        <input type="hidden" name="id" value={filter.id} />
                        <button type="submit" className="text-muted-foreground hover:text-destructive">
                          Remove
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Water &amp; air analysis</h2>
            <Link
              href={`/my-yacht/${yachtId}/services/new`}
              className="text-sm font-medium text-primary hover:underline"
            >
              + Book an analysis
            </Link>
          </div>

          {serviceRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No analysis booked yet. Request a water or air quality check whenever something
              seems off, or on a routine schedule.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {serviceRequests.map((request) => (
                <li key={request.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{serviceTypeLabel(request.service_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.preferred_date ? `Requested for ${request.preferred_date}` : "No preferred date"}
                      {request.notes ? ` · ${request.notes}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {SERVICE_REQUEST_STATUS_LABEL[request.status] ?? request.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
