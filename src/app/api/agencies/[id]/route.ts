import { NextRequest } from "next/server";
import { requireAuth, requireAgencyAccess } from "@/lib/auth/guards";
import { hasDb, getDb, getNeonSql } from "@/lib/db";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateAgencySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  tagline: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  email: z.string().email().max(255).optional().nullable().or(z.literal("")),
  phone: z.string().max(50).optional().nullable(),
  logo: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
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
  languages: z.array(z.string().max(60)).max(30).optional().nullable(),
  timezones: z.array(z.string().max(60)).max(30).optional().nullable(),
  locations: z
    .array(
      z.object({
        label: z.string().max(120).optional(),
        address: z.string().max(300).optional(),
        cityId: z.string().max(120).optional(),
        countryId: z.string().max(120).optional(),
        latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
        longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
        isHeadquarters: z.boolean().optional(),
      })
    )
    .max(50)
    .optional()
    .nullable(),
  serviceIds: z.array(z.string().uuid()).optional(),
  industryIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["draft", "pending"]).optional(),
}).passthrough();

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
    return Response.json({ error: "Internal server error" }, { status: 500 });
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

    const { serviceIds, industryIds, status, ...updateFields } = data;

    const hasSocial = Object.keys(socialLinks).length > 0;

    // Build SET clauses dynamically — only update fields explicitly provided in the request body
    // This allows clearing nullable fields by sending null, unlike COALESCE which prevents clearing
    type SqlChunk = ReturnType<typeof sql>;
    const setClauses: SqlChunk[] = [];

    if ("name" in updateFields) setClauses.push(sql`name = ${updateFields.name ?? null}`);
    if ("tagline" in updateFields) setClauses.push(sql`tagline = ${updateFields.tagline ?? null}`);
    if ("description" in updateFields) setClauses.push(sql`description = ${updateFields.description ?? null}`);
    if ("website" in updateFields) setClauses.push(sql`website = ${updateFields.website === "" ? null : (updateFields.website ?? null)}`);
    if ("email" in updateFields) setClauses.push(sql`email = ${updateFields.email === "" ? null : (updateFields.email ?? null)}`);
    if ("phone" in updateFields) setClauses.push(sql`phone = ${updateFields.phone ?? null}`);
    if ("logo" in updateFields) setClauses.push(sql`logo = ${updateFields.logo ?? null}`);
    if ("coverImage" in updateFields) setClauses.push(sql`cover_image = ${updateFields.coverImage ?? null}`);
    if ("foundedYear" in updateFields) setClauses.push(sql`founded_year = ${updateFields.foundedYear ?? null}`);
    if ("companySize" in updateFields) setClauses.push(sql`company_size = ${updateFields.companySize ?? null}`);
    if ("hourlyRate" in updateFields) setClauses.push(sql`hourly_rate = ${updateFields.hourlyRate ?? null}`);
    if ("minProjectSize" in updateFields) setClauses.push(sql`min_project_size = ${updateFields.minProjectSize ?? null}`);
    if ("countryId" in updateFields) setClauses.push(sql`country_id = ${updateFields.countryId ?? null}`);
    if ("cityId" in updateFields) setClauses.push(sql`city_id = ${updateFields.cityId ?? null}`);
    if ("address" in updateFields) setClauses.push(sql`address = ${updateFields.address ?? null}`);
    if ("latitude" in updateFields) setClauses.push(sql`latitude = ${updateFields.latitude ?? null}`);
    if ("longitude" in updateFields) setClauses.push(sql`longitude = ${updateFields.longitude ?? null}`);
    if (hasSocial || "linkedinUrl" in data || "twitterUrl" in data || "facebookUrl" in data || "instagramUrl" in data) {
      setClauses.push(sql`social_links = ${hasSocial ? JSON.stringify(socialLinks) : null}`);
    }
    if ("metaTitle" in updateFields) setClauses.push(sql`meta_title = ${updateFields.metaTitle ?? null}`);
    if ("metaDescription" in updateFields) setClauses.push(sql`meta_description = ${updateFields.metaDescription ?? null}`);
    if ("languages" in updateFields) setClauses.push(sql`languages = ${updateFields.languages ? JSON.stringify(updateFields.languages) : null}`);
    if ("timezones" in updateFields) setClauses.push(sql`timezones = ${updateFields.timezones ? JSON.stringify(updateFields.timezones) : null}`);
    if ("locations" in updateFields) setClauses.push(sql`locations = ${updateFields.locations ? JSON.stringify(updateFields.locations) : null}`);
    if (status !== undefined) setClauses.push(sql`status = ${status}`);

    setClauses.push(sql`updated_at = NOW()`);

    await db.execute(sql`UPDATE agencies SET ${sql.join(setClauses, sql`, `)} WHERE id = ${id}`);

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

    // Bust ISR cache for public profile
    const slug = updated?.slug as string | undefined;
    if (slug) {
      revalidatePath(`/agencies/${slug}`);
    }
    revalidatePath("/agencies");

    return Response.json({ data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/agencies/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
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
      sql`SELECT id FROM agencies WHERE id = ${id}`
    );
    const existing = (existingRows as unknown as Array<Record<string, unknown>>)[0];

    if (!existing) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    // Get slug before soft-deleting for cache invalidation
    const slugRows = await db.execute(sql`SELECT slug FROM agencies WHERE id = ${id} LIMIT 1`);
    const slug = (slugRows as unknown as Array<{ slug: string }>)[0]?.slug;

    // Soft delete: set deleted_at timestamp, preserve related data as historical records
    const neonSql = getNeonSql();
    await neonSql`UPDATE agencies SET deleted_at = NOW() WHERE id = ${id}`;

    if (slug) revalidatePath(`/agencies/${slug}`);
    revalidatePath("/agencies");

    return Response.json({ message: "Agency deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/agencies/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
