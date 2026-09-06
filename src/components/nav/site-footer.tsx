import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Eco Cleaning Technologies Consulting Srl — ECT Marine Store ·{" "}
          <Link href="/company-info" className="hover:text-foreground hover:underline">
            Company information
          </Link>
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/find-product" className="hover:text-foreground">
            Find the right product
          </Link>
          <Link href="/assistant" className="hover:text-foreground">
            Ask ECT
          </Link>
          <Link href="/my-yacht" className="hover:text-foreground">
            My Yacht
          </Link>
        </div>
      </div>
    </footer>
  );
}
