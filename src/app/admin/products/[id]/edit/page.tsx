import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import { getProductForEdit, listBrands, listCategoriesFlat } from "@/lib/admin/products";
import {
  addProductDocument,
  addProductImage,
  deleteProductDocument,
  deleteProductImage,
  updateProduct,
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
  const addImageWithId = addProductImage.bind(null, id);
  const deleteImageWithId = deleteProductImage.bind(null, id);
  const addDocWithId = addProductDocument.bind(null, id);
  const deleteDocWithId = deleteProductDocument.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Edit product</h1>
      <ProductForm
        action={updateWithId}
        defaultValues={product}
        categories={categories}
        brands={brands}
        submitLabel="Save changes"
      />

      <section className="mt-12">
        <h2 className="mb-3 text-lg font-semibold">Images</h2>
        <ul className="mb-4 flex flex-col gap-2">
          {images.map((image) => (
            <li key={image.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <span className="truncate">
                {image.url} {image.alt_text && <span className="text-muted-foreground">— {image.alt_text}</span>}
              </span>
              <form action={deleteImageWithId}>
                <input type="hidden" name="id" value={image.id} />
                <button type="submit" className="text-muted-foreground hover:text-destructive">
                  Remove
                </button>
              </form>
            </li>
          ))}
          {images.length === 0 && <p className="text-sm text-muted-foreground">No images yet.</p>}
        </ul>
        <form action={addImageWithId} className="flex gap-2">
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
