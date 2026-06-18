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

    // 1. Verify the assignment exists and belongs to an agency this user owns.
    //    We match by lead_id so we operate on ALL of this agency's rows for the
    //    lead (defensive against any duplicate assignment rows).
    let agencyId: string | null = null;
    let alreadyClaimed = false;
    try {
      const assignmentRows = await db.execute(sql`
        SELECT la.agency_id,
               a.user_id as agency_owner_id,
               bool_or(la.status IN ('claimed', 'responded', 'won')) as has_claimed
        FROM lead_assignments la
        JOIN agencies a ON a.id = la.agency_id
        WHERE la.lead_id = ${leadId}
          AND (la.id = ${assignmentId} OR la.agency_id = (
            SELECT agency_id FROM lead_assignments WHERE id = ${assignmentId}
          ))
        GROUP BY la.agency_id, a.user_id
      `);
      const row = (assignmentRows as unknown as Array<Record<string, unknown>>)[0];
      if (!row) return error("Assignment not found", 404);
      if (row.agency_owner_id !== user.id) return error("Access denied", 403);
      agencyId = row.agency_id as string;
      alreadyClaimed = row.has_claimed === true;
    } catch (err) {
      console.error("[CLAIM] Assignment lookup error:", err);
      return error("Failed to verify assignment: " + (err instanceof Error ? err.message : "DB error"), 500);
    }

    if (!agencyId) return error("Assignment not found", 404);

    // 2. Already claimed — nothing to do, no charge.
    if (alreadyClaimed) {
      return success({ message: "Already claimed", alreadyClaimed: true });
    }

    // 3. Ensure credit transactions table exists
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

    // 4. Compute available credits (outside the transaction is fine — read-only).
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
    let granted = 0;
    try {
      const usedRows = await db.execute(sql`
        SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as used
        FROM lead_credit_transactions
        WHERE agency_id = ${agencyId} AND type = 'consume'
          AND created_at >= date_trunc('month', NOW())
      `);
      consumed = Number((usedRows as unknown as Array<Record<string, unknown>>)[0]?.used ?? 0);
    } catch { /* ignore */ }
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

    // 5. ATOMIC claim: update status + deduct credit in one transaction.
    //    If anything fails, the whole thing rolls back — no partial writes.
    let claimedRowCount = 0;
    try {
      await db.transaction(async (tx) => {
        // 5a. Skip charging if a credit for this exact lead already exists
        //     (idempotent retry protection), but still make sure status is set.
        const existing = await tx.execute(sql`
          SELECT id FROM lead_credit_transactions
          WHERE agency_id = ${agencyId} AND type = 'consume'
            AND description = ${"Claimed lead: " + leadId}
          LIMIT 1
        `);
        const alreadyCharged = (existing as unknown as Array<Record<string, unknown>>).length > 0;

        // 5b. Update EVERY assignment row for this agency+lead that is still open.
        const updated = await tx.execute(sql`
          UPDATE lead_assignments
          SET status = 'claimed'
          WHERE lead_id = ${leadId}
            AND agency_id = ${agencyId}
            AND status IN ('sent', 'viewed')
          RETURNING id, status
        `);
        const updatedRows = updated as unknown as Array<Record<string, unknown>>;
        claimedRowCount = updatedRows.length;
        console.log(`[CLAIM] lead=${leadId} agency=${agencyId} updated ${claimedRowCount} row(s) ->`, updatedRows);

        // 5c. Deduct one credit (only if not already charged for this lead).
        if (!alreadyCharged) {
          await tx.execute(sql`
            INSERT INTO lead_credit_transactions (agency_id, amount, type, description)
            VALUES (${agencyId}, -1, 'consume', ${"Claimed lead: " + leadId})
          `);
        }

        // 5d. Bump the lead's own status if it was still 'new'.
        await tx.execute(sql`
          UPDATE leads SET status = 'viewed', updated_at = NOW()
          WHERE id = ${leadId} AND status = 'new'
        `);
      });
    } catch (err) {
      console.error("[CLAIM] Transaction failed:", err);
      return error("Failed to claim lead: " + (err instanceof Error ? err.message : "DB error"), 500);
    }

    return success({
      message: "Lead claimed successfully",
      creditsRemaining: available - 1,
      rowsClaimed: claimedRowCount,
    });
  } catch (err) {
    console.error("[CLAIM] Unexpected error:", err);
    return error("Claim failed: " + (err instanceof Error ? err.message : "Unknown error"), 500);
  }
}
