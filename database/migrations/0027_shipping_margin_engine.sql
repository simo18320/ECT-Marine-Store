-- Shipping & Margin Engine. Reuses what already exists: products.purchase_cost is the product
-- cost, products.weight_kg the weight, products.dimensions (jsonb) holds length/width/height in
-- cm. The old informational products.shipping_cost is left untouched.

alter table products
  add column shipping_class text check (shipping_class in ('A', 'B', 'C', 'D')),
  add column packaging_cost numeric(12, 2),
  add column free_shipping_eligible boolean not null default true,
  add column minimum_margin_percent numeric(5, 2),
  add column minimum_margin_amount numeric(12, 2),
  add column special_shipping_required boolean not null default false,
  add column shipping_override boolean not null default false,
  add column shipping_override_cost numeric(12, 2),
  -- ECT's own carrier cost for this product per destination zone; null = use the class rate's cost.
  add column shipping_cost_it numeric(12, 2),
  add column shipping_cost_eu numeric(12, 2),
  add column shipping_cost_uk numeric(12, 2),
  add column shipping_cost_int numeric(12, 2);

-- Cost snapshot per line so historical profitability survives later cost changes.
alter table order_items add column unit_cost_snapshot numeric(12, 2);

create table shipping_settings (
  id boolean primary key default true,
  default_minimum_net_margin_percent numeric(5, 2) not null default 30,
  free_shipping_target numeric(12, 2) not null default 150,
  payment_provider text not null default 'stripe',
  payment_fee_percent numeric(5, 2) not null default 2.9,
  payment_fixed_fee numeric(12, 2) not null default 0.30,
  default_packaging_cost numeric(12, 2) not null default 1.50,
  included_weight_kg numeric(8, 2) not null default 10,
  handling_fee_per_extra_kg numeric(8, 2) not null default 0,
  updated_at timestamptz not null default now(),
  constraint shipping_settings_singleton check (id)
);
insert into shipping_settings (id) values (true);

-- Both the customer tariff (net of VAT) and ECT's own carrier cost per zone and class.
-- mode 'quote' = no online price: shipping is quoted individually (class D, and anything
-- "calculated" until a carrier integration exists).
create table shipping_rates (
  zone text not null check (zone in ('IT', 'EU', 'UK', 'INT')),
  shipping_class text not null check (shipping_class in ('A', 'B', 'C', 'D')),
  mode text not null default 'quote' check (mode in ('fixed', 'quote')),
  customer_charge numeric(12, 2),
  ect_cost numeric(12, 2),
  primary key (zone, shipping_class),
  constraint shipping_rates_fixed_needs_values check (
    mode = 'quote' or (customer_charge is not null and ect_cost is not null)
  )
);

insert into shipping_rates (zone, shipping_class, mode, customer_charge, ect_cost) values
  ('IT', 'A', 'fixed', 9.90, 9.90),  ('IT', 'B', 'fixed', 14.90, 14.90),
  ('IT', 'C', 'quote', null, null),  ('IT', 'D', 'quote', null, null),
  ('EU', 'A', 'fixed', 14.90, 14.90), ('EU', 'B', 'fixed', 19.90, 19.90),
  ('EU', 'C', 'quote', null, null),  ('EU', 'D', 'quote', null, null),
  ('UK', 'A', 'fixed', 19.90, 19.90), ('UK', 'B', 'fixed', 29.90, 29.90),
  ('UK', 'C', 'quote', null, null),  ('UK', 'D', 'quote', null, null),
  ('INT', 'A', 'quote', null, null), ('INT', 'B', 'quote', null, null),
  ('INT', 'C', 'quote', null, null), ('INT', 'D', 'quote', null, null);

-- The shipping calculation exactly as used when the order was placed (audit trail).
create table order_profitability (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id) on delete cascade,
  shipping_zone text not null,
  shipping_class_at_order text,
  free_shipping_at_order boolean not null default false,
  free_shipping_note text,
  customer_shipping_at_order numeric(12, 2) not null default 0,
  shipping_cost_at_order numeric(12, 2) not null default 0,
  shipping_subsidy numeric(12, 2) not null default 0,
  payment_fee_at_order numeric(12, 2) not null default 0,
  packaging_cost_at_order numeric(12, 2) not null default 0,
  revenue_net numeric(12, 2) not null default 0,
  product_cost numeric(12, 2),
  gross_profit numeric(12, 2),
  net_profit numeric(12, 2),
  net_margin_at_order numeric(7, 2),
  min_margin_percent numeric(5, 2),
  margin_status text not null check (margin_status in ('SAFE', 'WARNING', 'LOSS', 'UNRELIABLE')),
  missing_cost_data boolean not null default false,
  flags text[] not null default '{}',
  override_active boolean not null default false,
  override_price numeric(12, 2),
  override_reason text,
  override_by uuid references profiles (id) on delete set null,
  override_at timestamptz,
  computed_at timestamptz not null default now()
);
create index order_profitability_computed_at_idx on order_profitability (computed_at);

-- Cost, margin and subsidy are internal: administrators only, never customers.
alter table shipping_settings enable row level security;
alter table shipping_rates enable row level security;
alter table order_profitability enable row level security;
create policy shipping_settings_admin on shipping_settings for all
  using (private.is_ect_admin()) with check (private.is_ect_admin());
create policy shipping_rates_admin on shipping_rates for all
  using (private.is_ect_admin()) with check (private.is_ect_admin());
create policy order_profitability_admin on order_profitability for all
  using (private.is_ect_admin()) with check (private.is_ect_admin());
