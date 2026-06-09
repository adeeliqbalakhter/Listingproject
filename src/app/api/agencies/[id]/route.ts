import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

// ─── GET /api/agencies/[id] ──────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!hasDb()) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const db = getDb();
    const rows = await db.execute(
      sql`SELECT * FROM agencies WHERE id = ${id} AND deleted_at IS NULL`
    );
    const agency = (rows as unknown as Array<Record<string, unknown>>)[0];

    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    return Response.json({ data: agency });
  } catch (error: unknown) {
    console.error("GET /api/agencies/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Internal server error", details: msg }, { status: 500 });
  }
}

// ─── PATCH /api/agencies/[id] ────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!hasDb()) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const db = getDb();

    const existingRows = await db.execute(
      sql`SELECT * FROM agencies WHERE id = ${id} AND deleted_at IS NULL`
    );
    const existing = (existingRows as unknown as Array<Record<string, unknown>>)[0];

    if (!existing) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }
    if (existing.user_id !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Discover actual columns
    const colRows = await db.execute(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'agencies' ORDER BY ordinal_position`
    );
    const dbColumns = (colRows as unknown as Array<{ column_name: string }>).map((r) => r.column_name);

    const fieldMap: Record<string, unknown> = {
      name: body.name,
      tagline: body.tagline,
      description: body.description,
      website: body.website,
      email: body.email,
      phone: body.phone,
      logo: body.logo,
      cover_image: body.coverImage,
      founded_year: body.foundedYear,
      company_size: body.companySize,
      hourly_rate: body.hourlyRate,
      min_project_size: body.minProjectSize,
      country_id: body.countryId,
      city_id: body.cityId,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      linkedin_url: body.linkedinUrl,
      twitter_url: body.twitterUrl,
      facebook_url: body.facebookUrl,
      instagram_url: body.instagramUrl,
      meta_title: body.metaTitle,
      meta_description: body.metaDescription,
      updated_at: new Date().toISOString(),
    };

    // Build SET clause with only valid columns that have values
    const setCols: string[] = [];
    const setVals: unknown[] = [];

    for (const [col, val] of Object.entries(fieldMap)) {
      if (val !== undefined && dbColumns.includes(col)) {
        setCols.push(col);
        setVals.push(val);
      }
    }

    if (setCols.length === 0) {
      return Response.json({ data: existing });
    }

    let updateQuery = sql`UPDATE agencies SET `;
    for (let i = 0; i < setCols.length; i++) {
      if (i > 0) updateQuery = updateQuery.append(sql`, `);
      updateQuery = updateQuery.append(sql.raw(`"${setCols[i]}" = `)).append(sql`${setVals[i]}`);
    }
    updateQuery = updateQuery.append(sql` WHERE id = ${id} RETURNING *`);

    const updatedRows = await db.execute(updateQuery);
    const updated = (updatedRows as unknown as Array<Record<string, unknown>>)[0];

    return Response.json({ data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/agencies/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Internal server error", details: msg }, { status: 500 });
  }
}

// ─── DELETE /api/agencies/[id] (soft delete) ─────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!hasDb()) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const db = getDb();

    const existingRows = await db.execute(
      sql`SELECT * FROM agencies WHERE id = ${id} AND deleted_at IS NULL`
    );
    const existing = (existingRows as unknown as Array<Record<string, unknown>>)[0];

    if (!existing) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }
    if (existing.user_id !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.execute(
      sql`UPDATE agencies SET deleted_at = NOW(), status = 'archived' WHERE id = ${id}`
    );

    return Response.json({ message: "Agency deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/agencies/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: "Internal server error", details: msg }, { status: 500 });
  }
}
