"use client";

import { useActionState } from "react";
import type { Database } from "@/types/database";
import type { ImageActionState } from "@/lib/admin/product-actions";

type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];

interface ProductImagesSectionProps {
  images: ProductImage[];
  uploadAction: (prevState: ImageActionState, formData: FormData) => Promise<ImageActionState>;
  importAction: (prevState: ImageActionState, formData: FormData) => Promise<ImageActionState>;
  deleteAction: (formData: FormData) => void;
}

export function ProductImagesSection({ images, uploadAction, importAction, deleteAction }: ProductImagesSectionProps) {
  const [uploadState, uploadFormAction, uploadPending] = useActionState(uploadAction, {});
  const [importState, importFormAction, importPending] = useActionState(importAction, {});

  return (
    <section className="mt-12">
      <h2 className="mb-3 text-lg font-semibold">Images</h2>
      <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image) => (
          <li key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt_text ?? ""} className="h-full w-full object-contain" />
            <form action={deleteAction} className="absolute right-2 top-2">
              <input type="hidden" name="id" value={image.id} />
              <button
                type="submit"
                className="rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              >
                Remove
              </button>
            </form>
          </li>
        ))}
        {images.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No images yet.</p>}
      </ul>

      {uploadState.error && (
        <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {uploadState.error}
        </p>
      )}
      <form action={uploadFormAction} className="mb-3 flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
        <label className="flex flex-col gap-1 text-sm">
          Upload a photo
          <input name="file" type="file" accept="image/*" required className="text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Alt text (optional)
          <input name="alt_text" className="rounded-md border border-input bg-card px-3 py-2 text-sm" />
        </label>
        <button
          type="submit"
          disabled={uploadPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadPending ? "Uploading…" : "Upload"}
        </button>
      </form>

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">Or import from a supplier/manufacturer&rsquo;s URL</summary>
        <p className="mt-2 text-xs">
          Downloads the image and hosts it ourselves, rather than linking to their site directly
          — check you&rsquo;re allowed to use the photo (most reseller agreements cover this, but
          it&rsquo;s worth a quick check if you&rsquo;re not sure).
        </p>
        {importState.error && (
          <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {importState.error}
          </p>
        )}
        <form action={importFormAction} className="mt-2 flex gap-2">
          <input
            name="source_url"
            type="url"
            required
            placeholder="https://supplier-site.com/photo.jpg"
            className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
          <input
            name="alt_text"
            placeholder="Alt text (optional)"
            className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={importPending}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importPending ? "Importing…" : "Import"}
          </button>
        </form>
      </details>
    </section>
  );
}
