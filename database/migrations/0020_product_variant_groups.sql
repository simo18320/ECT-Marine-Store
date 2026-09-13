-- Groups sibling products that are really the same filter type in different sizes/classes
-- (e.g. a Zehnder replacement filter in G4 vs F7) so the product page can offer a single
-- size selector instead of the customer having to find each size as a separate listing —
-- mirroring how a supplier catalog like aerofeel.com presents one product with a size
-- dropdown. This is a plain shared grouping key, not a parent/child relationship: no row is
-- "the" canonical product, every sibling is a real, independently sellable product with its
-- own SKU, slug, price and stock.
alter table products add column variant_group_id uuid;
create index products_variant_group_id_idx on products (variant_group_id) where variant_group_id is not null;
