import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAddresses } from "@/lib/addresses/queries";
import { deleteAddress, setDefaultAddress } from "@/lib/addresses/actions";

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/addresses");

  const addresses = await getAddresses();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Addresses</h1>
        <Link
          href="/account/addresses/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add address
        </Link>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No addresses yet. Add one before checking out.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm">
                  {address.is_default && (
                    <span className="mb-1 inline-block rounded bg-secondary px-2 py-0.5 text-xs font-medium">
                      Default
                    </span>
                  )}
                  {address.label && <p className="font-medium">{address.label}</p>}
                  <p>{address.full_name}</p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.postal_code}
                  </p>
                  <p>{address.country}</p>
                  {address.phone && <p className="text-muted-foreground">{address.phone}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
                  <Link href={`/account/addresses/${address.id}/edit`} className="text-primary hover:underline">
                    Edit
                  </Link>
                  {!address.is_default && (
                    <form action={setDefaultAddress}>
                      <input type="hidden" name="id" value={address.id} />
                      <button type="submit" className="text-muted-foreground hover:text-foreground">
                        Set as default
                      </button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className="text-muted-foreground hover:text-destructive">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link href="/account" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Back to account
      </Link>
    </main>
  );
}
