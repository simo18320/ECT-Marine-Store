import Link from "next/link";
import { SiteHeader } from "@/components/nav/site-header";
import { getCategoryTree } from "@/lib/products/queries";

export default async function HomePage() {
  const categories = await getCategoryTree();

  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <section className="flex flex-col items-center gap-8 px-6 py-28 text-center sm:py-36">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/70">
            Eco Cleaning Technologies
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Water. Air. Hygiene.
            <br />
            Engineered for Yachts.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            The technical digital platform for water, air, hygiene and maintenance management on
            superyachts — from filtration and UV-C to your yacht&rsquo;s full equipment register.
          </p>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <h2 className="mb-6 text-lg font-semibold">Shop by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-lg border border-border bg-card p-6 text-center font-medium shadow-sm transition hover:border-primary hover:shadow-md"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Eco Cleaning Technologies Consulting Srl — ECT Marine Store (Phase 2, in development)
      </footer>
    </>
  );
}
