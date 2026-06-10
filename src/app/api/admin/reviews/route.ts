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
    const status = searchParams.get("status") || "";

    const conditions: ReturnType<typeof sql>[] = [sql`r.deleted_at IS NULL`];
    if (status) conditions.push(sql`r.status = ${status}`);

    const where = conditions.reduce((acc, cond, i) => i === 0 ? sql`WHERE ${cond}` : sql`${acc} AND ${cond}`);

    const countResult = await db.execute(sql`SELECT count(*) as count FROM reviews r ${where}`);
    const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

    const rows = await db.execute(sql`
      SELECT r.*, u.name as user_name, u.email as user_email, a.name as agency_name
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN agencies a ON a.id = r.agency_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return paginated(rows as unknown as Array<Record<string, unknown>>, { page, limit, total });
  } catch (err) {
    return serverError(err);
  }
}
