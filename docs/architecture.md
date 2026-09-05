# ECT Marine Store — Architecture

Status: **Draft for approval** (Phase 0 deliverable — no application code has been written yet)

## 1. What this is

ECT Marine Store is the commercial entry point to the ECT Marine Intelligence Platform: e-commerce
for water/air/hygiene products, backed by a Yacht Equipment Register, a deterministic Maintenance
Engine, and an AI Procurement/Recommendation layer. The store is not a standalone shop — every
order is expected to eventually attach to a yacht, a piece of equipment, and a replacement schedule.

This document is the technical architecture. Business rules live in
[business-rules.md](business-rules.md), schema detail in [database.md](database.md), the AI
system in [ai-engine.md](ai-engine.md), sourcing in [procurement.md](procurement.md), and shipping
in [logistics.md](logistics.md).

## 2. Relationship to the existing Eco Air Sense app

`yacht-environmental-dashboard` (repo: `ECT-Eco-Air-Sense`) is a separate, already-shipping Next.js
+ Supabase app for yacht air-quality sensor data (AirCare sync, live readings, AI insights). It is
**not** being merged into this project. Two things from it are being reused directly so the two
products read as one company:

- **Design tokens** — the OKLCH marine-navy/brass palette in
  `yacht-environmental-dashboard/src/app/globals.css` (`--primary`, `--accent`, `--sidebar-*`,
  `--status-good/warning/critical`, etc.) and the `shadcn` `radix-nova` style are copied verbatim
  into this project's `globals.css` and `components.json`. Do not re-derive new colors.
- **Logo** — ~~`yacht-environmental-dashboard/public/logo.png`~~ **correction (Phase 1, Day 1):**
  that file is the *Eco Air Sense product* wordmark (cloud/wifi icon + "eco air sense" text), not
  the company mark — confirmed by opening it. The real Eco Cleaning Technologies corporate logo
  ("ECO CLEANING TECHNOLOGIES — Consulting and Marine Services" wordmark + circular badge) was
  found in a prior, unfinished attempt at this same project:
  `Desktop/eco-cleaning-technologies-consulting/public/images/` (`logo-wordmark.png`,
  `logo-wordmark-white.png`, `logo-badge.png`, `logo-badge-white.png`). Those four files are copied
  into `public/images/` here and used instead.

**Open decision (needs your call before Phase 1):** should ECT Marine Store use its **own Supabase
project** (isolated commerce data, simplest RLS, independent scaling/billing) or **share the Eco
Air Sense Supabase project** (single auth domain, a yacht's sensor data and its shop orders live
together from day one)? Default assumed below: **separate Supabase project**, with `profiles`
shaped so the two apps could federate auth later (same email = same person, not same `auth.users`
row). This avoids coupling an e-commerce launch's risk profile to a live sensor product's database.

## 3. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router, TypeScript) | Mirrors `yacht-environmental-dashboard`'s Next 16 / React 19 / Tailwind v4 / shadcn (`radix-nova`) setup for consistency and shared muscle memory. |
| Database/Auth/Storage | Supabase (Postgres + RLS, Supabase Auth, Storage) | Source of truth for all app data. Edge Functions reserved for webhook receivers and scheduled jobs (replacement-date sweeps, reminder emails), not general business logic. |
| Payments | Stripe (Checkout + Payment Intents + Webhooks) | Client never sets order/payment status; only the verified webhook does. |
| AI | Claude API (`@anthropic-ai/sdk`, Claude Sonnet 5) | Reasoning/explanation layer only. Reads structured Supabase data; never the system of record. See [ai-engine.md](ai-engine.md). |
| Email | Resend | Order confirmations, replacement-due reminders — same provider as Eco Air Sense. |
| Hosting | Vercel | Cron via `vercel.json`, same pattern as the sibling app. |
| Source control | GitHub, new repo `ect-marine-store` | Not created yet — pending your approval to start Phase 1. |

## 4. Layering rule

```
UI (app/, components/)
   ↓
Application Services (lib/*/service.ts — orchestration, no framework code)
   ↓
Business Logic (lib/*/rules.ts — pure functions: margin calc, compatibility, scoring, replacement dates)
   ↓
Database / External APIs (lib/supabase, lib/stripe, lib/ai — thin clients only)
```

Concrete rule for this codebase: a React Server Component or Route Handler may call a **service**
function, never a Supabase query or a pricing formula directly. Business logic (margin math,
compatibility resolution, supplier scoring, replacement-date calculation) lives in pure,
framework-free functions under `lib/*/rules.ts` so they're unit-testable without a DB or network.

## 5. Project structure

```
ect-marine-store/
├── app/
│   ├── (shop)/            # public storefront: shop, products, categories, cart, checkout
│   ├── account/           # customer dashboard: orders, addresses, my-yacht, maintenance
│   ├── services/          # lead-gen service pages (no forced checkout)
│   ├── admin/             # ECT_OPERATOR / ECT_ADMIN / SUPER_ADMIN only, RLS + route guard
│   └── api/               # webhooks (stripe, aircare-style suppliers later), cron handlers
├── components/
│   ├── ui/                # shadcn primitives (radix-nova, copied config)
│   ├── product/ cart/ yacht/ maintenance/ procurement/ admin/
├── lib/
│   ├── supabase/          # server/client factories only — no queries here
│   ├── stripe/            # checkout session + webhook verification
│   ├── ai/                # Claude client, prompt templates, retrieval helpers
│   ├── products/ orders/ inventory/ suppliers/ logistics/ maintenance/ recommendations/
│   │   each with: service.ts (DB-touching orchestration) + rules.ts (pure business logic)
├── database/
│   ├── migrations/        # numbered SQL migrations (see database.md)
│   ├── schema.sql          # consolidated reference (generated from migrations)
│   └── seed.sql            # MVP category/brand seed data
├── docs/                  # this folder
├── tests/                 # unit tests colocated by domain (rules.ts is the priority target)
└── README.md
```

## 6. Security model (summary — full detail in security.md once Phase 1 starts)

- Supabase RLS is the enforcement boundary, not the UI. Every table with tenant-scoped data
  (orders, yachts, equipment, addresses) has RLS keyed on `auth.uid()` via `profiles`/`company_users`.
- Roles: `customer`, `b2b_user`, `b2b_admin`, `ect_operator`, `ect_admin`, `super_admin` (Postgres
  enum `user_role`, mirrored as a claim). Admin routes check both RLS and a server-side role guard.
- Stripe webhook signature verification is mandatory; the webhook handler is the only writer of
  `orders.status`/`payments.status`.
- Service-role key is server-only (cron, webhooks), never shipped to the client — same pattern as
  `SUPABASE_SERVICE_ROLE_KEY` in the sibling app's `.env.example`.
- No secrets in the frontend bundle; all third-party keys read from `process.env` server-side.

## 7. What is explicitly deferred (not MVP)

Automated purchasing, courier API integration, predictive procurement, IoT ingestion for Eco Air
Sense sensor data, subscriptions/auto-reorder, and the AI "learning" pipeline are all schema-ready
(see database.md) but not implemented in the MVP. Building them now would violate §53 (don't
rewrite working code to add speculative features) and §32/44 of the master spec.

## 8. Major risks

1. **Compatibility data entry is the bottleneck, not the code.** The compatibility engine (§12) is
   worthless without ECT staff populating verified `product_compatibility` rows. Recommend
   starting data entry in parallel with Phase 2, not after.
2. **Scope creep across two Supabase projects.** If the "shared platform" option is chosen later
   (§2), migrating `yachts`/`equipment` tables between projects is a real migration, not a
   config change — decide before Phase 5 (My Yacht), not after.
3. **Stripe webhook idempotency.** Retries and out-of-order delivery are the most common source of
   duplicate orders/double-decremented inventory in this class of app — tests for this are called
   out explicitly in the implementation plan, not left implicit.
4. **AI safety boundary.** Claude must not be able to fabricate compatibility, stock, price, or
   delivery dates. The retrieval layer, not a system prompt alone, must make it structurally
   impossible (see ai-engine.md §"Data access contract").

## 9. Dependencies

- A Supabase project (new, or the shared-platform decision above) and its keys.
- A Stripe account (test mode keys first) and a webhook endpoint reachable from Stripe (Vercel
  preview/prod URL, or a tunnel for local dev).
- An Anthropic API key (already used by the sibling app — same key can likely be reused for the
  MVP; separate billing/rate-limit isolation is a later concern).
- Access to ECT's real product/supplier data to seed the catalogue — placeholder seed data only
  covers structure, not real SKUs.
