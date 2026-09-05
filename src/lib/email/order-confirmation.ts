import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";

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
            <tr><td style="padding:8px 0; font-weight:bold; border-top:1px solid #ddd">Total</td>
                <td style="padding:8px 0; font-weight:bold; text-align:right; border-top:1px solid #ddd">${formatCurrency(input.grandTotal)}</td></tr>
          </table>
          <p style="color:#666; font-size:13px;">Eco Cleaning Technologies Consulting Srl</p>
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
