import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { success, error } from "@/lib/api/response";
import { z } from "zod";

const claimSchema = z.object({
  leadId: z.string().uuid(),
  assignmentId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const body = await request.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400);

    const { leadId, assignmentId } = parsed.data;

    // Verify the assignment exists and belongs to an agency this user owns
    let assignment: Record<string, unknown> | undefined;
    try {
      const assignmentRows = await db.execute(sql`
        SELECT la.id, la.lead_id, la.agency_id, la.status,
               a.user_id as agency_owner_id, a.name as agency_name
        FROM lead_assignments la
        JOIN agencies a ON a.id = la.agency_id
        WHERE la.id = ${assignmentId} AND la.lead_id = ${leadId}
      `);
      assignment = (assignmentRows as unknown as Array<Record<string, unknown>>)[0];
    } catch (err) {
      console.error("[CLAIM] Assignment query error:", err);
      return error("Failed to verify assignment", 500);
    }

    if (!assignment) return error("Assignment not found", 404);
    if (assignment.agency_owner_id !== user.id) return error("Access denied", 403);

    const agencyId = assignment.agency_id as string;

    // Check if already claimed by status
    if (assignment.status === "claimed" || assignment.status === "responded" || assignment.status === "won") {
      return success({ message: "Already claimed", alreadyClaimed: true });
    }

    // Ensure credit transactions table exists
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS lead_credit_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agency_id UUID NOT NULL,
          amount INTEGER NOT NULL,
          type VARCHAR(30) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
    } catch { /* already exists */ }

    // Check if credit was already consumed for this lead (prevents double-charge)
    try {
      const existingClaim = await db.execute(sql`
        SELECT id FROM lead_credit_transactions
        WHERE agency_id = ${agencyId} AND type = 'consume'
          AND description = ${"Claimed lead: " + leadId}
        LIMIT 1
      `);
      if ((existingClaim as unknown as Array<Record<string, unknown>>).length > 0) {
        try {
          await db.execute(sql`
            UPDATE lead_assignments SET status = 'claimed' WHERE id = ${assignmentId}
          `);
        } catch { /* ignore */ }
        return success({ message: "Already claimed", alreadyClaimed: true });
      }
    } catch { /* table might not have data yet */ }

    // Calculate available credits
    let monthlyCredits = 1;
    try {
      const planRows = await db.execute(sql`
        SELECT p.monthly_lead_credits FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.agency_id = ${agencyId} AND s.status = 'active'
      `);
      const plan = (planRows as unknown as Array<Record<string, unknown>>)[0];
      if (plan) monthlyCredits = Number(plan.monthly_lead_credits) || 1;
    } catch { /* default 1 */ }

    let consumed = 0;
    try {
      const usedRows = await db.execute(sql`
        SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as used
        FROM lead_credit_transactions
        WHERE agency_id = ${agencyId} AND type = 'consume'
          AND created_at >= date_trunc('month', NOW())
      `);
      consumed = Number((usedRows as unknown as Array<Record<string, unknown>>)[0]?.used ?? 0);
    } catch { /* ignore */ }

    let granted = 0;
    try {
      const grantRows = await db.execute(sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM lead_credit_transactions
        WHERE agency_id = ${agencyId} AND type = 'grant'
      `);
      granted = Number((grantRows as unknown as Array<Record<string, unknown>>)[0]?.total ?? 0);
    } catch { /* ignore */ }

    const available = (monthlyCredits === -1 ? 999999 : monthlyCredits) + granted - consumed;

    if (available < 1) {
      return error("No credits remaining. Please upgrade your plan or contact support.", 403);
    }

    // Atomic: deduct credit AND update status in a single statement
    const claimDesc = "Claimed lead: " + leadId;
    try {
      await db.execute(sql`
        WITH credit AS (
          INSERT INTO lead_credit_transactions (agency_id, amount, type, description)
          VALUES (${agencyId}, -1, 'consume', ${claimDesc})
          RETURNING id
        )
        UPDATE lead_assignments SET status = 'claimed'
        WHERE id = ${assignmentId}
      `);
    } catch (err) {
      console.error("[CLAIM] Atomic claim error:", err);
      // Fallback: try separately
      try {
        await db.execute(sql`
          INSERT INTO lead_credit_transactions (agency_id, amount, type, description)
          VALUES (${agencyId}, -1, 'consume', ${claimDesc})
        `);
      } catch (err2) {
        console.error("[CLAIM] Credit insert fallback error:", err2);
        return error("Failed to deduct credit", 500);
      }
      try {
        await db.execute(sql`
          UPDATE lead_assignments SET status = 'claimed' WHERE id = ${assignmentId}
        `);
      } catch { /* best effort */ }
    }

    // Update lead status if still 'new'
    try {
      await db.execute(sql`
        UPDATE leads SET status = 'viewed', updated_at = NOW()
        WHERE id = ${leadId} AND status = 'new'
      `);
    } catch { /* ignore */ }

    return success({ message: "Lead claimed successfully", creditsRemaining: available - 1 });
  } catch (err) {
    console.error("[CLAIM] Unhandled error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
