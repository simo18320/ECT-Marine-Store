import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SearchBox } from "./search-box";
import { MobileNav } from "./mobile-nav";
import { CategoryMegaMenu } from "./category-mega-menu";
import { CartIcon } from "@/components/cart/cart-icon";
import { getCategoryTree } from "@/lib/products/queries";

const EXTRA_LINKS = [
  { href: "/find-product", label: "Find the right product" },
  { href: "/assistant", label: "Ask ECT" },
  { href: "/my-yacht", label: "My Yacht" },
];

export async function SiteHeader() {
  const categories = await getCategoryTree();
  const mobileLinks = [
    ...categories.map((c) => ({ href: `/categories/${c.slug}`, label: c.name })),
    ...EXTRA_LINKS,
  ];

  return (
    <header className="relative border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4">
        <MobileNav links={mobileLinks} />
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo-wordmark.png"
            alt="Eco Cleaning Technologies"
            width={1694}
            height={260}
            className="h-7 w-auto sm:h-8"
          />
        </Link>
        <CategoryMegaMenu categories={categories} />
        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
          {EXTRA_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <CartIcon />
          <Link
            href="/account"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Account
          </Link>
        </div>
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
