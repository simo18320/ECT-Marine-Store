-- Step 2 of 2 (see 0030): the application now reads cost and margin data from product_private and
-- order_item_costs, so the customer-readable copies are removed.
alter table products
  drop column if exists purchase_cost,
  drop column if exists shipping_cost,
  drop column if exists packaging_cost,
  drop column if exists minimum_margin_percent,
  drop column if exists minimum_margin_amount,
  drop column if exists shipping_cost_it,
  drop column if exists shipping_cost_eu,
  drop column if exists shipping_cost_uk,
  drop column if exists shipping_cost_int;
alter table order_items drop column if exists unit_cost_snapshot;
