import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/tokens";
import { success, error, serverError } from "@/lib/api/response";
import { z } from "zod";

const verifySchema = z.object({
  agencyId: z.string().uuid(),
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const { agencyId, email, code, password, name } = parsed.data;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();
    const neonSql = getNeonSql();

    const verRows = await db.execute(sql`
      SELECT id, code, expires_at, attempts
      FROM claim_verifications
      WHERE agency_id = ${agencyId} AND email = ${email} AND used_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `);
    const verification = (verRows as unknown as Array<Record<string, unknown>>)[0];
    if (!verification) return error("No verification found. Please request a new code.", 404);

    if ((verification.attempts as number) >= 5) {
      return error("Too many attempts. Please request a new code.", 429);
    }

    await neonSql`
      UPDATE claim_verifications SET attempts = attempts + 1 WHERE id = ${verification.id as string}
    `;

    if (verification.code !== code) {
      return error("Invalid verification code", 400);
    }

    const expiresAt = new Date(verification.expires_at as string);
    if (expiresAt < new Date()) {
      return error("Verification code has expired. Please request a new one.", 410);
    }

    const agencyRows = await db.execute(sql`
      SELECT id, name, slug, claim_status FROM agencies WHERE id = ${agencyId} AND deleted_at IS NULL
    `);
    const agency = (agencyRows as unknown as Array<Record<string, unknown>>)[0];
    if (!agency) return error("Agency not found", 404);
    if (agency.claim_status === "claimed") return error("This agency has already been claimed", 400);

    const existingUser = await db.execute(sql`
      SELECT id FROM users WHERE email = ${email} AND deleted_at IS NULL
    `);
    if ((existingUser as unknown as Array<unknown>).length > 0) {
      return error("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const userRows = await db.execute(sql`
      INSERT INTO users (name, email, password_hash, role, is_active, email_verified)
      VALUES (${name}, ${email}, ${passwordHash}, 'agency_owner', true, NOW())
      RETURNING id, name, email, role
    `);
    const newUser = (userRows as unknown as Array<Record<string, unknown>>)[0];
    const userId = newUser.id as string;

    try {
      await db.execute(sql`INSERT INTO user_profiles (user_id) VALUES (${userId})`);
    } catch { /* ignore */ }
    try {
      await db.execute(sql`INSERT INTO notification_preferences (user_id) VALUES (${userId})`);
    } catch { /* ignore */ }

    await neonSql`
      UPDATE agencies
      SET user_id = ${userId}, claim_status = 'claimed', claimed_at = NOW(), claimed_by = ${userId}, updated_at = NOW()
      WHERE id = ${agencyId}
    `;

    await neonSql`
      UPDATE claim_verifications SET used_at = NOW() WHERE id = ${verification.id as string}
    `;

    const accessToken = await generateAccessToken({
      sub: userId,
      email,
      role: "agency_owner",
      emailVerified: true,
    });

    const refresh = await generateRefreshToken();
    try {
      await db.execute(sql`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (${userId}, ${refresh.hash}, ${refresh.expiresAt.toISOString()})
      `);
    } catch { /* ignore */ }

    const response = success({
      user: newUser,
      agency: { id: agency.id, name: agency.name, slug: agency.slug },
      accessToken,
      message: "Agency claimed successfully!",
    });

    response.headers.set("Set-Cookie", `access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`);

    return response;
  } catch (err) {
    console.error("[CLAIM-VERIFY] Error:", err);
    return serverError(err);
  }
}
