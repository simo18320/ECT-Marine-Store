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
