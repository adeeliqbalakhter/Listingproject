import { NextRequest } from "next/server";
import { requireAuth, requireAgencyAccess } from "@/lib/auth/guards";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { z } from "zod";

const updateAgencySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  tagline: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal("")),
  email: z.string().email().max(255).optional().nullable().or(z.literal("")),
  phone: z.string().max(50).optional().nullable(),
  logo: z.string().max(10000).optional().nullable(),
  coverImage: z.string().max(10000).optional().nullable(),
  foundedYear: z.number().int().min(1900).max(2030).optional().nullable(),
  companySize: z.string().max(50).optional().nullable(),
  hourlyRate: z.string().max(50).optional().nullable(),
  minProjectSize: z.number().min(0).optional().nullable(),
  countryId: z.string().uuid().optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  linkedinUrl: z.string().max(500).optional().nullable(),
  twitterUrl: z.string().max(500).optional().nullable(),
  facebookUrl: z.string().max(500).optional().nullable(),
  instagramUrl: z.string().max(500).optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
}).strict();

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAgencyAccess(request, id);
    if ("error" in authResult) return authResult.error;

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

    const body = await request.json();

    const parsed = updateAgencySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const socialLinks: Record<string, string> = {};
    if (data.linkedinUrl) socialLinks.linkedin = data.linkedinUrl;
    if (data.twitterUrl) socialLinks.twitter = data.twitterUrl;
    if (data.facebookUrl) socialLinks.facebook = data.facebookUrl;
    if (data.instagramUrl) socialLinks.instagram = data.instagramUrl;

    await db.execute(sql`
      UPDATE agencies SET
        name = COALESCE(${data.name ?? null}, name),
        tagline = ${data.tagline ?? null},
        description = ${data.description ?? null},
        website = ${data.website ?? null},
        email = ${data.email ?? null},
        phone = ${data.phone ?? null},
        logo = ${data.logo ?? null},
        cover_image = ${data.coverImage ?? null},
        founded_year = ${data.foundedYear ?? null},
        company_size = ${data.companySize ?? null},
        hourly_rate = ${data.hourlyRate ?? null},
        min_project_size = ${data.minProjectSize ?? null},
        country_id = ${data.countryId ?? null},
        city_id = ${data.cityId ?? null},
        address = ${data.address ?? null},
        latitude = ${data.latitude ?? null},
        longitude = ${data.longitude ?? null},
        social_links = ${Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : null},
        meta_title = ${data.metaTitle ?? null},
        meta_description = ${data.metaDescription ?? null},
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAgencyAccess(request, id);
    if ("error" in authResult) return authResult.error;

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
