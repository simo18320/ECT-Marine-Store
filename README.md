# ECT Marine Store

The e-commerce entry point to the ECT Marine Intelligence Platform (Eco Cleaning Technologies
Consulting Srl) — water, air, hygiene and maintenance products for yachts, backed by a Yacht
Equipment Register, a deterministic Maintenance Engine, and an AI Procurement/Recommendation layer.

## Status

**Phase 1, Day 1 in progress** (Next.js scaffold). Architecture/docs/migrations (Phase 0) are
approved; Supabase project + Auth (Day 2–3) are next.

- [`docs/`](docs/) — architecture, database, business rules, AI engine, procurement, logistics,
  security, and the 30-day implementation plan.
- [`database/migrations/`](database/migrations/) — the initial Supabase-ready SQL migrations
  (`0001`–`0009`) implementing the MVP schema described in `docs/database.md`. Not yet applied to
  any Supabase project.
- [`database/schema.sql`](database/schema.sql) — a consolidated, read-only concatenation of the
  migrations above, for reviewing the full schema in one file.
- [`database/seed.sql`](database/seed.sql) — the MVP category tree and equipment-type vocabulary
  (structural seed data only; no placeholder products/suppliers).
- `src/`, `public/` — the Next.js app shell (homepage only so far).

Read [`docs/architecture.md`](docs/architecture.md) first.

## Design continuity with Eco Cleaning Technologies branding

This store must read as the same company as ECT's other apps, not a separate brand:

- **Color tokens** — the OKLCH marine-navy/brass palette in `src/app/globals.css` is copied
  verbatim from the sibling `yacht-environmental-dashboard` (Eco Air Sense) app, along with its
  `shadcn` `components.json` (`radix-nova` style).
- **Logo** — `public/images/logo-wordmark.png` / `logo-badge.png` (+ `-white` variants) are the
  real Eco Cleaning Technologies corporate marks ("Consulting and Marine Services" / "Marine and
  Aviation"). These were **not** found in the Eco Air Sense app (its `public/logo.png` is that
  product's own wordmark, not the company logo) — they were recovered from
  `Desktop/eco-cleaning-technologies-consulting/public/images/`, a prior, unfinished attempt at
  this same platform. See `docs/architecture.md` §2 for the correction.

## Prior attempts on this machine

Two earlier, partially-built projects exist for essentially the same idea and were discovered
mid-Phase-1: `Desktop/eco-cleaning-technologies-consulting` (Jul 2026) and
`Desktop/ect-yacht-technical-intelligence` (Aug 2026), each with its own Supabase project already
provisioned. `ect-marine-store` is a fresh build informed by the master specification, not a
continuation of either — see the conversation history for the decision on whether/how anything
from those (Supabase projects, code, content) gets reused.

## Next step

Phase 1 Day 2–3: Supabase project, migrations applied, Auth wired, design system verified in the
browser. See `docs/implementation-plan.md`.
