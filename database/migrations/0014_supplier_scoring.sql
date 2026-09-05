-- 0014_supplier_scoring.sql
-- Phase 7: supplier scoring inputs that have no other source in the schema.
--
-- business-rules.md §6 scores suppliers on price/lead-time/quality/reliability/MOQ/shipping/
-- payment-terms. Price/lead-time/MOQ/shipping/payment-terms all come from a supplier_quotes row
-- already. Quality and reliability have no MVP telemetry source (no completed supplier_orders
-- history to derive an on-time-delivery rate from yet) — so, like `suppliers.notes`, they are a
-- plain admin-entered rating (0-100), not fabricated as a computed metric until real order history
-- exists to compute one from.
alter table suppliers
  add column quality_score numeric(5, 2) check (quality_score is null or (quality_score between 0 and 100)),
  add column reliability_score numeric(5, 2) check (reliability_score is null or (reliability_score between 0 and 100));

-- business-rules.md §6: "Default weights (admin-configurable, stored not hard-coded)". A
-- singleton row rather than per-row config since there is exactly one scoring policy at a time.
create table supplier_scoring_weights (
  id boolean primary key default true check (id),
  price_weight numeric(4, 3) not null default 0.30,
  lead_time_weight numeric(4, 3) not null default 0.20,
  quality_weight numeric(4, 3) not null default 0.20,
  reliability_weight numeric(4, 3) not null default 0.15,
  moq_weight numeric(4, 3) not null default 0.05,
  shipping_weight numeric(4, 3) not null default 0.05,
  payment_terms_weight numeric(4, 3) not null default 0.05,
  updated_at timestamptz not null default now()
);

insert into supplier_scoring_weights (id) values (true);

create trigger supplier_scoring_weights_set_updated_at
  before update on supplier_scoring_weights
  for each row execute function set_updated_at();

alter table supplier_scoring_weights enable row level security;

-- Same shape as categories/brands: any staff member can read the active policy, only an
-- ect_admin+ can re-weight it.
create policy supplier_scoring_weights_staff_read on supplier_scoring_weights
  for select using (private.is_ect_staff());
create policy supplier_scoring_weights_admin_write on supplier_scoring_weights
  for all using (private.is_ect_admin()) with check (private.is_ect_admin());
