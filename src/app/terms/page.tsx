import { LegalPage } from "@/components/legal/legal-page";
import { COMPANY } from "@/lib/company";
import Link from "next/link";

export const metadata = { title: "Terms of Sale — ECT Marine Store" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Sale">
      <p>
        These terms govern purchases on ECT Marine Store from {COMPANY.legalName} (
        {COMPANY.addressLine1}, {COMPANY.addressLine2} — VAT no. {COMPANY.vatNumber} — REA{" "}
        {COMPANY.rea} — PEC {COMPANY.pec}), the &ldquo;Seller&rdquo;. They apply to consumers and to
        business customers unless a clause says otherwise.
      </p>

      <h2>1. Products and prices</h2>
      <p>
        Product descriptions, specifications and availability are those shown on each product page
        when you order. Prices are in euro and shown including VAT at the applicable rate; the price excluding VAT is also shown for business customers, and the order summary breaks down net amount and VAT. Delivery costs, where any, are shown before you confirm the order.
      </p>

      <h2>2. Placing an order and contract</h2>
      <p>
        Your order is an offer to buy. The contract is concluded when the payment is completed
        and we send the order confirmation by email. Before paying you are shown the complete
        order and you must accept these terms and the withdrawal information; the button that
        places the order states that it carries an obligation to pay.
      </p>

      <h2>3. Payment</h2>
      <p>
        Payment is taken online by card or the other methods offered at checkout, processed by
        Stripe. We do not see or store your card details.
      </p>

      <h2>4. Delivery</h2>
      <p>
        Estimated delivery times are shown on the product page (in stock, shipping time, or made
        to order). Products shown as made to order or restocking ship when available and we will
        keep you informed. Tracking details are sent by email and shown on your order page once
        the goods are shipped. Risk passes to you on delivery.
      </p>

      <h2>5. Right of withdrawal</h2>
      <p>
        Consumers have the right to withdraw within 14 days, subject to the exclusions listed in
        the <Link href="/withdrawal" className="text-primary hover:underline">right of withdrawal information</Link>,
        which includes the model form.
      </p>

      <h2>6. Legal guarantee and complaints</h2>
      <p>
        Consumers benefit from the legal guarantee of conformity of two years from delivery
        (Consumer Code arts. 128 ff.). For business customers, defects must be reported within the
        time limits of the Italian Civil Code (art. 1495). Send complaints to {COMPANY.pec},
        quoting your order number and describing the defect.
      </p>

      <h2>7. Regulated and technical products</h2>
      <p>
        Some products (for example sampling kits and hygiene products) are subject to specific
        handling or laboratory requirements, indicated on the product page. Before ordering such a
        product you confirm that you have read and understood them. Product information is
        provided for professional use and does not replace the laboratory&rsquo;s own instructions.
      </p>

      <h2>8. Invoices</h2>
      <p>
        We issue an electronic invoice when the billing details you give us are complete (tax
        code and, for businesses, VAT number and PEC or recipient code). Otherwise you receive a
        payment receipt. You can update your billing details in your account.
      </p>

      <h2>9. Applicable law and disputes</h2>
      <p>
        These terms are governed by Italian law. For consumers, mandatory consumer-protection
        rules of the country where you live remain applicable, and the court of your place of
        residence or domicile has jurisdiction. Consumers may also use out-of-court dispute
        resolution bodies available under Italian law. For business customers the court of Pisa has
        jurisdiction.
      </p>
    </LegalPage>
  );
}
