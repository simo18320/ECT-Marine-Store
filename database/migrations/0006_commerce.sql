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
