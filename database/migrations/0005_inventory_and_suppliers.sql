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
