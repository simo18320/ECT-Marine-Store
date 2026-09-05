"use client";

import { useState } from "react";
import Link from "next/link";

interface NavLink {
  href: string;
  label: string;
}

// Caught in Phase 9's mobile pass: both the customer header (site-header.tsx) and the admin
// header (app/admin/layout.tsx) render their full nav unconditionally with no responsive
// handling — on the customer side it was `hidden md:flex` with no mobile equivalent at all
// (/find-product, /assistant, /my-yacht unreachable from the header on a phone); on the admin
// side (8 links + a role badge + sign-out, always `flex`) it silently overflowed the whole page
// body horizontally instead of wrapping. This is the shared mobile equivalent for both: a plain
// toggled panel, no animation library needed.
export function MobileNav({ links, variant = "light" }: { links: NavLink[]; variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          isDark
            ? "flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-foreground/30"
            : "flex h-9 w-9 items-center justify-center rounded-md border border-border"
        }
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <nav
          className={
            isDark
              ? "absolute inset-x-0 top-full z-10 flex flex-col gap-1 bg-sidebar px-6 py-4 text-sm font-medium text-sidebar-foreground shadow-sm"
              : "absolute inset-x-0 top-full z-10 flex flex-col gap-1 border-b border-border bg-card px-6 py-4 text-sm font-medium shadow-sm"
          }
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={isDark ? "rounded-md px-2 py-2 hover:bg-sidebar-accent" : "rounded-md px-2 py-2 hover:bg-secondary"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
