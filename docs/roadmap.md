# ECT Marine Store — Roadmap (post-MVP)

Status: **Draft for approval**. Day-by-day MVP plan is in
[implementation-plan.md](implementation-plan.md); this file starts where that one ends.

## V2 — automation of what MVP does manually

- AI supplier discovery: real web/search integration replacing the semi-automated (admin-pastes,
  AI-structures) Phase 7 workflow.
- Automated RFQ transmission (email send) and inbound quote parsing.
- Courier integrations: first real implementation(s) of the `ShippingProvider` interface
  (logistics.md §3) — pick 1–2 couriers ECT actually uses.
- Supplier scoring weights become admin-editable in the dashboard (currently config-in-code).
- B2B negotiated pricing (`companies` price lists) exposed in checkout.
- Auto-reorder for a defined "auto-approved" envelope: preferred supplier + approved SKU + order
  < €500 + stock below reorder point (business-rules.md §7) — everything else keeps requiring
  approval.
- Subscriptions / scheduled replacement auto-reorder for consumer accounts (§38).

## V3 — prediction and sensor integration

- Predictive procurement: expected demand from sales history + replacement intervals +
  seasonality + supplier lead times (§27).
- Eco Air Sense sensor ingestion goes live: `sensor_readings` gets a real writer (API or shared
  event stream from the sibling app), `air_quality_devices` becomes populated, and AI analysis
  starts reading real time-series instead of an empty table.
- Water analysis results feed the recommendation engine (a bad water-test result should be able to
  trigger a product/service recommendation, not just sit in `water_analysis`).
- First real "learning" pipeline per ai-engine.md §6: closes the loop on `ai_recommendations.outcome`.

## V4 — platform maturity

- Full digital yacht twin (equipment + sensor + maintenance + water/air history in one view).
- Predictive maintenance (replacement dates informed by sensor/usage data, not just fixed
  intervals).
- Autonomous procurement within a widened, still-bounded approval envelope.
- Fleet management for management companies/shipyards (multi-yacht dashboards, cross-yacht
  reporting).
- Formal shipyard/management-company account tier with dedicated onboarding.

## Sequencing note

Nothing in V2–V4 requires restructuring MVP tables — see database.md §4 and the "deferred"
sections of ai-engine.md/procurement.md/logistics.md for exactly which columns/tables already
exist waiting for the corresponding feature.
