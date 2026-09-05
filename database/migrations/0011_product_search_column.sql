-- 0011_product_search_column.sql
-- Replaces the plain expression index from 0003 with a stored generated column so
-- Supabase JS's .textSearch() (Phase 2 Day 6) can target it by name.

drop index if exists products_search_idx;

alter table products
  add column search_vector tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(description, '')
    )
  ) stored;

create index products_search_idx on products using gin (search_vector);
