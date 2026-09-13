import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilterBar } from "@/components/product/product-filter-bar";
import { HelpMeChoose } from "@/components/product/help-me-choose";
import {
  getCategoryBySlug,
  getCategorySubtreeIds,
  getProductsByCategoryId,
  getSpecFacets,
} from "@/lib/products/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryBySlug(slug);
  if (!result) return {};
  const { category } = result;
  return {
    title: category.seo_title ?? category.name,
    description: category.meta_description ?? category.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    inStock?: string;
    size?: string;
    micron?: string;
    use?: string;
    filterType?: string;
    filterClass?: string;
    samplingType?: string;
    investigation?: string;
    application?: string;
  }>;
}) {
  const { slug } = await params;
  const { inStock, size, micron, use, filterType, filterClass, samplingType, investigation, application } =
    await searchParams;

  const result = await getCategoryBySlug(slug);
  if (!result) notFound();
  const { category, children, breadcrumb } = result;

  // Every real product lives on a leaf category several levels down, so "this category's
  // products" has to mean the whole subtree — a branch page like Water would otherwise always
  // come back empty even though it clearly has products underneath it.
  const subtreeIds = await getCategorySubtreeIds(category.id);
  const inStockOnly = inStock === "1";
  const allProducts = await getProductsByCategoryId(subtreeIds, { inStockOnly });
  const facets = getSpecFacets(allProducts);
  const products = await getProductsByCategoryId(subtreeIds, {
    inStockOnly,
    size,
    micron,
    use,
    filterType,
    filterClass,
    samplingType,
    investigation,
    application,
  });

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

        {category.slug === "sampling-kits" ? (
          <section className="-mt-4 mb-10 rounded-3xl bg-gradient-to-br from-[#0a1428] via-[#132a4d] to-[#1c3a63] px-6 py-16 text-center text-white sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">ECT Marine Store</p>
            <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-medium sm:text-5xl">Sampling Kits for Superyachts</h1>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Professional sampling solutions for water, hygiene, HVAC and environmental investigations.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#products"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md"
              >
                Explore Sampling Kits
              </a>
              <HelpMeChoose products={allProducts} />
            </div>
          </section>
        ) : (
          <>
            <h1 className="text-3xl font-medium">{category.name}</h1>
            {category.description && (
              <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
            )}
          </>
        )}

        {children.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
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
                    <path
                      d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M4 7.5 12 11l8-3.5M12 11v9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <span className="font-medium">{child.name}</span>
                  {child.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{child.description}</p>
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
        )}

        {allProducts.length > 0 && (
          <>
            <div id="products" className="mt-10 flex items-center justify-between scroll-mt-6">
              <h2 className="text-xl font-medium">Products</h2>
              <Link
                href={inStock === "1" ? `/categories/${slug}` : `/categories/${slug}?inStock=1`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {inStock === "1" ? "Show all" : "In stock only"}
              </Link>
            </div>
            <Suspense fallback={null}>
              <ProductFilterBar {...facets} />
            </Suspense>
            {products.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No products match these filters. Try clearing one.
              </p>
            )}
          </>
        )}

        {children.length === 0 && allProducts.length === 0 && (
          <p className="mt-10 text-sm text-muted-foreground">
            No products in this category yet.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
