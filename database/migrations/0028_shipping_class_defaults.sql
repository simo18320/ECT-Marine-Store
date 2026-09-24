-- Initial shipping class per category. A starting point only: every product's class stays
-- editable from the admin, and products left null fall back safely (never free, flagged).
update products p set shipping_class = 'A' from categories c
where p.category_id = c.id and c.slug in (
  'sediment-filters', 'pp-cartridges', 'carbon-block', 'cto', 'gac', 'water-filtration',
  'uv-lamps', 'quartz-sleeves', 'uv-spare-parts', 'ro-accessories', 'ro-spare-parts',
  'sampling-kits', 'hygiene-consumables', 'cleaning-accessories', 'microbiological-sampling',
  'legionella-sampling', 'hygiene-water-testing', 'water-testing', 'sanitization-kits'
);
update products p set shipping_class = 'B' from categories c
where p.category_id = c.id and c.slug in (
  'uv-systems', 'hvac-filters', 'water-filter-housings', 'ro-membranes', 'dosing',
  'remineralization', 'sanitization', 'tank-cleaning', 'water-purifiers-refrigerators-carbonators',
  'maintenance-kits', 'housing-10-inch', 'housing-20-inch', 'housing-big-blue', 'housing-single', 'housing-twin'
);
update products p set shipping_class = 'C' from categories c
where p.category_id = c.id and c.slug = 'water-reverse-osmosis';
-- A sampling kit that ships as a full box is bulkier than the single-bottle kits.
update products set shipping_class = 'B' where sku ilike 'ECT-SK-PREMIUM%' or name ilike '%Premium%Sampling Box%';
-- Uncategorised small spare part.
update products set shipping_class = 'A' where sku = 'ECT-0052' and shipping_class is null;
