import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createLeadSchema } from "@/lib/validations";

// ─── Mock Data ───────────────────────────────────────────────────
// TODO: Replace with Drizzle ORM queries against the leads / lead_assignments tables

const mockLeads = [
  {
    id: "l1a2b3c4-d5e6-7890-abcd-ef1234567890",
    userId: "user-004",
    companyName: "Bright Horizons Ltd",
    contactName: "Emily Watson",
    contactEmail: "emily@brighthorizons.example.com",
    contactPhone: "+1-555-0300",
    projectDescription:
      "We need a complete redesign of our corporate website with a focus on lead generation and SEO.",
    budget: "$25,000-$50,000",
    timeline: "3-6 months",
    serviceIds: ["s1", "s2"],
    industryId: "i1",
    countryId: null,
    cityId: null,
    status: "new" as const,
    createdAt: new Date("2024-05-28"),
    updatedAt: new Date("2024-05-28"),
    assignments: [
      {
        agencyId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        agencyName: "PixelCraft Studios",
        status: "sent",
        viewedAt: null,
        respondedAt: null,
      },
    ],
  },
  {
    id: "l2b3c4d5-e6f7-8901-bcde-f12345678901",
    userId: null,
    companyName: "Startup Hub",
    contactName: "Alex Rivera",
    contactEmail: "alex@startuphub.example.com",
    contactPhone: null,
    projectDescription:
      "Looking for an SEO and content marketing agency to help us grow organic traffic by 200% in the next year.",
    budget: "$5,000-$10,000",
    timeline: "Ongoing / monthly retainer",
    serviceIds: ["s3"],
    industryId: "i3",
    countryId: null,
    cityId: null,
    status: "sent" as const,
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
    assignments: [
      {
        agencyId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        agencyName: "GrowthLab Marketing",
        status: "viewed",
        viewedAt: new Date("2024-06-02"),
        respondedAt: null,
      },
    ],
  },
];

// ─── Query Params Schema ─────────────────────────────────────────

const leadQuerySchema = z.object({
  agencyId: z.string().uuid().optional(),
  status: z
    .enum(["new", "sent", "viewed", "responded", "won", "lost", "expired"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─── GET /api/leads ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const params = leadQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!params.success) {
      return Response.json(
        { error: "Invalid query parameters", details: params.error.format() },
        { status: 400 }
      );
    }

    const { agencyId, status, page, limit } = params.data;

    // TODO: Replace with Drizzle query:
    // Agency owners see leads assigned to their agencies.
    // const conditions = [];
    // if (agencyId) {
    //   // Verify user owns this agency
    //   const agency = await db.query.agencies.findFirst({
    //     where: and(eq(schema.agencies.id, agencyId), eq(schema.agencies.userId, session.user.id)),
    //   });
    //   if (!agency) return Response.json({ error: "Forbidden" }, { status: 403 });
    //   conditions.push(eq(schema.leadAssignments.agencyId, agencyId));
    // }
    // if (status) conditions.push(eq(schema.leads.status, status));
    //
    // const results = await db.select()
    //   .from(schema.leads)
    //   .innerJoin(schema.leadAssignments, eq(schema.leads.id, schema.leadAssignments.leadId))
    //   .where(and(...conditions))
    //   .orderBy(desc(schema.leads.createdAt))
    //   .limit(limit).offset((page - 1) * limit);

    let filtered = [...mockLeads];

    if (agencyId) {
      filtered = filtered.filter((l) =>
        l.assignments.some((a) => a.agencyId === agencyId)
      );
    }
    if (status) {
      filtered = filtered.filter((l) => l.status === status);
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
    console.error("GET /api/leads error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST /api/leads ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Leads can be created by anonymous users (get-quotes form) or authenticated users
    const session = await auth();

    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // TODO: Replace with Drizzle insert:
    // const [lead] = await db.insert(schema.leads).values({
    //   userId: session?.user?.id ?? null,
    //   companyName: data.companyName,
    //   contactName: data.contactName,
    //   contactEmail: data.contactEmail,
    //   contactPhone: data.contactPhone,
    //   projectDescription: data.projectDescription,
    //   budget: data.budget,
    //   timeline: data.timeline,
    //   serviceIds: data.serviceIds,
    //   industryId: data.industryId,
    //   countryId: data.countryId,
    //   cityId: data.cityId,
    // }).returning();
    //
    // If specific agencies were selected, create assignments:
    // if (data.agencyIds?.length) {
    //   await db.insert(schema.leadAssignments).values(
    //     data.agencyIds.map(agencyId => ({
    //       leadId: lead.id,
    //       agencyId,
    //       status: "sent",
    //     }))
    //   );
    //   // Update total leads count on each agency
    //   for (const agencyId of data.agencyIds) {
    //     await db.update(schema.agencies)
    //       .set({ totalLeads: sql`${schema.agencies.totalLeads} + 1` })
    //       .where(eq(schema.agencies.id, agencyId));
    //   }
    // }
    //
    // TODO: Send notification email to matched agencies

    const newLead = {
      id: crypto.randomUUID(),
      userId: session?.user?.id ?? null,
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    return Response.json({ data: newLead }, { status: 201 });
  } catch (error) {
    console.error("POST /api/leads error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
