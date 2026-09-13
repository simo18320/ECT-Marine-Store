"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductListItem } from "@/lib/products/queries";

const Q1_OPTIONS = ["Fresh water", "Hot water", "HVAC/Air", "Surface", "Grey/Black water", "Pool/Spa", "Other"];
const Q2_OPTIONS = [
  "Routine monitoring",
  "Legionella investigation",
  "Contamination",
  "Odour",
  "Heavy metals",
  "Post-cleaning",
  "Post-disinfection",
  "Other",
];
const Q3_OPTIONS = ["Yacht engineer", "ECT technician", "Laboratory", "Other"];

// A plain deterministic lookup, not a diagnosis — it never interprets results or makes a
// compliance/medical/legal judgement, only routes to the kit whose stated purpose matches the
// answers.
function recommendSku(q1: string, q2: string): string {
  if (q2 === "Legionella investigation") return "ECT-SK-LEGIONELLA-01";
  if (q2 === "Heavy metals") return "ECT-SK-METALS-01";
  if (q1 === "HVAC/Air") return "ECT-SK-HVAC-AIR-01";
  if (q1 === "Surface") return "ECT-SK-SURFACE-01";
  if (q1 === "Grey/Black water") return "ECT-SK-GREYBLACK-01";
  if (q1 === "Pool/Spa") return "ECT-SK-POOL-01";
  if (q2 === "Odour") return "ECT-SK-GREYBLACK-01";
  if (q2 === "Contamination") return "ECT-SK-BIOFILM-01";
  if (q1 === "Fresh water" && q2 === "Routine monitoring") return "ECT-SK-FW-MICRO-01";
  return "ECT-SK-PW-COMPLETE-01";
}

export function HelpMeChoose({ products }: { products: ProductListItem[] }) {
  const [open, setOpen] = useState(false);
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);

  const result = q1 && q2 && q3 ? products.find((p) => p.sku === recommendSku(q1, q2)) : null;
  const premiumBox = products.find((p) => p.sku === "ECT-SK-YACHT-COMPLETE-01");
  const suggestPremiumToo = result && (q3 === "Yacht engineer" || q3 === "ECT technician") && result.sku !== premiumBox?.sku;

  function reset() {
    setQ1(null);
    setQ2(null);
    setQ3(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/40 bg-white/95 px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-white"
      >
        Help me choose
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Help me choose a sampling kit</h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {result ? (
              <div>
                <p className="mb-4 text-sm text-muted-foreground">Based on your answers:</p>
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                  <p className="font-medium">{result.name}</p>
                  {result.short_description && (
                    <p className="mt-1 text-sm text-muted-foreground">{result.short_description}</p>
                  )}
                  <Link
                    href={`/products/${result.slug}`}
                    className="mt-3 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                  >
                    View this kit
                  </Link>
                </div>
                {suggestPremiumToo && premiumBox && (
                  <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-sm">
                      Covering several sampling types regularly?{" "}
                      <Link href={`/products/${premiumBox.slug}`} className="font-medium text-primary hover:underline">
                        {premiumBox.name}
                      </Link>{" "}
                      packs the most common kits into one reusable case.
                    </p>
                  </div>
                )}
                <button type="button" onClick={reset} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                  ← Start again
                </button>
              </div>
            ) : !q1 ? (
              <div>
                <p className="mb-3 text-sm font-medium">1. What are you sampling?</p>
                <div className="flex flex-wrap gap-2">
                  {Q1_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQ1(opt)}
                      className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : !q2 ? (
              <div>
                <p className="mb-3 text-sm font-medium">2. What is the reason?</p>
                <div className="flex flex-wrap gap-2">
                  {Q2_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQ2(opt)}
                      className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setQ1(null)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                  ← Back
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm font-medium">3. Who will perform the sampling?</p>
                <div className="flex flex-wrap gap-2">
                  {Q3_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setQ3(opt)}
                      className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setQ2(null)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
