import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, account_type, created_at")
    .eq("id", user.id)
    .single();

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Image
              src="/images/logo-wordmark.png"
              alt="Eco Cleaning Technologies"
              width={1694}
              height={260}
              className="h-8 w-auto"
            />
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-2xl font-semibold">My Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {profile?.email ?? user.email}.
        </p>

        <dl className="mt-8 grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
          <dt className="text-muted-foreground">Full name</dt>
          <dd>{profile?.full_name ?? "—"}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize">{profile?.role?.replace(/_/g, " ") ?? "customer"}</dd>
          <dt className="text-muted-foreground">Account type</dt>
          <dd className="capitalize">{profile?.account_type ?? "individual"}</dd>
          <dt className="text-muted-foreground">Member since</dt>
          <dd>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </dd>
        </dl>

        <div className="mt-10 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          Orders, addresses, My Yacht and maintenance history land here in later phases (see{" "}
          <code>docs/implementation-plan.md</code>).
        </div>
      </main>
    </>
  );
}
