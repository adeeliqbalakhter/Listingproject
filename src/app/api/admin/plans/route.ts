import { NextRequest } from "next/server";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "admin", "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const rows = await db.execute(sql`
      SELECT p.*,
        (SELECT count(*) FROM subscriptions s WHERE s.plan_id = p.id AND s.status = 'active') as active_subscribers
      FROM plans p
      ORDER BY p.sort_order ASC
    `);

    return success(rows as unknown as Array<Record<string, unknown>>);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const neonSql = getNeonSql();

    const body = await request.json();
    const { planId, monthlyPrice, yearlyPrice, monthlyLeadCredits, maxPortfolioItems, maxTeamMembers, features, description, isActive } = body as {
      planId?: string;
      monthlyPrice?: number;
      yearlyPrice?: number;
      monthlyLeadCredits?: number;
      maxPortfolioItems?: number;
      maxTeamMembers?: number;
      features?: Record<string, boolean>;
      description?: string;
      isActive?: boolean;
    };

    if (!planId) return error("planId is required", 400);

    const sets: string[] = [];
    const vals: Record<string, unknown> = {};

    if (monthlyPrice !== undefined) {
      if (monthlyPrice < 0) return error("Monthly price cannot be negative", 400);
      vals.monthlyPrice = monthlyPrice;
    }
    if (yearlyPrice !== undefined) {
      if (yearlyPrice < 0) return error("Yearly price cannot be negative", 400);
      vals.yearlyPrice = yearlyPrice;
    }

    const updated = await neonSql`
      UPDATE plans SET
        monthly_price = COALESCE(${monthlyPrice ?? null}::decimal, monthly_price),
        yearly_price = COALESCE(${yearlyPrice ?? null}::decimal, yearly_price),
        monthly_lead_credits = COALESCE(${monthlyLeadCredits ?? null}::int, monthly_lead_credits),
        max_portfolio_items = COALESCE(${maxPortfolioItems ?? null}::int, max_portfolio_items),
        max_team_members = COALESCE(${maxTeamMembers ?? null}::int, max_team_members),
        features = COALESCE(${features ? JSON.stringify(features) : null}::jsonb, features),
        description = COALESCE(${description ?? null}, description),
        is_active = COALESCE(${isActive ?? null}::bool, is_active)
      WHERE id = ${planId}
      RETURNING *
    `;

    if (!updated[0]) return error("Plan not found", 404);

    return success(updated[0]);
  } catch (err) {
    return serverError(err);
  }
}
