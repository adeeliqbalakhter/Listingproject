import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, notFound, serverError } from "@/lib/api/response";
import { z } from "zod";

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

const updateRoleSchema = z.object({
  role: z.enum(["user", "agency_owner", "admin", "super_admin"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;
    const { user: adminUser } = authResult;

    const { id } = await params;
    if (id === adminUser.id) return error("Cannot change your own role", 400);

    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) return error("Invalid role", 400);

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();
    const neonSql = getNeonSql();

    const rows = await db.execute(sql`SELECT id, role FROM users WHERE id = ${id} AND deleted_at IS NULL`);
    const user = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!user) return notFound("User not found");

    await neonSql`UPDATE users SET role = ${parsed.data.role}, updated_at = NOW() WHERE id = ${id}`;

    return success({ message: "Role updated", role: parsed.data.role });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;
    const { user: adminUser } = authResult;

    const { id } = await params;
    if (id === adminUser.id) return error("Cannot delete your own account", 400);

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    // Hard delete: remove related data then the user
    await db.execute(sql`DELETE FROM otp_tokens WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM agency_team_members WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM audit_logs WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM messages WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM review_votes WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM review_responses WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM review_reports WHERE reporter_id = ${id}`);
    await db.execute(sql`DELETE FROM files WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM notifications WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM search_logs WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM notification_preferences WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM user_profiles WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM refresh_tokens WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM reviews WHERE user_id = ${id}`);
    await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
    return success({ message: "User permanently deleted" });
  } catch (err) {
    return serverError(err);
  }
}
