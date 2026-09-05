import type { Database } from "@/types/database";

type Filter = Database["public"]["Tables"]["filters"]["Row"];

interface FilterFormProps {
  action: (formData: FormData) => void;
  defaultValues?: Filter | null;
  equipmentOptions: { id: string; label: string }[];
  productOptions: { id: string; sku: string; name: string }[];
  submitLabel: string;
}

export function FilterForm({ action, defaultValues, equipmentOptions, productOptions, submitLabel }: FilterFormProps) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Product (filter cartridge/element)
        <select
          name="product_id"
          required
          defaultValue={defaultValues?.product_id ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        >
          <option value="">— Select —</option>
          {productOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Installed in equipment (optional)
        <select
          name="equipment_id"
          defaultValue={defaultValues?.equipment_id ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        >
          <option value="">— None —</option>
          {equipmentOptions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Location
          <input
            name="location"
            defaultValue={defaultValues?.location ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Filter type
          <input
            name="filter_type"
            placeholder="Sediment, CTO, UV lamp…"
            defaultValue={defaultValues?.filter_type ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Installation date
          <input
            name="installation_date"
            type="date"
            defaultValue={defaultValues?.installation_date ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Replacement interval (days)
          <input
            name="replacement_interval_days"
            type="number"
            defaultValue={defaultValues?.replacement_interval_days ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
      >
        {submitLabel}
      </button>
    </form>
  );
}
