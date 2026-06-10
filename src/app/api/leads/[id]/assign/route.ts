import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { z } from "zod";
import { createAuditLog, getClientIp } from "@/lib/services/audit";
import { created, error, serverError } from "@/lib/api/response";

const assignSchema = z.object({
  agencyIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const results: Array<Record<string, unknown>> = [];
    for (const agencyId of parsed.data.agencyIds) {
      try {
        const rows = await db.execute(sql`
          INSERT INTO lead_assignments (lead_id, agency_id, status)
          VALUES (${id}, ${agencyId}, 'sent')
          ON CONFLICT DO NOTHING
          RETURNING *
        `);
        const row = (rows as unknown as Array<Record<string, unknown>>)[0];
        if (row) results.push(row);
      } catch { /* skip invalid */ }
    }

    await db.execute(sql`
      INSERT INTO lead_activity_logs (lead_id, user_id, action, details)
      VALUES (${id}, ${user.id}, 'assigned', ${JSON.stringify({ agencyIds: parsed.data.agencyIds })})
    `);

    await createAuditLog({
      userId: user.id,
      action: "lead_assigned",
      entityType: "lead",
      entityId: id,
      newValues: { agencyIds: parsed.data.agencyIds },
      ipAddress: getClientIp(request),
    });

    return created({ assignments: results });
  } catch (err) {
    return serverError(err);
  }
}
