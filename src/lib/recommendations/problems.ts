/**
 * The fixed problem taxonomy from the master spec §37 ("Find the right product"). Each
 * problem maps to the equipment_type(s) whose product_compatibility rows are eligible
 * candidates — this mapping is curated business knowledge, not admin-editable data, so it
 * lives in code rather than a table (avoids over-engineering an admin UI for ~9 rows that
 * change approximately never).
 */
export interface ProblemDefinition {
  id: string;
  label: string;
  description: string;
  equipmentTypeNames: string[];
}

export const PROBLEMS: ProblemDefinition[] = [
  {
    id: "sediment",
    label: "Sediment or cloudy water",
    description: "Sand, silt or rust particles in the fresh water supply.",
    equipmentTypeNames: ["Filter Housing"],
  },
  {
    id: "bad_taste_smell",
    label: "Bad taste or smell",
    description: "Chlorine taste, musty odour, or generally unpleasant-tasting water.",
    equipmentTypeNames: ["Filter Housing"],
  },
  {
    id: "microbiological_risk",
    label: "Microbiological risk",
    description: "Bacterial or Legionella risk in the water system.",
    equipmentTypeNames: ["UV System"],
  },
  {
    id: "filtration_upgrade",
    label: "General filtration upgrade",
    description: "Improving overall water filtration or desalination output.",
    equipmentTypeNames: ["Filter Housing", "RO Membrane Housing", "Desalination Unit"],
  },
  {
    id: "hvac_air_quality",
    label: "HVAC air quality",
    description: "Stale or poor-quality air from the HVAC system.",
    equipmentTypeNames: ["HVAC Unit"],
  },
  {
    id: "voc_pm",
    label: "VOC or particulate matter",
    description: "Airborne chemical odours (VOCs) or fine particulate matter (PM).",
    equipmentTypeNames: ["Air Handling Unit"],
  },
  {
    id: "filter_replacement",
    label: "Time to replace a filter",
    description: "A scheduled or overdue filter replacement.",
    equipmentTypeNames: ["Filter Housing"],
  },
];

export function getProblem(id: string): ProblemDefinition | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
