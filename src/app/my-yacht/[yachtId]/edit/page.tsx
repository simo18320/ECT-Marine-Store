import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { YachtForm } from "@/components/yacht/yacht-form";
import { getYacht } from "@/lib/yachts/queries";
import { updateYacht } from "@/lib/yachts/actions";

export default async function EditYachtPage({ params }: { params: Promise<{ yachtId: string }> }) {
  const { yachtId } = await params;
  const yacht = await getYacht(yachtId);
  if (!yacht) notFound();

  const updateWithId = updateYacht.bind(null, yachtId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Edit {yacht.name}</h1>
        <YachtForm action={updateWithId} defaultValues={yacht} submitLabel="Save changes" />
      </main>
    </>
  );
}
