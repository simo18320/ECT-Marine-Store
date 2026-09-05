"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="order-last w-full sm:order-none sm:w-auto sm:max-w-xs sm:flex-1">
      <input
        type="search"
        placeholder="Search products…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm"
      />
    </form>
  );
}
