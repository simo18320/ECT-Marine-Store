-- Site-wide launch settings, currently just the "restock mode" toggle: when a product
-- shows out_of_stock, the storefront can show a friendlier "coming soon"-style label
-- instead of the literal "Out of stock" while the catalogue is still being stocked.
-- Singleton row (id is always true) rather than a key/value table, since there's only
-- ever one of these and a fixed-shape row is simpler to read and write than rows to filter.
create table if not exists public.store_settings (
  id boolean primary key default true,
  restock_mode boolean not null default false,
  restock_label text not null default 'Coming soon',
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton check (id)
);

insert into public.store_settings (id) values (true) on conflict (id) do nothing;

alter table public.store_settings enable row level security;

create policy store_settings_public_read on public.store_settings for select using (true);
create policy store_settings_admin_write on public.store_settings for update using (private.is_ect_admin()) with check (private.is_ect_admin());
