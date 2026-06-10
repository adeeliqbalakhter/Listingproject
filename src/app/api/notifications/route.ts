import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";
import { success, paginated, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const unreadOnly = searchParams.get("unread") === "true";

    let condition = `WHERE user_id = '${user.id}'`;
    if (unreadOnly) condition += " AND is_read = false";

    const countResult = await db.execute(sql.raw(`SELECT count(*) as count FROM notifications ${condition}`));
    const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

    const rows = await db.execute(sql.raw(`
      SELECT * FROM notifications ${condition} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `));

    const unreadCount = await db.execute(sql`
      SELECT count(*) as count FROM notifications WHERE user_id = ${user.id} AND is_read = false
    `);

    return Response.json({
      data: rows,
      unreadCount: Number((unreadCount as unknown as Array<{ count: string }>)[0]?.count ?? 0),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const { notificationIds, markAll } = body as { notificationIds?: string[]; markAll?: boolean };

    if (markAll) {
      await db.execute(sql`
        UPDATE notifications SET is_read = true, read_at = NOW()
        WHERE user_id = ${user.id} AND is_read = false
      `);
    } else if (notificationIds?.length) {
      for (const nid of notificationIds) {
        await db.execute(sql`
          UPDATE notifications SET is_read = true, read_at = NOW()
          WHERE id = ${nid} AND user_id = ${user.id}
        `);
      }
    }

    return success({ message: "Notifications marked as read" });
  } catch (err) {
    return serverError(err);
  }
}
