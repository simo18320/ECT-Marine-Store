import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

const STAFF_ROLES: UserRole[] = ["ect_operator", "ect_admin", "super_admin"];
const ADMIN_ROLES: UserRole[] = ["ect_admin", "super_admin"];

export interface StaffContext {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Server-side route guard (security.md §2 layer 2) — re-checks role even though RLS
 * (layer 1) already enforces it at the database, so a UI bug never even issues the query.
 * ect_operator and above: inventory, orders, customers, audit visibility.
 */
export async function requireStaff(redirectTo = "/admin"): Promise<StaffContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${redirectTo}`);

  const { data: profile } = await supabase.from("profiles").select("role, email").eq("id", user.id).single();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect("/");
  }

  return { userId: user.id, email: profile.email, role: profile.role };
}

/** ect_admin and above only — catalogue structure (products, categories). */
export async function requireAdmin(redirectTo = "/admin"): Promise<StaffContext> {
  const staff = await requireStaff(redirectTo);
  if (!ADMIN_ROLES.includes(staff.role)) {
    redirect("/admin");
  }
  return staff;
}
