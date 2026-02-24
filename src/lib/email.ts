import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Lash Extension Academy <no-reply@course.iblfbeauty.com>";

// ─── Base sender ─────────────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    console.error("[Resend] Failed to send email:", error);
    throw new Error(error.message);
  }

  return data;
}

// ─── Templates ───────────────────────────────────────────────────────────────

function baseTemplate(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lash Extension Academy</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#7eb27d;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Lash Extension Academy
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Lash Extension Academy · All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Enrollment confirmation ──────────────────────────────────────────────────

interface EnrollmentEmailOptions {
  to: string;
  name: string;
  tier: "BASIC" | "STANDARD" | "PREMIUM";
  dashboardUrl?: string;
}

const TIER_LABELS: Record<string, string> = {
  BASIC: "Basic",
  STANDARD: "Standard",
  PREMIUM: "VIP Masterclass",
};

export async function sendEnrollmentConfirmation({
  to,
  name,
  tier,
  dashboardUrl = "https://course.iblfbeauty.com/dashboard",
}: EnrollmentEmailOptions) {
  const tierLabel = TIER_LABELS[tier] ?? tier;

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Welcome, ${name}! 🎉
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      You're officially enrolled in the <strong>${tierLabel}</strong> plan.
      Your journey to becoming a certified lash artist starts now.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#7eb27d;text-transform:uppercase;letter-spacing:0.5px;">Your Plan</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${tierLabel}</p>
        </td>
      </tr>
    </table>
    <a href="${dashboardUrl}"
       style="display:inline-block;background:#7eb27d;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;margin-bottom:24px;">
      Go to My Dashboard →
    </a>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      If you have any questions, reply to this email and we'll be happy to help.
    </p>
  `);

  return sendEmail({
    to,
    subject: `You're enrolled — ${tierLabel} 🎉`,
    html,
  });
}

// ─── Certificate issued ───────────────────────────────────────────────────────

interface CertificateEmailOptions {
  to: string;
  name: string;
  certificateUrl: string;
}

export async function sendCertificateEmail({
  to,
  name,
  certificateUrl,
}: CertificateEmailOptions) {
  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Congratulations, ${name}! 🏆
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      You've completed the Lash Extension Academy course and earned your
      <strong>Certificate of Completion</strong>. We're so proud of you!
    </p>
    <a href="${certificateUrl}"
       style="display:inline-block;background:#7eb27d;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;margin-bottom:24px;">
      View My Certificate →
    </a>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Share your achievement with friends, family, and future clients!
    </p>
  `);

  return sendEmail({
    to,
    subject: "Your Certificate of Completion is ready! 🏆",
    html,
  });
}

// ─── Payment receipt ──────────────────────────────────────────────────────────

interface PaymentReceiptEmailOptions {
  to: string;
  name: string;
  tier: "BASIC" | "STANDARD" | "PREMIUM";
  amountPaid: number; // in cents
}

export async function sendPaymentReceipt({
  to,
  name,
  tier,
  amountPaid,
}: PaymentReceiptEmailOptions) {
  const tierLabel = TIER_LABELS[tier] ?? tier;
  const amount = `$${(amountPaid / 100).toFixed(2)}`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Payment Confirmed
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
      Hi ${name}, your payment has been successfully processed. Here's your receipt.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:14px 20px;font-size:14px;color:#6b7280;">Plan</td>
        <td style="padding:14px 20px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${tierLabel}</td>
      </tr>
      <tr>
        <td style="padding:14px 20px;font-size:14px;color:#6b7280;">Amount Paid</td>
        <td style="padding:14px 20px;font-size:14px;font-weight:600;color:#111827;text-align:right;">${amount} USD</td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Keep this email as your receipt. If you have any billing questions, reply here.
    </p>
  `);

  return sendEmail({
    to,
    subject: `Payment receipt — ${tierLabel} (${amount})`,
    html,
  });
}
