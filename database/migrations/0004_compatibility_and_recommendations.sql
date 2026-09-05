-- 0004_compatibility_and_recommendations.sql
-- Equipment type vocabulary, verified compatibility, supersession, deterministic recommendations.

create table equipment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  description text
);

create table product_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  equipment_type_id uuid references equipment_types (id) on delete set null,
  compatible_manufacturer text,
  compatible_model text,
  connection_type text,
  flow_rate_range text,
  dimensions_constraint jsonb,
  source text not null check (source in ('ect_verified', 'manufacturer_doc', 'manual_entry')),
  verified_by uuid references profiles (id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint manual_entry_needs_verifier
    check (source <> 'manual_entry' or verified_by is not null)
);

create index product_compatibility_product_id_idx on product_compatibility (product_id);
create index product_compatibility_equipment_type_id_idx on product_compatibility (equipment_type_id);

create table product_replacements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  replaces_product_id uuid not null references products (id) on delete cascade,
  unique (product_id, replaces_product_id)
);

create table product_recommendations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  recommended_product_id uuid not null references products (id) on delete cascade,
  reason text,
  rule_source text not null default 'manual',
  priority int not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, recommended_product_id)
);

create index product_recommendations_product_id_idx on product_recommendations (product_id);
