import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/nav/site-header";
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
        <h1 className="text-3xl font-medium">Ask ECT</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          A quick way to ask about products, compatibility, or your yacht&rsquo;s maintenance —
          grounded only in what ECT has on file, never a guess.
        </p>
        <AssistantChat yachts={yachts.map((y) => ({ id: y.id, name: y.name }))} />
      </main>
    </>
  );
}
