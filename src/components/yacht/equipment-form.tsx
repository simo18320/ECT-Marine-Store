import type { Database } from "@/types/database";

type Equipment = Database["public"]["Tables"]["equipment"]["Row"];

interface EquipmentFormProps {
  action: (formData: FormData) => void;
  defaultValues?: Equipment | null;
  equipmentTypes: { id: string; name: string }[];
  submitLabel: string;
}

export function EquipmentForm({ action, defaultValues, equipmentTypes, submitLabel }: EquipmentFormProps) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Equipment type
        <select
          name="equipment_type_id"
          defaultValue={defaultValues?.equipment_type_id ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        >
          <option value="">— Select —</option>
          {equipmentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Manufacturer
          <input
            name="manufacturer"
            defaultValue={defaultValues?.manufacturer ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Model
          <input
            name="model"
            defaultValue={defaultValues?.model ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Serial number
          <input
            name="serial_number"
            defaultValue={defaultValues?.serial_number ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Location
          <input
            name="location"
            defaultValue={defaultValues?.location ?? ""}
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
          Status
          <select
            name="status"
            defaultValue={defaultValues?.status ?? "active"}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="removed">Removed</option>
            <option value="faulty">Faulty</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Maintenance interval (days)
        <input
          name="maintenance_interval_days"
          type="number"
          defaultValue={defaultValues?.maintenance_interval_days ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Last maintenance date
          <input
            name="last_maintenance_date"
            type="date"
            defaultValue={defaultValues?.last_maintenance_date ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Next maintenance date (override)
          <input
            name="next_maintenance_date"
            type="date"
            defaultValue={defaultValues?.next_maintenance_date ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Leave the override blank to compute the due date from the last maintenance date (or
        installation date if never serviced) plus the interval.
      </p>

      <button
        type="submit"
        className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
      >
        {submitLabel}
      </button>
    </form>
  );
}
