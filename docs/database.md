# ECT Marine Store — Database Design

Status: **Applied** (project `pwchzixxritrieedwuqz`, `eu-west-1`). This document describes the
schema implemented in `database/migrations/`. The migrations are the source of truth for exact
columns/constraints; this doc explains *why* the shape is what it is.

One migration exists beyond what's narrated below: `0010_security_hardening.sql`, a post-deploy
fix for issues the Supabase security advisor caught after `0001`–`0009` were applied (missing RLS
on `equipment_types`, unpinned function `search_path`, RLS helper functions directly RPC-callable).
See its header comment and `docs/security.md` for detail — the table/column design itself didn't
change, only where the four RLS helper functions live (`private` schema instead of `public`) and
one extra table's RLS.

## 1. Design principles

- **MVP tables are real, future tables are schema-ready but empty of app logic.** Sensor ingestion
  (`sensor_readings`), predictive procurement, and subscriptions have tables/columns so the schema
  doesn't need to be restructured later, but no MVP feature writes to them.
- **Money is never a single column.** Every place a margin could be shown carries `purchase_cost`,
  `selling_price`, and (where sourced) `landed_cost` separately — see business-rules.md §Margin.
- **Every stock change is an event.** `inventory.current_stock` is never updated directly by
  application code; it's derived from `inventory_movements` (trigger-maintained, see migration
  `0005`).
- **Compatibility and recommendations are ECT-authored data, not AI output.** `product_compatibility`
  has a `source` + `verified_by` column specifically so the AI layer can filter to verified rows
  only (§ai-engine.md).
- **RLS is per-tenant via `profiles`/`company_users`/`yacht_users`**, not per-row ad hoc checks
  scattered through app code.

## 2. Enums

| Enum | Values |
|---|---|
| `user_role` | customer, b2b_user, b2b_admin, ect_operator, ect_admin, super_admin |
| `account_type` | individual, business, shipyard, management_company, service_company |
| `order_status` | pending, paid, processing, shipped, delivered, cancelled, refunded |
| `payment_status` | pending, succeeded, failed, refunded, partially_refunded |
| `shipment_status` | ordered, processing, ready_to_ship, shipped, in_transit, out_for_delivery, delivered, delayed, exception |
| `supplier_status` | discovered, under_review, qualified, approved, preferred, blocked |
| `rfq_status` | draft, sent, quoted, awarded, cancelled |
| `inventory_movement_type` | purchase, sale, return, adjustment, damage, transfer |
| `replacement_status` | ok, due_soon, due, overdue, unknown |
| `service_request_status` | new, scheduled, in_progress, completed, cancelled |

## 3. Table groups (matches migration files)

### 0002 — Auth & organizations
- `profiles` (1:1 with `auth.users`) — role, account_type, optional `company_id`.
- `companies` — B2B parent (shipyard / management company / service company).
- `company_users` — many-to-many, role `member`/`admin` within the company.

### 0003 — Catalogue
- `brands`, `categories` (self-referencing for Water → Filtration → Sediment, etc.).
- `products` — the structured technical fields from §7 of the master spec, including
  `technical_specs jsonb` for the long tail of per-category specs (pore size, flow rate, UV
  wattage...) that don't deserve dedicated columns.
- `product_variants`, `product_images`, `product_documents`.
- `product_bundle_items` — makes a "kit" a `products` row with `is_bundle = true` plus a list of
  component products/quantities, so bundles behave as a single commercial offer (§11) while still
  decrementing component stock correctly (see business-rules.md).

### 0004 — Compatibility & recommendations
- `equipment_types` — controlled vocabulary (Filter Housing, UV System, RO Membrane, ...).
- `product_compatibility` — the differentiating table (§12). `source` is one of
  `ect_verified` / `manufacturer_doc` / `manual_entry`; nothing here is AI-written.
- `product_replacements` — supersession (this SKU replaces that discontinued one).
- `product_recommendations` — deterministic-engine output storage (§17), each row tagged with
  `rule_source` so the recommendation UI can say *why*.

### 0005 — Inventory & suppliers
- `inventory` (1:1 per product) + `inventory_movements` (append-only ledger, §26).
- `suppliers` with `status` lifecycle (§19) and `source`/`confidence` for AI-discovered rows.
- `supplier_products` — a supplier's price/MOQ/lead-time for a given product or external SKU.
- `rfqs` / `rfq_suppliers` / `supplier_quotes` — the RFQ engine (§22).

### 0006 — Commerce
- `customer_addresses` (owned by a `profiles` row).
- `orders` / `order_items` — line items snapshot `sku`/`name`/`price` at time of sale (never a
  live join to `products`, since prices and names change).
- `payments` — one row per Stripe PaymentIntent, `raw_event jsonb` stores the last webhook payload
  for audit/debugging.
- `supplier_orders` / `supplier_order_items` — the internal PO once an RFQ is approved (§23).
- `shipments` — polymorphic-by-column: exactly one of `order_id` (outbound to customer) or
  `supplier_order_id` (inbound from supplier) is set (CHECK constraint).
- `logistics_quotes` — manual entries in MVP; shape matches a future `ShippingProvider`
  abstraction (§24) without hard-coding a courier.

### 0007 — Yacht, equipment & maintenance
- `yachts` / `yacht_users` — a yacht can have multiple crew with different roles (§13).
- `equipment_types`, `equipment`, `equipment_installations` — the register (§14). `equipment.
  qr_code_token` is a stable UUID used to generate the QR code (§15); it never changes even if the
  equipment moves location.
- `filters` / `filter_installations` — the dedicated filter register (§15), separate from generic
  `equipment` because filters churn far more often and need their own replacement math.
- `replacement_schedules` — computed rows (`due_date`, `status`) recalculated by a scheduled job
  from `installation_date + replacement_interval_days`, not computed ad hoc in the UI (§16).
- `maintenance_records`, `service_requests` (§services, §33).

### 0008 — AI & observability
- `ai_conversations` + `ai_messages` (message list is implied by §18/§47 even though the master
  spec names only the parent table) + `ai_recommendations` — every recommendation stores
  `input`, `data_sources`, `recommendation`, `confidence`, `model`, and `outcome` per §47.
- `water_analysis`, `air_quality_devices`, `sensor_readings` — schema-ready for Eco Air Sense
  integration (§30); **no ingestion code in MVP**.
- `audit_logs` — generic before/after JSON, written by services (not triggers) so it can capture
  *who* and *why*, not just *what changed*.

### 0009 — RLS
Enables RLS on every tenant-scoped table and adds baseline policies:
- `profiles`: a user reads/updates only their own row; `ect_operator`+ reads all.
- `orders`/`order_items`/`payments`: visible to the owning customer, their company admins (if B2B),
  and `ect_operator`+.
- `yachts`/`equipment`/`filters`/`maintenance_records`: visible to `yacht_users` members of that
  yacht and `ect_operator`+.
- `suppliers`/`rfqs`/`supplier_*`/`ai_recommendations` (admin-facing): `ect_operator`+ only.
- `products`/`categories`/`brands` (catalogue): public read, `ect_admin`+ write.

Exact policy SQL is in migration `0009_rls_policies.sql`.

## 4. Deliberately not modeled yet

Subscriptions/auto-reorder scheduling, courier-specific fields, and a real feature-store for AI
learning are left out — adding them later is additive (new tables/columns), not a restructure,
because the tables that *would* reference them (`orders`, `replacement_schedules`, `products`)
already exist with stable primary keys.
