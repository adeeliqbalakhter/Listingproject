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
  serviceIds: z.array(z.string().uuid()).optional(),
  industryIds: z.array(z.string().uuid()).optional(),
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

    const { serviceIds, industryIds, ...updateFields } = data;

    await db.execute(sql`
      UPDATE agencies SET
        name = COALESCE(${updateFields.name ?? null}, name),
        tagline = ${updateFields.tagline ?? null},
        description = ${updateFields.description ?? null},
        website = ${updateFields.website ?? null},
        email = ${updateFields.email ?? null},
        phone = ${updateFields.phone ?? null},
        logo = ${updateFields.logo ?? null},
        cover_image = ${updateFields.coverImage ?? null},
        founded_year = ${updateFields.foundedYear ?? null},
        company_size = ${updateFields.companySize ?? null},
        hourly_rate = ${updateFields.hourlyRate ?? null},
        min_project_size = ${updateFields.minProjectSize ?? null},
        country_id = ${updateFields.countryId ?? null},
        city_id = ${updateFields.cityId ?? null},
        address = ${updateFields.address ?? null},
        latitude = ${updateFields.latitude ?? null},
        longitude = ${updateFields.longitude ?? null},
        social_links = ${Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : null},
        meta_title = ${updateFields.metaTitle ?? null},
        meta_description = ${updateFields.metaDescription ?? null},
        updated_at = NOW()
      WHERE id = ${id}
    `);

    // Update agency services if provided
    if (serviceIds) {
      try {
        await db.execute(
          sql`DELETE FROM agency_services WHERE agency_id = ${id}`
        );
        for (const serviceId of serviceIds) {
          try {
            await db.execute(
              sql`INSERT INTO agency_services (agency_id, service_id) VALUES (${id}, ${serviceId}) ON CONFLICT DO NOTHING`
            );
          } catch { /* skip invalid service */ }
        }
      } catch (e) {
        console.error("Failed to update agency_services:", e);
      }
    }

    // Update agency industries if provided
    if (industryIds) {
      try {
        await db.execute(
          sql`DELETE FROM agency_industries WHERE agency_id = ${id}`
        );
        for (const industryId of industryIds) {
          try {
            await db.execute(
              sql`INSERT INTO agency_industries (agency_id, industry_id) VALUES (${id}, ${industryId}) ON CONFLICT DO NOTHING`
            );
          } catch { /* skip invalid industry */ }
        }
      } catch (e) {
        console.error("Failed to update agency_industries:", e);
      }
    }

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
