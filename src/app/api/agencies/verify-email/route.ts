import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";
import { generateOTP } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/services/email";
import { z } from "zod";

const sendSchema = z.object({
  email: z.string().email(),
  agencyName: z.string().min(1),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();

    if (body.code) {
      const parsed = verifySchema.safeParse(body);
      if (!parsed.success) return error("Invalid input", 400);
      const { email, code } = parsed.data;

      const verRows = await db.execute(sql`
        SELECT id, code, expires_at, attempts
        FROM agency_email_verifications
        WHERE user_id = ${user.id} AND email = ${email} AND used_at IS NULL
        ORDER BY created_at DESC LIMIT 1
      `);
      const verification = (verRows as unknown as Array<Record<string, unknown>>)[0];
      if (!verification) return error("No verification found. Please request a new code.", 404);

      if ((verification.attempts as number) >= 5) {
        return error("Too many attempts. Please request a new code.", 429);
      }

      const neonSql = getNeonSql();
      await neonSql`
        UPDATE agency_email_verifications SET attempts = attempts + 1 WHERE id = ${verification.id as string}
      `;

      if (verification.code !== code) return error("Invalid verification code", 400);

      const expiresAt = new Date(verification.expires_at as string);
      if (expiresAt < new Date()) return error("Code expired. Please request a new one.", 410);

      await neonSql`
        UPDATE agency_email_verifications SET used_at = NOW() WHERE id = ${verification.id as string}
      `;

      return success({ verified: true, email });
    }

    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return error("Invalid input", 400);
    const { email, agencyName } = parsed.data;

    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS agency_email_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          email VARCHAR(255) NOT NULL,
          code VARCHAR(6) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          attempts INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    } catch { /* exists */ }

    await db.execute(sql`
      DELETE FROM agency_email_verifications WHERE user_id = ${user.id} AND used_at IS NULL
    `);

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.execute(sql`
      INSERT INTO agency_email_verifications (user_id, email, code, expires_at)
      VALUES (${user.id}, ${email}, ${code}, ${expiresAt.toISOString()})
    `);

    try {
      await sendEmail({
        to: email,
        subject: `Verify your agency email for ${agencyName} on AgencyHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">AgencyHub</h1>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e3a5f;">Verify your agency email</p>
              <p style="color: #4b5563;">Enter this code to verify <strong>${email}</strong> as the contact email for <strong>${agencyName}</strong>:</p>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #1e3a5f;">${code}</h1>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
          </div>
        `,
        text: `Your verification code for ${agencyName} on AgencyHub: ${code}. Expires in 10 minutes.`,
      });
    } catch (err) {
      console.error("[AGENCY-EMAIL-VERIFY] Email error:", err);
    }

    return success({ sent: true, message: "Verification code sent" });
  } catch (err) {
    console.error("[AGENCY-EMAIL-VERIFY] Error:", err);
    return serverError(err);
  }
}
