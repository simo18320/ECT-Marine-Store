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
        <section className="relative flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden px-6 py-10 text-center sm:gap-6 sm:py-14">
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80 sm:text-sm">
            Eco Cleaning Technologies
          </p>
          <h1 className="max-w-3xl text-3xl font-medium text-balance text-white sm:text-5xl lg:text-6xl">
            Every part, any yacht:
            <br />
            <span className="italic">one search.</span>
          </h1>
          <p className="max-w-xl text-sm text-white/85 sm:text-base">
            The spare part you&rsquo;re looking for isn&rsquo;t a problem. We&rsquo;ll find it for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/find-product"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              Find the right product
            </Link>
            <Link
              href="/my-yacht"
              className="rounded-full border border-white/40 bg-white/95 px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-white"
            >
              Book a water or air analysis
            </Link>
          </div>

          <div className="mt-2 grid w-full max-w-5xl grid-cols-2 gap-3 sm:mt-4 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur-sm transition duration-200 hover:border-white/40 hover:bg-white/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    {CATEGORY_ICON[category.slug]}
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">{category.name}</span>
                  {CATEGORY_BLURB[category.slug] && (
                    <span className="hidden truncate text-xs text-white/70 lg:block">
                      {CATEGORY_BLURB[category.slug]}
                    </span>
                  )}
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
