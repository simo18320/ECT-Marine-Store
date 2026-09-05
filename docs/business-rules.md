# ECT Marine Store — Business Rules

Status: **Draft for approval**. These are the pure-function rules that belong in `lib/*/rules.ts`
(no DB or network access) per architecture.md §4. Anything here should be unit-testable in
isolation.

## 1. Pricing, cost & margin

```
purchase_cost        → what ECT pays the supplier, per unit, ex-shipping/duties
+ shipping + handling + duties + payment_costs + other_known_costs
= landed_cost

selling_price - landed_cost = contribution_margin
selling_price - purchase_cost = gross_margin   (only shown when landed_cost is unknown)
```

**Rule:** never present `gross_margin` labeled as final/contribution margin if a `landed_cost`
figure exists or could exist for that product/order. If landed cost is unknown, the UI must show
"estimated (purchase cost only)", not a bare number (§21, §50).

**VAT and discounts are configurable, not hard-coded.** `products.vat_rate` is per-product (some
marine supplies may qualify for different VAT treatment); discounts are a `discount_total` on the
order, computed from a `promotions`/rule table introduced in Phase 2+, not a hard-coded percentage
in checkout code.

**B2B pricing:** a `company_users` member sees `companies.price_list_id` (future table) pricing
where one exists, else standard `products.selling_price`. MVP ships standard pricing only; the
column/relationship exists so negotiated pricing is additive later.

**Bundle pricing:** a bundle (`products.is_bundle = true`) has its own `selling_price` — it is
**not** the sum of component prices. Stock for a bundle sale decrements each `product_bundle_items`
component by `bundle_quantity × items_sold`, recorded as separate `inventory_movements` rows tagged
with `reference_type = 'order_item'` and the same `reference_id`, so a bundle sale is auditable
component-by-component.

## 2. Inventory

- `inventory.current_stock` is **never** written directly. Every change is an
  `inventory_movements` row; a DB trigger maintains the denormalized `current_stock` on `inventory`
  (see migration `0005`) so reads stay cheap but writes stay auditable.
- `available_stock = current_stock - reserved_stock`. Checkout reserves stock (increments
  `reserved_stock`) at payment-intent creation, not at cart-add; a reservation not converted to a
  `SALE` movement within a timeout is released back (Phase 3 job, not implemented in MVP beyond the
  column existing).
- Reorder logic: `available_stock <= reorder_point` flags the product for procurement (§7 flywheel)
  — this only *flags*, it never auto-creates a purchase order in MVP (§23).

## 3. Replacement / maintenance status

```
next_due = installation_date + replacement_interval_days
```

Status thresholds (configurable per product/equipment via `replacement_interval_days`, not
hard-coded per status):

| Status | Condition |
|---|---|
| `OK` | more than 30 days before `next_due` |
| `DUE_SOON` | within 30 days of `next_due` |
| `DUE` | within 0 days (today ≤ `next_due` ≤ today) |
| `OVERDUE` | `next_due` < today |
| `UNKNOWN` | no `installation_date` or no `replacement_interval_days` on record |

`replacement_schedules` rows are recalculated by a scheduled job (daily), not computed live on
every page render, so dashboard/alert queries stay a simple indexed read — that was the original
design intent, but it assumes a cron/staff-side writer that doesn't exist yet (`replacement_
schedules`'s own RLS write policy is staff-only, since a customer's own session was never meant to
populate it directly). **Correction from Phase 5's actual implementation:** with no cron
infrastructure in place yet, `lib/maintenance/rules.ts` computes filter/equipment status live from
`installation_date`/`replacement_interval_days` (or, for equipment, `next_maintenance_date` →
`last_maintenance_date` → `installation_date`, in that priority order) on every My Yacht page
render — correct today because a single customer's own register is a handful of rows, not a
fleet-wide query. `replacement_schedules` stays schema-ready and unpopulated; a future cron job
writing into it (for efficient fleet-wide staff queries, e.g. "every overdue filter across every
customer") is additive, not a rework of this logic.

## 4. Compatibility engine

A product may be recommended for a piece of equipment **only if** a `product_compatibility` row
exists linking them with `source IN ('ect_verified','manufacturer_doc')`, or `source =
'manual_entry'` **and** `verified_by IS NOT NULL`. Unverified manual entries are visible in admin
tooling but excluded from customer-facing recommendations. The AI assistant and the recommendation
engine both read through this same table — there is no separate "AI compatibility" path (§12, §17,
AI safety rules in §18/§48 of the master spec).

## 5. Recommendation engine (deterministic, pre-AI)

```
Customer problem (sediment / taste / smell / microbio / UV / HVAC / VOC / PM / replacement)
  → mapped to one or more equipment_types
  → filtered to equipment actually on the customer's yacht (if known) or equipment_type alone
  → filtered to product_compatibility rows passing §4
  → ranked by: exact compatibility match > category fit > in-stock > price
  → top N returned with rule_source recorded
```

Claude (ai-engine.md) may re-rank or explain this output in natural language but must not add
products absent from it.

## 6. Supplier scoring

Default weights (admin-configurable, stored not hard-coded — see database `suppliers`/scoring
config, Phase 7):

| Factor | Weight |
|---|---|
| Price | 30% |
| Lead time | 20% |
| Quality | 20% |
| Reliability | 15% |
| MOQ fit | 5% |
| Shipping | 5% |
| Payment terms | 5% |

Score is 0–100, each factor normalized 0–100 before weighting. Labels derived from the same score
set: `BEST_PRICE` (lowest price among qualified quotes), `FASTEST` (lowest lead time),
`BEST_VALUE` (highest weighted score), `PREFERRED_SUPPLIER` (supplier.status = 'preferred' and
qualifies at all). These are presentation labels, not stored states.

## 7. Procurement approval

```
AI/manual recommendation → RFQ → supplier quote → ECT approval → supplier_orders (Purchase Order)
```

**MVP: 100% human approval, no exceptions.** The auto-approval rule from §23 of the master spec
(`preferred supplier + approved SKU + order < €500 + stock below reorder point`) is documented here
as the **Phase 2+ target** and the `supplier_orders` schema already carries `approved_by` /
`approved_at` so turning it on later is a policy change, not a schema change. Until then every
`supplier_orders` row requires a non-null `approved_by` before status can move past `draft`.

## 8. Order & payment lifecycle

```
pending → (Stripe webhook: payment succeeded) → paid → processing → shipped → delivered
                                                       ↘ cancelled / refunded (any point pre-delivery)
```

- Order/payment status is **only** ever written by the verified Stripe webhook handler or an
  explicit admin action (refund) — never by the client, never optimistically.
- **Idempotency:** the webhook handler upserts on `payments.stripe_payment_intent_id` (unique) and
  is safe to receive the same event multiple times (Stripe redelivers on timeout). An
  `orders.stripe_checkout_session_id` unique constraint prevents duplicate order rows from a
  double-submitted checkout.

## 9. Roles & B2B account types

`user_role`: `customer < b2b_user < b2b_admin` (customer-side), `ect_operator < ect_admin <
super_admin` (ECT-side). `account_type` on `companies`: `individual` (default, no company row),
`business`, `shipyard`, `management_company`, `service_company`. B2B-specific behavior (credit
terms, PO-based checkout, multi-user approval workflow) is schema-ready (`companies.credit_terms_days`,
`company_users`) but not exposed in MVP checkout — MVP B2B accounts still pay by card like a
consumer account, just with company-scoped order history.

## 10. Regulated/hygiene products

Legionella/microbiological sampling kits and any product flagged `requires_compliance_ack = true`
(column on `products`, added when the category is built in Phase 2/7) must show a compliance
notice and require an explicit checkbox before add-to-cart. No product in this category ships
without that flag being deliberately set by an ECT admin — it defaults to `true` for the Hygiene
category and must be explicitly cleared per-product.
