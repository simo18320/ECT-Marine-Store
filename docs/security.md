# ECT Marine Store — Security

Status: **Partially implemented** — RLS, roles, and Auth are live (Phase 1); rate-limit config and
GDPR data-retention mechanics are still Phase 2+ design only. This file must stay in sync with the
actual code (§54 of the master spec); treat drift between this doc and
`database/migrations/0009_rls_policies.sql` / `0010_security_hardening.sql` as a bug.

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

## 7. GDPR readiness

Deferred detail to Phase 1+ implementation, but the schema already supports it without rework:
- Account deletion: `profiles` cascades are scoped so deleting a profile doesn't silently delete
  financial records ECT is legally required to retain (`orders`/`payments` reference `customer_id`
  but should anonymize rather than cascade-delete — implement as a service function, not a raw
  `ON DELETE CASCADE`).
- Data export: all customer-owned data is reachable by `customer_id`/`profile_id` FK, so a
  "download my data" job is a set of scoped queries, not a schema hunt.
- Minimization: no unnecessary PII columns were added speculatively in the MVP schema.
