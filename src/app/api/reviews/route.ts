import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validations";

// ─── Mock Data ───────────────────────────────────────────────────
// TODO: Replace with Drizzle ORM queries against the reviews table

const mockReviews = [
  {
    id: "r1a2b3c4-d5e6-7890-abcd-ef1234567890",
    agencyId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    userId: "user-002",
    overallRating: 4.8,
    qualityRating: 5.0,
    communicationRating: 4.5,
    valueRating: 4.8,
    timelinessRating: 4.5,
    title: "Exceptional web development partner",
    content:
      "PixelCraft Studios delivered an outstanding e-commerce platform for our business. Their attention to detail and UX expertise really set them apart. The project was delivered on time and within budget.",
    projectType: "E-commerce Website",
    projectBudget: "$25,000-$50,000",
    projectDuration: "3-6 months",
    companyName: "TechRetail Inc.",
    companySize: "51-200",
    isVerified: true,
    status: "approved" as const,
    helpfulCount: 12,
    createdAt: new Date("2024-04-20"),
    updatedAt: new Date("2024-04-20"),
    deletedAt: null,
    user: { name: "Sarah Chen", image: null },
  },
  {
    id: "r2b3c4d5-e6f7-8901-bcde-f12345678901",
    agencyId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    userId: "user-003",
    overallRating: 4.5,
    qualityRating: 4.5,
    communicationRating: 4.0,
    valueRating: 4.5,
    timelinessRating: 5.0,
    title: "Great design work, highly recommended",
    content:
      "We hired PixelCraft for a complete brand redesign and website overhaul. They were professional, creative, and responsive throughout the project. Would absolutely work with them again.",
    projectType: "Brand Identity & Website",
    projectBudget: "$10,000-$25,000",
    projectDuration: "1-3 months",
    companyName: "GreenLeaf Co.",
    companySize: "11-50",
    isVerified: false,
    status: "approved" as const,
    helpfulCount: 5,
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
    deletedAt: null,
    user: { name: "Marcus Johnson", image: null },
  },
];

// ─── Query Params Schema ─────────────────────────────────────────

const reviewQuerySchema = z.object({
  agencyId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["newest", "oldest", "highest", "lowest", "helpful"]).optional(),
});

// ─── GET /api/reviews ────────────────────────────────────────────

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

    const { agencyId, page, limit, sortBy } = params.data;

    // TODO: Replace with Drizzle query:
    // const conditions = [
    //   eq(schema.reviews.agencyId, agencyId),
    //   eq(schema.reviews.status, "approved"),
    //   isNull(schema.reviews.deletedAt),
    // ];
    // const orderClause = sortBy === "highest" ? desc(schema.reviews.overallRating)
    //   : sortBy === "lowest" ? asc(schema.reviews.overallRating)
    //   : sortBy === "helpful" ? desc(schema.reviews.helpfulCount)
    //   : sortBy === "oldest" ? asc(schema.reviews.createdAt)
    //   : desc(schema.reviews.createdAt);
    //
    // const [reviews, countResult] = await Promise.all([
    //   db.select().from(schema.reviews)
    //     .leftJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
    //     .where(and(...conditions))
    //     .orderBy(orderClause)
    //     .limit(limit).offset((page - 1) * limit),
    //   db.select({ count: count() }).from(schema.reviews).where(and(...conditions)),
    // ]);

    let filtered = mockReviews.filter(
      (r) =>
        r.agencyId === agencyId &&
        r.status === "approved" &&
        r.deletedAt === null
    );

    // Sorting
    if (sortBy === "highest") {
      filtered.sort((a, b) => b.overallRating - a.overallRating);
    } else if (sortBy === "lowest") {
      filtered.sort((a, b) => a.overallRating - b.overallRating);
    } else if (sortBy === "helpful") {
      filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedData = filtered.slice(offset, offset + limit);

    return Response.json({
      data: paginatedData,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST /api/reviews ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // TODO: Verify the agency exists and is active:
    // const agency = await db.query.agencies.findFirst({
    //   where: and(
    //     eq(schema.agencies.id, data.agencyId),
    //     eq(schema.agencies.status, "active"),
    //     isNull(schema.agencies.deletedAt)
    //   ),
    // });
    // if (!agency) return Response.json({ error: "Agency not found" }, { status: 404 });

    // TODO: Check for duplicate review (one review per user per agency):
    // const existingReview = await db.query.reviews.findFirst({
    //   where: and(
    //     eq(schema.reviews.agencyId, data.agencyId),
    //     eq(schema.reviews.userId, session.user.id),
    //     isNull(schema.reviews.deletedAt)
    //   ),
    // });
    // if (existingReview) {
    //   return Response.json({ error: "You have already reviewed this agency" }, { status: 409 });
    // }

    // TODO: Insert with Drizzle:
    // const [review] = await db.insert(schema.reviews).values({
    //   agencyId: data.agencyId,
    //   userId: session.user.id,
    //   ...data,
    //   status: "pending",
    // }).returning();
    //
    // Recalculate agency average rating:
    // const ratingResult = await db.select({
    //   avg: avg(schema.reviews.overallRating),
    //   count: count(),
    // }).from(schema.reviews).where(
    //   and(eq(schema.reviews.agencyId, data.agencyId), eq(schema.reviews.status, "approved"))
    // );
    // await db.update(schema.agencies).set({
    //   averageRating: ratingResult[0].avg,
    //   totalReviews: ratingResult[0].count,
    // }).where(eq(schema.agencies.id, data.agencyId));

    const newReview = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      status: "pending",
      isVerified: false,
      helpfulCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...data,
    };

    return Response.json({ data: newReview }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
