import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryFormProps {
  action: (formData: FormData) => void;
  defaultValues?: Category | null;
  categories: { id: string; label: string }[];
  submitLabel: string;
}

export function CategoryForm({ action, defaultValues, categories, submitLabel }: CategoryFormProps) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Slug
        <input
          name="slug"
          defaultValue={defaultValues?.slug ?? ""}
          placeholder={defaultValues ? undefined : "Auto-generated from name if left blank"}
          className="rounded-md border border-input bg-card px-3 py-2 font-mono"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Parent category
        <select
          name="parent_id"
          defaultValue={defaultValues?.parent_id ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        >
          <option value="">— Top level —</option>
          {categories
            .filter((c) => c.id !== defaultValues?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          name="description"
          rows={2}
          defaultValue={defaultValues?.description ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Sort order
        <input
          name="sort_order"
          type="number"
          defaultValue={defaultValues?.sort_order ?? 0}
          className="w-24 rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <button
        type="submit"
        className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
      >
        {submitLabel}
      </button>
    </form>
  );
}
