"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ProductFilterBarProps {
  sizes: string[];
  microns: string[];
  uses: string[];
  filterTypes: string[];
}

const FILTERS: { param: string; label: string; key: keyof ProductFilterBarProps; formatOption?: (v: string) => string }[] = [
  { param: "size", label: "All sizes", key: "sizes" },
  { param: "micron", label: "All micron ratings", key: "microns", formatOption: (v) => `${v} micron` },
  { param: "use", label: "All uses", key: "uses" },
  { param: "filterType", label: "All filter types", key: "filterTypes" },
];

export function ProductFilterBar(props: ProductFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = FILTERS.filter((f) => props[f.key].length > 0);
  if (active.length === 0) return null;

  function setParam(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(param, value);
    else params.delete(param);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {active.map((f) => (
        <select
          key={f.param}
          value={searchParams.get(f.param) ?? ""}
          onChange={(e) => setParam(f.param, e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="">{f.label}</option>
          {props[f.key].map((option) => (
            <option key={option} value={option}>
              {f.formatOption ? f.formatOption(option) : option}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
