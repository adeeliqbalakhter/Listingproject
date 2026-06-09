import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasDb, getDb } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { updateAgencySchema } from "@/lib/validations";
import { eq, and, isNull } from "drizzle-orm";

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

    const [agency] = await db
      .select()
      .from(agencies)
      .where(and(eq(agencies.id, id), isNull(agencies.deletedAt)));

    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    return Response.json({ data: agency });
  } catch (error) {
    console.error("GET /api/agencies/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
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

    const [existing] = await db
      .select()
      .from(agencies)
      .where(and(eq(agencies.id, id), isNull(agencies.deletedAt)));

    if (!existing) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateAgencySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { serviceIds, industryIds, ...updateFields } = parsed.data;

    const [updated] = await db
      .update(agencies)
      .set({ ...updateFields, updatedAt: new Date() } as typeof agencies.$inferInsert)
      .where(eq(agencies.id, id))
      .returning();

    return Response.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/agencies/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
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

    const [existing] = await db
      .select()
      .from(agencies)
      .where(and(eq(agencies.id, id), isNull(agencies.deletedAt)));

    if (!existing) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await db
      .update(agencies)
      .set({ deletedAt: new Date(), status: "archived" } as typeof agencies.$inferInsert)
      .where(eq(agencies.id, id));

    return Response.json({ message: "Agency deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/agencies/[id] error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
