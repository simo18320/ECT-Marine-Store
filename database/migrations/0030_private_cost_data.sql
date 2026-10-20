-- Cost and margin data must never be readable through the public API. products and order_items are
-- readable by customers (RLS is per row, not per column), so the sensitive columns move to
-- staff-only tables. Step 1 of 2: create and backfill; the old columns are dropped in 0031 once the
-- application reads from the new tables.
create table product_private (
  product_id uuid primary key references products (id) on delete cascade,
  purchase_cost numeric(12, 2),
  shipping_cost numeric(12, 2),
  packaging_cost numeric(12, 2),
  minimum_margin_percent numeric(5, 2),
  minimum_margin_amount numeric(12, 2),
  shipping_cost_it numeric(12, 2),
  shipping_cost_eu numeric(12, 2),
  shipping_cost_uk numeric(12, 2),
  shipping_cost_int numeric(12, 2),
  updated_at timestamptz not null default now()
);
insert into product_private
  (product_id, purchase_cost, shipping_cost, packaging_cost, minimum_margin_percent, minimum_margin_amount,
   shipping_cost_it, shipping_cost_eu, shipping_cost_uk, shipping_cost_int)
select id, purchase_cost, shipping_cost, packaging_cost, minimum_margin_percent, minimum_margin_amount,
       shipping_cost_it, shipping_cost_eu, shipping_cost_uk, shipping_cost_int
from products;

create table order_item_costs (
  order_item_id uuid primary key references order_items (id) on delete cascade,
  unit_cost numeric(12, 2)
);
insert into order_item_costs (order_item_id, unit_cost)
select id, unit_cost_snapshot from order_items where unit_cost_snapshot is not null;

alter table product_private enable row level security;
alter table order_item_costs enable row level security;
create policy product_private_staff_read on product_private for select using (private.is_ect_staff());
create policy product_private_admin_write on product_private for all
  using (private.is_ect_admin()) with check (private.is_ect_admin());
create policy order_item_costs_admin on order_item_costs for all
  using (private.is_ect_admin()) with check (private.is_ect_admin());
