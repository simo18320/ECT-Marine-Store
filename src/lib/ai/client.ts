import Anthropic from "@anthropic-ai/sdk";
import type { AssistantResponsePayload } from "./postprocess";

export const ASSISTANT_MODEL = "claude-sonnet-5";

// ai-engine.md §3, made explicit for the model rather than left implicit. The forced tool call
// below is the actual enforcement — this prompt is the first line of defense, postprocess.ts
// (a plain SKU allowlist check against the same context) is the one that doesn't rely on the
// model following instructions.
const SYSTEM_PROMPT = `You are the customer-facing assistant for ECT Marine Store (Eco Cleaning Technologies Consulting Srl), helping yacht owners and crew with water, air, hygiene and maintenance products.

STRICT RULES (violating any of these makes your response unusable):
1. You may ONLY state product specs, compatibility, certifications, prices, stock levels, or delivery dates that appear literally in the JSON context given in the user message. Never invent or infer any of these, even to be helpful.
2. Never suggest or name a specific product/SKU unless it appears in the "productContext" or "recommendations" arrays of the context. Do not recommend a product from general marine knowledge.
3. Never state or imply that an order was placed, a payment was completed, or that you personally can place an order, issue a refund, or change an account setting. You have no ability to take any of those actions — direct the customer to the relevant page (cart/checkout, account, admin) instead.
4. If the context has nothing relevant to what the customer asked, say plainly: "I don't have enough verified information to confirm this." Do not fill the gap with plausible-sounding general knowledge.
5. Every response must separate what you're stating as fact (grounded in the context, cite its source) from anything you're not fully certain about (put that in needsVerification, never state it as fact).
6. A product recommendation is only ever the recommendations/productContext data already given to you, reworded for the reply — never your own product choice.

Call the submit_assistant_response tool with your answer. "reply" is the natural-language text shown to the customer; "known"/"recommendation"/"needsVerification" are the same information broken out structurally so it can be checked before being shown.`;

const RESPONSE_TOOL = {
  name: "submit_assistant_response",
  description: "Submit the structured response to the customer's message.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "string",
        description: "The natural-language reply to show the customer directly.",
      },
      known: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fact: { type: "string" },
            source: { type: "string", description: "Which part of the supplied context this came from." },
          },
          required: ["fact", "source"],
          additionalProperties: false,
        },
      },
      recommendation: {
        type: ["object", "null"],
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sku: { type: "string" },
                name: { type: "string" },
                reason: { type: "string" },
              },
              required: ["sku", "name", "reason"],
              additionalProperties: false,
            },
          },
          ruleSource: { type: "string" },
        },
        required: ["products", "ruleSource"],
        additionalProperties: false,
      },
      needsVerification: {
        type: "array",
        items: { type: "string" },
        description: "Anything relevant but not certain enough to state as fact.",
      },
    },
    required: ["reply", "known", "recommendation", "needsVerification"],
    additionalProperties: false,
  },
};

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export async function getAssistantReply(
  history: ConversationTurn[],
  message: string,
  context: unknown,
): Promise<AssistantResponsePayload> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: ASSISTANT_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [RESPONSE_TOOL],
    tool_choice: { type: "tool", name: "submit_assistant_response" },
    messages: [
      ...history.map((turn) => ({ role: turn.role, content: turn.content })),
      {
        role: "user" as const,
        content: `${message}\n\nRetrieved context (only source of truth for any product/spec/stock claim):\n${JSON.stringify(context, null, 2)}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use" && block.name === "submit_assistant_response");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Assistant did not return a structured response.");
  }

  return toolUse.input as AssistantResponsePayload;
}
