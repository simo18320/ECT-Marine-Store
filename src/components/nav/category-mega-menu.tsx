"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CategoryNode, ProductSpecFacets } from "@/lib/products/queries";

interface FilterGroup {
  label: string;
  param: string;
  values: string[];
  formatValue?: (v: string) => string;
}

// Same five facets the category-page filter bar understands — jumping here with e.g.
// ?micron=20 lands on a pre-filtered product list rather than a category tree to drill through.
function facetGroups(facets: ProductSpecFacets | undefined): FilterGroup[] {
  if (!facets) return [];
  const groups: FilterGroup[] = [
    { label: "Size", param: "size", values: facets.sizes },
    { label: "Micron rating", param: "micron", values: facets.microns, formatValue: (v: string) => `${v} micron` },
    { label: "Use", param: "use", values: facets.uses },
    { label: "Filter type", param: "filterType", values: facets.filterTypes },
    { label: "Filter class", param: "filterClass", values: facets.filterClasses },
  ];
  return groups.filter((group) => group.values.length > 0);
}

export function CategoryMegaMenu({
  categories,
  facetsBySlug,
}: {
  categories: CategoryNode[];
  facetsBySlug: Record<string, ProductSpecFacets>;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpenSlug(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenSlug(null);
    }
    document.addEventListener("click", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={containerRef} className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
      {categories.map((category) => {
        const groups = facetGroups(facetsBySlug[category.slug]);
        const isOpen = openSlug === category.slug;

        if (groups.length === 0) {
          return (
            <Link key={category.id} href={`/categories/${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
          );
        }

        return (
          <div key={category.id} className="relative">
            <button
              type="button"
              onClick={() => setOpenSlug(isOpen ? null : category.slug)}
              className={`flex items-center gap-1 hover:text-foreground ${isOpen ? "text-foreground" : ""}`}
              aria-expanded={isOpen}
            >
              {category.name}
              <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 flex w-max max-w-[90vw] gap-8 rounded-xl border border-border bg-card p-6 shadow-lg">
                <Link
                  href={`/categories/${category.slug}`}
                  onClick={() => setOpenSlug(null)}
                  className="shrink-0 self-start rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/70"
                >
                  Shop all {category.name} →
                </Link>
                {groups.map((group) => (
                  <div key={group.param} className="min-w-32">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                      {group.label}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {group.values.map((value) => (
                        <li key={value}>
                          <Link
                            href={`/categories/${category.slug}?${group.param}=${encodeURIComponent(value)}`}
                            onClick={() => setOpenSlug(null)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            {group.formatValue ? group.formatValue(value) : value}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
