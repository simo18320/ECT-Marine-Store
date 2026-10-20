import Anthropic from "@anthropic-ai/sdk";
import { EMPTY_CRITERIA, normaliseSize, type SearchCriteria } from "./ranking";

// Extraction only — a small fast model. It never chooses or describes a product.
const INTENT_MODEL = "claude-haiku-4-5-20251001";

const TOOL = {
  name: "submit_search_criteria",
  description: "Turn the customer's request into catalogue search hints.",
  input_schema: {
    type: "object" as const,
    properties: {
      keywords: {
        type: "array",
        items: { type: "string" },
        description:
          "1-6 short product-type words or phrases a catalogue would contain, e.g. 'sediment', 'carbon', 'UV lamp', 'cartridge', 'housing'. No sizes or numbers here. No brand guesses.",
      },
      size_inches: { type: ["string", "null"], description: "Filter length/size in inches if stated, e.g. '10' or '20'. Otherwise null." },
      micron: { type: ["number", "null"], description: "Micron rating if stated, otherwise null." },
    },
    required: ["keywords", "size_inches", "micron"],
    additionalProperties: false,
  },
};

export async function extractCriteria(message: string): Promise<SearchCriteria> {
  if (!process.env.ANTHROPIC_API_KEY) return EMPTY_CRITERIA;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: INTENT_MODEL,
      max_tokens: 300,
      system:
        "You extract search hints for a yacht water/air/hygiene parts catalogue from a customer's message. Output only what the customer actually said. If they state a problem instead of a part (e.g. 'cloudy water'), give the product types that address it as keywords. Never invent a part number.",
      tools: [TOOL],
      tool_choice: { type: "tool", name: "submit_search_criteria" },
      messages: [{ role: "user", content: message.slice(0, 1000) }],
    });
    const use = response.content.find((b) => b.type === "tool_use");
    if (!use || use.type !== "tool_use") return EMPTY_CRITERIA;
    const input = use.input as { keywords?: unknown; size_inches?: unknown; micron?: unknown };
    return {
      keywords: Array.isArray(input.keywords) ? input.keywords.filter((k): k is string => typeof k === "string").slice(0, 6) : [],
      size: typeof input.size_inches === "string" ? normaliseSize(input.size_inches) : null,
      micron: typeof input.micron === "number" && Number.isFinite(input.micron) ? input.micron : null,
    };
  } catch {
    return EMPTY_CRITERIA;
  }
}
