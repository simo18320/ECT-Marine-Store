-- 0012_public_product_availability.sql
-- `inventory` is intentionally staff-only (database.md §3, security.md) — exact stock counts
-- and reorder points are operationally sensitive and shouldn't be scrapeable via the public
-- REST API. But the storefront legitimately needs to show availability (§36 of the master
-- spec: product page "Availability"). Standard Postgres pattern: a view owned by a
-- privileged role (security_invoker defaults to false) computes only a coarse status and
-- is granted to anon/authenticated — it runs with the owner's privileges against `inventory`
-- regardless of the querying role's RLS, while only ever exposing `status`, never the raw
-- current_stock/reserved_stock/reorder_point columns.

create view product_availability as
select
  product_id,
  case
    when (current_stock - reserved_stock) <= 0 then 'out_of_stock'
    when (current_stock - reserved_stock) <= reorder_point then 'low_stock'
    else 'in_stock'
  end as status
from inventory;

grant select on product_availability to anon, authenticated;
