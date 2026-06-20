import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/tokens";
import { success, error, serverError } from "@/lib/api/response";
import { z } from "zod";

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

async function ensureInviteColumns(db: ReturnType<typeof getDb>) {
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ`);
  } catch { /* columns may already exist */ }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) return error("Token is required", 400);

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();
    await ensureInviteColumns(db);

    const rows = await db.execute(sql`
      SELECT id, name, email, role, invite_token_expires_at
      FROM users
      WHERE invite_token = ${token} AND deleted_at IS NULL
    `);
    const user = (rows as unknown as Array<Record<string, unknown>>)[0];

    if (!user) return error("Invalid or expired invitation link", 404);

    const expiresAt = new Date(user.invite_token_expires_at as string);
    if (expiresAt < new Date()) {
      return error("This invitation link has expired. Please contact your administrator.", 410);
    }

    return success({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const { token, password } = parsed.data;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();
    const neonSql = getNeonSql();
    await ensureInviteColumns(db);

    const rows = await db.execute(sql`
      SELECT id, name, email, role, invite_token_expires_at
      FROM users
      WHERE invite_token = ${token} AND deleted_at IS NULL
    `);
    const user = (rows as unknown as Array<Record<string, unknown>>)[0];

    if (!user) return error("Invalid or expired invitation link", 404);

    const expiresAt = new Date(user.invite_token_expires_at as string);
    if (expiresAt < new Date()) {
      return error("This invitation link has expired. Please contact your administrator.", 410);
    }

    const passwordHash = await hashPassword(password);

    await neonSql`
      UPDATE users
      SET password_hash = ${passwordHash},
          invite_token = NULL,
          invite_token_expires_at = NULL,
          email_verified = NOW(),
          updated_at = NOW()
      WHERE id = ${user.id as string}
    `;

    const accessToken = await generateAccessToken({
      sub: user.id as string,
      email: user.email as string,
      role: user.role as string,
      emailVerified: true,
    });

    const refresh = await generateRefreshToken();
    try {
      await db.execute(sql`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES (${user.id as string}, ${refresh.hash}, ${refresh.expiresAt.toISOString()})
      `);
    } catch { /* ignore */ }

    const response = success({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      message: "Account activated successfully",
    });

    response.headers.set("Set-Cookie", `access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`);

    return response;
  } catch (err) {
    return serverError(err);
  }
}
