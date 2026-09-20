import { LegalPage } from "@/components/legal/legal-page";
import { COMPANY } from "@/lib/company";

export const metadata = { title: "Right of withdrawal — ECT Marine Store" };

export default function WithdrawalPage() {
  return (
    <LegalPage title="Right of withdrawal">
      <p>
        This information applies to <strong>consumers</strong> — individuals buying for purposes
        outside their trade, business or profession (Italian Consumer Code, D.Lgs. 206/2005, arts.
        52 ff.). Purchases made with a VAT number, for business use, carry no right of withdrawal.
      </p>

      <h2>Withdrawing from a purchase</h2>
      <p>
        You may withdraw from your order, without giving any reason, within{" "}
        <strong>14 days</strong> of the day you (or a third party you nominate, other than the
        carrier) receive the goods. For an order with several products delivered separately, the
        period runs from receipt of the last one.
      </p>
      <p>
        To withdraw, send us a clear statement of your decision — for example by PEC to{" "}
        {COMPANY.pec}, or by post to {COMPANY.legalName}, {COMPANY.addressLine1},{" "}
        {COMPANY.addressLine2} — quoting your order number. You may use the form below, but it is
        not mandatory. Sending your statement before the 14 days expire is enough.
      </p>

      <h2>Effects of withdrawal</h2>
      <ul>
        <li>
          We will refund all payments received, including standard delivery costs, without undue
          delay and within 14 days of being informed of your decision, using the same payment method
          you used. We may withhold the refund until we have received the goods back or you show
          you have sent them, whichever is earlier.
        </li>
        <li>
          Return the goods within 14 days of telling us you are withdrawing. The direct cost of
          returning them is borne by you.
        </li>
        <li>You are liable only for any loss in value caused by handling beyond what is needed to check the goods.</li>
      </ul>

      <h2>Products excluded from withdrawal</h2>
      <ul>
        <li>
          Goods made to your specifications or clearly personalised, including products
          made to order for you.
        </li>
        <li>
          Sealed goods that are not suitable for return for health or hygiene reasons (for example
          sampling kits, sterile sampling bottles or hygiene consumables) once the seal has been
          broken after delivery.
        </li>
      </ul>
      <p>
        Whether a product is made to order is shown on its page before you buy. Defective or
        non-conforming goods are covered by the legal guarantee described in our Terms of Sale, whatever the
        withdrawal rules.
      </p>

      <h2>Model withdrawal form</h2>
      <p>(Complete and return this form only if you wish to withdraw from the contract.)</p>
      <div className="rounded-md border border-border bg-card p-4 text-foreground">
        <p>To: {COMPANY.legalName}, {COMPANY.addressLine1}, {COMPANY.addressLine2} — PEC {COMPANY.pec}</p>
        <p className="mt-2">
          I/We hereby give notice that I/We withdraw from my/our contract of sale of the following
          goods: ______________________
        </p>
        <p className="mt-2">Ordered on / received on: ______________ &nbsp; Order number: ______________</p>
        <p className="mt-2">Name of consumer(s): ______________________</p>
        <p className="mt-2">Address of consumer(s): ______________________</p>
        <p className="mt-2">Signature (only if this form is on paper): ______________ &nbsp; Date: ____________</p>
      </div>
    </LegalPage>
  );
}
