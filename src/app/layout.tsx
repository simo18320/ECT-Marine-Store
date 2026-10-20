import type { Metadata } from "next";
import { Carlito, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";
import { jsonLd, organizationJsonLd } from "@/lib/seo";

const bodyFont = Carlito({
  variable: "--font-calibri",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// A refined serif for headings only (body text stays on Carlito/Calibri) — the "elegant yacht"
// look the client asked for, applied globally in globals.css rather than per-page so it lands on
// every page without touching each one.
const headingFont = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Water, air, hygiene and maintenance products for yachts, engineered by Eco Cleaning Technologies.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "ECT Marine Store",
  description: DESCRIPTION,
  openGraph: { siteName: "ECT Marine Store", type: "website", title: "ECT Marine Store", description: DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }} />
        {children}
      </body>
    </html>
  );
}
