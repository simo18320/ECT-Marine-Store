-- seed-dev-sample.sql
-- DEV/QA ONLY. Realistic-looking but entirely fabricated sample products, so Phase 2's
-- catalogue/search/filter/cart/compatibility UI can be verified in a browser before real
-- ECT product and pricing data exists. Do NOT run this against a production project, and
-- do not treat any name/spec/price here as real ECT catalogue data (business-rules.md §10,
-- ai-engine.md AI safety rules — this file is exempt only because it's clearly-labeled
-- development fixture data, not something ever shown to a real customer as fact).
--
-- Safe to re-run: every insert is keyed on a unique slug/sku via ON CONFLICT DO NOTHING,
-- and everything below can be removed with the DELETE block at the end of this file.

insert into brands (id, name, slug, website) values
  (gen_random_uuid(), 'ECT Marine', 'ect-marine', 'https://ectmarine.eu')
on conflict (slug) do nothing;

with b as (select id from brands where slug = 'ect-marine'),
     cat_sediment as (select id from categories where slug = 'sediment-filters'),
     cat_cto as (select id from categories where slug = 'cto'),
     cat_bigblue as (select id from categories where slug = 'housing-big-blue'),
     cat_uv as (select id from categories where slug = 'uv-systems'),
     cat_ro as (select id from categories where slug = 'ro-membranes'),
     cat_hepa as (select id from categories where slug = 'hepa'),
     cat_legionella as (select id from categories where slug = 'legionella-sampling'),
     cat_kits as (select id from categories where slug = 'maintenance-kits')
insert into products (
  sku, name, slug, category_id, brand_id, description, short_description,
  technical_specs, unit, purchase_cost, selling_price, vat_rate, weight_kg,
  replacement_interval_days, certifications, requires_compliance_ack, is_bundle, is_active
)
select * from (values
  ('ECT-SED-10-5M', 'Sediment Filter Cartridge 10" — 5 Micron', 'sediment-filter-10-5-micron',
   (select id from cat_sediment), (select id from b),
   'Melt-blown polypropylene sediment cartridge for 10" standard housings. Removes sand, silt and rust particles down to 5 microns, protecting downstream carbon and RO stages.',
   '10" melt-blown PP sediment cartridge, 5 micron',
   '{"length_in": 10, "micron_rating": 5, "material": "polypropylene", "max_flow_gpm": 5}'::jsonb,
   'pcs', 3.20, 9.90, 22.00, 0.15, 90, '{}'::text[], false, false, true),

  ('ECT-CTO-10-10M', 'CTO Carbon Block Filter 10"', 'cto-carbon-block-10',
   (select id from cat_cto), (select id from b),
   'Coconut-shell activated carbon block, chlorine taste-and-odor (CTO) reduction for 10" standard housings. Recommended as the second stage after sediment filtration.',
   '10" carbon block, chlorine taste & odor reduction',
   '{"length_in": 10, "micron_rating": 10, "material": "coconut carbon block", "max_flow_gpm": 2}'::jsonb,
   'pcs', 5.80, 16.50, 22.00, 0.22, 180, '{}'::text[], false, false, true),

  ('ECT-HSG-BB20', 'Big Blue Filter Housing 20"', 'big-blue-filter-housing-20',
   (select id from cat_bigblue), (select id from b),
   'Reinforced polypropylene Big Blue housing for 20" cartridges, 1" NPT ports, rated to 125 psi. Standard housing for main yacht fresh-water filtration stages.',
   '20" Big Blue housing, 1" NPT, 125 psi',
   '{"cartridge_length_in": 20, "port_size": "1in NPT", "max_pressure_psi": 125}'::jsonb,
   'pcs', 42.00, 89.00, 22.00, 2.80, null, '{}'::text[], false, false, true),

  ('ECT-UV-40GPM', 'UV-C Sterilizer System 40 GPM', 'uv-c-sterilizer-40gpm',
   (select id from cat_uv), (select id from b),
   'In-line UV-C disinfection system for fresh water production, 40 GPM rated flow, 316 stainless chamber, includes UV intensity monitor.',
   'In-line UV-C disinfection, 40 GPM, 316 stainless',
   '{"flow_gpm": 40, "chamber_material": "316 stainless steel", "lamp_life_hours": 9000}'::jsonb,
   'pcs', 890.00, 1590.00, 22.00, 14.50, 365, '{"CE"}'::text[], false, false, true),

  ('ECT-RO-100GPD', 'RO Membrane 100 GPD', 'ro-membrane-100gpd',
   (select id from cat_ro), (select id from b),
   'Thin-film composite reverse osmosis membrane, 100 GPD rated production, standard 2012 housing compatible.',
   'TFC RO membrane, 100 GPD, standard 2012 housing',
   '{"rated_gpd": 100, "membrane_type": "TFC", "housing_size": "2012"}'::jsonb,
   'pcs', 22.00, 54.00, 22.00, 0.35, 730, '{}'::text[], false, false, true),

  ('ECT-HEPA-HVAC-1', 'HEPA Filter Panel — HVAC', 'hepa-filter-panel-hvac',
   (select id from cat_hepa), (select id from b),
   'H13-rated HEPA panel filter for yacht HVAC air handling units, 99.95% particle capture at 0.3 micron.',
   'H13 HEPA panel, 99.95% @ 0.3 micron',
   '{"rating": "H13", "capture_efficiency_pct": 99.95, "test_particle_micron": 0.3}'::jsonb,
   'pcs', 34.00, 79.00, 22.00, 1.10, 180, '{"EN 1822"}'::text[], false, false, true),

  ('ECT-LEG-KIT-1', 'Legionella Sampling Kit', 'legionella-sampling-kit',
   (select id from cat_legionella), (select id from b),
   'Sterile sample bottles, sodium thiosulfate dechlorination tablets, chain-of-custody form and prepaid lab return packaging for Legionella pneumophila testing.',
   'Sterile sampling kit for Legionella lab testing',
   '{"sample_bottles": 4, "lab_turnaround_days": 5}'::jsonb,
   'kit', 18.00, 45.00, 22.00, 0.40, null, '{}'::text[], true, false, true)
) as v(sku, name, slug, category_id, brand_id, description, short_description, technical_specs, unit, purchase_cost, selling_price, vat_rate, weight_kg, replacement_interval_days, certifications, requires_compliance_ack, is_bundle, is_active)
on conflict (sku) do nothing;

-- Maintenance kit bundle, composed of the sediment + CTO filters above.
with cat_kits as (select id from categories where slug = 'maintenance-kits'),
     b as (select id from brands where slug = 'ect-marine')
insert into products (
  sku, name, slug, category_id, brand_id, description, short_description,
  technical_specs, unit, selling_price, vat_rate, is_bundle, is_active
)
values (
  'ECT-KIT-WATER-BASIC', 'ECT Water Basic Kit', 'ect-water-basic-kit',
  (select id from cat_kits), (select id from b),
  'Six-month fresh water filtration maintenance kit: one sediment pre-filter and one CTO carbon block filter, sized for a standard single Big Blue 10"/20" housing pair.',
  '6-month water filtration maintenance bundle',
  '{"included_stages": 2}'::jsonb,
  'kit', 22.90, 22.00, true, true
)
on conflict (sku) do nothing;

insert into product_bundle_items (bundle_product_id, component_product_id, quantity)
select
  (select id from products where sku = 'ECT-KIT-WATER-BASIC'),
  (select id from products where sku = 'ECT-SED-10-5M'),
  1
where not exists (
  select 1 from product_bundle_items
  where bundle_product_id = (select id from products where sku = 'ECT-KIT-WATER-BASIC')
    and component_product_id = (select id from products where sku = 'ECT-SED-10-5M')
);

insert into product_bundle_items (bundle_product_id, component_product_id, quantity)
select
  (select id from products where sku = 'ECT-KIT-WATER-BASIC'),
  (select id from products where sku = 'ECT-CTO-10-10M'),
  1
where not exists (
  select 1 from product_bundle_items
  where bundle_product_id = (select id from products where sku = 'ECT-KIT-WATER-BASIC')
    and component_product_id = (select id from products where sku = 'ECT-CTO-10-10M')
);

-- Inventory for every sample product. Mix of statuses on purpose: everything in_stock
-- except the UV system (low_stock: available 4 <= reorder_point 5) and the Legionella kit
-- (out_of_stock: 0 on hand) — so the storefront's three stock-status states are all exercised.
insert into inventory (product_id, current_stock, reserved_stock, reorder_point, reorder_quantity, warehouse_location)
select p.id, v.stock, v.reserved, v.reorder_point, v.reorder_qty, 'ECT-WH-MAIN'
from products p
join (values
  ('ECT-SED-10-5M', 240, 40, 50, 200),
  ('ECT-CTO-10-10M', 180, 30, 40, 150),
  ('ECT-HSG-BB20', 25, 5, 8, 20),
  ('ECT-UV-40GPM', 6, 2, 5, 5),
  ('ECT-RO-100GPD', 40, 10, 15, 30),
  ('ECT-HEPA-HVAC-1', 60, 15, 20, 40),
  ('ECT-LEG-KIT-1', 0, 0, 20, 20),
  ('ECT-KIT-WATER-BASIC', 50, 10, 15, 30)
) as v(sku, stock, reserved, reorder_point, reorder_qty) on v.sku = p.sku
on conflict (product_id) do nothing;

-- Verified compatibility: both filters fit any "Filter Housing" equipment; the UV system
-- fits "UV System" equipment (equipment_types were seeded in seed.sql).
insert into product_compatibility (product_id, equipment_type_id, compatible_manufacturer, connection_type, source, verified_at)
select p.id, et.id, 'Generic', 'Standard 10in cartridge', 'ect_verified', now()
from products p, equipment_types et
where p.sku in ('ECT-SED-10-5M', 'ECT-CTO-10-10M') and et.name = 'Filter Housing'
  and not exists (
    select 1 from product_compatibility pc where pc.product_id = p.id and pc.equipment_type_id = et.id
  );

insert into product_compatibility (product_id, equipment_type_id, compatible_manufacturer, connection_type, source, verified_at)
select p.id, et.id, 'Generic', '1in NPT in-line', 'ect_verified', now()
from products p, equipment_types et
where p.sku = 'ECT-UV-40GPM' and et.name = 'UV System'
  and not exists (
    select 1 from product_compatibility pc where pc.product_id = p.id and pc.equipment_type_id = et.id
  );

-- Deterministic recommendations: pair the two filter stages, and surface the bundle from
-- either individual filter (business-rules.md §5 "recommended kits").
insert into product_recommendations (product_id, recommended_product_id, reason, rule_source, priority)
select
  (select id from products where sku = 'ECT-SED-10-5M'),
  (select id from products where sku = 'ECT-CTO-10-10M'),
  'Typically installed as the second filtration stage after this sediment filter.',
  'manual', 1
where not exists (
  select 1 from product_recommendations
  where product_id = (select id from products where sku = 'ECT-SED-10-5M')
    and recommended_product_id = (select id from products where sku = 'ECT-CTO-10-10M')
);

insert into product_recommendations (product_id, recommended_product_id, reason, rule_source, priority)
select
  (select id from products where sku = 'ECT-CTO-10-10M'),
  (select id from products where sku = 'ECT-SED-10-5M'),
  'Typically installed as the first filtration stage before this carbon block.',
  'manual', 1
where not exists (
  select 1 from product_recommendations
  where product_id = (select id from products where sku = 'ECT-CTO-10-10M')
    and recommended_product_id = (select id from products where sku = 'ECT-SED-10-5M')
);

insert into product_recommendations (product_id, recommended_product_id, reason, rule_source, priority)
select
  (select id from products where sku = 'ECT-SED-10-5M'),
  (select id from products where sku = 'ECT-KIT-WATER-BASIC'),
  'Save by buying both stages together in the 6-month kit.',
  'manual', 2
where not exists (
  select 1 from product_recommendations
  where product_id = (select id from products where sku = 'ECT-SED-10-5M')
    and recommended_product_id = (select id from products where sku = 'ECT-KIT-WATER-BASIC')
);

-- To remove all dev-sample data:
-- delete from products where sku like 'ECT-%';
-- delete from brands where slug = 'ect-marine';
