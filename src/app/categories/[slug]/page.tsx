import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { ProductCard } from "@/components/product/product-card";
import { getCategoryBySlug, getProductsByCategoryId } from "@/lib/products/queries";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ inStock?: string }>;
}) {
  const { slug } = await params;
  const { inStock } = await searchParams;

  const result = await getCategoryBySlug(slug);
  if (!result) notFound();
  const { category, children, breadcrumb } = result;

  const products = await getProductsByCategoryId(category.id, { inStockOnly: inStock === "1" });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {breadcrumb.map((c) => (
            <span key={c.id} className="flex items-center gap-1">
              <span>/</span>
              <Link href={`/categories/${c.slug}`} className="hover:text-foreground">
                {c.name}
              </Link>
            </span>
          ))}
        </nav>

        <h1 className="text-3xl font-medium">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
        )}

        {children.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-2xl border border-border bg-card p-5 text-center font-medium shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {products.length > 0 && (
          <>
            <div className="mt-10 flex items-center justify-between">
              <h2 className="text-xl font-medium">Products</h2>
              <Link
                href={inStock === "1" ? `/categories/${slug}` : `/categories/${slug}?inStock=1`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {inStock === "1" ? "Show all" : "In stock only"}
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {children.length === 0 && products.length === 0 && (
          <p className="mt-10 text-sm text-muted-foreground">
            No products in this category yet.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
