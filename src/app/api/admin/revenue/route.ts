import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "admin", "super_admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const [tierCounts, totalPayments, monthlyPayments, overrideCounts] = await Promise.all([
      db.execute(sql`
        SELECT p.tier, p.name as plan_name, p.monthly_price, p.yearly_price,
          count(s.id)::int as subscriber_count
        FROM plans p
        LEFT JOIN subscriptions s ON s.plan_id = p.id AND s.status = 'active'
        GROUP BY p.id, p.tier, p.name, p.monthly_price, p.yearly_price, p.sort_order
        ORDER BY p.sort_order ASC
      `),
      db.execute(sql`
        SELECT
          count(*)::int as total_payments,
          COALESCE(sum(amount), 0)::decimal as total_revenue
        FROM payments WHERE status = 'succeeded'
      `),
      db.execute(sql`
        SELECT
          count(*)::int as monthly_payments,
          COALESCE(sum(amount), 0)::decimal as monthly_revenue
        FROM payments
        WHERE status = 'succeeded'
          AND created_at >= date_trunc('month', NOW())
      `),
      db.execute(sql`
        SELECT count(*)::int as count
        FROM subscriptions
        WHERE is_admin_override = true AND status = 'active'
      `),
    ]);

    const tiers = tierCounts as unknown as Array<Record<string, unknown>>;
    const totalStats = (totalPayments as unknown as Array<Record<string, unknown>>)[0] ?? {};
    const monthlyStats = (monthlyPayments as unknown as Array<Record<string, unknown>>)[0] ?? {};
    const overrides = (overrideCounts as unknown as Array<Record<string, unknown>>)[0] ?? {};

    let mrr = 0;
    for (const t of tiers) {
      const count = Number(t.subscriber_count ?? 0);
      const price = Number(t.monthly_price ?? 0);
      mrr += count * price;
    }

    return success({
      mrr,
      totalRevenue: Number(totalStats.total_revenue ?? 0),
      totalPayments: Number(totalStats.total_payments ?? 0),
      monthlyRevenue: Number(monthlyStats.monthly_revenue ?? 0),
      monthlyPayments: Number(monthlyStats.monthly_payments ?? 0),
      adminOverrides: Number(overrides.count ?? 0),
      tiers,
    });
  } catch (err) {
    return serverError(err);
  }
}
