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
