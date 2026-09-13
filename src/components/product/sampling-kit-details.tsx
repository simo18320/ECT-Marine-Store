import Link from "next/link";
import { generateQrDataUrl } from "@/lib/qr/generate";

interface SamplingKitSpecs {
  contents?: string[];
  applications_detail?: string[];
  how_it_works?: string[];
  laboratory_analysis_required?: boolean;
  laboratory_analysis_included?: boolean;
  potential_parameters?: string[];
  regulatory_notes?: string;
  safety_notes?: string;
  qr_enabled?: boolean;
}

// Renders only for products whose technical_specs describe a sampling kit (has a `contents`
// list) — every other product's page is untouched. The one hard rule throughout: a kit is for
// sample collection, never presented as if laboratory analysis is automatically included unless
// laboratory_analysis_included is explicitly set.
export async function SamplingKitDetails({
  productId,
  specs,
  whatIsIt,
}: {
  productId: string;
  specs: SamplingKitSpecs;
  whatIsIt: string | null;
}) {
  const registrationUrl = `/sample-registration?product=${productId}`;
  const qrDataUrl = specs.qr_enabled
    ? await generateQrDataUrl(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${registrationUrl}`)
    : null;

  return (
    <div className="mt-12 flex flex-col gap-10">
      {whatIsIt && (
        <section>
          <h2 className="mb-2 text-xl font-medium">What is it?</h2>
          <p className="max-w-3xl text-muted-foreground">{whatIsIt}</p>
        </section>
      )}

      {specs.contents && specs.contents.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-medium">What is included?</h2>
          <ul className="grid max-w-3xl grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {specs.contents.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {specs.applications_detail && specs.applications_detail.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-medium">Where is it used?</h2>
          <div className="flex max-w-3xl flex-wrap gap-2">
            {specs.applications_detail.map((a) => (
              <span key={a} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {specs.how_it_works && specs.how_it_works.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-medium">How does it work?</h2>
          <ol className="max-w-3xl space-y-2">
            {specs.how_it_works.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-medium">Laboratory analysis</h2>
        <div className="max-w-3xl rounded-2xl border border-border bg-card p-5 text-sm">
          <p className="font-medium">
            This is a sample-collection kit — {specs.laboratory_analysis_included ? "laboratory analysis is bundled with it" : "laboratory analysis is not included"}.
          </p>
          <p className="mt-2 text-muted-foreground">
            {specs.laboratory_analysis_included
              ? "The analysis is arranged as part of this purchase."
              : "Laboratory analysis is arranged separately, with the parameters agreed with your chosen laboratory."}
          </p>
          {specs.potential_parameters && specs.potential_parameters.length > 0 && (
            <>
              <p className="mt-3 font-medium">Potential laboratory parameters</p>
              <p className="mt-1 text-muted-foreground">{specs.potential_parameters.join(", ")}</p>
            </>
          )}
        </div>
      </section>

      {(specs.regulatory_notes || specs.safety_notes) && (
        <section>
          <h2 className="mb-3 text-xl font-medium">Technical notes</h2>
          <div className="max-w-3xl space-y-2 rounded-2xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
            {specs.regulatory_notes && <p>{specs.regulatory_notes}</p>}
            {specs.safety_notes && <p>{specs.safety_notes}</p>}
          </div>
        </section>
      )}

      {specs.qr_enabled && (
        <section>
          <h2 className="mb-3 text-xl font-medium">Digital registration</h2>
          <div className="flex max-w-3xl flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR code to register this sample digitally" className="h-28 w-28 shrink-0" />
            )}
            <div>
              <p className="font-medium">Register your sample digitally with ECT</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Scan the QR code on the kit — or use the link below — to log the vessel, sampling
                point and conditions at the time of collection.
              </p>
              <Link
                href={registrationUrl}
                className="mt-3 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Open the sample registration form
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
