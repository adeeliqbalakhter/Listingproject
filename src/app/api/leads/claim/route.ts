import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { hasDb, getDb } from "@/lib/db";
import { sql, eq } from "drizzle-orm";
import { leadAssignments } from "@/lib/db/schema/leads";
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

    // 1. Look up assignment + ownership
    let agencyId: string;
    let currentStatus: string;
    try {
      const rows = await db.execute(sql`
        SELECT la.agency_id, la.status, a.user_id as owner_id
        FROM lead_assignments la
        JOIN agencies a ON a.id = la.agency_id
        WHERE la.id = ${assignmentId} AND la.lead_id = ${leadId}
      `);
      const row = (rows as unknown as Array<Record<string, unknown>>)[0];
      if (!row) return error("Assignment not found", 404);
      if (row.owner_id !== user.id) return error("Access denied", 403);
      agencyId = row.agency_id as string;
      currentStatus = row.status as string;
    } catch (err) {
      return error("Lookup failed: " + (err instanceof Error ? err.message : "DB error"), 500);
    }

    // 2. Already claimed
    if (currentStatus === "claimed" || currentStatus === "responded" || currentStatus === "won") {
      return success({ message: "Already claimed", alreadyClaimed: true });
    }

    // 3. Check if credit already charged
    let alreadyCharged = false;
    try {
      const rows = await db.execute(sql`
        SELECT 1 FROM lead_credit_transactions
        WHERE agency_id = ${agencyId} AND type = 'consume'
          AND description = ${"Claimed lead: " + leadId}
        LIMIT 1
      `);
      alreadyCharged = (rows as unknown as Array<unknown>).length > 0;
    } catch { /* table may not exist */ }

    // 4. UPDATE status using Drizzle ORM (not raw SQL)
    let updateError: string | null = null;
    try {
      await db.update(leadAssignments)
        .set({ status: "claimed" })
        .where(eq(leadAssignments.id, assignmentId));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errCode = (err as Record<string, unknown>)?.code;
      const errDetail = (err as Record<string, unknown>)?.detail;
      updateError = `ORM update failed: ${errMsg} | code: ${errCode} | detail: ${errDetail}`;
      console.error("[CLAIM] ORM UPDATE failed:", err);

      // Retry with raw SQL as fallback
      try {
        await db.execute(sql`
          UPDATE lead_assignments SET status = 'claimed' WHERE id = ${assignmentId}
        `);
        updateError = null; // retry succeeded
        console.log("[CLAIM] Raw SQL retry succeeded");
      } catch (retryErr) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        updateError = `Both ORM and raw SQL failed. ORM: ${errMsg} | Raw: ${retryMsg}`;
        console.error("[CLAIM] Raw SQL retry also failed:", retryErr);
      }
    }

    if (updateError) {
      return error(updateError, 500);
    }

    // 5. Verify update
    try {
      const verify = await db.execute(sql`
        SELECT status FROM lead_assignments WHERE id = ${assignmentId}
      `);
      const row = (verify as unknown as Array<Record<string, unknown>>)[0];
      if (row && row.status !== "claimed") {
        return error("Status did not persist. DB returned: " + JSON.stringify(row), 500);
      }
    } catch { /* verification query failed, but update didn't throw */ }

    // 6. Charge credit if not already charged
    if (!alreadyCharged) {
      let available = 999;
      try {
        let monthlyCredits = 1;
        try {
          const planRows = await db.execute(sql`
            SELECT p.monthly_lead_credits FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.agency_id = ${agencyId} AND s.status = 'active'
          `);
          const plan = (planRows as unknown as Array<Record<string, unknown>>)[0];
          if (plan) monthlyCredits = Number(plan.monthly_lead_credits) || 1;
        } catch { /* default */ }

        let consumed = 0;
        try {
          const rows = await db.execute(sql`
            SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as used
            FROM lead_credit_transactions
            WHERE agency_id = ${agencyId} AND type = 'consume'
              AND created_at >= date_trunc('month', NOW())
          `);
          consumed = Number((rows as unknown as Array<Record<string, unknown>>)[0]?.used ?? 0);
        } catch { /* 0 */ }

        let granted = 0;
        try {
          const rows = await db.execute(sql`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM lead_credit_transactions
            WHERE agency_id = ${agencyId} AND type = 'grant'
          `);
          granted = Number((rows as unknown as Array<Record<string, unknown>>)[0]?.total ?? 0);
        } catch { /* 0 */ }

        available = (monthlyCredits === -1 ? 999999 : monthlyCredits) + granted - consumed;
      } catch { /* default 999 */ }

      if (available < 1) {
        try {
          await db.update(leadAssignments)
            .set({ status: "sent" })
            .where(eq(leadAssignments.id, assignmentId));
        } catch { /* best effort revert */ }
        return error("No credits remaining. Upgrade your plan.", 403);
      }

      try {
        await db.execute(sql`
          INSERT INTO lead_credit_transactions (agency_id, amount, type, description)
          VALUES (${agencyId}, -1, 'consume', ${"Claimed lead: " + leadId})
        `);
      } catch (err) {
        console.error("[CLAIM] Credit insert failed:", err);
      }
    }

    // 7. Bump lead status
    try {
      await db.execute(sql`
        UPDATE leads SET status = 'viewed', updated_at = NOW()
        WHERE id = ${leadId} AND status = 'new'
      `);
    } catch { /* non-critical */ }

    return success({ message: "Lead claimed successfully" });
  } catch (err) {
    console.error("[CLAIM] Error:", err);
    return error("Claim failed: " + (err instanceof Error ? err.message : "Unknown"), 500);
  }
}
