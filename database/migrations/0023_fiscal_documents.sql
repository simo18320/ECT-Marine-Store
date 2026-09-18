-- Italian fiscal data on the billing address, and a satellite table tracking what Fatture in
-- Cloud actually issued for each order (invoice vs receipt — business-rules: an invoice is only
-- issued when the fiscal data required to route it is present; otherwise a plain receipt).

alter table customer_addresses add column is_business boolean not null default false;
alter table customer_addresses add column tax_code text; -- codice fiscale
alter table customer_addresses add column vat_number text; -- partita IVA, business only
alter table customer_addresses add column pec_email text; -- certified email, SDI delivery route
alter table customer_addresses add column sdi_code text; -- codice destinatario, SDI delivery route

create table order_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  document_type text not null check (document_type in ('invoice', 'receipt')),
  provider text not null default 'fatture_in_cloud',
  external_id text,
  status text not null default 'pending' check (status in ('pending', 'issued', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index order_invoices_order_id_idx on order_invoices (order_id);

alter table order_invoices enable row level security;

create policy order_invoices_owner_read on order_invoices for select
  using (
    private.is_ect_staff()
    or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

create policy order_invoices_staff_write on order_invoices for all
  using (private.is_ect_staff()) with check (private.is_ect_staff());
