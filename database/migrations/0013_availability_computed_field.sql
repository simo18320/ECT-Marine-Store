-- 0013_availability_computed_field.sql
-- Replaces the product_availability view (flagged ERROR by the Supabase security advisor —
-- "security_definer_view": any view without security_invoker=true runs with the owner's
-- privileges against the underlying RLS-protected table, which the linter blanket-flags even
-- for deliberate, narrow uses like this one) with PostgREST's documented "computed field"
-- pattern: a SECURITY DEFINER function whose sole argument is the table's row type. PostgREST
-- exposes it as if it were a real column — `select=sku,availability_status` — with no join or
-- embed syntax needed. Same trusted-function pattern as private.is_ect_staff() etc. in
-- 0010, just intentionally public (it must be directly selectable by anon/authenticated).

drop view if exists product_availability;

create or replace function availability_status(p products)
returns text
language sql
stable
security definer set search_path = public
as $$
  select case
    when (i.current_stock - i.reserved_stock) <= 0 then 'out_of_stock'
    when (i.current_stock - i.reserved_stock) <= i.reorder_point then 'low_stock'
    else 'in_stock'
  end
  from inventory i
  where i.product_id = p.id;
$$;

grant execute on function availability_status(products) to anon, authenticated;
