-- 0010_security_hardening.sql
-- Fixes from the Supabase security advisor after 0001-0009 were applied:
--  1) equipment_types was missing RLS entirely (ERROR).
--  2) set_updated_at / apply_inventory_movement had a mutable search_path (WARN).
--  3) handle_new_user was directly RPC-callable by anon/authenticated (WARN) —
--     it's a trigger-only function, never meant to be called directly.
--  4) The four RLS helper functions (is_ect_staff, is_ect_admin, is_company_admin,
--     is_yacht_member) were directly RPC-callable via PostgREST (WARN). Moved to a
--     `private` schema, which PostgREST does not expose as RPC endpoints, while
--     `authenticated`/`anon` keep EXECUTE so RLS policy evaluation still works.
--
-- Not fixed here: `citext` living in the public schema (WARN). Moving an
-- already-in-use extension requires recreating the profiles.email column's type
-- dependency; low actual risk, deferred rather than churned this early — see
-- docs/security.md.

create schema if not exists private;
grant usage on schema private to authenticated, anon;

-- Recreate the four RLS helper functions in `private`, pinned search_path.
create or replace function private.is_ect_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('ect_operator', 'ect_admin', 'super_admin')
  );
$$;

create or replace function private.is_ect_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('ect_admin', 'super_admin')
  );
$$;

create or replace function private.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from company_users
    where company_id = target_company_id
      and profile_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function private.is_yacht_member(target_yacht_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from yacht_users
    where yacht_id = target_yacht_id
      and profile_id = auth.uid()
  );
$$;

grant execute on function private.is_ect_staff() to authenticated, anon;
grant execute on function private.is_ect_admin() to authenticated, anon;
grant execute on function private.is_company_admin(uuid) to authenticated, anon;
grant execute on function private.is_yacht_member(uuid) to authenticated, anon;

-- Drop every policy that references the old public.* helper functions, then the
-- functions themselves, then recreate all policies against private.* below.
drop policy if exists categories_public_read on categories;
drop policy if exists categories_staff_write on categories;
drop policy if exists brands_public_read on brands;
drop policy if exists brands_staff_write on brands;
drop policy if exists products_public_read on products;
drop policy if exists products_staff_write on products;
drop policy if exists product_variants_public_read on product_variants;
drop policy if exists product_variants_staff_write on product_variants;
drop policy if exists product_images_public_read on product_images;
drop policy if exists product_images_staff_write on product_images;
drop policy if exists product_documents_public_read on product_documents;
drop policy if exists product_documents_staff_write on product_documents;
drop policy if exists product_bundle_items_public_read on product_bundle_items;
drop policy if exists product_bundle_items_staff_write on product_bundle_items;
drop policy if exists product_compatibility_public_read on product_compatibility;
drop policy if exists product_compatibility_staff_write on product_compatibility;
drop policy if exists product_replacements_public_read on product_replacements;
drop policy if exists product_replacements_staff_write on product_replacements;
drop policy if exists product_recommendations_public_read on product_recommendations;
drop policy if exists product_recommendations_staff_write on product_recommendations;
drop policy if exists profiles_self_read on profiles;
drop policy if exists profiles_self_update on profiles;
drop policy if exists profiles_staff_manage on profiles;
drop policy if exists companies_member_read on companies;
drop policy if exists companies_staff_write on companies;
drop policy if exists company_users_member_read on company_users;
drop policy if exists company_users_admin_write on company_users;
drop policy if exists customer_addresses_owner on customer_addresses;
drop policy if exists orders_owner_read on orders;
drop policy if exists orders_owner_insert on orders;
drop policy if exists orders_staff_update on orders;
drop policy if exists order_items_owner_read on order_items;
drop policy if exists order_items_staff_write on order_items;
drop policy if exists payments_owner_read on payments;
drop policy if exists payments_staff_write on payments;
drop policy if exists yachts_member_access on yachts;
drop policy if exists yacht_users_member_read on yacht_users;
drop policy if exists yacht_users_owner_write on yacht_users;
drop policy if exists equipment_member_access on equipment;
drop policy if exists equipment_installations_member_access on equipment_installations;
drop policy if exists filters_member_access on filters;
drop policy if exists filter_installations_member_access on filter_installations;
drop policy if exists replacement_schedules_member_access on replacement_schedules;
drop policy if exists replacement_schedules_staff_write on replacement_schedules;
drop policy if exists replacement_schedules_staff_update on replacement_schedules;
drop policy if exists maintenance_records_member_access on maintenance_records;
drop policy if exists service_requests_member_access on service_requests;
drop policy if exists water_analysis_member_access on water_analysis;
drop policy if exists air_quality_devices_member_access on air_quality_devices;
drop policy if exists sensor_readings_member_access on sensor_readings;
drop policy if exists sensor_readings_staff_write on sensor_readings;
drop policy if exists inventory_staff_only on inventory;
drop policy if exists inventory_movements_staff_only on inventory_movements;
drop policy if exists suppliers_staff_only on suppliers;
drop policy if exists supplier_products_staff_only on supplier_products;
drop policy if exists rfqs_staff_only on rfqs;
drop policy if exists rfq_suppliers_staff_only on rfq_suppliers;
drop policy if exists supplier_quotes_staff_only on supplier_quotes;
drop policy if exists supplier_orders_staff_only on supplier_orders;
drop policy if exists supplier_order_items_staff_only on supplier_order_items;
drop policy if exists shipments_owner_read on shipments;
drop policy if exists shipments_staff_write on shipments;
drop policy if exists shipments_staff_update on shipments;
drop policy if exists logistics_quotes_staff_only on logistics_quotes;
drop policy if exists ai_conversations_owner on ai_conversations;
drop policy if exists ai_messages_owner on ai_messages;
drop policy if exists ai_recommendations_owner on ai_recommendations;
drop policy if exists audit_logs_staff_only on audit_logs;

drop function if exists public.is_ect_staff();
drop function if exists public.is_ect_admin();
drop function if exists public.is_company_admin(uuid);
drop function if exists public.is_yacht_member(uuid);

-- ---------------------------------------------------------------------------
-- Catalogue: public read, staff write.
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table product_documents enable row level security;
alter table product_bundle_items enable row level security;
alter table product_compatibility enable row level security;
alter table product_replacements enable row level security;
alter table product_recommendations enable row level security;

create policy categories_public_read on categories for select using (true);
create policy categories_staff_write on categories for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy brands_public_read on brands for select using (true);
create policy brands_staff_write on brands for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy products_public_read on products for select using (is_active or private.is_ect_staff());
create policy products_staff_write on products for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy product_variants_public_read on product_variants for select using (true);
create policy product_variants_staff_write on product_variants for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy product_images_public_read on product_images for select using (true);
create policy product_images_staff_write on product_images for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy product_documents_public_read on product_documents for select using (true);
create policy product_documents_staff_write on product_documents for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy product_bundle_items_public_read on product_bundle_items for select using (true);
create policy product_bundle_items_staff_write on product_bundle_items for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy product_compatibility_public_read on product_compatibility for select using (true);
create policy product_compatibility_staff_write on product_compatibility for all using (private.is_ect_staff()) with check (private.is_ect_staff());

create policy product_replacements_public_read on product_replacements for select using (true);
create policy product_replacements_staff_write on product_replacements for all using (private.is_ect_staff()) with check (private.is_ect_staff());

create policy product_recommendations_public_read on product_recommendations for select using (true);
create policy product_recommendations_staff_write on product_recommendations for all using (private.is_ect_staff()) with check (private.is_ect_staff());

-- ---------------------------------------------------------------------------
-- Identity & organizations.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table companies enable row level security;
alter table company_users enable row level security;

create policy profiles_self_read on profiles for select using (id = auth.uid() or private.is_ect_staff());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_manage on profiles for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy companies_member_read on companies for select
  using (private.is_company_admin(id) or private.is_ect_staff() or exists (
    select 1 from company_users where company_id = companies.id and profile_id = auth.uid()
  ));
create policy companies_staff_write on companies for all using (private.is_ect_admin()) with check (private.is_ect_admin());

create policy company_users_member_read on company_users for select
  using (profile_id = auth.uid() or private.is_company_admin(company_id) or private.is_ect_staff());
create policy company_users_admin_write on company_users for all
  using (private.is_company_admin(company_id) or private.is_ect_admin())
  with check (private.is_company_admin(company_id) or private.is_ect_admin());

-- ---------------------------------------------------------------------------
-- Commerce: visible to the owning customer, their company admins, and staff.
-- ---------------------------------------------------------------------------
alter table customer_addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

create policy customer_addresses_owner on customer_addresses for all
  using (customer_id = auth.uid() or private.is_ect_staff())
  with check (customer_id = auth.uid() or private.is_ect_staff());

create policy orders_owner_read on orders for select
  using (
    customer_id = auth.uid()
    or (company_id is not null and private.is_company_admin(company_id))
    or private.is_ect_staff()
  );
create policy orders_owner_insert on orders for insert
  with check (customer_id = auth.uid() or private.is_ect_staff());
create policy orders_staff_update on orders for update
  using (private.is_ect_staff()) with check (private.is_ect_staff());

create policy order_items_owner_read on order_items for select
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and (orders.customer_id = auth.uid()
           or (orders.company_id is not null and private.is_company_admin(orders.company_id))
           or private.is_ect_staff())
  ));
create policy order_items_staff_write on order_items for insert
  with check (private.is_ect_staff() or exists (
    select 1 from orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()
  ));

create policy payments_owner_read on payments for select
  using (exists (
    select 1 from orders
    where orders.id = payments.order_id
      and (orders.customer_id = auth.uid()
           or (orders.company_id is not null and private.is_company_admin(orders.company_id))
           or private.is_ect_staff())
  ));
create policy payments_staff_write on payments for all using (private.is_ect_staff()) with check (private.is_ect_staff());

-- ---------------------------------------------------------------------------
-- Yacht, equipment, maintenance: visible to yacht_users members and staff.
-- ---------------------------------------------------------------------------
alter table yachts enable row level security;
alter table yacht_users enable row level security;
alter table equipment enable row level security;
alter table equipment_installations enable row level security;
alter table filters enable row level security;
alter table filter_installations enable row level security;
alter table replacement_schedules enable row level security;
alter table maintenance_records enable row level security;
alter table service_requests enable row level security;
alter table water_analysis enable row level security;
alter table air_quality_devices enable row level security;
alter table sensor_readings enable row level security;

create policy yachts_member_access on yachts for all
  using (owner_id = auth.uid() or private.is_yacht_member(id) or private.is_ect_staff())
  with check (owner_id = auth.uid() or private.is_ect_staff());

create policy yacht_users_member_read on yacht_users for select
  using (profile_id = auth.uid() or private.is_yacht_member(yacht_id) or private.is_ect_staff());
create policy yacht_users_owner_write on yacht_users for all
  using (exists (select 1 from yachts where yachts.id = yacht_users.yacht_id and yachts.owner_id = auth.uid()) or private.is_ect_staff())
  with check (exists (select 1 from yachts where yachts.id = yacht_users.yacht_id and yachts.owner_id = auth.uid()) or private.is_ect_staff());

create policy equipment_member_access on equipment for all
  using (private.is_yacht_member(yacht_id) or private.is_ect_staff())
  with check (private.is_yacht_member(yacht_id) or private.is_ect_staff());

create policy equipment_installations_member_access on equipment_installations for all
  using (exists (select 1 from equipment where equipment.id = equipment_installations.equipment_id and private.is_yacht_member(equipment.yacht_id)) or private.is_ect_staff())
  with check (private.is_ect_staff() or exists (select 1 from equipment where equipment.id = equipment_installations.equipment_id and private.is_yacht_member(equipment.yacht_id)));

create policy filters_member_access on filters for all
  using (private.is_yacht_member(yacht_id) or private.is_ect_staff())
  with check (private.is_yacht_member(yacht_id) or private.is_ect_staff());

create policy filter_installations_member_access on filter_installations for all
  using (exists (select 1 from filters where filters.id = filter_installations.filter_id and private.is_yacht_member(filters.yacht_id)) or private.is_ect_staff())
  with check (private.is_ect_staff() or exists (select 1 from filters where filters.id = filter_installations.filter_id and private.is_yacht_member(filters.yacht_id)));

create policy replacement_schedules_member_access on replacement_schedules for select
  using (
    private.is_ect_staff()
    or exists (select 1 from filters where filters.id = replacement_schedules.filter_id and private.is_yacht_member(filters.yacht_id))
    or exists (select 1 from equipment where equipment.id = replacement_schedules.equipment_id and private.is_yacht_member(equipment.yacht_id))
  );
create policy replacement_schedules_staff_write on replacement_schedules for insert with check (private.is_ect_staff());
create policy replacement_schedules_staff_update on replacement_schedules for update using (private.is_ect_staff()) with check (private.is_ect_staff());

create policy maintenance_records_member_access on maintenance_records for all
  using (private.is_yacht_member(yacht_id) or private.is_ect_staff())
  with check (private.is_ect_staff() or private.is_yacht_member(yacht_id));

create policy service_requests_member_access on service_requests for all
  using (private.is_yacht_member(yacht_id) or private.is_ect_staff())
  with check (private.is_yacht_member(yacht_id) or private.is_ect_staff());

create policy water_analysis_member_access on water_analysis for all
  using (private.is_yacht_member(yacht_id) or private.is_ect_staff())
  with check (private.is_ect_staff());

create policy air_quality_devices_member_access on air_quality_devices for all
  using (private.is_yacht_member(yacht_id) or private.is_ect_staff())
  with check (private.is_ect_staff());

create policy sensor_readings_member_access on sensor_readings for select
  using (
    private.is_ect_staff()
    or exists (select 1 from air_quality_devices d where d.id = sensor_readings.device_id and private.is_yacht_member(d.yacht_id))
  );
create policy sensor_readings_staff_write on sensor_readings for insert with check (private.is_ect_staff());

-- ---------------------------------------------------------------------------
-- Procurement, logistics, AI: staff-only (admin dashboard, not customer-facing).
-- ---------------------------------------------------------------------------
alter table inventory enable row level security;
alter table inventory_movements enable row level security;
alter table suppliers enable row level security;
alter table supplier_products enable row level security;
alter table rfqs enable row level security;
alter table rfq_suppliers enable row level security;
alter table supplier_quotes enable row level security;
alter table supplier_orders enable row level security;
alter table supplier_order_items enable row level security;
alter table shipments enable row level security;
alter table logistics_quotes enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table ai_recommendations enable row level security;
alter table audit_logs enable row level security;

create policy inventory_staff_only on inventory for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy inventory_movements_staff_only on inventory_movements for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy suppliers_staff_only on suppliers for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy supplier_products_staff_only on supplier_products for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy rfqs_staff_only on rfqs for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy rfq_suppliers_staff_only on rfq_suppliers for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy supplier_quotes_staff_only on supplier_quotes for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy supplier_orders_staff_only on supplier_orders for all using (private.is_ect_staff()) with check (private.is_ect_staff());
create policy supplier_order_items_staff_only on supplier_order_items for all using (private.is_ect_staff()) with check (private.is_ect_staff());

-- Shipments: customers may read their own order's shipment; everything else staff-only.
create policy shipments_owner_read on shipments for select
  using (
    private.is_ect_staff()
    or exists (select 1 from orders where orders.id = shipments.order_id and orders.customer_id = auth.uid())
  );
create policy shipments_staff_write on shipments for insert with check (private.is_ect_staff());
create policy shipments_staff_update on shipments for update using (private.is_ect_staff()) with check (private.is_ect_staff());

create policy logistics_quotes_staff_only on logistics_quotes for all using (private.is_ect_staff()) with check (private.is_ect_staff());

create policy ai_conversations_owner on ai_conversations for all
  using (profile_id = auth.uid() or private.is_ect_staff())
  with check (profile_id = auth.uid() or private.is_ect_staff());
create policy ai_messages_owner on ai_messages for all
  using (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and (c.profile_id = auth.uid() or private.is_ect_staff())))
  with check (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and (c.profile_id = auth.uid() or private.is_ect_staff())));
create policy ai_recommendations_owner on ai_recommendations for all
  using (profile_id = auth.uid() or private.is_ect_staff())
  with check (profile_id = auth.uid() or private.is_ect_staff());

create policy audit_logs_staff_only on audit_logs for all using (private.is_ect_staff()) with check (private.is_ect_staff());

-- Pin search_path on the two remaining SECURITY-relevant functions that lacked it.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function apply_inventory_movement()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  delta int;
begin
  delta := case new.movement_type
    when 'purchase' then new.quantity
    when 'return' then new.quantity
    when 'sale' then -new.quantity
    when 'damage' then -new.quantity
    when 'transfer' then new.quantity
    when 'adjustment' then new.quantity
  end;

  insert into inventory (product_id, current_stock)
  values (new.product_id, delta)
  on conflict (product_id)
  do update set current_stock = inventory.current_stock + excluded.current_stock,
                updated_at = now();

  return new;
end;
$$;

-- handle_new_user is trigger-only (fired by auth.users insert) — never meant to be
-- called directly via PostgREST RPC.
revoke execute on function handle_new_user() from public, anon, authenticated;

-- equipment_types was missing RLS entirely (ERROR) — same public-read/staff-write
-- shape as the other controlled-vocabulary tables (categories, brands).
alter table equipment_types enable row level security;
create policy equipment_types_public_read on equipment_types for select using (true);
create policy equipment_types_staff_write on equipment_types for all using (private.is_ect_admin()) with check (private.is_ect_admin());
