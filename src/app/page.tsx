import Image from "next/image";
import Link from "next/link";

const ENTRY_POINTS = [
  { href: "/shop/water", label: "Shop Water" },
  { href: "/shop/air", label: "Shop Air" },
  { href: "/my-yacht", label: "My Yacht" },
];

export default function HomePage() {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Image
            src="/images/logo-wordmark.png"
            alt="Eco Cleaning Technologies — Consulting and Marine Services"
            width={1694}
            height={260}
            priority
            className="h-8 w-auto sm:h-9"
          />
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/shop/water" className="hover:text-foreground">
              Water
            </Link>
            <Link href="/shop/air" className="hover:text-foreground">
              Air
            </Link>
            <Link href="/shop/hygiene" className="hover:text-foreground">
              Hygiene
            </Link>
            <Link href="/services" className="hover:text-foreground">
              Services
            </Link>
            <Link href="/my-yacht" className="hover:text-foreground">
              My Yacht
            </Link>
          </nav>
          <Link
            href="/account"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Account
          </Link>
        </div>
      </header>

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
          <div className="flex flex-wrap items-center justify-center gap-3">
            {ENTRY_POINTS.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Eco Cleaning Technologies Consulting Srl — ECT Marine Store (Phase 1, in development)
      </footer>
    </>
  );
}
