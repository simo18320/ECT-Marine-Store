import Link from "next/link";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { getCategoryTree } from "@/lib/products/queries";

// Simple line icons per top-level category, keyed by slug — no icon library needed for four
// glyphs, and it keeps the category cards from being plain text tiles.
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  water: (
    <path
      d="M12 3c-3 4.5-6 8-6 11.5A6 6 0 0 0 12 20a6 6 0 0 0 6-5.5C18 11 15 7.5 12 3Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  air: (
    <path
      d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h14a2.5 2.5 0 1 1-2.5 2.5M3 16h8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  hygiene: (
    <path
      d="M12 3v3m-4 1 1.5 2M16 7l-1.5 2M9 9h6l1 4.5a4 4 0 0 1-8 0Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  "maintenance-kits": (
    <path
      d="M14.5 3.5 20.5 9.5m-11 1L3 17v3.5h3.5L15 12M8 8l8 8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export default async function HomePage() {
  const categories = await getCategoryTree();

  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-col items-center gap-8 overflow-hidden px-6 py-28 text-center sm:py-40">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, var(--color-secondary) 0%, var(--color-background) 70%)",
            }}
          />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-foreground/70">
            Eco Cleaning Technologies
          </p>
          <h1 className="max-w-3xl text-5xl font-medium text-balance sm:text-7xl">
            Water. Air. Hygiene.
            <br />
            <span className="italic">Engineered for Yachts.</span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            The technical digital platform for water, air, hygiene and maintenance management on
            superyachts — from filtration and UV-C to your yacht&rsquo;s full equipment register.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/find-product"
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              Find the right product
            </Link>
            <Link
              href="/my-yacht"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition hover:border-primary"
            >
              Book a water or air analysis
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <h2 className="mb-6 text-xl font-medium">Shop by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-accent-foreground/60 transition-colors group-hover:text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {CATEGORY_ICON[category.slug]}
                </svg>
                <span className="font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
