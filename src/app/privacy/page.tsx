import { LegalPage } from "@/components/legal/legal-page";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Privacy Policy — ECT Marine Store" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Last updated: 20 September 2026.</p>
      <p>
        This notice explains how personal data is processed when you use ECT Marine Store,
        pursuant to art. 13 of Regulation (EU) 2016/679 (GDPR).
      </p>

      <h2>1. Data controller</h2>
      <p>
        {COMPANY.legalName}, {COMPANY.addressLine1}, {COMPANY.addressLine2} — VAT no.{" "}
        {COMPANY.vatNumber} — PEC {COMPANY.pec}. Use the PEC address for any privacy request.
      </p>

      <h2>2. Data we process, why, and on what basis</h2>
      <ul>
        <li>
          <strong>Account and contact data</strong> (name, email, phone, password credentials,
          delivery and billing addresses) — to create and manage your account and deliver
          orders. Basis: performance of a contract.
        </li>
        <li>
          <strong>Orders and payments</strong> (products, amounts, order status, shipment and
          tracking details, payment outcome). Card data is entered on Stripe&rsquo;s page and never
          reaches us. Basis: performance of a contract; legal obligations.
        </li>
        <li>
          <strong>Billing and fiscal data</strong> (tax code, VAT number, PEC, SDI code) — to
          issue invoices or receipts. Basis: legal obligation (tax and accounting law).
        </li>
        <li>
          <strong>Yacht, equipment and maintenance data</strong> (vessel name and details,
          equipment, filters and replacement dates, service requests, water and air sample
          registrations including any photos, sampling points and readings you enter) — to
          provide the My Yacht features you use. Basis: performance of a contract / your request.
        </li>
        <li>
          <strong>Product requests</strong> (name, email, phone, message) — to reply to your
          request about an unavailable product. Basis: pre-contractual measures at your request.
        </li>
        <li>
          <strong>AI assistant conversations</strong> — the messages you write to &ldquo;Ask
          ECT&rdquo; and the replies, to answer your questions. Please do not enter sensitive
          personal information. Basis: performance of the service you request.
        </li>
        <li>
          <strong>Technical and security data</strong> (session, logs, audit records of
          administrative actions) — to keep the service secure and prevent abuse. Basis:
          legitimate interest.
        </li>
      </ul>
      <p>
        Providing the data marked as needed for your account, order or invoice is required to
        use those features; without it we cannot complete the order or issue the document.
      </p>

      <h2>3. Recipients</h2>
      <p>Data is processed on our behalf, or shared where needed, with:</p>
      <ul>
        <li>Supabase — database, authentication and file storage (EU region, Ireland);</li>
        <li>Vercel — website hosting;</li>
        <li>Stripe — online payments (Stripe also acts as an independent controller for payment and anti-fraud purposes);</li>
        <li>Resend — transactional emails (order confirmations, shipping notices, reminders);</li>
        <li>Anthropic — AI model that generates the assistant&rsquo;s replies;</li>
        <li>Fatture in Cloud — issuing invoices and receipts;</li>
        <li>carriers and couriers — delivery of your order;</li>
        <li>accountants, consultants and authorities where required by law.</li>
      </ul>
      <p>
        Some of these providers (for example Vercel and Anthropic) are based in, or may process
        data in, countries outside the European Economic Area, notably the United States. In
        those cases transfers rely on the safeguards provided by the GDPR, such as the European
        Commission&rsquo;s adequacy decision for certified US companies or standard contractual
        clauses. The shipment tracking link in your order page opens an external tracking website
        with its own privacy policy.
      </p>

      <h2>4. Retention</h2>
      <p>
        Account data is kept while your account exists, and AI conversations until you delete
        your account or ask us to delete them. Order, invoice and accounting records are kept for
        the periods required by law (generally 10 years for accounting records). After that
        data is deleted or anonymised.
      </p>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        The site uses only technical storage that is necessary for it to work: session cookies
        to keep you signed in, and your browser&rsquo;s local storage to remember your shopping cart.
        We do not use analytics, advertising or profiling cookies, so no consent banner is
        shown. If this changes we will update this notice and ask for your consent first.
      </p>

      <h2>6. Automated decisions</h2>
      <p>
        We do not take decisions based solely on automated processing that produce legal or
        similarly significant effects on you. The AI assistant provides informational
        suggestions only.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You can ask us for access to your data, rectification, erasure, restriction of
        processing, portability, and object to processing based on legitimate interest, by
        writing to {COMPANY.pec}. You also have the right to lodge a complaint with the Italian
        data protection authority, the Garante per la protezione dei dati personali
        (garanteprivacy.it).
      </p>
    </LegalPage>
  );
}
