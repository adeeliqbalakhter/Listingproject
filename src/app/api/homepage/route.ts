import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!hasDb()) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const db = getDb();

    const [
      agencyCountResult,
      reviewCountResult,
      countryCountResult,
      topAgencies,
      recentReviews,
      serviceRows,
    ] = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int AS count FROM agencies WHERE status = 'active' AND deleted_at IS NULL`),
      db.execute(sql`SELECT COUNT(*)::int AS count FROM reviews WHERE status = 'approved' AND deleted_at IS NULL`),
      db.execute(sql`
        SELECT COUNT(DISTINCT c.id)::int AS count
        FROM countries c
        INNER JOIN agencies a ON a.country_id = c.id
        WHERE a.status = 'active' AND a.deleted_at IS NULL
      `),
      db.execute(sql`
        SELECT a.id, a.name, a.slug, a.tagline, a.logo, a.cover_image, a.average_rating, a.total_reviews,
               a.is_verified, a.is_featured, a.company_size, a.min_project_size,
               co.name AS country_name, ci.name AS city_name
        FROM agencies a
        LEFT JOIN countries co ON a.country_id = co.id
        LEFT JOIN cities ci ON a.city_id = ci.id
        WHERE a.status = 'active' AND a.deleted_at IS NULL AND a.is_featured = true
        ORDER BY a.average_rating DESC NULLS LAST, a.total_reviews DESC NULLS LAST
        LIMIT 6
      `),
      db.execute(sql`
        SELECT r.id, r.overall_rating, r.title, r.content, r.company_name, r.created_at,
               a.name AS agency_name, a.slug AS agency_slug, a.logo AS agency_logo
        FROM reviews r
        INNER JOIN agencies a ON r.agency_id = a.id
        WHERE r.status = 'approved' AND r.deleted_at IS NULL
          AND a.status = 'active' AND a.deleted_at IS NULL
          AND r.content IS NOT NULL AND r.content != ''
        ORDER BY r.created_at DESC
        LIMIT 6
      `),
      db.execute(sql`
        SELECT s.id, s.name, s.slug,
               COUNT(asvc.agency_id)::int AS agency_count
        FROM services s
        LEFT JOIN agency_services asvc ON asvc.service_id = s.id
        GROUP BY s.id, s.name, s.slug
        ORDER BY agency_count DESC, s.sort_order ASC
        LIMIT 8
      `),
    ]);

    const agencyCount = (agencyCountResult as any[])[0]?.count ?? 0;
    const reviewCount = (reviewCountResult as any[])[0]?.count ?? 0;
    const countryCount = (countryCountResult as any[])[0]?.count ?? 0;

    let svcMap: Record<string, string[]> = {};
    const agencyIds = (topAgencies as any[]).map((a: any) => a.id);
    if (agencyIds.length > 0) {
      try {
        const svcRows = await db.execute(sql`
          SELECT asvc.agency_id, s.name
          FROM agency_services asvc
          JOIN services s ON s.id = asvc.service_id
          WHERE asvc.agency_id = ANY(${agencyIds})
        `);
        for (const row of svcRows as any[]) {
          if (!svcMap[row.agency_id]) svcMap[row.agency_id] = [];
          svcMap[row.agency_id].push(row.name);
        }
      } catch { /* agency_services may not exist yet */ }
    }

    const agencies = (topAgencies as any[]).map((a: any) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      tagline: a.tagline,
      logo: a.logo,
      coverImage: a.cover_image,
      averageRating: a.average_rating ? Number(a.average_rating) : null,
      totalReviews: a.total_reviews ?? 0,
      isVerified: a.is_verified,
      isFeatured: a.is_featured,
      companySize: a.company_size,
      minProjectSize: a.min_project_size,
      location: [a.city_name, a.country_name].filter(Boolean).join(", ") || null,
      services: svcMap[a.id] || [],
    }));

    const reviews = (recentReviews as any[]).map((r: any) => ({
      id: r.id,
      rating: Number(r.overall_rating),
      title: r.title,
      content: r.content,
      companyName: r.company_name,
      agencyName: r.agency_name,
      agencySlug: r.agency_slug,
      agencyLogo: r.agency_logo,
      createdAt: r.created_at,
    }));

    const services = (serviceRows as any[]).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      agencyCount: s.agency_count,
    }));

    return Response.json({
      stats: {
        agencies: agencyCount,
        reviews: reviewCount,
        countries: countryCount,
      },
      agencies,
      reviews,
      services,
    });
  } catch (err) {
    console.error("[HOMEPAGE API] Error:", err);
    return Response.json({ error: "Failed to load homepage data" }, { status: 500 });
  }
}
