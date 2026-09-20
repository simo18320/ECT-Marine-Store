import { COMPANY } from "@/lib/company";
import { escapeHtml, sendEmail } from "./send";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "";
const staffEmail = () => process.env.STAFF_NOTIFICATION_EMAIL;

// Art. 54 Consumer Code: the trader must acknowledge receipt of a withdrawal without delay,
// on a durable medium — this email is that acknowledgement.
export async function sendWithdrawalAcknowledgement(input: { toEmail: string; orderNumber: string }) {
  await sendEmail(
    input.toEmail,
    `We received your withdrawal request — ${input.orderNumber}`,
    `<h1 style="font-size:20px;">Withdrawal request received</h1>
     <p>We received your request to withdraw from order <strong>${escapeHtml(input.orderNumber)}</strong> on ${new Date().toLocaleDateString("en-GB")}.</p>
     <p>We will contact you with the return instructions and, once the goods are back with us, refund you as described in the <a href="${appUrl()}/withdrawal">right of withdrawal information</a>.</p>
     <p style="color:#666; font-size:13px;">${escapeHtml(COMPANY.legalName)}</p>`,
  );
}

export async function notifyStaffOfWithdrawal(input: { orderNumber: string; customerEmail: string; message: string | null }) {
  const to = staffEmail();
  if (!to) return;
  await sendEmail(
    to,
    `Withdrawal request — ${input.orderNumber}`,
    `<h1 style="font-size:20px;">New withdrawal request</h1>
     <p>Order <strong>${escapeHtml(input.orderNumber)}</strong> — ${escapeHtml(input.customerEmail)}</p>
     ${input.message ? `<p style="color:#444;">${escapeHtml(input.message)}</p>` : ""}
     <p><a href="${appUrl()}/admin/legal-requests">View in admin</a></p>`,
  );
}

export async function sendPrivacyAcknowledgement(input: { toEmail: string; requestType: string }) {
  await sendEmail(
    input.toEmail,
    "We received your privacy request",
    `<h1 style="font-size:20px;">Privacy request received</h1>
     <p>We received your request (<strong>${escapeHtml(input.requestType)}</strong>). We will reply within one month, as required by the GDPR.</p>
     <p style="color:#666; font-size:13px;">${escapeHtml(COMPANY.legalName)}</p>`,
  );
}

export async function notifyStaffOfPrivacyRequest(input: { customerEmail: string; requestType: string; message: string | null }) {
  const to = staffEmail();
  if (!to) return;
  await sendEmail(
    to,
    `Privacy request — ${input.requestType}`,
    `<h1 style="font-size:20px;">New privacy request</h1>
     <p>${escapeHtml(input.requestType)} — ${escapeHtml(input.customerEmail)}</p>
     ${input.message ? `<p style="color:#444;">${escapeHtml(input.message)}</p>` : ""}
     <p style="color:#666; font-size:13px;">Legal deadline: reply within one month. <a href="${appUrl()}/admin/legal-requests">View in admin</a></p>`,
  );
}
