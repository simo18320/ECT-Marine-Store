import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { EquipmentForm } from "@/components/yacht/equipment-form";
import { QrCode } from "@/components/yacht/qr-code";
import { getEquipment, listEquipmentTypes } from "@/lib/equipment/queries";
import { updateEquipment } from "@/lib/equipment/actions";
import { equipmentQrUrl } from "@/lib/qr/generate";

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ yachtId: string; equipmentId: string }>;
}) {
  const { yachtId, equipmentId } = await params;
  const [equipment, equipmentTypes] = await Promise.all([getEquipment(equipmentId), listEquipmentTypes()]);
  if (!equipment) notFound();

  const updateWithIds = updateEquipment.bind(null, yachtId, equipmentId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="mb-6 text-3xl font-medium">Edit equipment</h1>

        <div className="mb-8">
          <QrCode url={equipmentQrUrl(equipment.qr_code_token)} label={equipment.equipment_type?.name ?? "equipment"} />
        </div>

        <EquipmentForm
          action={updateWithIds}
          defaultValues={equipment}
          equipmentTypes={equipmentTypes}
          submitLabel="Save changes"
        />
      </main>
    </>
  );
}
