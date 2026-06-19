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

    // 1. Look up assignment
    const assignmentRows = await db.execute(sql`
      SELECT la.id, la.lead_id, la.agency_id, la.status,
             a.user_id as agency_owner_id
      FROM lead_assignments la
      JOIN agencies a ON a.id = la.agency_id
      WHERE la.id = ${assignmentId} AND la.lead_id = ${leadId}
    `);
    const assignment = (assignmentRows as unknown as Array<Record<string, unknown>>)[0];
    if (!assignment) return error("Assignment not found", 404);
    if (assignment.agency_owner_id !== user.id) return error("Access denied", 403);

    const agencyId = assignment.agency_id as string;
    const currentStatus = assignment.status as string;

    // 2. Already claimed
    if (currentStatus === "claimed" || currentStatus === "responded" || currentStatus === "won") {
      return success({ message: "Already claimed", alreadyClaimed: true });
    }

    // 3. Ensure credit table exists
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
    } catch { /* exists */ }

    // 4. Check if already charged (idempotent retry)
    let alreadyCharged = false;
    try {
      const existing = await db.execute(sql`
        SELECT id FROM lead_credit_transactions
        WHERE agency_id = ${agencyId} AND type = 'consume'
          AND description = ${"Claimed lead: " + leadId}
        LIMIT 1
      `);
      alreadyCharged = (existing as unknown as Array<Record<string, unknown>>).length > 0;
    } catch { /* table may not exist */ }

    if (alreadyCharged) {
      // Credit was charged before but status didn't update — fix it now
      await db.execute(sql`
        UPDATE lead_assignments SET status = 'claimed'
        WHERE id = ${assignmentId} AND status = 'sent'
      `);
      return success({ message: "Already claimed", alreadyClaimed: true });
    }

    // 5. Check credits
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

    // 6. Deduct credit FIRST (permanent record — this is the source of truth)
    await db.execute(sql`
      INSERT INTO lead_credit_transactions (agency_id, amount, type, description)
      VALUES (${agencyId}, -1, 'consume', ${"Claimed lead: " + leadId})
    `);

    // 7. Update status on ALL rows for this agency+lead
    await db.execute(sql`
      UPDATE lead_assignments SET status = 'claimed'
      WHERE lead_id = ${leadId} AND agency_id = ${agencyId} AND status = 'sent'
    `);

    // 8. Also update by specific ID as a safeguard
    await db.execute(sql`
      UPDATE lead_assignments SET status = 'claimed'
      WHERE id = ${assignmentId} AND status = 'sent'
    `);

    // 9. Bump lead status
    try {
      await db.execute(sql`
        UPDATE leads SET status = 'viewed', updated_at = NOW()
        WHERE id = ${leadId} AND status = 'new'
      `);
    } catch { /* non-critical */ }

    return success({
      message: "Lead claimed successfully",
      creditsRemaining: available - 1,
    });
  } catch (err) {
    console.error("[CLAIM] Error:", err);
    return error("Claim failed: " + (err instanceof Error ? err.message : "Unknown error"), 500);
  }
}
