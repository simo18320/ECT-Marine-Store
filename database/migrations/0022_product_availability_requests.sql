-- "Request this product" — a lead-capture form shown on the product page when a product is
-- out of stock, so a customer gets somewhere to go instead of a dead Add to Cart button.
-- Deliberately open to anonymous visitors (no yacht/account required, unlike service_requests)
-- since most people landing on an out-of-stock page aren't logged in.

create table product_availability_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  customer_id uuid references profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  quantity integer not null default 1,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_availability_requests_set_updated_at
  before update on product_availability_requests
  for each row execute function set_updated_at();

create index product_availability_requests_product_id_idx on product_availability_requests (product_id);

alter table product_availability_requests enable row level security;

create policy product_availability_requests_public_insert on product_availability_requests
  for insert to anon, authenticated
  with check (true);

create policy product_availability_requests_staff_access on product_availability_requests
  for all using (private.is_ect_staff()) with check (private.is_ect_staff());
