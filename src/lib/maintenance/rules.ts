export type ReplacementStatus = "ok" | "due_soon" | "due" | "overdue" | "unknown";

const DUE_SOON_WINDOW_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface ReplacementInfo {
  status: ReplacementStatus;
  dueDate: Date | null;
  daysUntilDue: number | null;
}

/**
 * business-rules.md §3 status thresholds, given an already-resolved due date:
 *   OVERDUE  — due date is in the past
 *   DUE      — due today
 *   DUE_SOON — within the next 30 days
 *   OK       — more than 30 days out
 *   UNKNOWN  — no due date could be resolved
 */
export function statusFromDueDate(dueDate: Date | null, today: Date = new Date()): ReplacementInfo {
  if (!dueDate) return { status: "unknown", dueDate: null, daysUntilDue: null };

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const dueDateStart = new Date(dueDate);
  dueDateStart.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.round((dueDateStart.getTime() - todayStart.getTime()) / MS_PER_DAY);

  let status: ReplacementStatus;
  if (daysUntilDue < 0) status = "overdue";
  else if (daysUntilDue === 0) status = "due";
  else if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) status = "due_soon";
  else status = "ok";

  return { status, dueDate, daysUntilDue };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Filters: due date = installation_date + replacement_interval_days, no override column. */
export function computeFilterReplacementStatus(
  installationDate: string | null,
  replacementIntervalDays: number | null,
  today: Date = new Date(),
): ReplacementInfo {
  if (!installationDate || !replacementIntervalDays) {
    return { status: "unknown", dueDate: null, daysUntilDue: null };
  }
  return statusFromDueDate(addDays(new Date(installationDate), replacementIntervalDays), today);
}

export interface EquipmentMaintenanceFields {
  installation_date: string | null;
  maintenance_interval_days: number | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
}

/**
 * Equipment: an explicit next_maintenance_date always wins (staff/owner can override it
 * directly); otherwise it's derived from the last service date, or the installation date if
 * it has never been serviced yet.
 */
export function computeEquipmentReplacementStatus(
  equipment: EquipmentMaintenanceFields,
  today: Date = new Date(),
): ReplacementInfo {
  if (equipment.next_maintenance_date) {
    return statusFromDueDate(new Date(equipment.next_maintenance_date), today);
  }

  const baseDate = equipment.last_maintenance_date ?? equipment.installation_date;
  if (!baseDate || !equipment.maintenance_interval_days) {
    return { status: "unknown", dueDate: null, daysUntilDue: null };
  }

  return statusFromDueDate(addDays(new Date(baseDate), equipment.maintenance_interval_days), today);
}

export const REPLACEMENT_STATUS_LABEL: Record<ReplacementStatus, string> = {
  ok: "OK",
  due_soon: "Due soon",
  due: "Due",
  overdue: "Overdue",
  unknown: "Unknown",
};

export const REPLACEMENT_STATUS_COLOR: Record<ReplacementStatus, string> = {
  ok: "text-status-good",
  due_soon: "text-status-warning",
  due: "text-status-warning",
  overdue: "text-status-critical",
  unknown: "text-muted-foreground",
};
