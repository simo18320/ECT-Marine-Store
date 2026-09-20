import { Resend } from "resend";

export function escapeHtml(value: string): string {
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

/**
 * Best-effort send shared by the legal/notification emails: a missing key or a send failure is
 * logged, never thrown — the request that triggered it is already saved either way.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`RESEND_API_KEY not configured — skipping email "${subject}"`);
    return;
  }
  try {
    const { data, error } = await new Resend(apiKey).emails.send({
      from: process.env.ORDER_CONFIRMATION_EMAIL_FROM ?? "ECT Marine Store <onboarding@resend.dev>",
      to,
      subject,
      html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">${html}</div>`,
    });
    if (error) console.error(`Failed to send email "${subject}":`, error);
    else console.log(`Email "${subject}" sent (Resend id ${data?.id}).`);
  } catch (err) {
    console.error(`Failed to send email "${subject}":`, err);
  }
}
