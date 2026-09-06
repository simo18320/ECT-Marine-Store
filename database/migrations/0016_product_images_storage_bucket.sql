-- 0016_product_images_storage_bucket.sql
-- Public bucket for product photos, uploaded via the admin product edit page rather than
-- requiring staff to already have an externally-hosted URL to paste in.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

create policy product_images_staff_write on storage.objects
  for insert with check (bucket_id = 'product-images' and private.is_ect_staff());

create policy product_images_staff_update on storage.objects
  for update using (bucket_id = 'product-images' and private.is_ect_staff())
  with check (bucket_id = 'product-images' and private.is_ect_staff());

create policy product_images_staff_delete on storage.objects
  for delete using (bucket_id = 'product-images' and private.is_ect_staff());
