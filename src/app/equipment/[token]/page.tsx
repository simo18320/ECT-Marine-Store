import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { createClient } from "@/lib/supabase/server";
import { getEquipmentByToken } from "@/lib/equipment/queries";
import {
  computeEquipmentReplacementStatus,
  REPLACEMENT_STATUS_COLOR,
  REPLACEMENT_STATUS_LABEL,
} from "@/lib/maintenance/rules";

export default async function EquipmentQrPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/equipment/${token}`);

  const equipment = await getEquipmentByToken(token);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {!equipment ? (
          <>
            <h1 className="text-3xl font-medium">Not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This QR code doesn&rsquo;t match any equipment you have access to.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{equipment.yacht?.name}</p>
            <h1 className="text-3xl font-medium">{equipment.equipment_type?.name ?? "Equipment"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {equipment.manufacturer} {equipment.model}
            </p>

            {(() => {
              const { status, dueDate } = computeEquipmentReplacementStatus(equipment);
              return (
                <div className="mt-6 rounded-md border border-border p-4">
                  <p className={`font-medium ${REPLACEMENT_STATUS_COLOR[status]}`}>
                    {REPLACEMENT_STATUS_LABEL[status]}
                  </p>
                  {dueDate && (
                    <p className="text-sm text-muted-foreground">
                      Next maintenance: {dueDate.toLocaleDateString("en-GB")}
                    </p>
                  )}
                </div>
              );
            })()}

            <dl className="mt-6 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Location</dt>
              <dd>{equipment.location ?? "—"}</dd>
              <dt className="text-muted-foreground">Serial number</dt>
              <dd>{equipment.serial_number ?? "—"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{equipment.status}</dd>
            </dl>

            {equipment.yacht && (
              <Link
                href={`/my-yacht/${equipment.yacht.id}/equipment/${equipment.id}/edit`}
                className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
              >
                Edit this record →
              </Link>
            )}
          </>
        )}
      </main>
    </>
  );
}
