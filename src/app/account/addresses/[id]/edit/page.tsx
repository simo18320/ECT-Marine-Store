import { notFound } from "next/navigation";
import { AddressForm } from "@/components/account/address-form";
import { getAddressById } from "@/lib/addresses/queries";
import { updateAddress } from "@/lib/addresses/actions";

export default async function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const address = await getAddressById(id);
  if (!address) notFound();

  const updateWithId = updateAddress.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Edit address</h1>
      <AddressForm action={updateWithId} defaultValues={address} submitLabel="Save changes" />
    </main>
  );
}
