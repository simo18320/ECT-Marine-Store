# ECT Marine Store — Security

Status: **Partially implemented** — RLS, roles, and Auth are live (Phase 1); catalogue browsing is
live (Phase 2); rate-limit config and GDPR data-retention mechanics are still design only. This
file must stay in sync with the actual code (§54 of the master spec); treat drift between this doc
and `database/migrations/0009_rls_policies.sql` / `0010_security_hardening.sql` /
`0013_availability_computed_field.sql` as a bug.

## 1. Roles

`user_role` enum: `customer`, `b2b_user`, `b2b_admin`, `ect_operator`, `ect_admin`, `super_admin`,
stored on `profiles.role`. **Correction from the original design:** role is *not* mirrored into a
JWT custom claim — RLS policies call a `stable security definer` SQL helper
(`private.is_ect_staff()` / `private.is_ect_admin()`) that looks up `profiles.role` for
`auth.uid()` on each check. This is a live DB read per policy evaluation rather than a JWT claim
read, which is simpler and was fast enough to ship with; revisit only if it shows up as a real
bottleneck. These helper functions live in a `private` schema (not `public`) specifically so
PostgREST never exposes them as directly callable RPC endpoints — `authenticated`/`anon` still have
`EXECUTE` on them (required for RLS policy evaluation), they're just not reachable via
`/rest/v1/rpc/...`. See migration `0010_security_hardening.sql`.

## 2. Enforcement layers

1. **Database (RLS)** — the real boundary. Every tenant-scoped table has RLS enabled; app code
   bugs cannot leak cross-tenant data because the DB itself refuses the row.
2. **Server-side route guard** — `admin/*` routes and Server Actions re-check role before doing
   anything, so a UI bug never even issues the RLS-protected query on behalf of the wrong intent.
3. **Client** — role gates what's rendered, purely for UX; never trusted for authorization.

## 3. Payments

- Stripe secret key and webhook signing secret are server-only env vars.
- Every webhook request's signature is verified before the payload is trusted (see
  business-rules.md §8 for the idempotency rule).
- Client never sends or receives a raw amount that gets written to `orders`/`payments` — the
  webhook is the only writer of financial status.

## 4. Secrets & environment

Following the same pattern as `yacht-environmental-dashboard/.env.example`:
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only client-exposed values;
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`,
`RESEND_API_KEY`, `CRON_SECRET` are server-only. No secret is ever committed — `.env.local` stays
gitignored.

## 5. Rate limiting

Applied at the API route boundary for unauthenticated/high-abuse-risk endpoints (checkout session
creation, AI assistant, search) once Phase 2/8 land — not a Phase 1 blocker, but the route
structure under `app/api/` should keep these handlers thin enough to wrap with a limiter without
rewriting them later.

## 6. Audit logging

`audit_logs` (database.md §0008) captures actor, action, entity, before/after JSON for admin
mutations (product edits, price changes, order status overrides, supplier status changes) — written
explicitly by the relevant service function, not inferred from DB triggers, so the "why" context
that a trigger can't know is captured too.

## 7. Public availability without exposing raw inventory

`inventory` is staff-only under RLS (business-rules.md §2 raw stock counts are operationally
sensitive), but the storefront needs to show "In stock" / "Low stock" / "Out of stock". This is
computed by `availability_status(products)` (migration `0013`), a `security definer` function
taking the product row as its argument — PostgREST's "computed field" pattern, selectable as if it
were a real column (`select=sku,availability_status`). It only ever returns the coarse status,
never `current_stock`/`reserved_stock`/`reorder_point`. An earlier attempt (`0012`, a plain view)
was correctly flagged ERROR by the Supabase advisor (`security_definer_view`) and was replaced
rather than left in place.

## 8. Accepted advisor findings

Two WARN-level findings are deliberately left as-is, not overlooked:
- **`citext` installed in the `public` schema.** Moving it would mean recreating
  `profiles.email`'s type dependency; low actual risk, not worth the churn this early (see
  migration `0010`'s header comment).
- **`availability_status` is directly RPC-callable by `anon`/`authenticated`.** It has to be —
  that's what makes it selectable as a computed field on the public `products` listing. The only
  information it discloses is the coarse stock status of a product that's already publicly
  readable, so the direct-RPC path adds no meaningful new exposure.

## 9. GDPR readiness

Deferred detail to Phase 1+ implementation, but the schema already supports it without rework:
- Account deletion: `profiles` cascades are scoped so deleting a profile doesn't silently delete
  financial records ECT is legally required to retain (`orders`/`payments` reference `customer_id`
  but should anonymize rather than cascade-delete — implement as a service function, not a raw
  `ON DELETE CASCADE`).
- Data export: all customer-owned data is reachable by `customer_id`/`profile_id` FK, so a
  "download my data" job is a set of scoped queries, not a schema hunt.
- Minimization: no unnecessary PII columns were added speculatively in the MVP schema.
