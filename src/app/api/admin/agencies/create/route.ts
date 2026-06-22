import { NextRequest } from "next/server";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guards";
import { success, error, serverError } from "@/lib/api/response";
import { z } from "zod";

const createUnclaimedSchema = z.object({
  name: z.string().min(2).max(255),
  tagline: z.string().max(500).optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  foundedYear: z.coerce.number().int().min(1900).max(2030).optional(),
  companySize: z.string().max(50).optional(),
  hourlyRate: z.string().max(50).optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  socialLinks: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

async function ensureClaimColumns(db: ReturnType<typeof getDb>) {
  try {
    await db.execute(sql`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS claim_status VARCHAR(20) DEFAULT 'claimed'`);
    await db.execute(sql`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ`);
    await db.execute(sql`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS claimed_by UUID`);
    await db.execute(sql`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS linkedin_url TEXT`);
    await db.execute(sql`DO $$ BEGIN ALTER TABLE agencies ALTER COLUMN user_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;`);
  } catch { /* ignore */ }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, "super_admin");
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const parsed = createUnclaimedSchema.safeParse(body);
    if (!parsed.success) return error("Validation failed", 400, parsed.error.format());

    if (!hasDb()) return error("Database not available", 503);
    const db = getDb();

    await ensureClaimColumns(db);

    const d = parsed.data;
    const baseSlug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const socialLinks = d.socialLinks || {};
    if (d.linkedinUrl) socialLinks.linkedin = d.linkedinUrl;
    const socialJson = Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : null;

    const rows = await db.execute(sql`
      INSERT INTO agencies (
        user_id, name, slug, tagline, description, website, email, phone,
        founded_year, company_size, hourly_rate, address, logo, cover_image,
        linkedin_url, social_links, status, claim_status, is_verified
      ) VALUES (
        NULL, ${d.name}, ${slug}, ${d.tagline ?? null}, ${d.description ?? null},
        ${d.website || null}, ${d.email || null}, ${d.phone ?? null},
        ${d.foundedYear ?? null}, ${d.companySize ?? null}, ${d.hourlyRate ?? null},
        ${d.address ?? null}, ${d.logo ?? null}, ${d.coverImage ?? null},
        ${d.linkedinUrl || null},
        ${socialJson ? sql`${socialJson}::jsonb` : sql`NULL`},
        'active', 'unclaimed', false
      )
      RETURNING id, name, slug, claim_status, status
    `);

    const agency = (rows as unknown as Array<Record<string, unknown>>)[0];
    return success({ agency, message: "Unclaimed agency profile created" }, 201);
  } catch (err) {
    console.error("[ADMIN-CREATE-AGENCY] Error:", err);
    return serverError(err);
  }
}
