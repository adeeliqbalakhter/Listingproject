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

    // Build social_links jsonb
    const socialLinks: Record<string, string> = {};
    if (body.linkedinUrl) socialLinks.linkedin = body.linkedinUrl;
    if (body.twitterUrl) socialLinks.twitter = body.twitterUrl;
    if (body.facebookUrl) socialLinks.facebook = body.facebookUrl;
    if (body.instagramUrl) socialLinks.instagram = body.instagramUrl;

    await db.execute(sql`
      UPDATE agencies SET
        name = COALESCE(${body.name ?? null}, name),
        tagline = ${body.tagline ?? null},
        description = ${body.description ?? null},
        website = ${body.website ?? null},
        email = ${body.email ?? null},
        phone = ${body.phone ?? null},
        logo = ${body.logo ?? null},
        cover_image = ${body.coverImage ?? null},
        founded_year = ${body.foundedYear ?? null},
        company_size = ${body.companySize ?? null},
        hourly_rate = ${body.hourlyRate ?? null},
        min_project_size = ${body.minProjectSize ?? null},
        country_id = ${body.countryId ?? null},
        city_id = ${body.cityId ?? null},
        address = ${body.address ?? null},
        latitude = ${body.latitude ?? null},
        longitude = ${body.longitude ?? null},
        social_links = ${Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : null},
        meta_title = ${body.metaTitle ?? null},
        meta_description = ${body.metaDescription ?? null},
        updated_at = NOW()
      WHERE id = ${id}
    `);

    const updatedRows = await db.execute(
      sql`SELECT * FROM agencies WHERE id = ${id}`
    );
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
