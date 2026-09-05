# ECT Marine Store — 30-Day Implementation Plan

Status: **Draft for approval — nothing below has been started.** This expands the master spec's
§44 phase outline into concrete day-by-day tasks with explicit exit criteria, so each phase has a
checkable "done" before the next starts (§56 Definition of Done). Dates assume a Phase 1 kickoff
the day this plan is approved.

## Phase 1 — Architecture (Days 1–3)

- Day 1: Confirm the open decision in architecture.md §2 (separate vs shared Supabase project).
  Scaffold `ect-marine-store` as a Next.js + TypeScript + App Router project; copy
  `globals.css` tokens and `components.json` (`radix-nova`) from `yacht-environmental-dashboard`;
  copy `public/logo.png`. Git init, first commit.
- Day 2: Create the Supabase project (or confirm shared one), run migrations `0001`–`0009` from
  `database/migrations/`, verify RLS with a throwaway second user. Wire `.env.local` /
  `.env.example` following the sibling app's pattern.
- Day 3: Supabase Auth wired into the app (sign up/in/out, `profiles` row auto-created via trigger
  on `auth.users` insert). Base layout, nav, and design system applied (colors/logo verified to
  match Eco Air Sense pixel-for-pixel).

**Exit criteria:** a logged-in user sees an empty shell with the correct ECT branding; `npm run
build` is clean; RLS confirmed to block cross-user reads via a manual test.

## Phase 2 — E-commerce core (Days 4–7)

- Day 4: Categories tree (Water/Air/Hygiene/Maintenance Kits from §8–§11) seeded via
  `database/seed.sql`; category listing pages.
- Day 5: Product detail page (structure from §36) reading `products` + `product_images` +
  `product_documents` + `product_compatibility` (compatible-equipment display) +
  `product_recommendations`.
- Day 6: Search (Postgres full-text on `products.name`/`description`, no external search service
  for MVP) and category/attribute filtering.
- Day 7: Cart (client state + `inventory.available_stock` check before allowing add), bundle
  display for maintenance kits (§11).

**Exit criteria:** a visitor can browse, search, filter, view a product with real compatibility
data, and build a cart, with no account required yet.

## Phase 3 — Checkout (Days 8–11)

- Day 8: Customer account (Supabase Auth), address book (`customer_addresses`).
- Day 9: Stripe Checkout session creation from cart contents; order created in `pending` status
  server-side before redirect (never after).
- Day 10: Stripe webhook handler — signature verification, idempotent upsert on
  `stripe_payment_intent_id`, order status transition `pending → paid`, `inventory_movements`
  `SALE` rows written, stock decremented via the trigger.
- Day 11: Order confirmation page + Resend confirmation email.

**Exit criteria:** a real (test-mode) Stripe payment produces exactly one order, one payment
record, and correct stock decrement — verified by replaying the same webhook event twice and
confirming no duplicate order/double decrement.

## Phase 4 — Admin (Days 12–15)

- Day 12: Admin shell with role guard (`ect_operator`+), product management (CRUD, images, docs).
- Day 13: Inventory view + manual `inventory_movements` entry (adjustment/damage/transfer).
- Day 14: Order management (status view, manual status override with `audit_logs` entry).
- Day 15: Customer & category management.

**Exit criteria:** an `ect_admin` can fully manage the Phase 2/3 catalogue and order flow without
touching SQL directly.

## Phase 5 — My Yacht (Days 16–19)

- Day 16: Yacht profile CRUD (`yachts`, `yacht_users`), multi-yacht per customer.
- Day 17: Equipment register (`equipment`, `equipment_installations`) with QR token generation.
- Day 18: Filter register (`filters`, `filter_installations`) + QR code rendering/scanning
  (scan opens the equipment/filter record or a public-safe maintenance summary).
- Day 19: Replacement date display (`replacement_schedules`) with status badges
  (OK/DUE_SOON/DUE/OVERDUE/UNKNOWN) on the yacht dashboard.

**Exit criteria:** a customer can register a yacht, add equipment/filters, scan a generated QR
code, and see accurate replacement status computed from real interval math.

## Phase 6 — Recommendation engine (Days 20–22)

- Day 20: Problem selector UI (§37 "Find the right product" flow: problem → system → equipment).
- Day 21: Deterministic ranking implementation per business-rules.md §5, wired to real
  `product_compatibility` data (data entry starts in parallel with Phase 2, per architecture.md
  risk #1 — should already have meaningful coverage by now).
- Day 22: Recommended kits surfaced on relevant product/category pages using
  `product_recommendations`.

**Exit criteria:** the problem selector returns only compatibility-validated products, matching a
hand-checked expected result for at least 5 test scenarios.

## Phase 7 — Procurement (Days 23–25)

- Day 23: Supplier database (`suppliers`, `supplier_products`) + status lifecycle UI.
- Day 24: Landed cost calculation (business-rules.md §1) + procurement dashboard (low-stock flags
  from §2).
- Day 25: Manual RFQ generation (`rfqs`/`rfq_suppliers`/`supplier_quotes`), Claude-assisted RFQ
  draft text (human sends).

**Exit criteria:** an admin can take a low-stock product from flag → RFQ → recorded quotes →
landed cost comparison, entirely manually but fully recorded in the schema.

**Done.** Exceeded slightly: the approval gate (procurement.md §6) is also built — a qualified+
quote can be awarded into a real `supplier_orders`/`supplier_order_items` row, admin-only, with the
DISCOVERED/UNDER_REVIEW rejection enforced in `lib/suppliers/service.ts`. See README.md's
"Procurement" section for what was verified and how.

## Phase 8 — AI (Days 26–27)

- Day 26: Retrieval layer (ai-engine.md §2) + Claude integration for the customer-facing
  assistant; response postprocessing/allowlist check (§3).
- Day 27: Maintenance-explanation and yacht-aware answers wired to real `getYachtContext`/
  `getReplacementStatus` data; `ai_conversations`/`ai_messages`/`ai_recommendations` logging live.

**Exit criteria:** the assistant correctly refuses to state a spec/compatibility/stock fact not
present in retrieved data (tested with at least 3 deliberately out-of-scope questions).

**Done.** Verified against a real `claude-sonnet-5` model with 3 deliberately out-of-scope
questions (fictional product, exact stock count, a problem category with zero verified
compatibility data) — all three produced correct, well-reasoned refusals rather than fabrication.
One real bug surfaced and fixed during this pass: the SKU allowlist check originally flagged
Claude's own correct refusal as a violation when it repeated a customer-mentioned fictional SKU
back to say "I don't recognize this" — `lib/ai/postprocess.ts`'s `checkAllowlist` now exempts a
SKU already present in the customer's own message from that check (a recommendation naming that
same product is still always rejected). See README.md's "AI assistant" section for the full
verification detail.

## Phase 9 — Testing (Days 28–29)

Per §45 of the master spec, at minimum: auth, product retrieval, cart, checkout, Stripe webhook
(including the double-delivery idempotency case), order creation, inventory, RLS/permissions
(cross-tenant read attempt must fail), yacht creation, equipment, replacement calculation,
compatibility filtering, recommendation ranking, supplier scoring, landed cost. Mobile + desktop
manual pass on: homepage, product page, cart/checkout, My Yacht, admin dashboard.

**Exit criteria:** every item above has a passing automated test where feasible (rules.ts functions
are unit tested; webhook/RLS are integration tested), and a manual mobile pass has no blocking
layout issues on the core flows.

**Done.** 74 unit tests (`npm test`) across every domain's rules.ts, including two gaps closed
this phase (`inventory/rules.ts`, `products/queries.ts`'s `toListItem`) and one refactor (cart
logic extracted from the `useCart()` hook into pure `lib/cart/rules.ts` so it's testable at all).
7 integration tests (`npm run test:integration`) against the real Supabase project: webhook
double-delivery idempotency (which caught and fixed a real bug — bundle sales never decremented
their components, only business-rules.md §1 said they should) and RLS cross-tenant isolation with
real signed-in sessions. Manual mobile pass at 375×812 found and fixed two blocking navigation
issues (see README.md's "Testing" section) via a shared `MobileNav` component, plus a horizontal
overflow on `/admin/inventory`'s movement form. auth and yacht/equipment creation are exercised as
part of the RLS and webhook integration tests rather than as separate dedicated tests — creating
users/yachts/equipment is plain CRUD with no business-logic branches of its own to test beyond
what those two suites already exercise live.

## Phase 10 — Launch (Day 30)

Soft launch to selected ECT customers per §44. Not called "production-ready" until Phase 9's exit
criteria are actually met, per §56 (Definition of Done) — a slipped Phase 9 pushes Day 30, it
doesn't get skipped.

## Standing rule across all phases

No phase begins its next day's work with a broken build or a failing test from the previous day.
Documentation (this folder) is updated alongside code changes that affect it, not batched at the
end.
