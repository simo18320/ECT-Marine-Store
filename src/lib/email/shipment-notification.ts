import { Resend } from "resend";

export interface ShipmentNotificationInput {
  toEmail: string;
  orderNumber: string;
  provider: string | null;
  trackingNumber: string | null;
  expectedDelivery: string | null;
}

/**
 * Best-effort — mirrors order-confirmation.ts. A missing RESEND_API_KEY or a send failure must
 * never block the admin's shipment update; the customer's order page already reflects the new
 * status regardless of whether this email goes out.
 */
export async function sendShipmentNotificationEmail(input: ShipmentNotificationInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY not configured — skipping shipment email for ${input.orderNumber}`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const trackingHtml = input.trackingNumber
      ? `<p>Tracking number: <strong>${escapeHtml(input.trackingNumber)}</strong>${input.provider ? ` (${escapeHtml(input.provider)})` : ""}</p>
         <p><a href="https://t.17track.net/en#nums=${encodeURIComponent(input.trackingNumber)}">Track your package</a></p>`
      : input.provider
        ? `<p>Carrier: <strong>${escapeHtml(input.provider)}</strong></p>`
        : "";

    const { data, error } = await resend.emails.send({
      from: process.env.ORDER_CONFIRMATION_EMAIL_FROM ?? "ECT Marine Store <onboarding@resend.dev>",
      to: input.toEmail,
      subject: `Your order has shipped — ${input.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="font-size: 20px;">Your order is on its way</h1>
          <p>Order <strong>${input.orderNumber}</strong> has shipped.</p>
          ${trackingHtml}
          ${input.expectedDelivery ? `<p>Expected delivery: <strong>${new Date(input.expectedDelivery).toLocaleDateString("en-GB")}</strong></p>` : ""}
          <p style="color:#666; font-size:13px;">Eco Cleaning Technologies Consulting Srl</p>
        </div>
      `,
    });

    if (error) {
      console.error(`Failed to send shipment email for ${input.orderNumber}:`, error);
      return;
    }
    console.log(`Shipment email sent for ${input.orderNumber} (Resend id ${data?.id}).`);
  } catch (err) {
    console.error(`Failed to send shipment email for ${input.orderNumber}:`, err);
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
