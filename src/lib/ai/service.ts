"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { detectProblem } from "@/lib/recommendations/problems";
import {
  getCustomerContext,
  getProductContext,
  getRecommendations,
  getYachtContext,
  type Retrieved,
} from "./retrieval";
import { extractCriteria } from "./intent";
import { toListItem, PRODUCT_LIST_SELECT, type ProductListItem, type RawProductListRow } from "@/lib/products/queries";
import { getAssistantReply, ASSISTANT_MODEL, type ConversationTurn } from "./client";
import { checkAllowlist, FALLBACK_MESSAGE, type AssistantResponsePayload } from "./postprocess";
import type { Json } from "@/types/database";

export interface AssistantTurnResult {
  conversationId: string;
  reply: string;
  known: AssistantResponsePayload["known"];
  needsVerification: string[];
  /** Catalogue products the reply recommends, already checked against this turn's retrieved SKUs. */
  products: ProductListItem[];
}

async function getOrCreateConversation(profileId: string, conversationId: string | null, yachtId: string | null) {
  const supabase = await createClient();

  if (conversationId) {
    const { data } = await supabase.from("ai_conversations").select("id").eq("id", conversationId).maybeSingle();
    if (data) return data.id;
  }

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ profile_id: profileId, yacht_id: yachtId })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not start a conversation.");
  return data.id;
}

export async function sendAssistantMessage(
  conversationId: string | null,
  message: string,
  yachtId: string | null,
): Promise<AssistantTurnResult> {
  const trimmed = message.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/find-product");

  const conversation = await getOrCreateConversation(user.id, conversationId, yachtId);

  const { data: priorMessages } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversation)
    .order("created_at", { ascending: true })
    .limit(20);
  const history: ConversationTurn[] = (priorMessages ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  await supabase.from("ai_messages").insert({ conversation_id: conversation, role: "user", content: trimmed });

  // Deterministic engines first (ai-engine.md's pipeline diagram) — Claude only ever explains
  // what these already resolved, it never picks a product or an equipment record on its own.
  const problem = detectProblem(trimmed);
  const criteria = await extractCriteria(trimmed);
  const [customerContext, yachtContext, productContext, recommendations] = await Promise.all([
    getCustomerContext(user.id),
    yachtId ? getYachtContext(yachtId) : Promise.resolve(null),
    getProductContext(trimmed, criteria),
    problem ? getRecommendations(problem.id, yachtId ?? undefined) : Promise.resolve(null),
  ]);

  const allowedSkus = new Set<string>([
    ...productContext.data.map((p) => p.sku),
    ...(recommendations?.data.map((r) => r.product.sku) ?? []),
    ...(yachtContext?.data?.filters.map((f) => f.productSku).filter((sku): sku is string => sku !== null) ?? []),
  ]);

  const context = {
    customer: describe(customerContext),
    yacht: yachtContext ? describe(yachtContext) : null,
    productContext: describe(productContext),
    recommendations: recommendations ? describe(recommendations) : null,
  };

  let payload: AssistantResponsePayload;
  try {
    payload = await getAssistantReply(history, trimmed, context);
  } catch {
    payload = { reply: FALLBACK_MESSAGE, known: [], recommendation: null, needsVerification: [] };
  }

  const { allowed, violations } = checkAllowlist(payload, allowedSkus, trimmed);
  if (!allowed) {
    // Code-enforced backstop (ai-engine.md §3) — a SKU outside this turn's retrieved context was
    // mentioned, so the model's response is discarded wholesale rather than trying to patch it.
    console.warn("AI assistant response rejected for unverified SKU mention(s):", violations);
    payload = { reply: FALLBACK_MESSAGE, known: [], recommendation: null, needsVerification: [] };
  }

  await supabase.from("ai_messages").insert({ conversation_id: conversation, role: "assistant", content: payload.reply });
  await supabase.from("ai_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation);

  if (payload.recommendation && payload.recommendation.products.length > 0) {
    const dataSources = [
      "supabase:products",
      ...(recommendations && recommendations.data.length > 0 ? ["supabase:recommendation_engine"] : []),
      ...(yachtContext?.data ? ["supabase:yacht_context"] : []),
    ];

    await supabase.from("ai_recommendations").insert({
      conversation_id: conversation,
      profile_id: user.id,
      yacht_id: yachtId,
      input: { message: trimmed },
      data_sources: dataSources,
      recommendation: payload.recommendation as unknown as Json,
      // Every product here already passed the same verified-compatibility filter as the
      // deterministic recommendation engine (business-rules.md §4) — unlike AI-sourced supplier
      // discovery (procurement.md §3), there is no genuine model-estimated uncertainty to report.
      confidence: 1.0,
      model: ASSISTANT_MODEL,
    });
  }

  // Cards are only ever the recommended SKUs that survived the allowlist above, loaded fresh
  // from the catalogue — the model's own wording never reaches the grid.
  const recommendedSkus = (payload.recommendation?.products ?? []).map((p) => p.sku);
  let products: ProductListItem[] = [];
  if (recommendedSkus.length > 0) {
    const { data } = await supabase.from("products").select(PRODUCT_LIST_SELECT).eq("is_active", true).in("sku", recommendedSkus);
    const bySku = new Map(((data ?? []) as unknown as RawProductListRow[]).map(toListItem).map((p) => [p.sku, p]));
    products = recommendedSkus.map((sku) => bySku.get(sku)).filter((p): p is ProductListItem => Boolean(p));
  }

  return {
    conversationId: conversation,
    reply: payload.reply,
    known: payload.known,
    needsVerification: payload.needsVerification,
    products,
  };
}

function describe<T>(retrieved: Retrieved<T>) {
  return { data: compact(retrieved.data), source: retrieved.source, asOf: retrieved.asOf };
}

// Only what a customer-facing answer can use. Whole database rows carried search vectors, internal
// flags and ids: wasted tokens, and nothing the model should ever be able to repeat.
const PRODUCT_FIELDS = [
  "sku",
  "name",
  "short_description",
  "selling_price",
  "vat_rate",
  "unit",
  "technical_specs",
  "availability_status",
  "delivery_estimate",
  "certifications",
  "requires_compliance_ack",
] as const;

function compactProduct(p: Record<string, unknown>) {
  return Object.fromEntries(PRODUCT_FIELDS.filter((k) => p[k] !== undefined && p[k] !== null).map((k) => [k, p[k]]));
}

function compact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.sku === "string" && "selling_price" in obj) return compactProduct(obj);
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, compact(v)]));
  }
  return value;
}
