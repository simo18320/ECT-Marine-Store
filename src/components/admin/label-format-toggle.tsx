"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "ect-label-format";

// There is no browser API to detect which printer is physically connected — printer enumeration
// is blocked everywhere for fingerprinting/privacy reasons. The closest practical substitute is
// remembering the admin's last choice, so after picking Brother once, every later visit (without
// an explicit ?format= in the URL) jumps straight to it instead of defaulting back to A4.
export function LabelFormatToggle({
  isBrother,
  hasExplicitFormat,
}: {
  isBrother: boolean;
  hasExplicitFormat: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (hasExplicitFormat) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (saved === "brother") router.replace("/admin/inventory/labels?format=brother");
  }, [hasExplicitFormat, router]);

  function remember(format: "a4" | "brother") {
    try {
      localStorage.setItem(STORAGE_KEY, format);
    } catch {
      // Private browsing or storage disabled — the toggle still works, it just won't be
      // remembered for next time.
    }
  }

  return (
    <div className="flex gap-2 text-sm">
      <Link
        href="/admin/inventory/labels"
        onClick={() => remember("a4")}
        className={!isBrother ? "font-semibold text-black" : "text-gray-500 hover:text-black"}
      >
        Foglio A4
      </Link>
      <span className="text-gray-300">|</span>
      <Link
        href="/admin/inventory/labels?format=brother"
        onClick={() => remember("brother")}
        className={isBrother ? "font-semibold text-black" : "text-gray-500 hover:text-black"}
      >
        Brother VC-500W (rotolo 25mm)
      </Link>
    </div>
  );
}
