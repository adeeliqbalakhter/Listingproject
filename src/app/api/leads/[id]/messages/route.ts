import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";
import { z } from "zod";
import { success, created, error, serverError } from "@/lib/api/response";

const messageSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const assignmentId = searchParams.get("assignmentId");
    if (!assignmentId) return error("assignmentId required", 400);

    const rows = await db.execute(sql`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.lead_assignment_id = ${assignmentId}
      ORDER BY m.created_at ASC
    `);

    return success(rows);
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await params;
    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    const rows = await db.execute(sql`
      INSERT INTO messages (lead_assignment_id, sender_id, content)
      VALUES (${parsed.data.assignmentId}, ${user.id}, ${parsed.data.content})
      RETURNING *
    `);

    // Update assignment responded_at if this is agency's first response
    await db.execute(sql`
      UPDATE lead_assignments SET responded_at = COALESCE(responded_at, NOW()), status = 'responded'
      WHERE id = ${parsed.data.assignmentId} AND responded_at IS NULL
    `);

    return created((rows as unknown as Array<Record<string, unknown>>)[0]);
  } catch (err) {
    return serverError(err);
  }
}
