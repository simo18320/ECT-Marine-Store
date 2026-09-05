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
