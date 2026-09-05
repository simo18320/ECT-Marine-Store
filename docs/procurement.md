# ECT Marine Store — Procurement

Status: **Draft for approval**.

## 1. Flywheel this supports

```
CUSTOMER ORDER → INVENTORY CHECK → available? → YES: ship
                                              → NO: AI PROCUREMENT → SUPPLIER COMPARISON
                                                 → LANDED COST → ECT APPROVAL → PURCHASE ORDER
                                                 → SUPPLIER → LOGISTICS → CUSTOMER
```

MVP implements every box except the fully-automated middle: supplier discovery is
semi-automated, and everything after "landed cost" is a human-driven admin workflow, not a
background job.

## 2. Supplier lifecycle

`suppliers.status`: `DISCOVERED → UNDER_REVIEW → QUALIFIED → APPROVED → PREFERRED`, with `BLOCKED`
reachable from any state. A supplier discovered via AI/web search starts at `DISCOVERED` with
`source` and `confidence` set; it cannot be selected for an actual `supplier_orders` row until an
ECT admin manually advances it to at least `QUALIFIED`. This is a hard rule, not a UI nicety — the
service layer (`lib/suppliers/service.ts`) rejects creating a `supplier_orders` row against a
`DISCOVERED` or `UNDER_REVIEW` supplier.

## 3. Supplier discovery (AI-assisted)

Input: SKU/spec, quantity, target delivery, destination (matches §19 of the master spec exactly).
Output rows (`supplier_products` + a `suppliers` row per new supplier found) always carry:

| Field | Notes |
|---|---|
| Source | e.g. "web search", "manufacturer site", "existing ECT contact" |
| Confidence | 0–1, model-estimated, never fabricated as certainty |
| Status label shown to admin | `SOURCE VERIFIED` / `SOURCE UNVERIFIED` / `REQUIRES ECT VALIDATION` |

**Never** presented as an approved ECT supplier until a human changes `status`. This mirrors the
AI safety rule in business-rules.md §4 for compatibility — discovery output is a lead, not a fact.

MVP note: "AI web/search integration" depends on which search tool is wired up when Phase 7 starts
(no such integration exists yet in this codebase) — semi-automated for MVP means an ECT admin can
paste in candidate supplier info and the AI structures/summarizes it, rather than the system
autonomously crawling the web.

**As shipped in Phase 7:** no AI integration exists yet at all (that's Phase 8's ai-engine.md), so
"semi-automated" for now means plain manual entry — `/admin/suppliers` is a CRUD form, not an
AI-assisted paste-and-structure flow. `source`/`confidence` remain on the schema and the UI shows
them when set, ready for Phase 8 to populate; a manually-entered supplier simply leaves them null.

## 4. Landed cost engine

See business-rules.md §1 for the formula. Implementation note: `supplier_quotes.landed_cost` is
computed server-side (`lib/suppliers/rules.ts`) the moment a quote has enough fields to compute it
(unit price + shipping + at minimum one of duties/handling), and left `null` otherwise — the UI
must render "incomplete — purchase price only" rather than a number when any component is missing
(§21 "never use an incomplete cost calculation while presenting a margin as definitive").

`supplier_quotes` only had a `shipping_cost` column from migration `0005` — no columns existed to
check duties/handling completeness against. Migration `0015` adds `duties_cost`/`handling_cost` so
this rule has something to actually gate on; `payment_costs`/`other_known_costs` from
business-rules.md §1's full formula stay a V2 addition.

## 5. RFQ engine

Admin selects product, quantity, spec, destination, requested delivery date, and one or more
suppliers → system generates a standardized RFQ row (`rfqs` + `rfq_suppliers`). Claude may draft
the RFQ *text* (a formatted request document/email body) from these structured fields, but:

- The RFQ is not transmitted to any supplier automatically — MVP requires an admin to actually
  send it (copy the draft into email, or a manual "mark as sent" action that just updates
  `rfq_suppliers.sent_at`).
- Supplier responses are entered manually into `supplier_quotes` in MVP (no inbound-email parsing).

**As shipped in Phase 7:** `lib/suppliers/rfq-draft.ts` generates that text as a deterministic
template from the structured fields, not an actual Claude call — no AI integration exists in this
codebase yet (Phase 8). It still satisfies the rule above either way: nothing is ever sent
automatically, an admin always reviews the text and sends it themselves.

## 6. Approval gate

```
AI/manual recommendation → RFQ → supplier_quotes → ECT approval (human) → supplier_orders (PO)
```

No automatic purchasing in MVP (§23). `supplier_orders.approved_by`/`approved_at` must be set by
an `ect_admin`+ before a PO can move out of `draft`. The future auto-approval rule (preferred
supplier + approved SKU + order < €500 + stock below reorder point) is documented as the V2 target
in [roadmap.md](roadmap.md) — the schema already supports flipping it on without migration.

## 7. Supplier scoring surfaced here

Uses the weighted formula in business-rules.md §6. The procurement dashboard (Phase 7) shows, per
open RFQ, its quotes ranked by score with `BEST_PRICE`/`FASTEST`/`BEST_VALUE`/`PREFERRED_SUPPLIER`
labels — these are computed at render time from `supplier_quotes`, not persisted as a separate
"winner" field, so re-weighting the formula later doesn't require a data migration.

## 8. What's deferred to V2+

Automated RFQ transmission, inbound quote parsing, autonomous web-based supplier discovery beyond
semi-automated drafting, and the auto-approval threshold going live. See roadmap.md.
