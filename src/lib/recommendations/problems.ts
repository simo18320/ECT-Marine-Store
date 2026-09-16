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
  /** Category slugs (from the storefront's own category tree) that typically address this
   * problem — shown as a "product types worth browsing" suggestion, distinct from and never a
   * substitute for the verified-compatible results below it: it's a starting point for browsing,
   * not a compatibility claim, since product_compatibility rows don't exist for every product yet.
   * Each slug is matched exactly (no subtree expansion) — for a branch category, list its relevant
   * children individually rather than the parent, so the capped preview surfaces the products that
   * actually matter instead of whichever child sorts first alphabetically. */
  suggestedCategorySlugs: string[];
}

export const PROBLEMS: ProblemDefinition[] = [
  {
    id: "sediment",
    label: "Sediment or cloudy water",
    description: "Sand, silt or rust particles in the fresh water supply.",
    equipmentTypeNames: ["Filter Housing"],
    keywords: ["sediment", "cloudy water", "sandy water", "silt", "rust in the water", "gritty water"],
    suggestedCategorySlugs: ["sediment-filters", "pp-cartridges"],
  },
  {
    id: "bad_taste_smell",
    label: "Bad taste or smell",
    description: "Chlorine taste, musty odour, or generally unpleasant-tasting water.",
    equipmentTypeNames: ["Filter Housing"],
    keywords: ["bad taste", "tastes bad", "smells bad", "musty", "chlorine taste", "bad smell", "odd smell"],
    suggestedCategorySlugs: ["carbon-block", "gac"],
  },
  {
    id: "microbiological_risk",
    label: "Microbiological risk",
    description: "Bacterial or Legionella risk in the water system.",
    equipmentTypeNames: ["UV System"],
    keywords: ["legionella", "bacteria", "bacterial", "microbiological"],
    suggestedCategorySlugs: ["uv-lamps", "uv-systems"],
  },
  {
    id: "filtration_upgrade",
    label: "General filtration upgrade",
    description: "Improving overall water filtration or desalination output.",
    equipmentTypeNames: ["Filter Housing", "RO Membrane Housing", "Desalination Unit"],
    keywords: ["upgrade my filtration", "improve water filtration", "desalination output", "more fresh water"],
    suggestedCategorySlugs: ["water-filter-housings", "water-reverse-osmosis"],
  },
  {
    id: "hvac_air_quality",
    label: "HVAC air quality",
    description: "Stale or poor-quality air from the HVAC system.",
    equipmentTypeNames: ["HVAC Unit"],
    keywords: ["stale air", "hvac", "air conditioning smell", "poor air quality"],
    suggestedCategorySlugs: ["hvac-filters"],
  },
  {
    id: "voc_pm",
    label: "VOC or particulate matter",
    description: "Airborne chemical odours (VOCs) or fine particulate matter (PM).",
    equipmentTypeNames: ["Air Handling Unit"],
    keywords: ["voc", "particulate matter", "chemical smell", "fumes", "dusty air"],
    suggestedCategorySlugs: ["voc-filtration", "hepa", "air-activated-carbon"],
  },
  {
    id: "filter_replacement",
    label: "Time to replace a filter",
    description: "A scheduled or overdue filter replacement.",
    equipmentTypeNames: ["Filter Housing"],
    keywords: ["replace my filter", "filter replacement", "filter is due", "filter overdue", "change my filter"],
    suggestedCategorySlugs: ["carbon-block", "cto", "gac", "pp-cartridges", "sediment-filters"],
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
