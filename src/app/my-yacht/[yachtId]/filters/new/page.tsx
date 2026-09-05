import { SiteHeader } from "@/components/nav/site-header";
import { FilterForm } from "@/components/yacht/filter-form";
import { listFilterableProducts } from "@/lib/filters/queries";
import { listEquipmentForYacht } from "@/lib/equipment/queries";
import { createFilter } from "@/lib/filters/actions";

export default async function NewFilterPage({ params }: { params: Promise<{ yachtId: string }> }) {
  const { yachtId } = await params;
  const [products, equipmentList] = await Promise.all([
    listFilterableProducts(),
    listEquipmentForYacht(yachtId),
  ]);

  const equipmentOptions = equipmentList.map((e) => ({
    id: e.id,
    label: `${e.equipment_type?.name ?? "Equipment"}${e.location ? ` — ${e.location}` : ""}`,
  }));

  const createForYacht = createFilter.bind(null, yachtId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Add filter</h1>
        <FilterForm
          action={createForYacht}
          equipmentOptions={equipmentOptions}
          productOptions={products}
          submitLabel="Add filter"
        />
      </main>
    </>
  );
}
