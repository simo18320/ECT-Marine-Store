import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { getCategoryTree } from "@/lib/products/queries";

// Simple line icons per top-level category, keyed by slug — no icon library needed for four
// glyphs, and it keeps the category cards from being plain text tiles.
const CATEGORY_BLURB: Record<string, string> = {
  water: "Filtration, UV-C and reverse osmosis for onboard water systems.",
  air: "Purification and treatment equipment for cabin and engine-room air.",
  hygiene: "Sanitation and surface-treatment supplies for crew and guests.",
  "maintenance-kits": "Bundled spares and consumables to keep every system running.",
};

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
        <section className="relative flex flex-col items-center gap-8 overflow-hidden px-6 py-28 text-center sm:py-44">
          <Image
            src="/images/hero-yacht.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,20,40,0.6) 0%, rgba(10,20,40,0.72) 55%, rgba(10,20,40,0.85) 100%)",
            }}
          />
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            Eco Cleaning Technologies
          </p>
          <h1 className="max-w-3xl text-5xl font-medium text-balance text-white sm:text-7xl">
            Hard to find.
            <br />
            <span className="italic">Easy with ECT.</span>
          </h1>
          <p className="max-w-xl text-base text-white/85 sm:text-lg">
            The spare part you&rsquo;re looking for isn&rsquo;t a problem. We&rsquo;ll find it for you.
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
              className="rounded-full border border-white/40 bg-white/95 px-6 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-white"
            >
              Book a water or air analysis
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="mb-8 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Explore the range</p>
            <h2 className="mt-2 text-2xl font-medium sm:text-3xl">Everything your yacht&rsquo;s systems need</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    {CATEGORY_ICON[category.slug]}
                  </svg>
                </span>
                <div>
                  <span className="font-medium">{category.name}</span>
                  {CATEGORY_BLURB[category.slug] && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{CATEGORY_BLURB[category.slug]}</p>
                  )}
                </div>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Shop now
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.5 6h7m0 0L6 2.5M9.5 6 6 9.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
