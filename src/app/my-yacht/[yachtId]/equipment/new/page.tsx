import { SiteHeader } from "@/components/nav/site-header";
import { EquipmentForm } from "@/components/yacht/equipment-form";
import { listEquipmentTypes } from "@/lib/equipment/queries";
import { createEquipment } from "@/lib/equipment/actions";

export default async function NewEquipmentPage({ params }: { params: Promise<{ yachtId: string }> }) {
  const { yachtId } = await params;
  const equipmentTypes = await listEquipmentTypes();
  const createForYacht = createEquipment.bind(null, yachtId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="mb-6 text-3xl font-medium">Add equipment</h1>
        <EquipmentForm action={createForYacht} equipmentTypes={equipmentTypes} submitLabel="Add equipment" />
      </main>
    </>
  );
}
