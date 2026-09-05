-- 0003_catalog.sql
-- Brands, categories, products, variants, images, documents, bundle composition.

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  website text,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories (id) on delete set null,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index categories_parent_id_idx on categories (parent_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  category_id uuid references categories (id) on delete set null,
  brand_id uuid references brands (id) on delete set null,
  description text,
  short_description text,
  technical_specs jsonb not null default '{}'::jsonb,
  unit text not null default 'pcs',
  purchase_cost numeric(12, 2),
  selling_price numeric(12, 2) not null,
  vat_rate numeric(5, 2) not null default 22.00,
  weight_kg numeric(10, 3),
  dimensions jsonb,
  application text,
  replacement_interval_days int,
  operating_conditions jsonb,
  certifications text[] not null default '{}',
  requires_compliance_ack boolean not null default false,
  is_bundle boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create index products_category_id_idx on products (category_id);
create index products_brand_id_idx on products (brand_id);
create index products_search_idx on products
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text not null unique,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  price_override numeric(12, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on product_variants (product_id);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0
);

create index product_images_product_id_idx on product_images (product_id);

create table product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  title text not null,
  url text not null,
  doc_type text not null default 'datasheet'
);

create index product_documents_product_id_idx on product_documents (product_id);

-- Maintenance kits / bundles: a bundle is a `products` row with is_bundle = true,
-- composed of component products via this table (business-rules.md §1).
create table product_bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_product_id uuid not null references products (id) on delete cascade,
  component_product_id uuid not null references products (id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  unique (bundle_product_id, component_product_id),
  constraint product_bundle_items_no_self_reference check (bundle_product_id <> component_product_id)
);
