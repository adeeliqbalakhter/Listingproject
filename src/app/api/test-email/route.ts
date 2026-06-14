import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/services/email";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return Response.json(
      { error: "Missing required query parameter: email" },
      { status: 400 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  const diagnostics: Record<string, unknown> = {
    resend_key_configured: !!resendKey,
    resend_key_preview: resendKey
      ? resendKey.substring(0, 8) + "********"
      : null,
    email_from_configured: !!emailFrom,
    email_from_value: emailFrom || "AgencyHub <onboarding@resend.dev> (default)",
    smtp_host_configured: !!process.env.SMTP_HOST,
    target_email: email,
  };

  try {
    const sent = await sendEmail({
      to: email,
      subject: "AgencyHub Test Email",
      html: `<h2>Test Email</h2><p>This is a test email from AgencyHub to verify email delivery is working.</p><p>Sent at: ${new Date().toISOString()}</p>`,
      text: `Test email from AgencyHub. Sent at: ${new Date().toISOString()}`,
    });

    return Response.json({
      ...diagnostics,
      send_attempted: true,
      send_success: sent,
      message: sent
        ? "Test email sent successfully. Check your inbox."
        : "Email send returned false. Check Vercel logs for details.",
    });
  } catch (err) {
    return Response.json({
      ...diagnostics,
      send_attempted: true,
      send_success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
