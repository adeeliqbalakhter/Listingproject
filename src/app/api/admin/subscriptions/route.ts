import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { paginated, success, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "admin", "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const tier = searchParams.get("tier") || "";
    const agencyName = searchParams.get("agency") || "";

    const conditions: ReturnType<typeof sql>[] = [];
    if (tier) conditions.push(sql`p.tier = ${tier}`);
    if (agencyName) conditions.push(sql`a.name ILIKE ${`%${agencyName}%`}`);

    const where = conditions.length > 0
      ? conditions.reduce((acc, cond, i) => i === 0 ? sql`WHERE ${cond}` : sql`${acc} AND ${cond}`)
      : sql``;

    try {
      const countResult = await db.execute(sql`
        SELECT count(*) as count
        FROM subscriptions s
        JOIN agencies a ON s.agency_id = a.id
        JOIN plans p ON s.plan_id = p.id
        ${where}
      `);
      const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

      const rows = await db.execute(sql`
        SELECT s.*, a.name as agency_name, p.name as plan_name, p.tier
        FROM subscriptions s
        JOIN agencies a ON s.agency_id = a.id
        JOIN plans p ON s.plan_id = p.id
        ${where}
        ORDER BY s.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      return paginated(rows as unknown as Array<Record<string, unknown>>, { page, limit, total });
    } catch (tableErr) {
      const message = tableErr instanceof Error ? tableErr.message : String(tableErr);
      if (message.includes("does not exist") || message.includes("relation")) {
        return error("Subscription tables not set up yet", 503);
      }
      throw tableErr;
    }
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "admin", "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();
    const neonSql = getNeonSql();

    const body = await request.json();
    const { agencyId, planId, isAdminOverride, overrideReason } = body as {
      agencyId?: string;
      planId?: string;
      isAdminOverride?: boolean;
      overrideReason?: string;
    };

    if (!agencyId || !planId) {
      return error("agencyId and planId are required", 400);
    }

    if (isAdminOverride && !overrideReason?.trim()) {
      return error("Override reason is required when promoting an agency", 400);
    }

    try {
      // Verify the plan exists and get its credit amount
      const planRows = await db.execute(sql`
        SELECT id, monthly_lead_credits, tier, name FROM plans WHERE id = ${planId}
      `);
      const plan = (planRows as unknown as Array<{ id: string; monthly_lead_credits: number; tier: string; name: string }>)[0];
      if (!plan) return error("Plan not found", 404);

      // Check for existing subscription
      const existingRows = await db.execute(sql`
        SELECT id FROM subscriptions WHERE agency_id = ${agencyId}
      `);
      const existing = (existingRows as unknown as Array<{ id: string }>)[0];

      let subscriptionRow;
      const adminId = authResult.user.id;

      if (existing) {
        const updated = await neonSql`
          UPDATE subscriptions
          SET plan_id = ${planId},
              updated_at = NOW(),
              status = 'active',
              is_admin_override = ${isAdminOverride ? true : false},
              override_reason = ${isAdminOverride ? (overrideReason ?? null) : null},
              override_by = ${isAdminOverride ? adminId : null},
              current_period_end = NOW() + INTERVAL '1 year'
          WHERE id = ${existing.id}
          RETURNING *
        `;
        subscriptionRow = updated[0];
      } else {
        const inserted = await neonSql`
          INSERT INTO subscriptions (agency_id, plan_id, status, billing_cycle, current_period_start, current_period_end, is_admin_override, override_reason, override_by)
          VALUES (${agencyId}, ${planId}, 'active', 'monthly', NOW(), NOW() + INTERVAL '1 year', ${isAdminOverride ? true : false}, ${isAdminOverride ? (overrideReason ?? null) : null}, ${isAdminOverride ? adminId : null})
          RETURNING *
        `;
        subscriptionRow = inserted[0];
      }

      // Update agency verified/featured flags based on tier
      if (plan.tier === "premium" || plan.tier === "pro" || plan.tier === "enterprise") {
        await neonSql`UPDATE agencies SET is_verified = true WHERE id = ${agencyId}`;
      }
      if (plan.tier === "pro" || plan.tier === "enterprise") {
        await neonSql`UPDATE agencies SET is_featured = true WHERE id = ${agencyId}`;
      }
      if (plan.tier === "free") {
        await neonSql`UPDATE agencies SET is_verified = false, is_featured = false WHERE id = ${agencyId}`;
      }

      // Grant monthly credits
      if (plan.monthly_lead_credits > 0) {
        await neonSql`
          INSERT INTO lead_credit_transactions (agency_id, amount, type, description)
          VALUES (${agencyId}, ${plan.monthly_lead_credits}, 'grant', ${isAdminOverride ? 'Admin override: ' + plan.name + ' plan' : 'Monthly credits from plan change'})
        `;
      }

      return success({ ...subscriptionRow, planTier: plan.tier, planName: plan.name });
    } catch (tableErr) {
      const message = tableErr instanceof Error ? tableErr.message : String(tableErr);
      if (message.includes("does not exist") || message.includes("relation")) {
        return error("Subscription tables not set up yet", 503);
      }
      throw tableErr;
    }
  } catch (err) {
    return serverError(err);
  }
}
