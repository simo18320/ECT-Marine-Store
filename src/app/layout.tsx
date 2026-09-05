import type { Metadata } from "next";
import { Carlito, Geist_Mono } from "next/font/google";
import "./globals.css";

const bodyFont = Carlito({
  variable: "--font-calibri",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECT Marine Store",
  description:
    "Water, air, hygiene and maintenance products for yachts, engineered by Eco Cleaning Technologies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
