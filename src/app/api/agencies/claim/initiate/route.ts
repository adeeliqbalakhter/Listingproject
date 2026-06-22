import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { success, error, serverError } from "@/lib/api/response";
import { generateOTP } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/services/email";
import { z } from "zod";

const initiateSchema = z.object({
  agencyId: z.string().uuid(),
  email: z.string().email(),
});

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = initiateSchema.safeParse(body);
    if (!parsed.success) return error("Invalid input", 400);

    const { agencyId, email } = parsed.data;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT id, name, website, claim_status, slug
      FROM agencies
      WHERE id = ${agencyId} AND deleted_at IS NULL
    `);
    const agency = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!agency) return error("Agency not found", 404);

    if (agency.claim_status === "claimed") {
      return error("This agency has already been claimed", 400);
    }

    const agencyWebsite = agency.website as string;
    if (agencyWebsite) {
      const agencyDomain = extractDomain(agencyWebsite);
      const emailDomain = email.split("@")[1]?.toLowerCase();

      if (agencyDomain && emailDomain && agencyDomain !== emailDomain) {
        return error(
          `Email domain must match the agency website domain (${agencyDomain}). Please use an @${agencyDomain} email.`,
          400
        );
      }
    }

    const existing = await db.execute(sql`
      SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL
    `);
    if ((existing as unknown as Array<unknown>).length > 0) {
      return error("An account with this email already exists. Please sign in first.", 409);
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS claim_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agency_id UUID NOT NULL,
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
      DELETE FROM claim_verifications
      WHERE agency_id = ${agencyId} AND used_at IS NULL
    `);

    await db.execute(sql`
      INSERT INTO claim_verifications (agency_id, email, code, expires_at)
      VALUES (${agencyId}, ${email}, ${code}, ${expiresAt.toISOString()})
    `);

    const agencyName = agency.name as string;
    try {
      await sendEmail({
        to: email,
        subject: `Verify your ownership of ${agencyName} on AgencyHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">AgencyHub</h1>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #1e3a5f;">Claim your agency profile</p>
              <p style="color: #4b5563;">You're claiming the profile for <strong>${agencyName}</strong> on AgencyHub. Enter this verification code:</p>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #1e3a5f;">${code}</h1>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">If you didn't request this, ignore this email.</p>
            </div>
          </div>
        `,
        text: `Your verification code for claiming ${agencyName} on AgencyHub: ${code}. Expires in 10 minutes.`,
      });
    } catch (err) {
      console.error("[CLAIM] Email error:", err);
    }

    return success({ message: "Verification code sent to your email", agencyName });
  } catch (err) {
    return serverError(err);
  }
}
