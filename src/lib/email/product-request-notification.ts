import { Resend } from "resend";

export interface ProductRequestNotificationInput {
  productName: string;
  productSku: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  quantity: number;
  message: string | null;
}

/**
 * Best-effort staff notification — mirrors order-confirmation.ts: a missing RESEND_API_KEY or a
 * send failure must never fail the customer's request itself, which is already saved and visible
 * in Admin > Product requests regardless of whether this email goes out.
 */
export async function sendProductRequestNotification(input: ProductRequestNotificationInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.STAFF_NOTIFICATION_EMAIL;
  if (!apiKey || !toEmail) {
    console.warn("RESEND_API_KEY or STAFF_NOTIFICATION_EMAIL not configured — skipping product request notification");
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: process.env.ORDER_CONFIRMATION_EMAIL_FROM ?? "ECT Marine Store <onboarding@resend.dev>",
      to: toEmail,
      subject: `Product request — ${input.productName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="font-size: 20px;">New product request</h1>
          <p><strong>${escapeHtml(input.productName)}</strong> (${escapeHtml(input.productSku)}) — qty ${input.quantity}</p>
          <p>${escapeHtml(input.customerName)} — <a href="mailto:${escapeHtml(input.customerEmail)}">${escapeHtml(input.customerEmail)}</a>${input.customerPhone ? ` — ${escapeHtml(input.customerPhone)}` : ""}</p>
          ${input.message ? `<p style="color:#444;">${escapeHtml(input.message)}</p>` : ""}
          <p style="color:#666; font-size:13px;"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/product-requests">View in admin</a></p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send product request notification:", error);
      return;
    }
    console.log(`Product request notification sent (Resend id ${data?.id}).`);
  } catch (err) {
    console.error("Failed to send product request notification:", err);
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
