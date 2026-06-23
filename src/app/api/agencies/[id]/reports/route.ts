import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAgencyAccess } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";

async function safeQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise; } catch { return fallback; }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await requireAgencyAccess(request, id);
    if ("error" in authResult) return authResult.error;

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    const { searchParams } = request.nextUrl;
    const days = Math.min(365, Math.max(7, parseInt(searchParams.get("days") || "30")));

    const emptyLeadStats = [{ total: 0, sent: 0, viewed: 0, responded: 0, won: 0, lost: 0, claimed: 0, opened: 0, replied: 0 }];
    const emptyTotals = [{ views: 0, clicks: 0, phone: 0, email: 0, impressions: 0, leads: 0 }];

    const [
      agencyRow,
      dailyStats,
      leadStats,
      leadTimeline,
      reviewBreakdown,
      periodTotals,
    ] = await Promise.all([
      safeQuery(
        db.execute(sql`
          SELECT profile_views, total_reviews, total_leads, average_rating,
                 is_verified, is_featured, status, created_at
          FROM agencies WHERE id = ${id}
        `),
        [] as any[]
      ),
      safeQuery(
        db.execute(sql`
          SELECT date,
                 profile_views, search_impressions, website_clicks,
                 phone_clicks, email_clicks, lead_requests
          FROM agency_analytics_daily
          WHERE agency_id = ${id} AND date >= CURRENT_DATE - ${days}
          ORDER BY date ASC
        `),
        [] as any[]
      ),
      safeQuery(
        db.execute(sql`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
            COUNT(*) FILTER (WHERE status = 'viewed')::int AS viewed,
            COUNT(*) FILTER (WHERE status = 'responded')::int AS responded,
            COUNT(*) FILTER (WHERE status = 'won')::int AS won,
            COUNT(*) FILTER (WHERE status = 'lost')::int AS lost,
            COUNT(*) FILTER (WHERE status = 'claimed')::int AS claimed,
            COUNT(*) FILTER (WHERE viewed_at IS NOT NULL)::int AS opened,
            COUNT(*) FILTER (WHERE responded_at IS NOT NULL)::int AS replied
          FROM lead_assignments WHERE agency_id = ${id}
        `),
        emptyLeadStats as any[]
      ),
      safeQuery(
        db.execute(sql`
          SELECT DATE_TRUNC('week', created_at)::date AS week, COUNT(*)::int AS count
          FROM lead_assignments
          WHERE agency_id = ${id} AND created_at >= NOW() - make_interval(days => ${days})
          GROUP BY week ORDER BY week ASC
        `),
        [] as any[]
      ),
      safeQuery(
        db.execute(sql`
          SELECT
            overall_rating,
            COUNT(*)::int AS count
          FROM reviews
          WHERE agency_id = ${id} AND deleted_at IS NULL AND status = 'approved'
          GROUP BY overall_rating
          ORDER BY overall_rating DESC
        `),
        [] as any[]
      ),
      safeQuery(
        db.execute(sql`
          SELECT
            COALESCE(SUM(profile_views), 0)::int AS views,
            COALESCE(SUM(website_clicks), 0)::int AS clicks,
            COALESCE(SUM(phone_clicks), 0)::int AS phone,
            COALESCE(SUM(email_clicks), 0)::int AS email,
            COALESCE(SUM(search_impressions), 0)::int AS impressions,
            COALESCE(SUM(lead_requests), 0)::int AS leads
          FROM agency_analytics_daily
          WHERE agency_id = ${id} AND date >= CURRENT_DATE - ${days}
        `),
        emptyTotals as any[]
      ),
    ]);

    const agency = (agencyRow as any[])[0] || {};
    const leads = (leadStats as any[])[0] || {};
    const totals = (periodTotals as any[])[0] || {};

    const totalViews = Number(totals.views) || 0;
    const totalClicks = Number(totals.clicks) || 0;
    const totalPhone = Number(totals.phone) || 0;
    const totalEmail = Number(totals.email) || 0;
    const totalImpressions = Number(totals.impressions) || 0;
    const totalLeadRequests = Number(totals.leads) || 0;

    const ctr = totalImpressions > 0 ? ((totalViews / totalImpressions) * 100) : 0;
    const conversionRate = totalViews > 0 ? ((totalLeadRequests / totalViews) * 100) : 0;
    const leadResponseRate = Number(leads.total) > 0 ? ((Number(leads.replied) / Number(leads.total)) * 100) : 0;
    const leadWinRate = Number(leads.total) > 0 ? ((Number(leads.won) / Number(leads.total)) * 100) : 0;

    return success({
      period: days,
      agency: {
        profileViews: Number(agency.profile_views) || 0,
        totalReviews: Number(agency.total_reviews) || 0,
        totalLeads: Number(agency.total_leads) || 0,
        averageRating: agency.average_rating ? Number(agency.average_rating) : null,
        isVerified: agency.is_verified ?? false,
        isFeatured: agency.is_featured ?? false,
        status: agency.status ?? "draft",
        createdAt: agency.created_at ?? new Date().toISOString(),
      },
      periodStats: {
        views: totalViews,
        impressions: totalImpressions,
        websiteClicks: totalClicks,
        phoneClicks: totalPhone,
        emailClicks: totalEmail,
        leadRequests: totalLeadRequests,
        ctr: Math.round(ctr * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      leads: {
        total: Number(leads.total) || 0,
        sent: Number(leads.sent) || 0,
        viewed: Number(leads.viewed) || 0,
        responded: Number(leads.responded) || 0,
        won: Number(leads.won) || 0,
        lost: Number(leads.lost) || 0,
        claimed: Number(leads.claimed) || 0,
        responseRate: Math.round(leadResponseRate * 10) / 10,
        winRate: Math.round(leadWinRate * 10) / 10,
      },
      dailyStats,
      leadTimeline,
      reviewBreakdown: (reviewBreakdown as any[]).map((r: any) => ({
        rating: Number(r.overall_rating),
        count: Number(r.count),
      })),
    });
  } catch (err) {
    console.error("[REPORTS API] Error:", err);
    return serverError(err);
  }
}
