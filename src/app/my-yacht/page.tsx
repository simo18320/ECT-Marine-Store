import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { createClient } from "@/lib/supabase/server";
import { getYachtsForUser } from "@/lib/yachts/queries";

export default async function MyYachtPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-yacht");

  const yachts = await getYachtsForUser();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Yacht</h1>
          <Link
            href="/my-yacht/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Add yacht
          </Link>
        </div>

        {yachts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No yachts registered yet. Add your first yacht to start tracking equipment, filters,
            and replacement dates.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {yachts.map((yacht) => (
              <Link
                key={yacht.id}
                href={`/my-yacht/${yacht.id}`}
                className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:border-primary"
              >
                <h2 className="font-semibold">{yacht.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[yacht.yacht_type, yacht.length_m ? `${yacht.length_m}m` : null, yacht.build_year]
                    .filter(Boolean)
                    .join(" · ") || "No details yet"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
