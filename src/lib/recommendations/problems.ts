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
  /** Free-text keywords used by the AI assistant (ai-engine.md §1) to trigger this same
   * deterministic engine from a customer's chat message — never an independent product choice. */
  keywords: string[];
}

export const PROBLEMS: ProblemDefinition[] = [
  {
    id: "sediment",
    label: "Sediment or cloudy water",
    description: "Sand, silt or rust particles in the fresh water supply.",
    equipmentTypeNames: ["Filter Housing"],
    keywords: ["sediment", "cloudy water", "sandy water", "silt", "rust in the water", "gritty water"],
  },
  {
    id: "bad_taste_smell",
    label: "Bad taste or smell",
    description: "Chlorine taste, musty odour, or generally unpleasant-tasting water.",
    equipmentTypeNames: ["Filter Housing"],
    keywords: ["bad taste", "tastes bad", "smells bad", "musty", "chlorine taste", "bad smell", "odd smell"],
  },
  {
    id: "microbiological_risk",
    label: "Microbiological risk",
    description: "Bacterial or Legionella risk in the water system.",
    equipmentTypeNames: ["UV System"],
    keywords: ["legionella", "bacteria", "bacterial", "microbiological"],
  },
  {
    id: "filtration_upgrade",
    label: "General filtration upgrade",
    description: "Improving overall water filtration or desalination output.",
    equipmentTypeNames: ["Filter Housing", "RO Membrane Housing", "Desalination Unit"],
    keywords: ["upgrade my filtration", "improve water filtration", "desalination output", "more fresh water"],
  },
  {
    id: "hvac_air_quality",
    label: "HVAC air quality",
    description: "Stale or poor-quality air from the HVAC system.",
    equipmentTypeNames: ["HVAC Unit"],
    keywords: ["stale air", "hvac", "air conditioning smell", "poor air quality"],
  },
  {
    id: "voc_pm",
    label: "VOC or particulate matter",
    description: "Airborne chemical odours (VOCs) or fine particulate matter (PM).",
    equipmentTypeNames: ["Air Handling Unit"],
    keywords: ["voc", "particulate matter", "chemical smell", "fumes", "dusty air"],
  },
  {
    id: "filter_replacement",
    label: "Time to replace a filter",
    description: "A scheduled or overdue filter replacement.",
    equipmentTypeNames: ["Filter Housing"],
    keywords: ["replace my filter", "filter replacement", "filter is due", "filter overdue", "change my filter"],
  },
];

export function getProblem(id: string): ProblemDefinition | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

/**
 * Keyword match against a free-text customer message. Deliberately simple (first match wins,
 * substring search) — this only decides whether to run the existing deterministic recommendation
 * engine at all, it never itself picks a product, so false negatives just mean the assistant
 * answers without a recommendation rather than picking the wrong problem.
 */
export function detectProblem(message: string): ProblemDefinition | undefined {
  const lower = message.toLowerCase();
  return PROBLEMS.find((p) => p.keywords.some((k) => lower.includes(k)));
}
