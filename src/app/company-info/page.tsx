import { SiteHeader } from "@/components/nav/site-header";
import { SiteFooter } from "@/components/nav/site-footer";

export const metadata = {
  title: "Company information — ECT Marine Store",
};

const FIELDS: { label: string; value: string }[] = [
  { label: "Ragione sociale", value: "Eco Cleaning Technologies Consulting Srl" },
  { label: "Sede legale", value: "Via di Pratale 28, 56127 Pisa (PI), Italia" },
  { label: "Partita IVA / Codice Fiscale", value: "02488080504" },
  { label: "REA", value: "PI-257266" },
  { label: "Capitale sociale", value: "€ 10.000,00 i.v." },
  { label: "PEC", value: "ecocleaningtechnologies@lamiapec.it" },
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
