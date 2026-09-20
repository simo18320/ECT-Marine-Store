import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { AssistantChat } from "@/components/assistant/chat";
import { createClient } from "@/lib/supabase/server";
import { getYachtsForUser } from "@/lib/yachts/queries";

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/assistant");

  const yachts = await getYachtsForUser();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="flex items-center gap-3 text-3xl font-medium">
          Ask ECT
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            AI assistant
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A quick way to ask about products, compatibility, or your yacht&rsquo;s maintenance —
          grounded only in what ECT has on file, never a guess.
        </p>
        <p className="mt-3 mb-6 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          You are chatting with an artificial-intelligence assistant, not a person. Answers may
          contain errors — confirm anything critical with ECT before ordering or acting on it.
          Your messages are processed by an external AI provider — see our{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <AssistantChat yachts={yachts.map((y) => ({ id: y.id, name: y.name }))} />
      </main>
      <SiteFooter />
    </>
  );
}
