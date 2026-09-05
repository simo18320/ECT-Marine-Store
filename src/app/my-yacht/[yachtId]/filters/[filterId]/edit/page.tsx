import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { FilterForm } from "@/components/yacht/filter-form";
import { QrCode } from "@/components/yacht/qr-code";
import { getFilter, listFilterableProducts } from "@/lib/filters/queries";
import { listEquipmentForYacht } from "@/lib/equipment/queries";
import { updateFilter } from "@/lib/filters/actions";
import { filterQrUrl } from "@/lib/qr/generate";

export default async function EditFilterPage({
  params,
}: {
  params: Promise<{ yachtId: string; filterId: string }>;
}) {
  const { yachtId, filterId } = await params;
  const [filter, products, equipmentList] = await Promise.all([
    getFilter(filterId),
    listFilterableProducts(),
    listEquipmentForYacht(yachtId),
  ]);
  if (!filter) notFound();

  const equipmentOptions = equipmentList.map((e) => ({
    id: e.id,
    label: `${e.equipment_type?.name ?? "Equipment"}${e.location ? ` — ${e.location}` : ""}`,
  }));

  const updateWithIds = updateFilter.bind(null, yachtId, filterId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Edit filter</h1>

        <div className="mb-8">
          <QrCode url={filterQrUrl(filter.qr_code_token)} label={filter.product?.name ?? "filter"} />
        </div>

        <FilterForm
          action={updateWithIds}
          defaultValues={filter}
          equipmentOptions={equipmentOptions}
          productOptions={products}
          submitLabel="Save changes"
        />
      </main>
    </>
  );
}
