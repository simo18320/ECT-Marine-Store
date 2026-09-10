import { Suspense } from "react";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilterBar } from "@/components/product/product-filter-bar";
import { searchProducts, getSpecFacets } from "@/lib/products/queries";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inStock?: string; size?: string; micron?: string; use?: string; filterType?: string }>;
}) {
  const { q, inStock, size, micron, use, filterType } = await searchParams;
  const query = q?.trim() ?? "";
  const inStockOnly = inStock === "1";
  const allProducts = query ? await searchProducts(query, { inStockOnly }) : [];
  const facets = getSpecFacets(allProducts);
  const products = query ? await searchProducts(query, { inStockOnly, size, micron, use, filterType }) : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-medium">
          {query ? (
            <>
              Search results for <span className="text-muted-foreground">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search"
          )}
        </h1>

        {!query && (
          <p className="mt-4 text-sm text-muted-foreground">
            Use the search box above to find products by name or description.
          </p>
        )}

        {query && allProducts.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No products matched &ldquo;{query}&rdquo;. Try a different term, or browse by category.
          </p>
        )}

        {allProducts.length > 0 && (
          <>
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
      </main>
      <SiteFooter />
    </>
  );
}
