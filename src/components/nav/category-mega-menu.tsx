"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CategoryNode } from "@/lib/products/queries";

const MAX_ITEMS_PER_COLUMN = 6;

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
    <div ref={containerRef} className="relative hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
      {categories.map((category) => {
        const columns = category.children;
        const isOpen = openSlug === category.slug;

        if (columns.length === 0) {
          return (
            <Link key={category.id} href={`/categories/${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
          );
        }

        return (
          <div key={category.id}>
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
              <div className="absolute left-0 top-full z-20 mt-2 flex w-[min(44rem,90vw)] flex-wrap gap-x-8 gap-y-6 rounded-xl border border-border bg-card p-6 shadow-lg">
                <div className="basis-full">
                <Link
                  href={`/categories/${category.slug}`}
                  onClick={() => setOpenSlug(null)}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/70"
                >
                  Shop all {category.name} →
                </Link>
                </div>
                {columns.map((column) => (
                  <div key={column.id} className="min-w-36 max-w-52">
                    <Link
                      href={`/categories/${column.slug}`}
                      onClick={() => setOpenSlug(null)}
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground hover:text-primary"
                    >
                      {column.name}
                    </Link>
                    <ul className="flex flex-col gap-1.5">
                      {column.children.slice(0, MAX_ITEMS_PER_COLUMN).map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categories/${child.slug}`}
                            onClick={() => setOpenSlug(null)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            {child.name}
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
