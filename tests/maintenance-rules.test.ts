import { describe, expect, it } from "vitest";
import { computeEquipmentReplacementStatus, computeFilterReplacementStatus } from "@/lib/maintenance/rules";

const FIXED_TODAY = new Date("2026-09-05T00:00:00Z");

describe("computeFilterReplacementStatus", () => {
  it("returns unknown when installation date is missing", () => {
    expect(computeFilterReplacementStatus(null, 90, FIXED_TODAY).status).toBe("unknown");
  });

  it("returns unknown when replacement interval is missing", () => {
    expect(computeFilterReplacementStatus("2026-01-01", null, FIXED_TODAY).status).toBe("unknown");
  });

  it("returns ok when more than 30 days from due", () => {
    // Installed just before FIXED_TODAY with a long interval -> due date is far out.
    const info = computeFilterReplacementStatus("2026-09-01", 200, FIXED_TODAY);
    expect(info.status).toBe("ok");
  });

  it("returns due_soon within the 30-day window", () => {
    // Due 20 days from FIXED_TODAY.
    const installed = new Date(FIXED_TODAY);
    installed.setDate(installed.getDate() - 70); // 70 days ago, 90-day interval -> 20 days left
    const info = computeFilterReplacementStatus(installed.toISOString().slice(0, 10), 90, FIXED_TODAY);
    expect(info.status).toBe("due_soon");
    expect(info.daysUntilDue).toBe(20);
  });

  it("returns due exactly on the due date", () => {
    const installed = new Date(FIXED_TODAY);
    installed.setDate(installed.getDate() - 90);
    const info = computeFilterReplacementStatus(installed.toISOString().slice(0, 10), 90, FIXED_TODAY);
    expect(info.status).toBe("due");
    expect(info.daysUntilDue).toBe(0);
  });

  it("returns overdue once the due date has passed", () => {
    const installed = new Date(FIXED_TODAY);
    installed.setDate(installed.getDate() - 100);
    const info = computeFilterReplacementStatus(installed.toISOString().slice(0, 10), 90, FIXED_TODAY);
    expect(info.status).toBe("overdue");
    expect(info.daysUntilDue).toBe(-10);
  });
});

describe("computeEquipmentReplacementStatus", () => {
  it("prefers an explicit next_maintenance_date over everything else", () => {
    const info = computeEquipmentReplacementStatus(
      {
        installation_date: "2020-01-01",
        maintenance_interval_days: 30,
        last_maintenance_date: "2026-01-01",
        next_maintenance_date: "2026-09-10",
      },
      FIXED_TODAY,
    );
    expect(info.status).toBe("due_soon");
    expect(info.daysUntilDue).toBe(5);
  });

  it("falls back to last_maintenance_date + interval when no override is set", () => {
    const info = computeEquipmentReplacementStatus(
      {
        installation_date: "2020-01-01",
        maintenance_interval_days: 90,
        last_maintenance_date: "2026-08-01",
        next_maintenance_date: null,
      },
      FIXED_TODAY,
    );
    // due 2026-10-30, well beyond the 30-day window from 2026-09-05.
    expect(info.status).toBe("ok");
  });

  it("falls back to installation_date + interval when never serviced", () => {
    const info = computeEquipmentReplacementStatus(
      {
        installation_date: "2026-08-20",
        maintenance_interval_days: 20,
        last_maintenance_date: null,
        next_maintenance_date: null,
      },
      FIXED_TODAY,
    );
    // due 2026-09-09, 4 days from FIXED_TODAY.
    expect(info.status).toBe("due_soon");
    expect(info.daysUntilDue).toBe(4);
  });

  it("returns unknown when nothing is on record", () => {
    const info = computeEquipmentReplacementStatus(
      { installation_date: null, maintenance_interval_days: null, last_maintenance_date: null, next_maintenance_date: null },
      FIXED_TODAY,
    );
    expect(info.status).toBe("unknown");
  });
});
