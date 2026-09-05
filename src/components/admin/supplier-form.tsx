import type { Database } from "@/types/database";

type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierStatus = Database["public"]["Enums"]["supplier_status"];

const STATUSES: SupplierStatus[] = ["discovered", "under_review", "qualified", "approved", "preferred", "blocked"];

interface SupplierFormProps {
  action: (formData: FormData) => void;
  defaultValues?: Supplier | null;
  submitLabel: string;
}

export function SupplierForm({ action, defaultValues, submitLabel }: SupplierFormProps) {
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

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Country
          <input name="country" defaultValue={defaultValues?.country ?? ""} className="rounded-md border border-input bg-card px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Website
          <input name="website" defaultValue={defaultValues?.website ?? ""} className="rounded-md border border-input bg-card px-3 py-2" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Contact email
          <input
            name="contact_email"
            type="email"
            defaultValue={defaultValues?.contact_email ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contact phone
          <input
            name="contact_phone"
            defaultValue={defaultValues?.contact_phone ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Status
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "discovered"}
          className="rounded-md border border-input bg-card px-3 py-2 capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-muted-foreground">
          A purchase order can only be awarded to a qualified, approved, or preferred supplier
          (procurement.md §2).
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Quality score (0–100)
          <input
            name="quality_score"
            type="number"
            min={0}
            max={100}
            step={0.5}
            defaultValue={defaultValues?.quality_score ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Reliability score (0–100)
          <input
            name="reliability_score"
            type="number"
            min={0}
            max={100}
            step={0.5}
            defaultValue={defaultValues?.reliability_score ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Manually rated by ECT staff — there is no order history yet to compute these from
        automatically. Left blank, a supplier scores 0 on that factor rather than an assumed
        average (business-rules.md §6).
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Payment terms
        <input
          name="payment_terms"
          placeholder="e.g. Net 30"
          defaultValue={defaultValues?.payment_terms ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Certifications (comma-separated)
        <input
          name="certifications"
          defaultValue={defaultValues?.certifications?.join(", ") ?? ""}
          className="rounded-md border border-input bg-card px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} className="rounded-md border border-input bg-card px-3 py-2" />
      </label>

      <button type="submit" className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
        {submitLabel}
      </button>
    </form>
  );
}
