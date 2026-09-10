"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CategoryNode } from "@/lib/products/queries";

export function CategoryMegaMenu({ categories }: { categories: CategoryNode[] }) {
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
        const hasChildren = category.children.length > 0;
        const isOpen = openSlug === category.slug;

        if (!hasChildren) {
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
                {category.children.map((sub) => (
                  <div key={sub.id} className="min-w-32">
                    <Link
                      href={`/categories/${sub.slug}`}
                      onClick={() => setOpenSlug(null)}
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground hover:text-primary"
                    >
                      {sub.name}
                    </Link>
                    <ul className="flex flex-col gap-1.5">
                      {sub.children.length > 0
                        ? sub.children.map((leaf) => (
                            <li key={leaf.id}>
                              <Link
                                href={`/categories/${leaf.slug}`}
                                onClick={() => setOpenSlug(null)}
                                className="text-muted-foreground hover:text-primary"
                              >
                                {leaf.name}
                              </Link>
                            </li>
                          ))
                        : null}
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
