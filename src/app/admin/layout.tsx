import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { SignOutButton } from "@/app/account/sign-out-button";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/procurement", label: "Procurement" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <Link href="/admin" className="shrink-0">
            <Image
              src="/images/logo-wordmark-white.png"
              alt="Eco Cleaning Technologies"
              width={1694}
              height={260}
              className="h-6 w-auto"
            />
          </Link>
          <nav className="flex flex-1 gap-5 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-sidebar-primary">
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="text-xs text-sidebar-foreground/70 capitalize">
            {staff.role.replace(/_/g, " ")}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
