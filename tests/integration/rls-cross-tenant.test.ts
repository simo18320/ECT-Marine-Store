import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

/**
 * database.md / security.md's core promise: a yacht is only visible to its own owner/crew and
 * ECT staff, never to an unrelated authenticated customer or an anonymous request. Exercised
 * against the real Supabase project with real signed-in sessions (not role-simulated SQL) so this
 * tests the actual RLS policies PostgREST enforces in production, not just the policy SQL in
 * isolation.
 */
const admin = createAdminClient();
const PASSWORD = "Test1234!";

function anonClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function signedInClient(email: string) {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
}

let ownerId: string;
let ownerEmail: string;
let outsiderId: string;
let outsiderEmail: string;
let adminUserId: string;
let adminEmail: string;
let yachtId: string;

beforeAll(async () => {
  const suffix = Date.now();
  ownerEmail = `phase9-rls-owner-${suffix}@ect-marine-store.test`;
  outsiderEmail = `phase9-rls-outsider-${suffix}@ect-marine-store.test`;
  adminEmail = `phase9-rls-admin-${suffix}@ect-marine-store.test`;

  const [ownerRes, outsiderRes, adminRes] = await Promise.all([
    admin.auth.admin.createUser({ email: ownerEmail, password: PASSWORD, email_confirm: true }),
    admin.auth.admin.createUser({ email: outsiderEmail, password: PASSWORD, email_confirm: true }),
    admin.auth.admin.createUser({ email: adminEmail, password: PASSWORD, email_confirm: true }),
  ]);
  if (ownerRes.error || !ownerRes.data.user) throw new Error(ownerRes.error?.message);
  if (outsiderRes.error || !outsiderRes.data.user) throw new Error(outsiderRes.error?.message);
  if (adminRes.error || !adminRes.data.user) throw new Error(adminRes.error?.message);

  ownerId = ownerRes.data.user.id;
  outsiderId = outsiderRes.data.user.id;
  adminUserId = adminRes.data.user.id;

  await admin.from("profiles").update({ role: "ect_admin" }).eq("id", adminUserId);

  const { data: yacht, error: yachtError } = await admin
    .from("yachts")
    .insert({ owner_id: ownerId, name: "Phase 9 RLS Test Yacht" })
    .select("id")
    .single();
  if (yachtError || !yacht) throw new Error(yachtError?.message);
  yachtId = yacht.id;

  await admin.from("yacht_users").insert({ yacht_id: yachtId, profile_id: ownerId, role: "owner" });
});

afterAll(async () => {
  await admin.from("yacht_users").delete().eq("yacht_id", yachtId);
  await admin.from("yachts").delete().eq("id", yachtId);
  await admin.auth.admin.deleteUser(ownerId);
  await admin.auth.admin.deleteUser(outsiderId);
  await admin.auth.admin.deleteUser(adminUserId);
});

describe("yachts RLS", () => {
  it("lets the owner read their own yacht", async () => {
    const client = await signedInClient(ownerEmail);
    const { data } = await client.from("yachts").select("id").eq("id", yachtId);
    expect(data).toHaveLength(1);
  });

  it("hides the yacht from an unrelated authenticated customer (cross-tenant read must fail)", async () => {
    const client = await signedInClient(outsiderEmail);
    const { data, error } = await client.from("yachts").select("id").eq("id", yachtId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0); // RLS filters silently rather than erroring
  });

  it("hides the yacht from an anonymous (signed-out) request", async () => {
    const client = anonClient();
    const { data, error } = await client.from("yachts").select("id").eq("id", yachtId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("lets ECT staff (ect_admin) read every yacht regardless of ownership", async () => {
    const client = await signedInClient(adminEmail);
    const { data } = await client.from("yachts").select("id").eq("id", yachtId);
    expect(data).toHaveLength(1);
  });
});
