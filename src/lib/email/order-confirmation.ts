import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";
import { COMPANY } from "@/lib/company";

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderConfirmationInput {
  toEmail: string;
  orderNumber: string;
  items: OrderConfirmationItem[];
  grandTotal: number;
}

/**
 * Best-effort — a missing RESEND_API_KEY or a send failure must never fail the order itself
 * (the payment already succeeded; the customer's confirmation page and order history already
 * reflect that regardless of email delivery). Errors are logged, not thrown.
 */
export async function sendOrderConfirmationEmail(input: OrderConfirmationInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY not configured — skipping confirmation email for ${input.orderNumber}`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const itemsHtml = input.items
      .map(
        (item) =>
          `<tr><td style="padding:4px 0">${item.quantity}× ${escapeHtml(item.name)}</td><td style="padding:4px 0;text-align:right">${formatCurrency(item.lineTotal)}</td></tr>`,
      )
      .join("");

    // The Resend SDK returns { data, error } for API-level failures (e.g. sandbox
    // restrictions) rather than throwing — both paths must be handled to actually catch them.
    const { data, error } = await resend.emails.send({
      from: process.env.ORDER_CONFIRMATION_EMAIL_FROM ?? "ECT Marine Store <onboarding@resend.dev>",
      to: input.toEmail,
      subject: `Order confirmed — ${input.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="font-size: 20px;">Thank you for your order</h1>
          <p>Order <strong>${input.orderNumber}</strong> is confirmed and being prepared.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            ${itemsHtml}
            <tr><td style="padding:8px 0; font-weight:bold; border-top:1px solid #ddd">Total (incl. VAT)</td>
                <td style="padding:8px 0; font-weight:bold; text-align:right; border-top:1px solid #ddd">${formatCurrency(input.grandTotal)}</td></tr>
          </table>
          <h2 style="font-size:15px; margin-top:24px;">Your rights</h2>
          <p style="font-size:13px; color:#444;">
            If you are a consumer you may withdraw from this order within 14 days of receiving the
            goods, without giving a reason (products made to order and opened sealed hygiene
            products are excluded). You can withdraw online from your
            <a href="${appUrl}/account/orders/${input.orderNumber}">order page</a> or by PEC to
            ${escapeHtml(COMPANY.pec)}. Full information and the model withdrawal form:
            <a href="${appUrl}/withdrawal">right of withdrawal</a>. Your purchase is governed by our
            <a href="${appUrl}/terms">Terms of Sale</a>; see also our <a href="${appUrl}/privacy">Privacy Policy</a>.
          </p>
          <p style="color:#666; font-size:13px;">
            ${escapeHtml(COMPANY.legalName)} — ${escapeHtml(COMPANY.addressLine1)}, ${escapeHtml(COMPANY.addressLine2)} — VAT no. ${escapeHtml(COMPANY.vatNumber)}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(`Failed to send order confirmation email for ${input.orderNumber}:`, error);
      return;
    }
    console.log(`Order confirmation email sent for ${input.orderNumber} (Resend id ${data?.id}).`);
  } catch (err) {
    console.error(`Failed to send order confirmation email for ${input.orderNumber}:`, err);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
