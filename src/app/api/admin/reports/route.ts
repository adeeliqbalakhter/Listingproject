import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

async function safeQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise; } catch { return fallback; }
}

function extract(r: unknown): number {
  return Number((r as Array<{ count: string }>)[0]?.count ?? 0);
}

function extractVal(r: unknown, key: string): number {
  return Number((r as Array<Record<string, unknown>>)[0]?.[key] ?? 0);
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin", "admin");
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const days = Math.min(365, Math.max(7, parseInt(searchParams.get("days") || "30")));

    const [
      // Platform growth
      totalUsers,
      totalAgencies,
      newUsersInPeriod,
      newAgenciesInPeriod,
      usersByRole,
      agenciesByStatus,
      dailySignups,
      dailyAgencyRegistrations,

      // Agency health
      featuredCount,
      verifiedCount,
      topAgenciesByRating,
      topAgenciesByLeads,

      // Lead pipeline
      totalLeads,
      newLeadsInPeriod,
      leadsByStatus,
      leadsPerAgencyAvg,
      unassignedLeads,
      dailyLeads,

      // Revenue & credits
      subscriptionsByTier,
      totalCreditsDistributed,
      totalCreditsUsed,
      creditTopups,
      paymentStats,

      // Reviews
      totalReviews,
      newReviewsInPeriod,
      reviewsByStatus,
      platformAvgRating,
      dailyReviews,

      // Search & engagement
      totalSearches,
      topQueries,
      platformEngagement,
      dailyEngagement,

      // Content
      blogStats,
    ] = await Promise.all([
      // --- Platform growth ---
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM agencies WHERE deleted_at IS NULL`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL AND created_at >= NOW() - make_interval(days => ${days})`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM agencies WHERE deleted_at IS NULL AND created_at >= NOW() - make_interval(days => ${days})`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT role, COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL GROUP BY role ORDER BY count DESC`), [] as any[]),
      safeQuery(db.execute(sql`SELECT status, COUNT(*)::int AS count FROM agencies WHERE deleted_at IS NULL GROUP BY status ORDER BY count DESC`), [] as any[]),
      safeQuery(db.execute(sql`
        SELECT date_trunc('day', created_at)::date AS date, COUNT(*)::int AS count
        FROM users WHERE deleted_at IS NULL AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date ORDER BY date ASC
      `), [] as any[]),
      safeQuery(db.execute(sql`
        SELECT date_trunc('day', created_at)::date AS date, COUNT(*)::int AS count
        FROM agencies WHERE deleted_at IS NULL AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date ORDER BY date ASC
      `), [] as any[]),

      // --- Agency health ---
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM agencies WHERE is_featured = true AND deleted_at IS NULL`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM agencies WHERE is_verified = true AND deleted_at IS NULL`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT id, name, slug, average_rating, total_reviews
        FROM agencies WHERE status = 'active' AND deleted_at IS NULL AND average_rating IS NOT NULL
        ORDER BY average_rating DESC, total_reviews DESC LIMIT 10
      `), [] as any[]),
      safeQuery(db.execute(sql`
        SELECT id, name, slug, total_leads, average_rating
        FROM agencies WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY total_leads DESC NULLS LAST LIMIT 10
      `), [] as any[]),

      // --- Lead pipeline ---
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM leads`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM leads WHERE created_at >= NOW() - make_interval(days => ${days})`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status ORDER BY count DESC`), [] as any[]),
      safeQuery(db.execute(sql`
        SELECT ROUND(AVG(cnt), 1) AS avg FROM (
          SELECT agency_id, COUNT(*)::int AS cnt FROM lead_assignments GROUP BY agency_id
        ) sub
      `), [{ avg: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT COUNT(*)::int AS count FROM leads l
        WHERE NOT EXISTS (SELECT 1 FROM lead_assignments la WHERE la.lead_id = l.id)
      `), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT date_trunc('day', created_at)::date AS date, COUNT(*)::int AS count
        FROM leads WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date ORDER BY date ASC
      `), [] as any[]),

      // --- Revenue & credits ---
      safeQuery(db.execute(sql`
        SELECT p.tier, COUNT(*)::int AS count
        FROM subscriptions s JOIN plans p ON p.id = s.plan_id
        WHERE s.status = 'active'
        GROUP BY p.tier ORDER BY count DESC
      `), [] as any[]),
      safeQuery(db.execute(sql`
        SELECT COALESCE(SUM(amount), 0)::int AS total
        FROM lead_credit_transactions WHERE amount > 0
      `), [{ total: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT COALESCE(SUM(ABS(amount)), 0)::int AS total
        FROM lead_credit_transactions WHERE amount < 0
      `), [{ total: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::int AS total
        FROM lead_credit_transactions
        WHERE amount > 0 AND type = 'topup' AND created_at >= NOW() - make_interval(days => ${days})
      `), [{ count: 0, total: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT
          COUNT(*)::int AS total_payments,
          COUNT(*) FILTER (WHERE status = 'succeeded')::int AS successful,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
          COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount::numeric ELSE 0 END), 0)::numeric AS total_revenue
        FROM payments
      `), [{ total_payments: 0, successful: 0, failed: 0, total_revenue: 0 }] as any[]),

      // --- Reviews ---
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM reviews WHERE deleted_at IS NULL`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM reviews WHERE deleted_at IS NULL AND created_at >= NOW() - make_interval(days => ${days})`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`SELECT status, COUNT(*)::int AS count FROM reviews WHERE deleted_at IS NULL GROUP BY status ORDER BY count DESC`), [] as any[]),
      safeQuery(db.execute(sql`
        SELECT ROUND(AVG(overall_rating)::numeric, 2) AS avg_rating
        FROM reviews WHERE status = 'approved' AND deleted_at IS NULL
      `), [{ avg_rating: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT date_trunc('day', created_at)::date AS date, COUNT(*)::int AS count
        FROM reviews WHERE deleted_at IS NULL AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY date ORDER BY date ASC
      `), [] as any[]),

      // --- Search & engagement ---
      safeQuery(db.execute(sql`SELECT COUNT(*)::int AS count FROM search_logs WHERE created_at >= NOW() - make_interval(days => ${days})`), [{ count: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT query, COUNT(*)::int AS count
        FROM search_logs
        WHERE query IS NOT NULL AND query != '' AND created_at >= NOW() - make_interval(days => ${days})
        GROUP BY query ORDER BY count DESC LIMIT 10
      `), [] as any[]),
      safeQuery(db.execute(sql`
        SELECT
          COALESCE(SUM(profile_views), 0)::int AS total_views,
          COALESCE(SUM(search_impressions), 0)::int AS total_impressions,
          COALESCE(SUM(website_clicks), 0)::int AS total_website_clicks,
          COALESCE(SUM(phone_clicks), 0)::int AS total_phone_clicks,
          COALESCE(SUM(email_clicks), 0)::int AS total_email_clicks,
          COALESCE(SUM(lead_requests), 0)::int AS total_lead_requests
        FROM agency_analytics_daily WHERE date >= CURRENT_DATE - ${days}
      `), [{ total_views: 0, total_impressions: 0, total_website_clicks: 0, total_phone_clicks: 0, total_email_clicks: 0, total_lead_requests: 0 }] as any[]),
      safeQuery(db.execute(sql`
        SELECT date,
          COALESCE(SUM(profile_views), 0)::int AS views,
          COALESCE(SUM(search_impressions), 0)::int AS impressions,
          COALESCE(SUM(website_clicks), 0)::int AS website_clicks,
          COALESCE(SUM(phone_clicks), 0)::int AS phone_clicks,
          COALESCE(SUM(email_clicks), 0)::int AS email_clicks
        FROM agency_analytics_daily WHERE date >= CURRENT_DATE - ${days}
        GROUP BY date ORDER BY date ASC
      `), [] as any[]),

      // --- Content ---
      safeQuery(db.execute(sql`
        SELECT
          COUNT(*)::int AS total_posts,
          COUNT(*) FILTER (WHERE status = 'published')::int AS published,
          COALESCE(SUM(view_count), 0)::int AS total_views
        FROM blog_posts
      `), [{ total_posts: 0, published: 0, total_views: 0 }] as any[]),
    ]);

    const engagement = (platformEngagement as any[])[0] || {};
    const totalViews = Number(engagement.total_views) || 0;
    const totalImpressions = Number(engagement.total_impressions) || 0;
    const totalWebClicks = Number(engagement.total_website_clicks) || 0;
    const totalPhoneClicks = Number(engagement.total_phone_clicks) || 0;
    const totalEmailClicks = Number(engagement.total_email_clicks) || 0;
    const totalAllClicks = totalWebClicks + totalPhoneClicks + totalEmailClicks;
    const platformCTR = totalImpressions > 0 ? Math.round((totalViews / totalImpressions) * 1000) / 10 : 0;

    const paymentRow = (paymentStats as any[])[0] || {};
    const creditTopupRow = (creditTopups as any[])[0] || {};
    const blog = (blogStats as any[])[0] || {};

    return success({
      period: days,

      platformGrowth: {
        totalUsers: extract(totalUsers),
        totalAgencies: extract(totalAgencies),
        newUsersInPeriod: extract(newUsersInPeriod),
        newAgenciesInPeriod: extract(newAgenciesInPeriod),
        usersByRole: (usersByRole as any[]).map((r: any) => ({ role: r.role, count: Number(r.count) })),
        agenciesByStatus: (agenciesByStatus as any[]).map((r: any) => ({ status: r.status, count: Number(r.count) })),
        dailySignups: (dailySignups as any[]).map((r: any) => ({ date: r.date, count: Number(r.count) })),
        dailyAgencyRegistrations: (dailyAgencyRegistrations as any[]).map((r: any) => ({ date: r.date, count: Number(r.count) })),
      },

      agencyHealth: {
        totalActive: ((agenciesByStatus as any[]).find((r: any) => r.status === "active")?.count ?? 0),
        featured: extract(featuredCount),
        verified: extract(verifiedCount),
        topByRating: (topAgenciesByRating as any[]).map((r: any) => ({
          id: r.id, name: r.name, slug: r.slug,
          rating: Number(r.average_rating) || 0,
          reviews: Number(r.total_reviews) || 0,
        })),
        topByLeads: (topAgenciesByLeads as any[]).map((r: any) => ({
          id: r.id, name: r.name, slug: r.slug,
          leads: Number(r.total_leads) || 0,
          rating: Number(r.average_rating) || 0,
        })),
      },

      leadPipeline: {
        total: extract(totalLeads),
        newInPeriod: extract(newLeadsInPeriod),
        byStatus: (leadsByStatus as any[]).map((r: any) => ({ status: r.status, count: Number(r.count) })),
        avgPerAgency: Number((leadsPerAgencyAvg as any[])[0]?.avg) || 0,
        unassigned: extract(unassignedLeads),
        dailyLeads: (dailyLeads as any[]).map((r: any) => ({ date: r.date, count: Number(r.count) })),
      },

      revenueCredits: {
        subscriptionsByTier: (subscriptionsByTier as any[]).map((r: any) => ({ tier: r.tier, count: Number(r.count) })),
        creditsDistributed: extractVal(totalCreditsDistributed, "total"),
        creditsUsed: extractVal(totalCreditsUsed, "total"),
        creditTopupsInPeriod: { count: Number(creditTopupRow.count) || 0, total: Number(creditTopupRow.total) || 0 },
        payments: {
          total: Number(paymentRow.total_payments) || 0,
          successful: Number(paymentRow.successful) || 0,
          failed: Number(paymentRow.failed) || 0,
          totalRevenue: Number(paymentRow.total_revenue) || 0,
        },
      },

      reviews: {
        total: extract(totalReviews),
        newInPeriod: extract(newReviewsInPeriod),
        byStatus: (reviewsByStatus as any[]).map((r: any) => ({ status: r.status, count: Number(r.count) })),
        platformAvgRating: Number((platformAvgRating as any[])[0]?.avg_rating) || 0,
        dailyReviews: (dailyReviews as any[]).map((r: any) => ({ date: r.date, count: Number(r.count) })),
      },

      searchEngagement: {
        totalSearches: extract(totalSearches),
        topQueries: (topQueries as any[]).map((r: any) => ({ query: r.query, count: Number(r.count) })),
        totalViews,
        totalImpressions,
        totalWebsiteClicks: totalWebClicks,
        totalPhoneClicks,
        totalEmailClicks,
        totalClicks: totalAllClicks,
        ctr: platformCTR,
        dailyEngagement: (dailyEngagement as any[]).map((r: any) => ({
          date: r.date,
          views: Number(r.views) || 0,
          impressions: Number(r.impressions) || 0,
          websiteClicks: Number(r.website_clicks) || 0,
          phoneClicks: Number(r.phone_clicks) || 0,
          emailClicks: Number(r.email_clicks) || 0,
        })),
      },

      content: {
        totalPosts: Number(blog.total_posts) || 0,
        published: Number(blog.published) || 0,
        totalViews: Number(blog.total_views) || 0,
      },
    });
  } catch (err) {
    console.error("[ADMIN REPORTS] Error:", err);
    return serverError(err);
  }
}
