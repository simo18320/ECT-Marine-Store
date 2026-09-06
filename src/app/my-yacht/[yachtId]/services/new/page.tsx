import { SiteHeader } from "@/components/nav/site-header";
import { createServiceRequest } from "@/lib/service-requests/actions";
import { SERVICE_TYPES } from "@/lib/service-requests/types";

export default async function NewServiceRequestPage({ params }: { params: Promise<{ yachtId: string }> }) {
  const { yachtId } = await params;
  const createForYacht = createServiceRequest.bind(null, yachtId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <h1 className="text-3xl font-medium">Book an analysis</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          An ECT technician will confirm your appointment — this books a request, it doesn&rsquo;t
          reserve a specific time slot yet.
        </p>

        <form action={createForYacht} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1 font-medium">What do you need analyzed?</legend>
            {SERVICE_TYPES.map((type) => (
              <label key={type.value} className="flex items-center gap-2">
                <input type="radio" name="service_type" value={type.value} required />
                {type.label}
              </label>
            ))}
          </fieldset>

          <label className="flex flex-col gap-1 text-sm">
            Preferred date (optional)
            <input name="preferred_date" type="date" className="rounded-md border border-input bg-card px-3 py-2" />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Notes for the technician (optional)
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. sample point, symptoms noticed, access instructions"
              className="rounded-md border border-input bg-card px-3 py-2"
            />
          </label>

          <button type="submit" className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
            Request booking
          </button>
        </form>
      </main>
    </>
  );
}
