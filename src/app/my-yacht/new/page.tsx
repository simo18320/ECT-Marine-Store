import { SiteHeader } from "@/components/nav/site-header";
import { YachtForm } from "@/components/yacht/yacht-form";
import { createYacht } from "@/lib/yachts/actions";

export default function NewYachtPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Add a yacht</h1>
        <YachtForm action={createYacht} submitLabel="Create yacht" />
      </main>
    </>
  );
}
