-- =============================================================================
-- ECT Marine Store — consolidated reference schema
-- Generated from database/migrations/*.sql — DO NOT edit directly.
-- Source of truth is the numbered migrations; this file is for readability only.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0001_extensions_and_enums.sql
-- ---------------------------------------------------------------------------
-- 0001_extensions_and_enums.sql
-- Extensions, enum types, and the shared updated_at trigger used across the schema.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type user_role as enum (
  'customer', 'b2b_user', 'b2b_admin', 'ect_operator', 'ect_admin', 'super_admin'
);

create type account_type as enum (
  'individual', 'business', 'shipyard', 'management_company', 'service_company'
);

create type order_status as enum (
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

create type payment_status as enum (
  'pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'
);

create type shipment_status as enum (
  'ordered', 'processing', 'ready_to_ship', 'shipped', 'in_transit',
  'out_for_delivery', 'delivered', 'delayed', 'exception'
);

create type supplier_status as enum (
  'discovered', 'under_review', 'qualified', 'approved', 'preferred', 'blocked'
);

create type rfq_status as enum (
  'draft', 'sent', 'quoted', 'awarded', 'cancelled'
);

create type inventory_movement_type as enum (
  'purchase', 'sale', 'return', 'adjustment', 'damage', 'transfer'
);

create type replacement_status as enum (
  'ok', 'due_soon', 'due', 'overdue', 'unknown'
);

create type service_request_status as enum (
  'new', 'scheduled', 'in_progress', 'completed', 'cancelled'
);

-- Shared updated_at maintenance, used via `create trigger ... execute function set_updated_at()`
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 0002_auth_and_organizations.sql
-- ---------------------------------------------------------------------------
-- 0002_auth_and_organizations.sql
-- profiles (1:1 with auth.users), companies (B2B parent), company_users (membership).

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_type account_type not null default 'business',
  vat_number text,
  billing_address jsonb,
  credit_terms_days int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null,
  full_name text,
  phone text,
  role user_role not null default 'customer',
  account_type account_type not null default 'individual',
  company_id uuid references companies (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create index profiles_company_id_idx on profiles (company_id);

-- Auto-create a profile row whenever a new Supabase Auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table company_users (
  company_id uuid not null references companies (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- 0003_catalog.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 0004_compatibility_and_recommendations.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 0005_inventory_and_suppliers.sql
-- ---------------------------------------------------------------------------
-- 0005_inventory_and_suppliers.sql
-- Inventory (event-sourced), suppliers, supplier products, RFQ engine.

create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products (id) on delete cascade,
  current_stock int not null default 0,
  reserved_stock int not null default 0,
  reorder_point int not null default 0,
  reorder_quantity int not null default 0,
  warehouse_location text,
  updated_at timestamptz not null default now()
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  movement_type inventory_movement_type not null,
  quantity int not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index inventory_movements_product_id_idx on inventory_movements (product_id);
create index inventory_movements_reference_idx on inventory_movements (reference_type, reference_id);

-- current_stock is derived, never written directly by application code (business-rules.md §2).
-- purchase/return add stock; sale/damage/transfer-out subtract; adjustment is signed as entered.
create or replace function apply_inventory_movement()
returns trigger
language plpgsql
as $$
declare
  delta int;
begin
  delta := case new.movement_type
    when 'purchase' then new.quantity
    when 'return' then new.quantity
    when 'sale' then -new.quantity
    when 'damage' then -new.quantity
    when 'transfer' then new.quantity
    when 'adjustment' then new.quantity
  end;

  insert into inventory (product_id, current_stock)
  values (new.product_id, delta)
  on conflict (product_id)
  do update set current_stock = inventory.current_stock + excluded.current_stock,
                updated_at = now();

  return new;
end;
$$;

create trigger inventory_movements_apply
  after insert on inventory_movements
  for each row execute function apply_inventory_movement();

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  website text,
  status supplier_status not null default 'discovered',
  payment_terms text,
  certifications text[] not null default '{}',
  contact_email text,
  contact_phone text,
  source text,
  confidence numeric(4, 3),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suppliers_set_updated_at
  before update on suppliers
  for each row execute function set_updated_at();

create table supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  external_sku text,
  description text,
  unit_price numeric(12, 2),
  currency text not null default 'EUR',
  moq int,
  lead_time_days int,
  shipping_estimate numeric(12, 2),
  last_verified_at timestamptz
);

create index supplier_products_supplier_id_idx on supplier_products (supplier_id);
create index supplier_products_product_id_idx on supplier_products (product_id);

create table rfqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete restrict,
  quantity int not null check (quantity > 0),
  specification text,
  destination text,
  requested_delivery_date date,
  status rfq_status not null default 'draft',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table rfq_suppliers (
  rfq_id uuid not null references rfqs (id) on delete cascade,
  supplier_id uuid not null references suppliers (id) on delete cascade,
  sent_at timestamptz,
  primary key (rfq_id, supplier_id)
);

create table supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs (id) on delete cascade,
  supplier_id uuid not null references suppliers (id) on delete cascade,
  unit_price numeric(12, 2) not null,
  currency text not null default 'EUR',
  moq int,
  lead_time_days int,
  shipping_cost numeric(12, 2),
  payment_terms text,
  valid_until date,
  landed_cost numeric(12, 2),
  score numeric(5, 2),
  created_at timestamptz not null default now()
);

create index supplier_quotes_rfq_id_idx on supplier_quotes (rfq_id);

-- ---------------------------------------------------------------------------
-- 0006_commerce.sql
-- ---------------------------------------------------------------------------
-- 0006_commerce.sql
-- Customer addresses, orders, payments, supplier purchase orders, shipments, logistics quotes.

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  label text,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text not null,
  country text not null,
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index customer_addresses_customer_id_idx on customer_addresses (customer_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references profiles (id) on delete restrict,
  company_id uuid references companies (id) on delete set null,
  status order_status not null default 'pending',
  currency text not null default 'EUR',
  subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  shipping_total numeric(12, 2) not null default 0,
  vat_total numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  shipping_address_id uuid references customer_addresses (id) on delete set null,
  billing_address_id uuid references customer_addresses (id) on delete set null,
  stripe_checkout_session_id text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create index orders_customer_id_idx on orders (customer_id);
create index orders_company_id_idx on orders (company_id);
create index orders_status_idx on orders (status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  variant_id uuid references product_variants (id) on delete set null,
  sku_snapshot text not null,
  name_snapshot text not null,
  unit_price numeric(12, 2) not null,
  quantity int not null check (quantity > 0),
  vat_rate numeric(5, 2) not null,
  line_total numeric(12, 2) not null
);

create index order_items_order_id_idx on order_items (order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  stripe_payment_intent_id text unique,
  status payment_status not null default 'pending',
  amount numeric(12, 2) not null,
  currency text not null default 'EUR',
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payments_set_updated_at
  before update on payments
  for each row execute function set_updated_at();

create index payments_order_id_idx on payments (order_id);

create table supplier_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers (id) on delete restrict,
  rfq_id uuid references rfqs (id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  currency text not null default 'EUR',
  total_cost numeric(12, 2),
  landed_cost numeric(12, 2),
  created_by uuid references profiles (id) on delete set null,
  approved_by uuid references profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint supplier_orders_approval_required
    check (status = 'draft' or approved_by is not null)
);

create table supplier_order_items (
  id uuid primary key default gen_random_uuid(),
  supplier_order_id uuid not null references supplier_orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_cost numeric(12, 2) not null,
  line_total numeric(12, 2) not null
);

create index supplier_order_items_supplier_order_id_idx on supplier_order_items (supplier_order_id);

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders (id) on delete cascade,
  supplier_order_id uuid references supplier_orders (id) on delete cascade,
  provider text,
  tracking_number text,
  status shipment_status not null default 'ordered',
  shipping_cost numeric(12, 2),
  expected_delivery date,
  actual_delivery date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipments_one_direction_only check (
    (order_id is not null and supplier_order_id is null) or
    (order_id is null and supplier_order_id is not null)
  )
);

create trigger shipments_set_updated_at
  before update on shipments
  for each row execute function set_updated_at();

create index shipments_order_id_idx on shipments (order_id);
create index shipments_supplier_order_id_idx on shipments (supplier_order_id);

create table logistics_quotes (
  id uuid primary key default gen_random_uuid(),
  shipment_context text,
  provider text not null,
  price numeric(12, 2) not null,
  currency text not null default 'EUR',
  estimated_days int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 0007_yacht_and_maintenance.sql
-- ---------------------------------------------------------------------------
-- 0007_yacht_and_maintenance.sql
-- Yacht profiles, equipment register, filter register, replacement schedules, maintenance, services.

create table yachts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  company_id uuid references companies (id) on delete set null,
  name text not null,
  yacht_type text,
  length_m numeric(6, 2),
  build_year int,
  flag text,
  cruising_area text,
  crew_count int,
  guest_count int,
  water_tank_capacity_l numeric(10, 2),
  freshwater_production_lpd numeric(10, 2),
  desalination_system text,
  filtration_notes text,
  uv_notes text,
  hvac_notes text,
  air_monitoring_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger yachts_set_updated_at
  before update on yachts
  for each row execute function set_updated_at();

create index yachts_owner_id_idx on yachts (owner_id);
create index yachts_company_id_idx on yachts (company_id);

create table yacht_users (
  yacht_id uuid not null references yachts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'captain', 'engineer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (yacht_id, profile_id)
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts (id) on delete cascade,
  equipment_type_id uuid references equipment_types (id) on delete set null,
  manufacturer text,
  model text,
  serial_number text,
  location text,
  installation_date date,
  status text not null default 'active' check (status in ('active', 'removed', 'faulty')),
  maintenance_interval_days int,
  last_maintenance_date date,
  next_maintenance_date date,
  qr_code_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger equipment_set_updated_at
  before update on equipment
  for each row execute function set_updated_at();

create index equipment_yacht_id_idx on equipment (yacht_id);

create table equipment_installations (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  installed_at date not null default current_date,
  removed_at date,
  installed_by uuid references profiles (id) on delete set null
);

create index equipment_installations_equipment_id_idx on equipment_installations (equipment_id);

create table filters (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts (id) on delete cascade,
  equipment_id uuid references equipment (id) on delete set null,
  location text,
  filter_type text,
  product_id uuid not null references products (id) on delete restrict,
  installation_date date,
  replacement_interval_days int,
  operating_hours numeric(10, 2),
  qr_code_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

create index filters_yacht_id_idx on filters (yacht_id);

create table filter_installations (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid not null references filters (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  installed_at date not null default current_date,
  removed_at date
);

create index filter_installations_filter_id_idx on filter_installations (filter_id);

create table replacement_schedules (
  id uuid primary key default gen_random_uuid(),
  filter_id uuid references filters (id) on delete cascade,
  equipment_id uuid references equipment (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  due_date date,
  status replacement_status not null default 'unknown',
  last_calculated_at timestamptz not null default now(),
  constraint replacement_schedules_one_target_only check (
    (filter_id is not null and equipment_id is null) or
    (filter_id is null and equipment_id is not null)
  )
);

create index replacement_schedules_filter_id_idx on replacement_schedules (filter_id);
create index replacement_schedules_equipment_id_idx on replacement_schedules (equipment_id);
create index replacement_schedules_status_idx on replacement_schedules (status);

create table maintenance_records (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts (id) on delete cascade,
  equipment_id uuid references equipment (id) on delete set null,
  filter_id uuid references filters (id) on delete set null,
  service_request_id uuid,
  performed_by text,
  performed_at date not null default current_date,
  description text,
  products_used jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index maintenance_records_yacht_id_idx on maintenance_records (yacht_id);

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts (id) on delete cascade,
  requested_by uuid references profiles (id) on delete set null,
  service_type text not null,
  status service_request_status not null default 'new',
  preferred_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger service_requests_set_updated_at
  before update on service_requests
  for each row execute function set_updated_at();

create index service_requests_yacht_id_idx on service_requests (yacht_id);

alter table maintenance_records
  add constraint maintenance_records_service_request_fk
  foreign key (service_request_id) references service_requests (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 0008_ai_and_observability.sql
-- ---------------------------------------------------------------------------
-- 0008_ai_and_observability.sql
-- AI conversations/recommendations, water/air sensor schema (ingestion deferred), audit log.

create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  yacht_id uuid references yachts (id) on delete set null,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index ai_conversations_profile_id_idx on ai_conversations (profile_id);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_id_idx on ai_messages (conversation_id);

create table ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references ai_conversations (id) on delete set null,
  profile_id uuid not null references profiles (id) on delete cascade,
  yacht_id uuid references yachts (id) on delete set null,
  input jsonb not null,
  data_sources text[] not null default '{}',
  recommendation jsonb not null,
  confidence numeric(4, 3),
  model text not null,
  outcome text,
  created_at timestamptz not null default now()
);

create index ai_recommendations_profile_id_idx on ai_recommendations (profile_id);

-- Schema-ready for Eco Air Sense integration (roadmap.md V3) — no ingestion writer in MVP.
create table water_analysis (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts (id) on delete cascade,
  sample_point text,
  sampled_at date not null default current_date,
  parameters jsonb not null default '{}'::jsonb,
  lab_report_url text,
  created_at timestamptz not null default now()
);

create index water_analysis_yacht_id_idx on water_analysis (yacht_id);

create table air_quality_devices (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts (id) on delete cascade,
  device_type text not null default 'eco_air_sense',
  serial_number text,
  location text,
  installed_at date,
  is_active boolean not null default true
);

create index air_quality_devices_yacht_id_idx on air_quality_devices (yacht_id);

create table sensor_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references air_quality_devices (id) on delete cascade,
  reading_type text not null,
  value numeric not null,
  unit text,
  recorded_at timestamptz not null
);

create index sensor_readings_device_id_recorded_at_idx on sensor_readings (device_id, recorded_at desc);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 0009_rls_policies.sql
-- ---------------------------------------------------------------------------
-- 0009_rls_policies.sql
-- Enables RLS on every tenant-scoped table and defines baseline policies (database.md §3 "RLS").

create or replace function is_ect_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('ect_operator', 'ect_admin', 'super_admin')
  );
$$;

create or replace function is_ect_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('ect_admin', 'super_admin')
  );
$$;

create or replace function is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from company_users
    where company_id = target_company_id
      and profile_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function is_yacht_member(target_yacht_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from yacht_users
    where yacht_id = target_yacht_id
      and profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Catalogue: public read, staff write.
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table product_documents enable row level security;
alter table product_bundle_items enable row level security;
alter table product_compatibility enable row level security;
alter table product_replacements enable row level security;
alter table product_recommendations enable row level security;

create policy categories_public_read on categories for select using (true);
create policy categories_staff_write on categories for all using (is_ect_admin()) with check (is_ect_admin());

create policy brands_public_read on brands for select using (true);
create policy brands_staff_write on brands for all using (is_ect_admin()) with check (is_ect_admin());

create policy products_public_read on products for select using (is_active or is_ect_staff());
create policy products_staff_write on products for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_variants_public_read on product_variants for select using (true);
create policy product_variants_staff_write on product_variants for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_images_public_read on product_images for select using (true);
create policy product_images_staff_write on product_images for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_documents_public_read on product_documents for select using (true);
create policy product_documents_staff_write on product_documents for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_bundle_items_public_read on product_bundle_items for select using (true);
create policy product_bundle_items_staff_write on product_bundle_items for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_compatibility_public_read on product_compatibility for select using (true);
create policy product_compatibility_staff_write on product_compatibility for all using (is_ect_staff()) with check (is_ect_staff());

create policy product_replacements_public_read on product_replacements for select using (true);
create policy product_replacements_staff_write on product_replacements for all using (is_ect_staff()) with check (is_ect_staff());

create policy product_recommendations_public_read on product_recommendations for select using (true);
create policy product_recommendations_staff_write on product_recommendations for all using (is_ect_staff()) with check (is_ect_staff());

-- ---------------------------------------------------------------------------
-- Identity & organizations.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table companies enable row level security;
alter table company_users enable row level security;

create policy profiles_self_read on profiles for select using (id = auth.uid() or is_ect_staff());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_manage on profiles for all using (is_ect_admin()) with check (is_ect_admin());

create policy companies_member_read on companies for select
  using (is_company_admin(id) or is_ect_staff() or exists (
    select 1 from company_users where company_id = companies.id and profile_id = auth.uid()
  ));
create policy companies_staff_write on companies for all using (is_ect_admin()) with check (is_ect_admin());

create policy company_users_member_read on company_users for select
  using (profile_id = auth.uid() or is_company_admin(company_id) or is_ect_staff());
create policy company_users_admin_write on company_users for all
  using (is_company_admin(company_id) or is_ect_admin())
  with check (is_company_admin(company_id) or is_ect_admin());

-- ---------------------------------------------------------------------------
-- Commerce: visible to the owning customer, their company admins, and staff.
-- ---------------------------------------------------------------------------
alter table customer_addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

create policy customer_addresses_owner on customer_addresses for all
  using (customer_id = auth.uid() or is_ect_staff())
  with check (customer_id = auth.uid() or is_ect_staff());

create policy orders_owner_read on orders for select
  using (
    customer_id = auth.uid()
    or (company_id is not null and is_company_admin(company_id))
    or is_ect_staff()
  );
create policy orders_owner_insert on orders for insert
  with check (customer_id = auth.uid() or is_ect_staff());
create policy orders_staff_update on orders for update
  using (is_ect_staff()) with check (is_ect_staff());

create policy order_items_owner_read on order_items for select
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and (orders.customer_id = auth.uid()
           or (orders.company_id is not null and is_company_admin(orders.company_id))
           or is_ect_staff())
  ));
create policy order_items_staff_write on order_items for insert
  with check (is_ect_staff() or exists (
    select 1 from orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()
  ));

create policy payments_owner_read on payments for select
  using (exists (
    select 1 from orders
    where orders.id = payments.order_id
      and (orders.customer_id = auth.uid()
           or (orders.company_id is not null and is_company_admin(orders.company_id))
           or is_ect_staff())
  ));
create policy payments_staff_write on payments for all using (is_ect_staff()) with check (is_ect_staff());

-- ---------------------------------------------------------------------------
-- Yacht, equipment, maintenance: visible to yacht_users members and staff.
-- ---------------------------------------------------------------------------
alter table yachts enable row level security;
alter table yacht_users enable row level security;
alter table equipment enable row level security;
alter table equipment_installations enable row level security;
alter table filters enable row level security;
alter table filter_installations enable row level security;
alter table replacement_schedules enable row level security;
alter table maintenance_records enable row level security;
alter table service_requests enable row level security;
alter table water_analysis enable row level security;
alter table air_quality_devices enable row level security;
alter table sensor_readings enable row level security;

create policy yachts_member_access on yachts for all
  using (owner_id = auth.uid() or is_yacht_member(id) or is_ect_staff())
  with check (owner_id = auth.uid() or is_ect_staff());

create policy yacht_users_member_read on yacht_users for select
  using (profile_id = auth.uid() or is_yacht_member(yacht_id) or is_ect_staff());
create policy yacht_users_owner_write on yacht_users for all
  using (exists (select 1 from yachts where yachts.id = yacht_users.yacht_id and yachts.owner_id = auth.uid()) or is_ect_staff())
  with check (exists (select 1 from yachts where yachts.id = yacht_users.yacht_id and yachts.owner_id = auth.uid()) or is_ect_staff());

create policy equipment_member_access on equipment for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_yacht_member(yacht_id) or is_ect_staff());

create policy equipment_installations_member_access on equipment_installations for all
  using (exists (select 1 from equipment where equipment.id = equipment_installations.equipment_id and is_yacht_member(equipment.yacht_id)) or is_ect_staff())
  with check (is_ect_staff() or exists (select 1 from equipment where equipment.id = equipment_installations.equipment_id and is_yacht_member(equipment.yacht_id)));

create policy filters_member_access on filters for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_yacht_member(yacht_id) or is_ect_staff());

create policy filter_installations_member_access on filter_installations for all
  using (exists (select 1 from filters where filters.id = filter_installations.filter_id and is_yacht_member(filters.yacht_id)) or is_ect_staff())
  with check (is_ect_staff() or exists (select 1 from filters where filters.id = filter_installations.filter_id and is_yacht_member(filters.yacht_id)));

create policy replacement_schedules_member_access on replacement_schedules for select
  using (
    is_ect_staff()
    or exists (select 1 from filters where filters.id = replacement_schedules.filter_id and is_yacht_member(filters.yacht_id))
    or exists (select 1 from equipment where equipment.id = replacement_schedules.equipment_id and is_yacht_member(equipment.yacht_id))
  );
create policy replacement_schedules_staff_write on replacement_schedules for insert with check (is_ect_staff());
create policy replacement_schedules_staff_update on replacement_schedules for update using (is_ect_staff()) with check (is_ect_staff());

create policy maintenance_records_member_access on maintenance_records for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_ect_staff() or is_yacht_member(yacht_id));

create policy service_requests_member_access on service_requests for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_yacht_member(yacht_id) or is_ect_staff());

create policy water_analysis_member_access on water_analysis for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_ect_staff());

create policy air_quality_devices_member_access on air_quality_devices for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_ect_staff());

create policy sensor_readings_member_access on sensor_readings for select
  using (
    is_ect_staff()
    or exists (select 1 from air_quality_devices d where d.id = sensor_readings.device_id and is_yacht_member(d.yacht_id))
  );
create policy sensor_readings_staff_write on sensor_readings for insert with check (is_ect_staff());

-- ---------------------------------------------------------------------------
-- Procurement, logistics, AI: staff-only (admin dashboard, not customer-facing).
-- ---------------------------------------------------------------------------
alter table inventory enable row level security;
alter table inventory_movements enable row level security;
alter table suppliers enable row level security;
alter table supplier_products enable row level security;
alter table rfqs enable row level security;
alter table rfq_suppliers enable row level security;
alter table supplier_quotes enable row level security;
alter table supplier_orders enable row level security;
alter table supplier_order_items enable row level security;
alter table shipments enable row level security;
alter table logistics_quotes enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table ai_recommendations enable row level security;
alter table audit_logs enable row level security;

create policy inventory_staff_only on inventory for all using (is_ect_staff()) with check (is_ect_staff());
create policy inventory_movements_staff_only on inventory_movements for all using (is_ect_staff()) with check (is_ect_staff());
create policy suppliers_staff_only on suppliers for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_products_staff_only on supplier_products for all using (is_ect_staff()) with check (is_ect_staff());
create policy rfqs_staff_only on rfqs for all using (is_ect_staff()) with check (is_ect_staff());
create policy rfq_suppliers_staff_only on rfq_suppliers for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_quotes_staff_only on supplier_quotes for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_orders_staff_only on supplier_orders for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_order_items_staff_only on supplier_order_items for all using (is_ect_staff()) with check (is_ect_staff());

-- Shipments: customers may read their own order's shipment; everything else staff-only.
create policy shipments_owner_read on shipments for select
  using (
    is_ect_staff()
    or exists (select 1 from orders where orders.id = shipments.order_id and orders.customer_id = auth.uid())
  );
create policy shipments_staff_write on shipments for insert with check (is_ect_staff());
create policy shipments_staff_update on shipments for update using (is_ect_staff()) with check (is_ect_staff());

create policy logistics_quotes_staff_only on logistics_quotes for all using (is_ect_staff()) with check (is_ect_staff());

create policy ai_conversations_owner on ai_conversations for all
  using (profile_id = auth.uid() or is_ect_staff())
  with check (profile_id = auth.uid() or is_ect_staff());
create policy ai_messages_owner on ai_messages for all
  using (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and (c.profile_id = auth.uid() or is_ect_staff())))
  with check (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and (c.profile_id = auth.uid() or is_ect_staff())));
create policy ai_recommendations_owner on ai_recommendations for all
  using (profile_id = auth.uid() or is_ect_staff())
  with check (profile_id = auth.uid() or is_ect_staff());

create policy audit_logs_staff_only on audit_logs for all using (is_ect_staff()) with check (is_ect_staff());

