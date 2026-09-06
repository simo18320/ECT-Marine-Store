import Link from "next/link";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { ProductCard } from "@/components/product/product-card";
import { PROBLEMS, getProblem } from "@/lib/recommendations/problems";
import { getRecommendationsForProblem } from "@/lib/recommendations/engine";
import { createClient } from "@/lib/supabase/server";
import { getYachtsForUser } from "@/lib/yachts/queries";

export default async function FindProductPage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string; yacht?: string }>;
}) {
  const { problem: problemId, yacht: yachtId } = await searchParams;
  const problem = problemId ? getProblem(problemId) : undefined;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-medium">Find the right product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what you&rsquo;re trying to solve and we&rsquo;ll recommend compatible products
          — never a guess, only products with verified compatibility.
        </p>

        {!problem ? (
          <ProblemSelector />
        ) : (
          <ProblemResults problemId={problem.id} yachtId={yachtId} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function ProblemSelector() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {PROBLEMS.map((problem) => (
        <Link
          key={problem.id}
          href={`/find-product?problem=${problem.id}`}
          className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <h2 className="font-medium">{problem.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{problem.description}</p>
        </Link>
      ))}
    </div>
  );
}

async function ProblemResults({ problemId, yachtId }: { problemId: string; yachtId?: string }) {
  const problem = getProblem(problemId)!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const yachts = user ? await getYachtsForUser() : [];

  const results = await getRecommendationsForProblem(problemId, yachtId);

  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Problem</p>
          <h2 className="text-lg font-semibold">{problem.label}</h2>
        </div>
        <Link href="/find-product" className="text-sm text-muted-foreground hover:text-foreground">
          ← Choose a different problem
        </Link>
      </div>

      {yachts.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Your yacht:</span>
          <Link
            href={`/find-product?problem=${problemId}`}
            className={`rounded-full px-3 py-1 ${!yachtId ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Any equipment
          </Link>
          {yachts.map((yacht) => (
            <Link
              key={yacht.id}
              href={`/find-product?problem=${problemId}&yacht=${yacht.id}`}
              className={`rounded-full px-3 py-1 ${yachtId === yacht.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {yacht.name}
            </Link>
          ))}
        </div>
      )}

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No verified-compatible products found for this problem yet. This is shown honestly
          rather than guessing — ECT is still building out compatibility data for some equipment
          types.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {results.map((result) => (
            <div key={result.product.id} className="flex flex-col gap-2">
              <ProductCard product={result.product} />
              <p className="text-xs text-muted-foreground">
                {result.matchTier === "exact" && (
                  <span className="mr-1 font-medium text-status-good">Exact match —</span>
                )}
                {result.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
