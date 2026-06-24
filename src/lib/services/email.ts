import { createTransport, type Transporter } from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  const smtpHost = process.env.SMTP_HOST;

  // Try Resend first
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "AgencyHub <onboarding@resend.dev>",
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });
      if (res.ok) {
        return true;
      }
      const body = await res.text();
      console.error("[EMAIL] Resend failed:", res.status, body);
    } catch (err) {
      console.error("[EMAIL] Resend error:", err);
    }
  }

  // Fall back to SMTP (Gmail, etc.)
  if (smtpHost) {
    const t = getTransporter();
    if (t) {
      try {
        await t.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        return true;
      } catch (err) {
        console.error("[EMAIL] SMTP send failed:", err);
      }
    }
  }

  logEmail(options);
  return false;
}

function logEmail(options: EmailOptions) {
  console.log(`[EMAIL] To: ${options.to}`);
  console.log(`[EMAIL] Subject: ${options.subject}`);
  console.log(`[EMAIL] Body: ${options.text || options.html.substring(0, 200)}`);
}

export function buildVerificationEmail(name: string, token: string): EmailOptions & { to: "" } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
  return {
    to: "" as const,
    subject: "Verify your email address",
    html: `
      <h2>Welcome${name ? `, ${name}` : ""}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a></p>
      <p>Or copy and paste: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
    text: `Welcome${name ? `, ${name}` : ""}! Verify your email: ${verifyUrl}`,
  };
}

export function buildOTPEmail(name: string, code: string, purpose: string): EmailOptions & { to: "" } {
  return {
    to: "" as const,
    subject: `Your verification code: ${code}`,
    html: `
      <h2>Hi${name ? ` ${name}` : ""},</h2>
      <p>Your ${purpose} verification code is:</p>
      <h1 style="font-size:36px;letter-spacing:8px;text-align:center;padding:20px;background:#f3f4f6;border-radius:8px;">${code}</h1>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `,
    text: `Your ${purpose} code: ${code}. Expires in 10 minutes.`,
  };
}

export function buildPasswordResetEmail(name: string, token: string): EmailOptions & { to: "" } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/forgot-password?token=${token}`;
  return {
    to: "" as const,
    subject: "Reset your password",
    html: `
      <h2>Hi${name ? ` ${name}` : ""},</h2>
      <p>You requested a password reset. Click the link below:</p>
      <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a></p>
      <p>Or copy and paste: ${resetUrl}</p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
    text: `Reset your password: ${resetUrl}. Expires in 1 hour.`,
  };
}

export function buildSubscriptionConfirmationEmail(name: string, planName: string, tier: string, isOverride: boolean): EmailOptions & { to: "" } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dashboardUrl = `${baseUrl}/dashboard/subscription`;
  const tierBenefits: Record<string, string[]> = {
    premium: ["Verified badge on your profile", "Priority search placement", "Unlimited portfolio items", "Cover image support", "Service packages", "Social media links"],
    pro: ["Featured badge on your profile", "Highest search priority", "Unlimited team members", "API access", "Branded quote forms", "Advanced analytics"],
    enterprise: ["Enterprise-level visibility", "Dedicated search boost", "All Pro features included", "Custom integrations support"],
  };
  const benefits = tierBenefits[tier] ?? ["Enhanced agency profile"];
  const benefitsList = benefits.map(b => `<li style="padding:4px 0;">${b}</li>`).join("");
  return {
    to: "" as const,
    subject: isOverride ? `Your agency has been upgraded to ${planName}!` : `Welcome to ${planName} - Subscription Confirmed`,
    html: `
      <h2>Hi${name ? ` ${name}` : ""},</h2>
      <p>${isOverride ? `Great news! Your agency has been promoted to the <strong>${planName}</strong> plan.` : `Your subscription to the <strong>${planName}</strong> plan is now active.`}</p>
      <h3 style="margin-top:20px;">What's included:</h3>
      <ul style="list-style:none;padding:0;">${benefitsList}</ul>
      <p style="margin-top:20px;"><a href="${dashboardUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Your Subscription</a></p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px;">If you have any questions, contact us at support@listingproject.com</p>
    `,
    text: `Your ${planName} plan is now active. View your subscription: ${dashboardUrl}`,
  };
}

export function buildSubscriptionCancellationEmail(name: string, planName: string, endDate: string): EmailOptions & { to: "" } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    to: "" as const,
    subject: `Your ${planName} subscription has been cancelled`,
    html: `
      <h2>Hi${name ? ` ${name}` : ""},</h2>
      <p>Your <strong>${planName}</strong> subscription has been cancelled.</p>
      <p>You will continue to have access to ${planName} features until <strong>${endDate}</strong>. After that, your account will revert to the Free plan.</p>
      <p style="margin-top:16px;">We're sorry to see you go. If you change your mind, you can re-subscribe anytime from your dashboard.</p>
      <p style="margin-top:20px;"><a href="${baseUrl}/dashboard/subscription" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Manage Subscription</a></p>
    `,
    text: `Your ${planName} subscription has been cancelled. Access continues until ${endDate}.`,
  };
}

export function buildSubscriptionRenewalReminderEmail(name: string, planName: string, renewalDate: string, price: string): EmailOptions & { to: "" } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    to: "" as const,
    subject: `Your ${planName} subscription renews soon`,
    html: `
      <h2>Hi${name ? ` ${name}` : ""},</h2>
      <p>Your <strong>${planName}</strong> subscription will renew on <strong>${renewalDate}</strong> for <strong>${price}</strong>.</p>
      <p>No action is needed if you'd like to continue. If you want to make changes, visit your subscription dashboard.</p>
      <p style="margin-top:20px;"><a href="${baseUrl}/dashboard/subscription" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Manage Subscription</a></p>
    `,
    text: `Your ${planName} subscription renews on ${renewalDate} for ${price}. Manage: ${baseUrl}/dashboard/subscription`,
  };
}

export function buildPaymentFailedEmail(name: string, planName: string): EmailOptions & { to: "" } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    to: "" as const,
    subject: `Payment failed for your ${planName} subscription`,
    html: `
      <h2>Hi${name ? ` ${name}` : ""},</h2>
      <p>We were unable to process your payment for the <strong>${planName}</strong> plan.</p>
      <p>Please update your payment method to avoid any interruption to your service. Your account will be downgraded to the Free plan if payment is not received within 7 days.</p>
      <p style="margin-top:20px;"><a href="${baseUrl}/dashboard/subscription" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Update Payment Method</a></p>
      <p style="margin-top:16px;color:#6b7280;font-size:14px;">Need help? Contact us at support@listingproject.com</p>
    `,
    text: `Payment failed for your ${planName} plan. Update your payment method: ${baseUrl}/dashboard/subscription`,
  };
}
