-- Online right of withdrawal (consumer orders) and GDPR data-subject requests. Both are
-- created by the signed-in customer for their own records and handled by staff.

create table withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  customer_id uuid references profiles (id) on delete set null,
  message text,
  status text not null default 'new' check (status in ('new', 'acknowledged', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger withdrawal_requests_set_updated_at
  before update on withdrawal_requests for each row execute function set_updated_at();
create index withdrawal_requests_order_id_idx on withdrawal_requests (order_id);
alter table withdrawal_requests enable row level security;
create policy withdrawal_requests_owner_read on withdrawal_requests for select
  using (customer_id = auth.uid() or private.is_ect_staff());
create policy withdrawal_requests_owner_insert on withdrawal_requests for insert
  with check (
    customer_id = auth.uid()
    and exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );
create policy withdrawal_requests_staff_write on withdrawal_requests for update
  using (private.is_ect_staff()) with check (private.is_ect_staff());

create table privacy_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles (id) on delete set null,
  email text not null,
  request_type text not null check (
    request_type in ('access', 'erasure', 'rectification', 'restriction', 'portability', 'objection', 'other')
  ),
  message text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger privacy_requests_set_updated_at
  before update on privacy_requests for each row execute function set_updated_at();
alter table privacy_requests enable row level security;
create policy privacy_requests_owner_read on privacy_requests for select
  using (customer_id = auth.uid() or private.is_ect_staff());
create policy privacy_requests_owner_insert on privacy_requests for insert
  with check (customer_id = auth.uid());
create policy privacy_requests_staff_write on privacy_requests for update
  using (private.is_ect_staff()) with check (private.is_ect_staff());
