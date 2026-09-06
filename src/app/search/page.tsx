import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { ProductCard } from "@/components/product/product-card";
import { searchProducts } from "@/lib/products/queries";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inStock?: string }>;
}) {
  const { q, inStock } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await searchProducts(query, { inStockOnly: inStock === "1" }) : [];

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

        {query && products.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No products matched &ldquo;{query}&rdquo;. Try a different term, or browse by category.
          </p>
        )}

        {products.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
