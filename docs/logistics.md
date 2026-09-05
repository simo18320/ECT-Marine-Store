# ECT Marine Store — Logistics

Status: **Draft for approval**.

## 1. Scope

Tracks both directions of movement:
- **Outbound** — `orders` → `shipments` (order_id set) → customer.
- **Inbound** — `supplier_orders` → `shipments` (supplier_order_id set) → ECT warehouse.

A `shipments` row always has exactly one of `order_id` / `supplier_order_id` set (DB CHECK
constraint) — one table, two directions, so a future unified tracking view doesn't need a UNION.

## 2. Status model

`shipment_status`: `ORDERED → PROCESSING → READY_TO_SHIP → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY
→ DELIVERED`, with `DELAYED` and `EXCEPTION` reachable from any in-flight state. Status in MVP is
**manually updated** by an ECT operator (admin dashboard action) or, once a courier is manually
told a tracking number, by pasting a status from the courier's own tracking page — no live courier
webhook in MVP.

## 3. Provider abstraction

No courier is hard-coded. `shipments.provider` is a free-text/enum-ready column, and the service
layer defines the shape a future integration must satisfy:

```ts
interface ShippingProvider {
  getQuote(params: ShipmentParams): Promise<LogisticsQuote>
  createShipment(params: ShipmentParams): Promise<{ trackingNumber: string }>
  getTrackingStatus(trackingNumber: string): Promise<ShipmentStatus>
}
```

MVP ships zero implementations of this interface — shipping selection and tracking entry are
manual admin-dashboard actions writing directly to `shipments`/`logistics_quotes`. The interface
exists now so a V2 courier integration is "implement `ShippingProvider` for DHL/UPS/etc." rather
than a schema change.

## 4. Shipping optimization (future)

`logistics_quotes` stores manually-entered comparison quotes in MVP (`provider`, `price`,
`estimated_days`). The V2/V3 comparison logic (`CHEAPEST` / `FASTEST` / `BEST_VALUE`, weighing
price, weight, dimensions, destination, urgency, reliability, tracking, restrictions per §25) reads
the same table — no restructure needed, just an automated writer instead of a manual one.

## 5. What's deferred to V2+

Courier API integration (tracking + label purchase), automatic delay detection, and
weight/dimension-based automated rate shopping. See roadmap.md.
