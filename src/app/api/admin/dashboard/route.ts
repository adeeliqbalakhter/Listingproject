import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const [usersCount, agenciesCount, reviewsCount, leadsCount, pendingAgencies, pendingReviews, recentUsers] =
      await Promise.all([
        db.execute(sql`SELECT count(*) as count FROM users WHERE deleted_at IS NULL`),
        db.execute(sql`SELECT count(*) as count FROM agencies WHERE deleted_at IS NULL`),
        db.execute(sql`SELECT count(*) as count FROM reviews WHERE deleted_at IS NULL`),
        db.execute(sql`SELECT count(*) as count FROM leads`),
        db.execute(sql`SELECT count(*) as count FROM agencies WHERE status = 'pending' AND deleted_at IS NULL`),
        db.execute(sql`SELECT count(*) as count FROM reviews WHERE status = 'pending' AND deleted_at IS NULL`),
        db.execute(sql`SELECT id, name, email, role, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10`),
      ]);

    const extract = (r: unknown) => Number((r as Array<{ count: string }>)[0]?.count ?? 0);

    let subscriptionStats = { totalSubscribers: 0, paidSubscribers: 0, mrr: 0, tierBreakdown: [] as Array<Record<string, unknown>> };
    try {
      const tierRows = await db.execute(sql`
        SELECT p.tier, p.monthly_price, count(s.id)::int as count
        FROM plans p
        LEFT JOIN subscriptions s ON s.plan_id = p.id AND s.status = 'active'
        GROUP BY p.tier, p.monthly_price, p.sort_order
        ORDER BY p.sort_order ASC
      `);
      const tiers = tierRows as unknown as Array<{ tier: string; monthly_price: string; count: number }>;
      let total = 0;
      let paid = 0;
      let mrr = 0;
      for (const t of tiers) {
        total += t.count;
        if (t.tier !== "free") {
          paid += t.count;
          mrr += t.count * Number(t.monthly_price);
        }
      }
      subscriptionStats = { totalSubscribers: total, paidSubscribers: paid, mrr, tierBreakdown: tiers };
    } catch { /* tables may not exist yet */ }

    return success({
      stats: {
        totalUsers: extract(usersCount),
        totalAgencies: extract(agenciesCount),
        totalReviews: extract(reviewsCount),
        totalLeads: extract(leadsCount),
        pendingAgencies: extract(pendingAgencies),
        pendingReviews: extract(pendingReviews),
      },
      subscriptionStats,
      recentUsers,
    });
  } catch (err) {
    return serverError(err);
  }
}
