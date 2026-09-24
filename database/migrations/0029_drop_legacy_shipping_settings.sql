-- Superseded by shipping_settings / shipping_rates (0027): the flat threshold and fee no longer
-- drive anything, so they must not linger as a second, misleading source of truth.
alter table store_settings
  drop column if exists free_shipping_threshold,
  drop column if exists shipping_fee_italy;
