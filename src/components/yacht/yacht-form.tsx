import type { Yacht } from "@/lib/yachts/queries";

interface YachtFormProps {
  action: (formData: FormData) => void;
  defaultValues?: Yacht | null;
  submitLabel: string;
}

export function YachtForm({ action, defaultValues, submitLabel }: YachtFormProps) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Yacht name
        <input
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Type
          <input
            name="yacht_type"
            placeholder="Motor, Sail…"
            defaultValue={defaultValues?.yacht_type ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Length (m)
          <input
            name="length_m"
            type="number"
            step="0.1"
            defaultValue={defaultValues?.length_m ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Build year
          <input
            name="build_year"
            type="number"
            defaultValue={defaultValues?.build_year ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Flag
          <input
            name="flag"
            defaultValue={defaultValues?.flag ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Cruising area
          <input
            name="cruising_area"
            defaultValue={defaultValues?.cruising_area ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Crew
          <input
            name="crew_count"
            type="number"
            defaultValue={defaultValues?.crew_count ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Guests
          <input
            name="guest_count"
            type="number"
            defaultValue={defaultValues?.guest_count ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Water tank capacity (L)
          <input
            name="water_tank_capacity_l"
            type="number"
            step="0.1"
            defaultValue={defaultValues?.water_tank_capacity_l ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Freshwater production (L/day)
          <input
            name="freshwater_production_lpd"
            type="number"
            step="0.1"
            defaultValue={defaultValues?.freshwater_production_lpd ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Desalination system
        <input
          name="desalination_system"
          defaultValue={defaultValues?.desalination_system ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Filtration notes
        <textarea
          name="filtration_notes"
          rows={2}
          defaultValue={defaultValues?.filtration_notes ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        UV notes
        <textarea
          name="uv_notes"
          rows={2}
          defaultValue={defaultValues?.uv_notes ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        HVAC notes
        <textarea
          name="hvac_notes"
          rows={2}
          defaultValue={defaultValues?.hvac_notes ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Air monitoring notes
        <textarea
          name="air_monitoring_notes"
          rows={2}
          defaultValue={defaultValues?.air_monitoring_notes ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
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
