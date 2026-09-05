-- 0001_extensions_and_enums.sql
-- Extensions, enum types, and the shared updated_at trigger used across the schema.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type user_role as enum (
  'customer', 'b2b_user', 'b2b_admin', 'ect_operator', 'ect_admin', 'super_admin'
);

create type account_type as enum (
  'individual', 'business', 'shipyard', 'management_company', 'service_company'
);

create type order_status as enum (
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

create type payment_status as enum (
  'pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'
);

create type shipment_status as enum (
  'ordered', 'processing', 'ready_to_ship', 'shipped', 'in_transit',
  'out_for_delivery', 'delivered', 'delayed', 'exception'
);

create type supplier_status as enum (
  'discovered', 'under_review', 'qualified', 'approved', 'preferred', 'blocked'
);

create type rfq_status as enum (
  'draft', 'sent', 'quoted', 'awarded', 'cancelled'
);

create type inventory_movement_type as enum (
  'purchase', 'sale', 'return', 'adjustment', 'damage', 'transfer'
);

create type replacement_status as enum (
  'ok', 'due_soon', 'due', 'overdue', 'unknown'
);

create type service_request_status as enum (
  'new', 'scheduled', 'in_progress', 'completed', 'cancelled'
);

-- Shared updated_at maintenance, used via `create trigger ... execute function set_updated_at()`
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
