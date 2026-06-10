import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { createAuditLog, getClientIp } from "@/lib/services/audit";
import { success, error, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const action = (body as Record<string, string>).action;

    if (!["approve", "reject"].includes(action)) {
      return error("Action must be 'approve' or 'reject'", 400);
    }

    const newStatus = action === "approve" ? "active" : "rejected";

    const rows = await db.execute(
      sql`SELECT id, status FROM agencies WHERE id = ${id} AND deleted_at IS NULL`
    );
    const agency = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!agency) return error("Agency not found", 404);

    await db.execute(sql`
      UPDATE agencies SET status = ${newStatus}, is_verified = ${action === "approve"}, updated_at = NOW()
      WHERE id = ${id}
    `);

    await createAuditLog({
      userId: user.id,
      action: `agency_${action}d`,
      entityType: "agency",
      entityId: id,
      oldValues: { status: agency.status },
      newValues: { status: newStatus },
      ipAddress: getClientIp(request),
    });

    return success({ message: `Agency ${action}d`, status: newStatus });
  } catch (err) {
    return serverError(err);
  }
}
