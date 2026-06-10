import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { hasDb, getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { createReviewSchema } from "@/lib/validations";

const reviewQuerySchema = z.object({
  agencyId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["newest", "oldest", "highest", "lowest", "helpful"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const params = reviewQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!params.success) {
      return Response.json(
        { error: "Invalid query parameters", details: params.error.format() },
        { status: 400 }
      );
    }

    if (!hasDb()) {
      return Response.json({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });
    }

    const db = getDb();
    const { agencyId, page, limit, sortBy } = params.data;
    const offset = (page - 1) * limit;

    let orderClause = "ORDER BY r.created_at DESC";
    if (sortBy === "oldest") orderClause = "ORDER BY r.created_at ASC";
    else if (sortBy === "highest") orderClause = "ORDER BY r.overall_rating DESC";
    else if (sortBy === "lowest") orderClause = "ORDER BY r.overall_rating ASC";
    else if (sortBy === "helpful") orderClause = "ORDER BY r.helpful_count DESC NULLS LAST";

    const results = await db.execute(
      sql`SELECT r.*, u.name as user_name, u.image as user_image
          FROM reviews r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE r.agency_id = ${agencyId}
            AND r.status = 'approved'
            AND r.deleted_at IS NULL
          ${sql.raw(orderClause)}
          LIMIT ${limit} OFFSET ${offset}`
    );

    const countResult = await db.execute(
      sql`SELECT count(*) as count FROM reviews
          WHERE agency_id = ${agencyId} AND status = 'approved' AND deleted_at IS NULL`
    );
    const total = Number((countResult as unknown as Array<{ count: string }>)[0]?.count ?? 0);

    return Response.json({
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ("error" in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (!hasDb()) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const db = getDb();
    const data = parsed.data;

    const agencyRows = await db.execute(
      sql`SELECT id FROM agencies WHERE id = ${data.agencyId} AND status = 'active' AND deleted_at IS NULL`
    );
    const agency = (agencyRows as unknown as Array<Record<string, unknown>>)[0];
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    const existingRows = await db.execute(
      sql`SELECT id FROM reviews WHERE agency_id = ${data.agencyId} AND user_id = ${user.id} AND deleted_at IS NULL`
    );
    const existing = (existingRows as unknown as Array<Record<string, unknown>>)[0];
    if (existing) {
      return Response.json({ error: "You have already reviewed this agency" }, { status: 409 });
    }

    const rows = await db.execute(sql`
      INSERT INTO reviews (
        agency_id, user_id, overall_rating, quality_rating, communication_rating,
        value_rating, timeliness_rating, title, content,
        project_type, project_budget, project_duration,
        company_name, company_size, status, is_verified, helpful_count
      ) VALUES (
        ${data.agencyId},
        ${user.id},
        ${data.overallRating},
        ${data.qualityRating ?? null},
        ${data.communicationRating ?? null},
        ${data.valueRating ?? null},
        ${data.timelinessRating ?? null},
        ${data.title},
        ${data.content},
        ${data.projectType ?? null},
        ${data.projectBudget ?? null},
        ${data.projectDuration ?? null},
        ${data.companyName ?? null},
        ${data.companySize ?? null},
        'pending',
        false,
        0
      ) RETURNING *
    `);

    const review = (rows as unknown as Array<Record<string, unknown>>)[0];

    return Response.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
