-- 0009_rls_policies.sql
-- Enables RLS on every tenant-scoped table and defines baseline policies (database.md §3 "RLS").

create or replace function is_ect_staff()
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

create or replace function is_ect_admin()
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

create or replace function is_company_admin(target_company_id uuid)
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

create or replace function is_yacht_member(target_yacht_id uuid)
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
create policy categories_staff_write on categories for all using (is_ect_admin()) with check (is_ect_admin());

create policy brands_public_read on brands for select using (true);
create policy brands_staff_write on brands for all using (is_ect_admin()) with check (is_ect_admin());

create policy products_public_read on products for select using (is_active or is_ect_staff());
create policy products_staff_write on products for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_variants_public_read on product_variants for select using (true);
create policy product_variants_staff_write on product_variants for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_images_public_read on product_images for select using (true);
create policy product_images_staff_write on product_images for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_documents_public_read on product_documents for select using (true);
create policy product_documents_staff_write on product_documents for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_bundle_items_public_read on product_bundle_items for select using (true);
create policy product_bundle_items_staff_write on product_bundle_items for all using (is_ect_admin()) with check (is_ect_admin());

create policy product_compatibility_public_read on product_compatibility for select using (true);
create policy product_compatibility_staff_write on product_compatibility for all using (is_ect_staff()) with check (is_ect_staff());

create policy product_replacements_public_read on product_replacements for select using (true);
create policy product_replacements_staff_write on product_replacements for all using (is_ect_staff()) with check (is_ect_staff());

create policy product_recommendations_public_read on product_recommendations for select using (true);
create policy product_recommendations_staff_write on product_recommendations for all using (is_ect_staff()) with check (is_ect_staff());

-- ---------------------------------------------------------------------------
-- Identity & organizations.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table companies enable row level security;
alter table company_users enable row level security;

create policy profiles_self_read on profiles for select using (id = auth.uid() or is_ect_staff());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_manage on profiles for all using (is_ect_admin()) with check (is_ect_admin());

create policy companies_member_read on companies for select
  using (is_company_admin(id) or is_ect_staff() or exists (
    select 1 from company_users where company_id = companies.id and profile_id = auth.uid()
  ));
create policy companies_staff_write on companies for all using (is_ect_admin()) with check (is_ect_admin());

create policy company_users_member_read on company_users for select
  using (profile_id = auth.uid() or is_company_admin(company_id) or is_ect_staff());
create policy company_users_admin_write on company_users for all
  using (is_company_admin(company_id) or is_ect_admin())
  with check (is_company_admin(company_id) or is_ect_admin());

-- ---------------------------------------------------------------------------
-- Commerce: visible to the owning customer, their company admins, and staff.
-- ---------------------------------------------------------------------------
alter table customer_addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;

create policy customer_addresses_owner on customer_addresses for all
  using (customer_id = auth.uid() or is_ect_staff())
  with check (customer_id = auth.uid() or is_ect_staff());

create policy orders_owner_read on orders for select
  using (
    customer_id = auth.uid()
    or (company_id is not null and is_company_admin(company_id))
    or is_ect_staff()
  );
create policy orders_owner_insert on orders for insert
  with check (customer_id = auth.uid() or is_ect_staff());
create policy orders_staff_update on orders for update
  using (is_ect_staff()) with check (is_ect_staff());

create policy order_items_owner_read on order_items for select
  using (exists (
    select 1 from orders
    where orders.id = order_items.order_id
      and (orders.customer_id = auth.uid()
           or (orders.company_id is not null and is_company_admin(orders.company_id))
           or is_ect_staff())
  ));
create policy order_items_staff_write on order_items for insert
  with check (is_ect_staff() or exists (
    select 1 from orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()
  ));

create policy payments_owner_read on payments for select
  using (exists (
    select 1 from orders
    where orders.id = payments.order_id
      and (orders.customer_id = auth.uid()
           or (orders.company_id is not null and is_company_admin(orders.company_id))
           or is_ect_staff())
  ));
create policy payments_staff_write on payments for all using (is_ect_staff()) with check (is_ect_staff());

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
  using (owner_id = auth.uid() or is_yacht_member(id) or is_ect_staff())
  with check (owner_id = auth.uid() or is_ect_staff());

create policy yacht_users_member_read on yacht_users for select
  using (profile_id = auth.uid() or is_yacht_member(yacht_id) or is_ect_staff());
create policy yacht_users_owner_write on yacht_users for all
  using (exists (select 1 from yachts where yachts.id = yacht_users.yacht_id and yachts.owner_id = auth.uid()) or is_ect_staff())
  with check (exists (select 1 from yachts where yachts.id = yacht_users.yacht_id and yachts.owner_id = auth.uid()) or is_ect_staff());

create policy equipment_member_access on equipment for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_yacht_member(yacht_id) or is_ect_staff());

create policy equipment_installations_member_access on equipment_installations for all
  using (exists (select 1 from equipment where equipment.id = equipment_installations.equipment_id and is_yacht_member(equipment.yacht_id)) or is_ect_staff())
  with check (is_ect_staff() or exists (select 1 from equipment where equipment.id = equipment_installations.equipment_id and is_yacht_member(equipment.yacht_id)));

create policy filters_member_access on filters for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_yacht_member(yacht_id) or is_ect_staff());

create policy filter_installations_member_access on filter_installations for all
  using (exists (select 1 from filters where filters.id = filter_installations.filter_id and is_yacht_member(filters.yacht_id)) or is_ect_staff())
  with check (is_ect_staff() or exists (select 1 from filters where filters.id = filter_installations.filter_id and is_yacht_member(filters.yacht_id)));

create policy replacement_schedules_member_access on replacement_schedules for select
  using (
    is_ect_staff()
    or exists (select 1 from filters where filters.id = replacement_schedules.filter_id and is_yacht_member(filters.yacht_id))
    or exists (select 1 from equipment where equipment.id = replacement_schedules.equipment_id and is_yacht_member(equipment.yacht_id))
  );
create policy replacement_schedules_staff_write on replacement_schedules for insert with check (is_ect_staff());
create policy replacement_schedules_staff_update on replacement_schedules for update using (is_ect_staff()) with check (is_ect_staff());

create policy maintenance_records_member_access on maintenance_records for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_ect_staff() or is_yacht_member(yacht_id));

create policy service_requests_member_access on service_requests for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_yacht_member(yacht_id) or is_ect_staff());

create policy water_analysis_member_access on water_analysis for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_ect_staff());

create policy air_quality_devices_member_access on air_quality_devices for all
  using (is_yacht_member(yacht_id) or is_ect_staff())
  with check (is_ect_staff());

create policy sensor_readings_member_access on sensor_readings for select
  using (
    is_ect_staff()
    or exists (select 1 from air_quality_devices d where d.id = sensor_readings.device_id and is_yacht_member(d.yacht_id))
  );
create policy sensor_readings_staff_write on sensor_readings for insert with check (is_ect_staff());

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

create policy inventory_staff_only on inventory for all using (is_ect_staff()) with check (is_ect_staff());
create policy inventory_movements_staff_only on inventory_movements for all using (is_ect_staff()) with check (is_ect_staff());
create policy suppliers_staff_only on suppliers for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_products_staff_only on supplier_products for all using (is_ect_staff()) with check (is_ect_staff());
create policy rfqs_staff_only on rfqs for all using (is_ect_staff()) with check (is_ect_staff());
create policy rfq_suppliers_staff_only on rfq_suppliers for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_quotes_staff_only on supplier_quotes for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_orders_staff_only on supplier_orders for all using (is_ect_staff()) with check (is_ect_staff());
create policy supplier_order_items_staff_only on supplier_order_items for all using (is_ect_staff()) with check (is_ect_staff());

-- Shipments: customers may read their own order's shipment; everything else staff-only.
create policy shipments_owner_read on shipments for select
  using (
    is_ect_staff()
    or exists (select 1 from orders where orders.id = shipments.order_id and orders.customer_id = auth.uid())
  );
create policy shipments_staff_write on shipments for insert with check (is_ect_staff());
create policy shipments_staff_update on shipments for update using (is_ect_staff()) with check (is_ect_staff());

create policy logistics_quotes_staff_only on logistics_quotes for all using (is_ect_staff()) with check (is_ect_staff());

create policy ai_conversations_owner on ai_conversations for all
  using (profile_id = auth.uid() or is_ect_staff())
  with check (profile_id = auth.uid() or is_ect_staff());
create policy ai_messages_owner on ai_messages for all
  using (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and (c.profile_id = auth.uid() or is_ect_staff())))
  with check (exists (select 1 from ai_conversations c where c.id = ai_messages.conversation_id and (c.profile_id = auth.uid() or is_ect_staff())));
create policy ai_recommendations_owner on ai_recommendations for all
  using (profile_id = auth.uid() or is_ect_staff())
  with check (profile_id = auth.uid() or is_ect_staff());

create policy audit_logs_staff_only on audit_logs for all using (is_ect_staff()) with check (is_ect_staff());
