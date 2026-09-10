import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Company information — ECT Marine Store",
};

const FIELDS: { label: string; value: string }[] = [
  { label: "Ragione sociale", value: COMPANY.legalName },
  { label: "Sede legale", value: `${COMPANY.addressLine1}, ${COMPANY.addressLine2}` },
  { label: "Partita IVA / Codice Fiscale", value: COMPANY.vatNumber },
  { label: "REA", value: COMPANY.rea },
  { label: "Capitale sociale", value: COMPANY.shareCapital },
  { label: "PEC", value: COMPANY.pec },
];

export default function CompanyInfoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-medium">Company information</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Legal details for Eco Cleaning Technologies Consulting Srl, disclosed pursuant to
          art. 2250 of the Italian Civil Code and D.Lgs. 70/2003.
        </p>
        <dl className="divide-y divide-border rounded-md border border-border">
          {FIELDS.map((field) => (
            <div key={field.label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="w-48 shrink-0 text-sm font-medium text-muted-foreground">{field.label}</dt>
              <dd className="text-sm">{field.value}</dd>
            </div>
          ))}
        </dl>
      </main>
      <SiteFooter />
    </>
  );
}
