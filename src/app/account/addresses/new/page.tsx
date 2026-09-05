import { AddressForm } from "@/components/account/address-form";
import { createAddress } from "@/lib/addresses/actions";

export default function NewAddressPage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Add address</h1>
      <AddressForm action={createAddress} submitLabel="Save address" />
    </main>
  );
}
