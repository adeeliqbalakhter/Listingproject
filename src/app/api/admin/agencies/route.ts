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
    const query = searchParams.get("query") || "";

    let conditions = "WHERE a.deleted_at IS NULL";
    if (status) conditions += ` AND a.status = '${status.replace(/'/g, "''")}'`;
    if (query) conditions += ` AND a.name ILIKE '%${query.replace(/'/g, "''")}%'`;

    const countResult = await db.execute(sql.raw(`SELECT count(*) as count FROM agencies a ${conditions}`));
    const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

    const rows = await db.execute(sql.raw(`
      SELECT a.id, a.name, a.slug, a.email, a.status, a.is_verified, a.is_featured, a.is_premium,
             a.average_rating, a.total_reviews, a.created_at, u.name as owner_name, u.email as owner_email
      FROM agencies a
      LEFT JOIN users u ON u.id = a.user_id
      ${conditions}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `));

    return paginated(rows as unknown as Array<Record<string, unknown>>, { page, limit, total });
  } catch (err) {
    return serverError(err);
  }
}
