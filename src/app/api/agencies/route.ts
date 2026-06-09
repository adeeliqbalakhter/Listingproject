import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createAgencySchema, searchParamsSchema } from "@/lib/validations";
import slugify from "slugify";

async function getTableColumns(db: ReturnType<typeof getDb>, tableName: string): Promise<string[]> {
  const rows = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = ${tableName} ORDER BY ordinal_position`
  );
  return (rows as unknown as Array<{ column_name: string }>).map((r) => r.column_name);
}

async function tableExists(db: ReturnType<typeof getDb>, tableName: string): Promise<boolean> {
  const rows = await db.execute(
    sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${tableName}) as exists`
  );
  return (rows as unknown as Array<{ exists: boolean }>)[0]?.exists === true;
}

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
    const dbColumns = await getTableColumns(db, "agencies");

    const baseSlug = slugify(data.name, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    const { serviceIds, industryIds, logo, coverImage, ...rest } = data;

    // Map camelCase field names → snake_case DB columns
    const fieldMap: Record<string, unknown> = {
      user_id: session.user.id,
      name: rest.name,
      slug,
      tagline: rest.tagline,
      description: rest.description,
      website: rest.website,
      email: rest.email,
      phone: rest.phone,
      founded_year: rest.foundedYear,
      company_size: rest.companySize,
      hourly_rate: rest.hourlyRate,
      min_project_size: rest.minProjectSize,
      country_id: rest.countryId,
      city_id: rest.cityId,
      address: rest.address,
      latitude: rest.latitude,
      longitude: rest.longitude,
      linkedin_url: rest.linkedinUrl,
      twitter_url: rest.twitterUrl,
      facebook_url: rest.facebookUrl,
      instagram_url: rest.instagramUrl,
      meta_title: rest.metaTitle,
      meta_description: rest.metaDescription,
      status: "draft",
    };

    // Only include columns that exist in the actual DB table
    const cols: string[] = [];
    const vals: unknown[] = [];

    for (const [col, val] of Object.entries(fieldMap)) {
      if (val !== undefined && val !== null && val !== "" && dbColumns.includes(col)) {
        cols.push(col);
        vals.push(val);
      }
    }

    if (!cols.includes("name")) {
      return Response.json({ error: "Agency name is required" }, { status: 400 });
    }

    // Build parameterized INSERT using sql template
    let insertQuery = sql`INSERT INTO agencies (`;
    for (let i = 0; i < cols.length; i++) {
      if (i > 0) insertQuery = insertQuery.append(sql`, `);
      insertQuery = insertQuery.append(sql.raw(`"${cols[i]}"`));
    }
    insertQuery = insertQuery.append(sql`) VALUES (`);
    for (let i = 0; i < vals.length; i++) {
      if (i > 0) insertQuery = insertQuery.append(sql`, `);
      insertQuery = insertQuery.append(sql`${vals[i]}`);
    }
    insertQuery = insertQuery.append(sql`) RETURNING *`);

    const rows = await db.execute(insertQuery);
    const agency = (rows as unknown as Array<Record<string, unknown>>)[0];

    if (!agency) {
      return Response.json({ error: "Failed to create agency" }, { status: 500 });
    }

    const agencyId = agency.id as string;

    // Update images separately (large base64 strings)
    if (logo && dbColumns.includes("logo")) {
      await db.execute(sql`UPDATE agencies SET logo = ${logo} WHERE id = ${agencyId}`);
    }
    if (coverImage && dbColumns.includes("cover_image")) {
      await db.execute(sql`UPDATE agencies SET cover_image = ${coverImage} WHERE id = ${agencyId}`);
    }

    // Insert service relations
    if (serviceIds?.length && await tableExists(db, "agency_services")) {
      for (const serviceId of serviceIds) {
        try {
          await db.execute(
            sql`INSERT INTO agency_services (agency_id, service_id) VALUES (${agencyId}, ${serviceId}) ON CONFLICT DO NOTHING`
          );
        } catch { /* skip invalid service IDs */ }
      }
    }

    // Insert industry relations
    if (industryIds?.length && await tableExists(db, "agency_industries")) {
      for (const industryId of industryIds) {
        try {
          await db.execute(
            sql`INSERT INTO agency_industries (agency_id, industry_id) VALUES (${agencyId}, ${industryId}) ON CONFLICT DO NOTHING`
          );
        } catch { /* skip invalid industry IDs */ }
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
