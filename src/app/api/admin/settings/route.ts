import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

async function safeQuery<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

async function checkEndpoint(baseUrl: string, path: string): Promise<{ path: string; status: number; ok: boolean; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: { "x-health-check": "1" },
      signal: AbortSignal.timeout(8000),
    });
    return { path, status: res.status, ok: res.status < 500, ms: Date.now() - start };
  } catch {
    return { path, status: 0, ok: false, ms: Date.now() - start };
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

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

    // Database health: test query speed
    let dbLatency = 0;
    let dbHealthy = true;
    try {
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      dbLatency = Date.now() - start;
    } catch {
      dbHealthy = false;
    }

    // Table health: check critical tables exist and are accessible
    const criticalTables = ["users", "agencies", "reviews", "leads", "lead_assignments", "services", "industries", "countries", "cities", "agency_analytics_daily", "search_logs", "sessions"];
    const tableChecks: { table: string; ok: boolean; count: number }[] = [];
    for (const table of criticalTables) {
      try {
        const r = await db.execute(sql.raw(`SELECT COUNT(*)::int AS count FROM ${table} LIMIT 1`));
        tableChecks.push({ table, ok: true, count: Number((r as any[])[0]?.count) || 0 });
      } catch {
        tableChecks.push({ table, ok: false, count: 0 });
      }
    }

    // API health: probe key endpoints
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    const apiEndpoints = [
      "/api/services",
      "/api/industries",
      "/api/locations",
      "/api/search",
      "/api/homepage",
      "/api/plans",
      "/api/auth/me",
    ];

    const apiChecks = await Promise.all(apiEndpoints.map(ep => checkEndpoint(baseUrl, ep)));

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
      dbConnected: dbHealthy,
      health: {
        database: {
          connected: dbHealthy,
          latencyMs: dbLatency,
          tables: tableChecks,
        },
        apis: apiChecks,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
