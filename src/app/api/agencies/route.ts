import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createAgencySchema, searchParamsSchema } from "@/lib/validations";
import slugify from "slugify";

// ─── GET /api/agencies ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    if (!hasDb()) {
      return Response.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }

    const db = getDb();
    const { searchParams } = request.nextUrl;

    const params = searchParamsSchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!params.success) {
      return Response.json(
        { error: "Invalid query parameters", details: params.error.format() },
        { status: 400 }
      );
    }

    const { page, limit, query, sortBy } = params.data;
    const offset = (page - 1) * limit;

    let orderClause = "ORDER BY created_at DESC";
    if (sortBy === "rating") orderClause = "ORDER BY average_rating DESC NULLS LAST";
    else if (sortBy === "reviews") orderClause = "ORDER BY total_reviews DESC NULLS LAST";
    else if (sortBy === "name") orderClause = "ORDER BY name ASC";

    let results;
    let total;

    if (query) {
      results = await db.execute(
        sql`SELECT * FROM agencies WHERE deleted_at IS NULL AND name ILIKE ${`%${query}%`} ${sql.raw(orderClause)} LIMIT ${limit} OFFSET ${offset}`
      );
      const countResult = await db.execute(
        sql`SELECT count(*) as count FROM agencies WHERE deleted_at IS NULL AND name ILIKE ${`%${query}%`}`
      );
      total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);
    } else {
      results = await db.execute(
        sql`SELECT * FROM agencies WHERE deleted_at IS NULL ${sql.raw(orderClause)} LIMIT ${limit} OFFSET ${offset}`
      );
      const countResult = await db.execute(
        sql`SELECT count(*) as count FROM agencies WHERE deleted_at IS NULL`
      );
      total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);
    }

    return Response.json({
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    console.error("GET /api/agencies error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Internal server error", details: msg }, { status: 500 });
  }
}

// ─── POST /api/agencies ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasDb()) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const db = getDb();
    const body = await request.json();
    const parsed = createAgencySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const baseSlug = slugify(data.name, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    const { serviceIds, industryIds, logo, coverImage, ...rest } = data;

    // Build social_links jsonb from individual social fields
    const socialLinks: Record<string, string> = {};
    if (rest.linkedinUrl) socialLinks.linkedin = rest.linkedinUrl;
    if (rest.twitterUrl) socialLinks.twitter = rest.twitterUrl;
    if (rest.facebookUrl) socialLinks.facebook = rest.facebookUrl;
    if (rest.instagramUrl) socialLinks.instagram = rest.instagramUrl;

    // Insert agency using only columns that exist in the actual DB
    const rows = await db.execute(sql`
      INSERT INTO agencies (
        user_id, name, slug, tagline, description,
        website, email, phone, founded_year, company_size,
        hourly_rate, min_project_size, country_id, city_id, address,
        latitude, longitude, status, social_links,
        meta_title, meta_description
      ) VALUES (
        ${session.user.id}, ${rest.name}, ${slug},
        ${rest.tagline ?? null}, ${rest.description ?? null},
        ${rest.website ?? null}, ${rest.email ?? null}, ${rest.phone ?? null},
        ${rest.foundedYear ?? null}, ${rest.companySize ?? null},
        ${rest.hourlyRate ?? null}, ${rest.minProjectSize ?? null},
        ${rest.countryId ?? null}, ${rest.cityId ?? null}, ${rest.address ?? null},
        ${rest.latitude ?? null}, ${rest.longitude ?? null},
        'draft',
        ${Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : null},
        ${rest.metaTitle ?? null}, ${rest.metaDescription ?? null}
      ) RETURNING *
    `);

    const agency = (rows as unknown as Array<Record<string, unknown>>)[0];

    if (!agency) {
      return Response.json({ error: "Failed to create agency" }, { status: 500 });
    }

    const agencyId = agency.id as string;

    // Update images separately (large base64 strings)
    if (logo) {
      await db.execute(sql`UPDATE agencies SET logo = ${logo} WHERE id = ${agencyId}`);
    }
    if (coverImage) {
      await db.execute(sql`UPDATE agencies SET cover_image = ${coverImage} WHERE id = ${agencyId}`);
    }

    // Insert service relations (agency_services has no id column)
    if (serviceIds?.length) {
      for (const serviceId of serviceIds) {
        try {
          await db.execute(
            sql`INSERT INTO agency_services (agency_id, service_id) VALUES (${agencyId}, ${serviceId}) ON CONFLICT DO NOTHING`
          );
        } catch { /* skip invalid */ }
      }
    }

    // Insert industry relations (agency_industries has no id column)
    if (industryIds?.length) {
      for (const industryId of industryIds) {
        try {
          await db.execute(
            sql`INSERT INTO agency_industries (agency_id, industry_id) VALUES (${agencyId}, ${industryId}) ON CONFLICT DO NOTHING`
          );
        } catch { /* skip invalid */ }
      }
    }

    // Fetch final row
    const finalRows = await db.execute(sql`SELECT * FROM agencies WHERE id = ${agencyId}`);
    const finalAgency = (finalRows as unknown as Array<Record<string, unknown>>)[0] ?? agency;

    return Response.json({ data: finalAgency }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/agencies error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return Response.json(
        { error: "An agency with this name already exists. Please use a different name." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Internal server error", details: msg },
      { status: 500 }
    );
  }
}
