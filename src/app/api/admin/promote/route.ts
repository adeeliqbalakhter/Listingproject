import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createAuditLog, getClientIp } from "@/lib/services/audit";
import { success, error, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return error("Promotion endpoint is not configured", 503);
    }

    const body = await request.json();
    const { email, secret } = body as { email?: string; secret?: string };

    if (!email || !secret) {
      return error("Email and secret are required", 400);
    }

    if (secret !== adminSecret) {
      return error("Invalid secret", 403);
    }

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();
    const neonSql = getNeonSql();

    const rows = await db.execute(
      sql`SELECT id, email, role FROM users WHERE email = ${email} AND deleted_at IS NULL`
    );
    const user = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!user) {
      return error("User not found", 404);
    }

    await neonSql`
      UPDATE users SET role = 'super_admin', updated_at = NOW() WHERE id = ${user.id as string}
    `;

    await createAuditLog({
      userId: user.id as string,
      action: "user_promoted",
      entityType: "user",
      entityId: user.id as string,
      newValues: { role: "super_admin" },
      ipAddress: getClientIp(request),
    }).catch(() => {});

    return success({ message: "User promoted to super_admin", email });
  } catch (err) {
    return serverError(err);
  }
}
