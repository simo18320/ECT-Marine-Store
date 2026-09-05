# ECT Marine Store

The e-commerce entry point to the ECT Marine Intelligence Platform (Eco Cleaning Technologies
Consulting Srl) — water, air, hygiene and maintenance products for yachts, backed by a Yacht
Equipment Register, a deterministic Maintenance Engine, and an AI Procurement/Recommendation layer.

## Status

**Phase 7 (Days 23–25) done.** Phases 0–6 (architecture, Next.js scaffold, Supabase/Auth,
catalogue/search/cart, Stripe checkout, admin dashboard, My Yacht, recommendation engine) are
complete. Procurement — suppliers, landed cost, RFQs, quotes, supplier scoring, and the approval
gate into a purchase order — is live under `/admin/suppliers` and `/admin/procurement`. Phase 8
(AI) is next.

- [`docs/`](docs/) — architecture, database, business rules, AI engine, procurement, logistics,
  security, and the 30-day implementation plan.
- [`database/migrations/`](database/migrations/) — the Supabase migrations (`0001`–`0015`)
  implementing the MVP schema from `docs/database.md`, applied to the live project
  (`pwchzixxritrieedwuqz`, region `eu-west-1`). `0010`–`0015` are post-Phase-0 additions (security
  hardening, full-text search, public stock-status exposure, supplier scoring, landed-cost
  columns) — see `docs/database.md`'s intro for what each does.
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
  full-text), `/cart` (client-side, localStorage-backed), `/checkout` (address selection + Stripe
  Checkout redirect), `/account` (profile, addresses, orders), `/login`, `/admin` (see below),
  `/my-yacht` (see below).

## My Yacht

`/my-yacht` → yacht list/create → `/my-yacht/[yachtId]` (dashboard: equipment register, filter
register, both with a live-computed replacement status badge) → add/edit equipment or filters,
each with a real QR code (the `qrcode` package, generated server-side to a data URL — no external
service, no client-side JS). The QR encodes `/equipment/[token]` or `/filters/[token]`, which
resolve through the same RLS as everything else (`is_yacht_member`) — scanning a sticker on a
yacht crew member's already-authenticated phone opens the record directly; a truly public,
unauthenticated "safe summary" view (§15 of the master spec) is a deferred enhancement, not built
in Phase 5.

Replacement status is **computed live**, not read from the schema's `replacement_schedules` table:
that table's write policy is staff-only, so a customer's own session can't populate it, and
business-rules.md always described it as staff/cron-recalculated rather than customer-app-writable
— `lib/maintenance/rules.ts` (`computeFilterReplacementStatus`, `computeEquipmentReplacementStatus`,
14 unit tests) is the actual source of truth for what a customer sees today. Filters use
`installation_date + replacement_interval_days` directly; equipment is a little richer — an
explicit `next_maintenance_date` override wins if set, otherwise it falls back to
`last_maintenance_date` (or `installation_date` if never serviced) plus the interval.

Verified live end-to-end with a throwaway customer account (deleted after): created a yacht,
added a Filter Housing installed 40 days ago with a 30-day interval (correctly showed
**Overdue**, computed next-due date included), added a CTO filter installed 20 days ago with a
90-day interval (correctly showed **OK**), then actually navigated to both generated QR URLs
(reading the real token out of the database, simulating a scan) and confirmed each resolved to the
right record with the right computed status and due date.

## Recommendation engine

`/find-product` — business-rules.md §5's deterministic engine, exactly as designed: a fixed
problem taxonomy (`lib/recommendations/problems.ts`, e.g. "Sediment or cloudy water") maps to one
or more `equipment_types`; `lib/recommendations/engine.ts` finds `product_compatibility` rows for
those types (filtered to only `ect_verified`/`manufacturer_doc` sources, or a `manual_entry` row
that's actually been signed off — §4's compatibility rule, enforced again here even though the DB
constraint already guarantees it); if the customer has a yacht selected, equipment actually
registered there upgrades a match from "category fit" to "exact match" by comparing manufacturer/
model. `lib/recommendations/rules.ts` (5 unit tests) does the final ranking: exact > category >
in-stock > price. No AI involved in this phase — Phase 8's assistant may explain this output later
but can never add a product absent from it.

Verified against 5 scenarios (the implementation plan's exit criteria), all confirmed live rather
than just read from the code: a "Sediment" query correctly surfaced both compatible filters,
price-ordered; "Microbiological risk" correctly surfaced only the UV system; "HVAC air quality" (a
type with no compatibility data yet) correctly showed an honest empty state instead of guessing;
selecting a throwaway test yacht with a matching Filter Housing installed correctly upgraded both
sediment-problem results to "Exact match"; the same yacht queried for "Microbiological risk" (no
UV equipment registered there) correctly fell back to "category fit" rather than falsely claiming
an exact match.

## Procurement

`/admin/suppliers` (CRUD, staff-managed) and `/admin/procurement` (reorder-flag dashboard, RFQs)
implement procurement.md's flywheel from "flag" through to a purchase order:

- **Flag**: `available_stock <= reorder_point` (business-rules.md §2) surfaces a product on the
  dashboard with a one-click "Create RFQ" prefilled with its `reorder_quantity`. This only flags —
  nothing is auto-purchased.
- **RFQ**: an admin picks the product/quantity/spec/destination/date and one or more non-blocked
  suppliers; `lib/suppliers/rfq-draft.ts` renders ready-to-send text per supplier (a deterministic
  template today, not an actual Claude call — no AI integration exists until Phase 8) and a
  "mark as sent" action records `rfq_suppliers.sent_at`.
- **Quotes → landed cost**: entering a quote computes `landed_cost` the moment unit price +
  shipping + at least one of duties/handling are known (migration `0015` added the duties/handling
  columns that were missing from Phase 0's schema); otherwise the UI honestly shows "incomplete —
  purchase price only" rather than a number (business-rules.md §1, §21).
- **Scoring**: every quote on an RFQ is ranked by `lib/suppliers/rules.ts` (`rankQuotes`, 12 unit
  tests) against business-rules.md §6's weighted formula, re-normalized across the current quote
  set on every new quote. Quality/reliability are `suppliers.quality_score`/`reliability_score` —
  a plain admin-entered 0–100 rating (migration `0014`), since there's no completed-order history
  yet to compute either from automatically; a missing rating scores as worst-case, not average.
  `BEST_PRICE`/`FASTEST`/`BEST_VALUE`/`PREFERRED_SUPPLIER` labels are computed at render time, not
  stored, so re-weighting later needs no migration.
- **Approval gate**: awarding a quote (admin-only) creates a real `supplier_orders` +
  `supplier_order_items` row, `approved_by`/`approved_at` set immediately by that admin
  (business-rules.md §7) — and is rejected in `lib/suppliers/service.ts` if the quote's supplier is
  still `discovered`/`under_review` (procurement.md §2's hard rule: a lead is not an approved
  source). The database's own `supplier_orders_approval_required` check constraint is a second,
  independent enforcement of the same "no PO without an approver" rule.

Verified live end-to-end in the browser as a throwaway `ect_admin` account (two suppliers — one
`discovered`, one `qualified` — an RFQ, and two quotes, all deleted after): created both suppliers
through `/admin/suppliers/new`; flagged products on `/admin/procurement` matched the real dev
sample data exactly (UV-C Sterilizer at 4/5, Legionella Sampling Kit at 0/20) and "Create RFQ"
correctly prefilled product and `reorder_quantity`; sent the RFQ to both suppliers and confirmed
the rendered draft text and `sent_at` timestamp; entered a cheaper/faster quote for the discovered
supplier and a pricier/slower, deliberately incomplete one (no shipping) for the qualified supplier
— the discovered quote correctly **out-scored** the qualified one (86 → 66 once both were in, vs.
60.5) and showed `Best price`/`Best value`, while the qualified quote showed `incomplete — purchase
price only` for its landed cost, exactly as `computeLandedCost` and `rankQuotes` predict; clicking
"Award & create PO" on the top-scoring discovered quote was rejected (Next's error boundary caught
the thrown guard error, and the database confirmed no `supplier_orders` row was created), while
awarding the lower-scored qualified quote succeeded, moved the RFQ to `Awarded`, and produced the
exact expected `supplier_orders`/`supplier_order_items` row (20 × €9.50 = €190, `landed_cost` null,
`approved_by`/`approved_at` set to that admin).

Getting there took one detour: Supabase Auth's password grant returned `500 Database error
querying schema` for every throwaway account this phase, which first looked like a platform
incident (health endpoint was up, nothing on Supabase's status page, profiles/RLS/extensions all
checked out). It wasn't — [Supabase's own troubleshooting
guide](https://supabase.com/docs/guides/troubleshooting/auth-error-500-database-error-querying-schema-eb6b44)
confirms this exact error means `NULL` in `auth.users` columns GoTrue expects as `''`, and every
prior phase's throwaway-user SQL insert (this one included) had only ever set
`confirmation_token`/`recovery_token` to `''`, leaving `email_change`, `email_change_token_new`,
etc. `NULL` by column default. Explicitly setting all of them to `''` on insert fixed it
immediately — worth remembering for every throwaway account created in later phases too.

## Admin dashboard

`/admin` reuses the exact `is_ect_staff()`/`is_ect_admin()` RLS split built in Phase 1 — no new
policies were needed. Admin pages call the regular session-aware Supabase client (`lib/supabase/
server.ts`), not the service-role client: the signed-in staff member's own `profiles.role` is what
RLS checks, so the database is the actual enforcement boundary, and `lib/admin/guard.ts`
(`requireStaff`/`requireAdmin`) is the server-side route-guard layer on top (security.md §2).

- **`ect_operator`+**: inventory (record movements, edit reorder points), orders (view all, status
  override — every change writes an `audit_logs` row with before/after), customers (view + order
  history).
- **`ect_admin`+ only**: products (create/edit, images, documents — bundle *composition* isn't
  editable here yet, only the bundle's own fields; component lines still need direct DB access)
  and categories (create/edit/delete).

Verified live with three throwaway staff/customer accounts (since deleted): product edits show up
immediately on the storefront (added an image, confirmed it rendered on the public product page);
an order status change produced the expected `audit_logs` row; and — the actual point of the
operator/admin split — an `ect_operator` account could see the products list but not its Edit/New
controls, and directly navigating to `/admin/products/new` as that operator redirected them away
via the server guard rather than relying on the UI hiding the link.

## Checkout & payments

Prices/VAT/stock are always re-read from the database server-side at checkout — never trusted
from the client cart (`lib/orders/service.ts`). Order status only ever moves via the Stripe
webhook handler (`app/api/webhooks/stripe/route.ts` → `lib/orders/webhook-handlers.ts`), never the
client, matching business-rules.md §8. This was verified with a **real Stripe test-mode payment**
(hosted Checkout, test card 4242 4242 4242 4242), then a signed-webhook replay test proving
idempotency: after two deliveries of the identical event, exactly one order, one payment, and one
inventory movement existed (stock decremented exactly once). Order confirmation email (Resend) was
confirmed delivered for a real send and confirmed to fail gracefully (order still marks `paid`)
when Resend's sandbox restrictions block the recipient.

One account-specific Stripe quirk hit during setup: this account has "Managed Payments" (Stripe
Tax) on by default, which requires a product tax code per line item unless disabled. Since VAT is
already computed server-side per business-rules.md §1 and baked into each line's `unit_amount`,
the session is created with `managed_payments: { enabled: false }` rather than adding tax codes —
see the comment in `lib/orders/checkout-actions.ts`.

No Stripe CLI or public tunnel is available in this environment, so local webhook testing signs
simulated events by hand with a self-chosen `STRIPE_WEBHOOK_SECRET` (`.env.local`) rather than
Stripe's real signing secret — replace it with the real one from Stripe Dashboard → Developers →
Webhooks once a production/staging endpoint exists.

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

`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `RESEND_API_KEY` are all in `.env.local`
(Supabase's MCP integration can't expose the service-role secret itself; the user supplied it and
the Stripe/Resend keys from their own dashboards).

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

Phase 8 (Days 26–27): AI — retrieval layer, the customer-facing assistant, maintenance-explanation
and yacht-aware answers, response allowlist checking. See `docs/implementation-plan.md`.
