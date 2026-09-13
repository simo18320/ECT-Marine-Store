-- Sampling Kits category support + the first slice of the future ECT digital ecosystem
-- (ORDER KIT -> RECEIVE KIT -> SCAN QR -> ... -> REPORT). Reuses what already exists rather
-- than introducing parallel tables: `yachts` is the vessel, `equipment` is the system/asset a
-- sample relates to, and `water_analysis` is already exactly "a sample + its lab result" for
-- water — this just grows it to carry the registration-form fields and adds the two small
-- satellite tables (photos, an append-only event/custody log) and a `laboratories` reference
-- table that don't already exist anywhere in the schema.

-- Per-category SEO overrides — generic, not sampling-kits-specific, so any category can use it.
alter table categories add column seo_title text;
alter table categories add column meta_description text;

create table laboratories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);
alter table laboratories enable row level security;
create policy laboratories_staff_only on laboratories for all
  using (private.is_ect_staff()) with check (private.is_ect_staff());

alter table water_analysis add column product_id uuid references products (id) on delete set null;
alter table water_analysis add column equipment_id uuid references equipment (id) on delete set null;
alter table water_analysis add column laboratory_id uuid references laboratories (id) on delete set null;
alter table water_analysis add column vessel_imo text;
alter table water_analysis add column collected_by text;
alter table water_analysis add column reason_for_sampling text;
alter table water_analysis add column water_temperature_c numeric;
alter table water_analysis add column free_chlorine_mg_l numeric;
alter table water_analysis add column ph numeric;
alter table water_analysis add column comments text;
alter table water_analysis add column status text not null default 'registered';

-- Registration used to be staff-only (a yacht member could only ever read their own records);
-- the QR-driven self-registration flow needs a yacht member to be able to log their own sample.
drop policy water_analysis_member_access on water_analysis;
create policy water_analysis_member_access on water_analysis for all
  using (private.is_yacht_member(yacht_id) or private.is_ect_staff())
  with check (private.is_yacht_member(yacht_id) or private.is_ect_staff());

create table water_analysis_photos (
  id uuid primary key default gen_random_uuid(),
  water_analysis_id uuid not null references water_analysis (id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);
alter table water_analysis_photos enable row level security;
create policy water_analysis_photos_member_access on water_analysis_photos for all
  using (
    exists (
      select 1 from water_analysis wa
      where wa.id = water_analysis_id and (private.is_yacht_member(wa.yacht_id) or private.is_ect_staff())
    )
  )
  with check (
    exists (
      select 1 from water_analysis wa
      where wa.id = water_analysis_id and (private.is_yacht_member(wa.yacht_id) or private.is_ect_staff())
    )
  );

-- Append-only log standing in for chain-of-custody: "sample_registered" today, with
-- "shipped_to_lab" / "results_uploaded" etc. to follow once the lab side of the workflow exists.
create table water_analysis_events (
  id uuid primary key default gen_random_uuid(),
  water_analysis_id uuid not null references water_analysis (id) on delete cascade,
  event_type text not null,
  actor text,
  occurred_at timestamptz not null default now(),
  notes text
);
alter table water_analysis_events enable row level security;
create policy water_analysis_events_member_access on water_analysis_events for all
  using (
    exists (
      select 1 from water_analysis wa
      where wa.id = water_analysis_id and (private.is_yacht_member(wa.yacht_id) or private.is_ect_staff())
    )
  )
  with check (
    exists (
      select 1 from water_analysis wa
      where wa.id = water_analysis_id and (private.is_yacht_member(wa.yacht_id) or private.is_ect_staff())
    )
  );
