# ECT Marine Store — AI Engine

Status: **Draft for approval**.

## 1. Role of the AI

Claude (via `@anthropic-ai/sdk`, same dependency already used in `yacht-environmental-dashboard`)
is a **reasoning and interpretation layer over Supabase data**. It is not the database, not the
compatibility engine, and not the recommendation engine — those are deterministic (business-rules.md
§4–§5). Claude explains, summarizes, and converses; it does not decide what is compatible or in
stock.

```
User question
   ↓
lib/ai/retrieval.ts   — pulls structured, scoped data from Supabase (never a raw SQL string from Claude)
   ↓
Deterministic engines — compatibility filter, recommendation ranking, replacement-status calc
   ↓
Claude — given ONLY the retrieved+ranked data as context, asked to explain/converse in natural language
   ↓
Response, tagged: known information / recommendation / requires technical verification
```

## 2. Data access contract

The retrieval layer exposes a small set of typed functions Claude's context is built from —
Claude never receives raw table access or write access:

- `getCustomerContext(profileId)` → profile, company, past orders (summary), saved yachts.
- `getYachtContext(yachtId)` → yacht profile, registered equipment, filters, open maintenance.
- `getProductContext(query | equipmentType)` → catalogue rows **already filtered** through
  `product_compatibility` (business-rules.md §4) and current `inventory.available_stock`.
- `getRecommendations(problem, yachtId?)` → output of the deterministic recommendation engine only.
- `getReplacementStatus(yachtId)` → `replacement_schedules` rows with computed status.

Each of these functions returns `{ data, source: 'supabase', asOf: timestamp }`. The prompt
assembled for Claude includes this provenance so the model can (and must) say *when* the answer
uses a source that might be stale, rather than presenting everything as equally current.

**As shipped in Phase 8:** `getReplacementStatus` doesn't read a `replacement_schedules` table —
there still isn't a writer for it (business-rules.md §3's Phase 5 correction stands: staff/cron-
only, nothing populates it in MVP). It's the same live computation `getYachtContext` already does
(`lib/maintenance/rules.ts`), exposed as its own retrieval function only because this contract
names it separately. `getProductContext` is `lib/products/queries.ts`'s existing full-text search
(`search_vector`, already availability-filtered via the Phase 0 computed field) rather than a new
equipment-type lookup — a customer's free-text message is matched by search, not by picking an
equipment type first; `getRecommendations` still goes through the equipment-type path when the
message matches the fixed problem taxonomy (`lib/recommendations/problems.ts`'s new
`detectProblem`, keyword-matched, same taxonomy Phase 6's "Find the right product" uses).

## 3. Hard safety rules (enforced in code, not just prompted)

Matches §18/§48 of the master spec, made concrete:

| Rule | Enforcement |
|---|---|
| Never invent specs, compatibility, certifications, supplier prices, stock, or delivery dates | Claude only ever sees data already resolved by the retrieval layer; the system prompt forbids adding anything not in that context, and responses are checked for product/SKU mentions not present in the supplied context before being shown (basic allowlist check in `lib/ai/postprocess.ts`) |
| Never claim an order was placed or payment completed | The AI assistant has **no write access** — no tool/function call in its toolset can create an order, a payment, or a supplier order. Those actions require the normal checkout/admin UI. |
| Never bypass compatibility validation | Recommendations always pass through `getRecommendations`, which itself filters via `product_compatibility` — there is no code path where Claude's own text becomes a product suggestion without that filter. |
| Distinguish known / recommended / needs-verification | Required structure in every substantive response (see §5 response contract below); enforced by prompt + a lightweight schema check on the model output. |
| Say "I don't have enough verified information to confirm this" when data is missing | Default fallback when a retrieval function returns no rows, rather than letting the model free-associate. |

## 4. Conversation & logging

- `ai_conversations` / `ai_messages` store the raw turn history per user (RLS: owner + `ect_operator`+).
- `ai_recommendations` stores every recommendation surfaced through the AI path (not just the
  deterministic engine's direct output) with `input`, `data_sources`, `recommendation`,
  `confidence`, `model`, `timestamp`, `user`, and `outcome` (nullable, filled in later if the
  customer orders the recommended product — the closing of this loop is what eventually feeds
  §31's learning pipeline).

## 5. Response contract

Every AI assistant response that includes a product/technical claim is structured internally as:

```json
{
  "known": ["facts pulled directly from retrieval, with source"],
  "recommendation": { "products": [...], "rule_source": "..." } ,
  "needs_verification": ["anything the assistant is not certain enough to state as fact"]
}
```

This is rendered as natural prose to the user, but keeping the structure server-side is what lets
`lib/ai/postprocess.ts` reject a response that states a product claim outside the `known`/
`recommendation` set.

## 6. What "AI learning" means here (and doesn't, yet)

Per §31 of the master spec: storing history is not learning. For MVP, "learning" is retrieval +
rules + Claude reasoning only. `ai_recommendations.outcome` is captured from day one specifically
so that a real pipeline (ingestion → validation → feature extraction → historical dataset →
model/rule evaluation → prediction → outcome tracking → improvement) has real data to start from
when it's built in V3, without needing a backfill migration.

## 7. Procurement AI (separate concern, see procurement.md)

Supplier discovery is a distinct AI use case from the customer-facing assistant: different data
(external web/search results, not Supabase), different safety rules (source + confidence labeling,
never auto-approving a supplier), and different audience (ECT staff only). It's specified in
[procurement.md](procurement.md) rather than here to keep the customer-facing contract clean.

## 8. MVP scope for this section (Phase 8, days 26–27)

- Customer-facing assistant: product Q&A, maintenance explanations, yacht-aware answers, using the
  retrieval contract above.
- No procurement AI automation yet beyond a manually-triggered "draft an RFQ" text-generation
  helper (human sends it) — see procurement.md §RFQ engine.
