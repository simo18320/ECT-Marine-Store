import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAddresses } from "@/lib/addresses/queries";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const addresses = await getAddresses();

  if (addresses.length === 0) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16 text-center">
        <h1 className="text-3xl font-medium">Add a delivery address</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need at least one address on file before checking out.
        </p>
        <Link
          href="/account/addresses/new"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md"
        >
          Add address
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="mb-6 text-3xl font-medium">Checkout</h1>
      <CheckoutClient addresses={addresses} />
    </main>
  );
}
