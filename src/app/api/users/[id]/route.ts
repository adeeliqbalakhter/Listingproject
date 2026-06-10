import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, notFound, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT u.id, u.name, u.email, u.role, u.image, u.is_active, u.email_verified,
             u.last_login_at, u.login_count, u.created_at, u.updated_at,
             up.bio, up.phone, up.company_name, up.job_title, up.website, up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = ${id} AND u.deleted_at IS NULL
    `);
    const user = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!user) return notFound("User not found");

    return success(user);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    await db.execute(sql`UPDATE users SET deleted_at = NOW() WHERE id = ${id}`);
    return success({ message: "User deleted" });
  } catch (err) {
    return serverError(err);
  }
}
