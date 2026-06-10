import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { paginated, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const query = searchParams.get("query") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const conditions: ReturnType<typeof sql>[] = [sql`u.deleted_at IS NULL`];
    if (query) {
      const pattern = `%${query}%`;
      conditions.push(sql`(u.name ILIKE ${pattern} OR u.email ILIKE ${pattern})`);
    }
    if (role) conditions.push(sql`u.role = ${role}`);
    if (status === "active") conditions.push(sql`u.is_active = true`);
    if (status === "inactive") conditions.push(sql`u.is_active = false`);

    const where = conditions.reduce((acc, cond, i) => i === 0 ? sql`WHERE ${cond}` : sql`${acc} AND ${cond}`);

    const countResult = await db.execute(sql`SELECT count(*) as count FROM users u ${where}`);
    const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

    const rows = await db.execute(sql`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.email_verified, u.last_login_at, u.login_count, u.created_at
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return paginated(rows as unknown as Array<Record<string, unknown>>, { page, limit, total });
  } catch (err) {
    return serverError(err);
  }
}
