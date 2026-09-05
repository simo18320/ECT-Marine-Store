# ECT Marine Store

The e-commerce entry point to the ECT Marine Intelligence Platform (Eco Cleaning Technologies
Consulting Srl) — water, air, hygiene and maintenance products for yachts, backed by a Yacht
Equipment Register, a deterministic Maintenance Engine, and an AI Procurement/Recommendation layer.

## Status

**Phase 2 (Days 4–7) done.** Phase 0 (architecture/docs/migrations) and Phase 1 (Next.js scaffold,
Supabase project, Auth) are complete; catalogue browsing, product pages, search, filtering, and
cart are live. Phase 3 (checkout — Stripe, real orders) is next.

- [`docs/`](docs/) — architecture, database, business rules, AI engine, procurement, logistics,
  security, and the 30-day implementation plan.
- [`database/migrations/`](database/migrations/) — the Supabase migrations (`0001`–`0013`)
  implementing the MVP schema from `docs/database.md`, applied to the live project
  (`pwchzixxritrieedwuqz`, region `eu-west-1`). `0010`–`0013` are post-Phase-0 additions (security
  hardening, full-text search, public stock-status exposure) — see `docs/database.md`'s intro for
  what each does.
- [`database/schema.sql`](database/schema.sql) — a consolidated, read-only concatenation of
  `0001`–`0009` for reviewing the original schema in one file (predates `0010`–`0013`).
- [`database/seed.sql`](database/seed.sql) — the MVP category tree and equipment-type vocabulary,
  applied.
- [`database/seed-dev-sample.sql`](database/seed-dev-sample.sql) — **dev/QA only**, fabricated
  sample products so the catalogue/search/cart/compatibility UI could be verified in a browser
  before real ECT product data exists. Applied to the dev project; never run this against
  production — see the file's own header comment.
- `src/`, `public/` — Next.js app: homepage (dynamic category grid), `/categories/[slug]`
  (breadcrumb + subcategories + products, in-stock filter), `/products/[slug]` (full product page:
  specs, compatibility, bundle contents, recommendations, purchase panel), `/search` (Postgres
  full-text), `/cart` (client-side, localStorage-backed), `/login`, `/account`.

Read [`docs/architecture.md`](docs/architecture.md) first.

## Supabase

Own project (not shared with Eco Air Sense — see `docs/architecture.md` §2): `ect-marine-store`,
ref `pwchzixxritrieedwuqz`, `eu-west-1`, free tier. Auth wired end-to-end (sign in/up/out,
`handle_new_user` trigger auto-creates a `profiles` row). RLS was verified two ways: real sign-in/
sign-out through the actual UI, and direct SQL role-simulation confirming cross-user isolation
(`yachts_member_access` — an owner sees their yacht, an unrelated `authenticated` user sees none,
`anon` sees none, `ect_admin` sees everything). Security-advisor lints from the initial deploy
(missing RLS on `equipment_types`, unpinned function `search_path`, RLS helper functions directly
RPC-callable via PostgREST) were fixed in migration `0010`. A later ERROR (`security_definer_view`,
from an initial view-based approach to exposing stock status publicly) was replaced with a
PostgREST "computed field" function in `0013` — see `docs/security.md` §7. Two WARNs remain
deliberately accepted (§8 there): `citext` living in the `public` schema, and that computed field
being directly RPC-callable (required for it to work as a computed field at all).

`SUPABASE_SERVICE_ROLE_KEY` is not yet in `.env.local` — Supabase's MCP integration doesn't expose
that secret; grab it from the project's API settings when Phase 3 (Stripe webhook) needs it.

## Design continuity with Eco Cleaning Technologies branding

This store must read as the same company as ECT's other apps, not a separate brand:

- **Color tokens** — the OKLCH marine-navy/brass palette in `src/app/globals.css` is copied
  verbatim from the sibling `yacht-environmental-dashboard` (Eco Air Sense) app, along with its
  `shadcn` `components.json` (`radix-nova` style).
- **Logo** — `public/images/logo-wordmark.png` / `logo-badge.png` (+ `-white` variants) are the
  real Eco Cleaning Technologies corporate marks ("Consulting and Marine Services" / "Marine and
  Aviation"). These were **not** found in the Eco Air Sense app (its `public/logo.png` is that
  product's own wordmark, not the company logo) — they were recovered from a prior, unfinished
  project on this machine before it was retired (see below). See `docs/architecture.md` §2 for the
  correction.

## Prior attempts on this machine

Two earlier projects were discovered mid-Phase-1 while sourcing the logo:
`eco-cleaning-technologies-consulting` (Jul 2026) and `ect-yacht-technical-intelligence`
(Aug 2026). Both turned out to be different products for the same company (a consultancy/
membership lead-gen site with an AI diagnostic tool, and a symptom-based troubleshooting/digital-
passport tool respectively) — neither was an e-commerce attempt, and an audit of both found no
reusable code or real data. Their Supabase projects were paused free-tier projects that, together
with the active Eco Air Sense project, were blocking this project's creation under the
2-active-free-project cap; both were deleted with explicit approval to free the slot. The logo
assets were recovered from `eco-cleaning-technologies-consulting/public/images/` before it was
deleted.

## Next step

Phase 3 (Days 8–11): customer addresses, Stripe Checkout, order creation, webhook-driven payment
status, order confirmation email. See `docs/implementation-plan.md`.
