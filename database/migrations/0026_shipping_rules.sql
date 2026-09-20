-- Shipping: free in Italy from a goods-total threshold, a flat fee below it, and abroad only by
-- quote. Fee and threshold are editable settings; quote requests come from checkout.
alter table store_settings add column free_shipping_threshold numeric(12, 2) not null default 100;
alter table store_settings add column shipping_fee_italy numeric(12, 2) not null default 12.90;

create table shipping_quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles (id) on delete set null,
  email text not null,
  country text not null,
  address_summary text,
  items jsonb not null,
  message text,
  status text not null default 'new' check (status in ('new', 'quoted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shipping_quote_requests_set_updated_at
  before update on shipping_quote_requests for each row execute function set_updated_at();
alter table shipping_quote_requests enable row level security;
create policy shipping_quote_requests_owner_read on shipping_quote_requests for select
  using (customer_id = auth.uid() or private.is_ect_staff());
create policy shipping_quote_requests_owner_insert on shipping_quote_requests for insert
  with check (customer_id = auth.uid());
create policy shipping_quote_requests_staff_update on shipping_quote_requests for update
  using (private.is_ect_staff()) with check (private.is_ect_staff());
