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

    const safeQuery = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
      try { return await p; } catch { return fallback; }
    };

    const [platformStats, serviceCount, industryCount, countryCount, cityCount] = await Promise.all([
      safeQuery(db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM users WHERE deleted_at IS NULL) AS total_users,
          (SELECT COUNT(*)::int FROM agencies WHERE deleted_at IS NULL) AS total_agencies,
          (SELECT COUNT(*)::int FROM reviews WHERE deleted_at IS NULL) AS total_reviews,
          (SELECT COUNT(*)::int FROM leads) AS total_leads
      `), [{ total_users: 0, total_agencies: 0, total_reviews: 0, total_leads: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM services`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM industries`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM countries`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM cities`), [{ count: 0 }] as any[]),
    ]);

    const stats = (platformStats as any[])[0] || {};

    return success({
      platform: {
        totalUsers: Number(stats.total_users) || 0,
        totalAgencies: Number(stats.total_agencies) || 0,
        totalReviews: Number(stats.total_reviews) || 0,
        totalLeads: Number(stats.total_leads) || 0,
        totalServices: Number((serviceCount as any[])[0]?.count) || 0,
        totalIndustries: Number((industryCount as any[])[0]?.count) || 0,
        totalCountries: Number((countryCount as any[])[0]?.count) || 0,
        totalCities: Number((cityCount as any[])[0]?.count) || 0,
      },
      dbConnected: true,
    });
  } catch (err) {
    return serverError(err);
  }
}
