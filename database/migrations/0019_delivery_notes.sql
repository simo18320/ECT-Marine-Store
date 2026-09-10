-- DDT (Documento Di Trasporto) — the Italian transport document required whenever goods move
-- between parties (D.P.R. 472/1996), generated per order once it's paid and ready to ship.
-- Progressive numbering resets each calendar year (the common convention: "12/2026") rather
-- than running forever, and the (year, number) unique constraint is the actual guard against a
-- double-issued number under concurrent generation — the app computes the next number itself,
-- but only the constraint makes a genuine race fail loudly instead of silently colliding.
create table delivery_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete restrict,
  number int not null,
  year int not null,
  issued_at timestamptz not null default now(),
  causale text not null default 'Vendita',
  carrier_name text,
  package_count int not null default 1,
  total_weight_kg numeric(10, 3),
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (year, number)
);

create index delivery_notes_order_id_idx on delivery_notes (order_id);

alter table delivery_notes enable row level security;

create policy delivery_notes_staff_only on delivery_notes for all using (private.is_ect_staff()) with check (private.is_ect_staff());
