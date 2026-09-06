import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { getProductForEdit, listBrands, listCategoriesFlat } from "@/lib/admin/products";
import {
  addProductDocument,
  addProductImage,
  deleteProductDocument,
  deleteProductImage,
  updateProduct,
  uploadProductImage,
} from "@/lib/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [result, categories, brands] = await Promise.all([
    getProductForEdit(id),
    listCategoriesFlat(),
    listBrands(),
  ]);

  if (!result) notFound();
  const { product, images, documents } = result;

  const updateWithId = updateProduct.bind(null, id);
  const uploadImageWithId = uploadProductImage.bind(null, id);
  const addImageWithId = addProductImage.bind(null, id);
  const deleteImageWithId = deleteProductImage.bind(null, id);
  const addDocWithId = addProductDocument.bind(null, id);
  const deleteDocWithId = deleteProductDocument.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-medium">Edit product</h1>
      <ProductForm
        action={updateWithId}
        defaultValues={product}
        categories={categories}
        brands={brands}
        submitLabel="Save changes"
      />

      <section className="mt-12">
        <h2 className="mb-3 text-lg font-semibold">Images</h2>
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.alt_text ?? ""} className="h-full w-full object-cover" />
              <form action={deleteImageWithId} className="absolute right-2 top-2">
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

        <form action={uploadImageWithId} className="mb-3 flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
          <label className="flex flex-col gap-1 text-sm">
            Upload a photo
            <input name="file" type="file" accept="image/*" required className="text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Alt text (optional)
            <input name="alt_text" className="rounded-md border border-input bg-card px-3 py-2 text-sm" />
          </label>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Upload
          </button>
        </form>

        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Or link an externally hosted image instead</summary>
          <form action={addImageWithId} className="mt-2 flex gap-2">
            <input
              name="url"
              required
              placeholder="Image URL"
              className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
            <input
              name="alt_text"
              placeholder="Alt text (optional)"
              className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
              Add
            </button>
          </form>
        </details>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Documents</h2>
        <ul className="mb-4 flex flex-col gap-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <span className="truncate">
                {doc.title} <span className="text-muted-foreground">({doc.doc_type})</span>
              </span>
              <form action={deleteDocWithId}>
                <input type="hidden" name="id" value={doc.id} />
                <button type="submit" className="text-muted-foreground hover:text-destructive">
                  Remove
                </button>
              </form>
            </li>
          ))}
          {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
        </ul>
        <form action={addDocWithId} className="flex gap-2">
          <input
            name="title"
            required
            placeholder="Title"
            className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
          <input
            name="url"
            required
            placeholder="Document URL"
            className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
          <select name="doc_type" className="rounded-md border border-input bg-card px-3 py-2 text-sm">
            <option value="datasheet">Datasheet</option>
            <option value="certificate">Certificate</option>
            <option value="manual">Manual</option>
          </select>
          <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
