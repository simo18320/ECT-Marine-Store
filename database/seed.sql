-- seed.sql
-- MVP structural seed data: category tree (§8-§11 of the master spec) and equipment-type
-- vocabulary (§12). No real products/suppliers are seeded — that's real ECT catalogue data,
-- not placeholder rows, and should be entered/imported once Phase 2 starts.

insert into categories (id, name, slug, parent_id, sort_order) values
  (gen_random_uuid(), 'Water', 'water', null, 1),
  (gen_random_uuid(), 'Air', 'air', null, 2),
  (gen_random_uuid(), 'Hygiene', 'hygiene', null, 3),
  (gen_random_uuid(), 'Maintenance Kits', 'maintenance-kits', null, 4);

-- Water subtree
with water as (select id from categories where slug = 'water')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, water.id, v.sort_order
from water, (values
  ('Filtration', 'water-filtration', 1),
  ('Filter Housings', 'water-filter-housings', 2),
  ('UV-C', 'water-uvc', 3),
  ('Reverse Osmosis', 'water-reverse-osmosis', 4),
  ('Water Treatment', 'water-treatment', 5)
) as v(name, slug, sort_order);

with filtration as (select id from categories where slug = 'water-filtration')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, filtration.id, v.sort_order
from filtration, (values
  ('Sediment Filters', 'sediment-filters', 1),
  ('PP Cartridges', 'pp-cartridges', 2),
  ('Pleated Filters', 'pleated-filters', 3),
  ('Carbon Filters', 'carbon-filters', 4),
  ('GAC', 'gac', 5),
  ('CTO', 'cto', 6),
  ('Carbon Block', 'carbon-block', 7)
) as v(name, slug, sort_order);

with housings as (select id from categories where slug = 'water-filter-housings')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, housings.id, v.sort_order
from housings, (values
  ('10"', 'housing-10-inch', 1),
  ('20"', 'housing-20-inch', 2),
  ('Big Blue', 'housing-big-blue', 3),
  ('Single', 'housing-single', 4),
  ('Twin', 'housing-twin', 5),
  ('Triple', 'housing-triple', 6)
) as v(name, slug, sort_order);

with uvc as (select id from categories where slug = 'water-uvc')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, uvc.id, v.sort_order
from uvc, (values
  ('UV Systems', 'uv-systems', 1),
  ('UV Lamps', 'uv-lamps', 2),
  ('Quartz Sleeves', 'quartz-sleeves', 3),
  ('Spare Parts', 'uv-spare-parts', 4)
) as v(name, slug, sort_order);

with ro as (select id from categories where slug = 'water-reverse-osmosis')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, ro.id, v.sort_order
from ro, (values
  ('RO Membranes', 'ro-membranes', 1),
  ('RO Accessories', 'ro-accessories', 2),
  ('RO Spare Parts', 'ro-spare-parts', 3)
) as v(name, slug, sort_order);

with treatment as (select id from categories where slug = 'water-treatment')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, treatment.id, v.sort_order
from treatment, (values
  ('Sanitization', 'sanitization', 1),
  ('Water Testing', 'water-testing', 2),
  ('Dosing', 'dosing', 3),
  ('Tank Cleaning', 'tank-cleaning', 4),
  ('Remineralization', 'remineralization', 5)
) as v(name, slug, sort_order);

-- Air subtree
with air as (select id from categories where slug = 'air')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, air.id, v.sort_order
from air, (values
  ('HVAC Filters', 'hvac-filters', 1),
  ('HEPA', 'hepa', 2),
  ('Activated Carbon', 'air-activated-carbon', 3),
  ('VOC Filtration', 'voc-filtration', 4),
  ('Pre-Filters', 'pre-filters', 5),
  ('Air Quality Sensors', 'air-quality-sensors', 6),
  ('Eco Air Sense', 'eco-air-sense', 7),
  ('Eco Air Sense Accessories', 'eco-air-sense-accessories', 8)
) as v(name, slug, sort_order);

-- Hygiene subtree
with hygiene as (select id from categories where slug = 'hygiene')
insert into categories (name, slug, parent_id, sort_order)
select v.name, v.slug, hygiene.id, v.sort_order
from hygiene, (values
  ('Sampling Kits', 'sampling-kits', 1),
  ('Microbiological Sampling', 'microbiological-sampling', 2),
  ('Legionella Sampling', 'legionella-sampling', 3),
  ('Water Testing (Hygiene)', 'hygiene-water-testing', 4),
  ('Cleaning Accessories', 'cleaning-accessories', 5),
  ('Sanitization Kits', 'sanitization-kits', 6),
  ('Hygiene Consumables', 'hygiene-consumables', 7)
) as v(name, slug, sort_order);

-- Equipment type vocabulary referenced by product_compatibility (§12)
insert into equipment_types (name, category) values
  ('Filter Housing', 'water'),
  ('UV System', 'water'),
  ('RO Membrane Housing', 'water'),
  ('Desalination Unit', 'water'),
  ('Water Tank', 'water'),
  ('HVAC Unit', 'air'),
  ('Air Handling Unit', 'air'),
  ('Eco Air Sense Device', 'air');
