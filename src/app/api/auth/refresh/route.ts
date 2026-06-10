import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { hashToken, generateAccessToken, generateRefreshToken } from "@/lib/auth/tokens";
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/services/rate-limit";
import { getClientIp } from "@/lib/services/audit";
import { success, error, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, RATE_LIMITS.auth, "refresh");
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const token = (body as Record<string, string>).refreshToken;
    if (!token) return error("Refresh token required", 400);

    const tokenHash = hashToken(token);

    const rows = await db.execute(sql`
      SELECT rt.*, u.id as uid, u.email, u.role, u.email_verified, u.is_active, u.name
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = ${tokenHash}
        AND rt.revoked_at IS NULL
        AND rt.expires_at > NOW()
        AND u.deleted_at IS NULL
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];

    if (!row) return error("Invalid or expired refresh token", 401);
    if (!row.is_active) return error("Account is deactivated", 403);

    // Revoke old token (rotation)
    await db.execute(
      sql`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ${tokenHash}`
    );

    const emailVerified = row.email_verified !== null;

    const accessToken = await generateAccessToken({
      sub: row.uid as string,
      email: row.email as string,
      role: row.role as string,
      emailVerified,
    });

    const newRefresh = await generateRefreshToken();
    const ip = getClientIp(request);
    const ua = request.headers.get("user-agent") || "";

    await db.execute(sql`
      INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
      VALUES (${row.uid}, ${newRefresh.hash}, ${JSON.stringify({ userAgent: ua })}, ${ip}, ${newRefresh.expiresAt})
    `);

    return success({
      accessToken,
      refreshToken: newRefresh.token,
      user: {
        id: row.uid,
        name: row.name,
        email: row.email,
        role: row.role,
        emailVerified,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
