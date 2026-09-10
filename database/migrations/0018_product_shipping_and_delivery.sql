-- Per-product shipping cost (shown to the customer, not yet folded into checkout's
-- order.shipping_total — that needs a multi-item combination rule that hasn't been decided
-- yet) and an optional manual delivery-estimate label. The estimate is a deliberate admin
-- override of what the customer sees for timing — independent of the real computed stock
-- status (availability_status) and takes priority over it when set, but never affects
-- purchasability: add-to-cart still gates on the real stock numbers.
create type product_delivery_estimate as enum (
  'ships_immediately',
  'ships_2_3_days',
  'made_to_order'
);

alter table products
  add column shipping_cost numeric(12, 2),
  add column delivery_estimate product_delivery_estimate;
