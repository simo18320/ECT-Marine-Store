-- 0015_supplier_quote_cost_breakdown.sql
-- procurement.md §4: landed cost is computed the moment a quote has unit price + shipping + at
-- minimum one of duties/handling, left null otherwise. 0005 only gave supplier_quotes a
-- shipping_cost column; duties and handling were never added, so the completeness gate the doc
-- describes had no columns to check. payment_costs/other_known_costs from business-rules.md §1's
-- full formula stay a V2 addition — procurement.md §4 only requires duties/handling for MVP.
alter table supplier_quotes
  add column duties_cost numeric(12, 2),
  add column handling_cost numeric(12, 2);
