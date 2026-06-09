import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasDb, getDb } from "@/lib/db";
import {
  agencies,
  agencyServices,
  agencyIndustries,
} from "@/lib/db/schema";
import { createAgencySchema, searchParamsSchema } from "@/lib/validations";
import { eq, and, isNull, desc, asc, ilike, gte, sql } from "drizzle-orm";
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

    const { page, limit, query, minRating, companySize, sortBy } = params.data;

    const conditions: ReturnType<typeof eq>[] = [
      isNull(agencies.deletedAt),
      eq(agencies.status, "active"),
    ];

    if (query) {
      conditions.push(ilike(agencies.name, `%${query}%`));
    }
    if (minRating) {
      conditions.push(gte(agencies.averageRating, String(minRating)));
    }
    if (companySize) {
      conditions.push(eq(agencies.companySize, companySize));
    }

    let orderBy;
    if (sortBy === "rating") orderBy = desc(agencies.averageRating);
    else if (sortBy === "reviews") orderBy = desc(agencies.totalReviews);
    else if (sortBy === "name") orderBy = asc(agencies.name);
    else orderBy = desc(agencies.createdAt);

    const offset = (page - 1) * limit;

    const [results, countResult] = await Promise.all([
      db
        .select()
        .from(agencies)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(agencies)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return Response.json({
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/agencies error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return Response.json(
        { error: "Database not available" },
        { status: 503 }
      );
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

    const { serviceIds, industryIds, logo, coverImage, ...agencyFields } = data;

    const [agency] = await db
      .insert(agencies)
      .values({
        userId: session.user.id,
        slug,
        ...agencyFields,
      })
      .returning();

    if (logo || coverImage) {
      const imageUpdate: Record<string, string> = {};
      if (logo) imageUpdate.logo = logo;
      if (coverImage) imageUpdate.coverImage = coverImage;
      await db
        .update(agencies)
        .set(imageUpdate as unknown as typeof agencies.$inferInsert)
        .where(eq(agencies.id, agency.id));
    }

    if (serviceIds?.length) {
      await db.insert(agencyServices).values(
        serviceIds.map((serviceId) => ({
          agencyId: agency.id,
          serviceId,
        }))
      );
    }

    if (industryIds?.length) {
      await db.insert(agencyIndustries).values(
        industryIds.map((industryId) => ({
          agencyId: agency.id,
          industryId,
        }))
      );
    }

    const [fullAgency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, agency.id));

    return Response.json({ data: fullAgency }, { status: 201 });
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
